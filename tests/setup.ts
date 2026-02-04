import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';

const SUPPRESSED_CONSOLE_PATTERNS = [
  /^i18next:/,
  /Push notifications not supported/i,
  /Notification shown:/,
  /New service worker activated/i,
  /Update waiting, showing notification/i,
  /WaitingArea: seats 数组无效/,
  /Failed to activate audio/i,
  /Failed to capture screenshot/i,
  /Failed to check nomination eligibility/i,
  /Failed to check seat eligibility/i,
  /Failed to fetch interactions/i,
  /Failed to fetch interactions for day/i,
  /Failed to refresh interactions/i,
  /Nomination failed:/i,
  /Error making nomination:/i,
  /No "setRealtimeChannel" export is defined/,
  /The vi\.fn\(\) mock did not use 'function' or 'class' in its implementation/,
  /云端连接失败，切换到离线模式/,
  /\[Supabase\]/,
  /\[Connection\]/,
];

const getConsoleMessages = (args: unknown[]): string[] => {
  const messages: string[] = [];
  for (const arg of args) {
    if (typeof arg === 'string') {
      messages.push(arg);
      continue;
    }
    if (arg instanceof Error) {
      messages.push(arg.message);
      continue;
    }
    if (arg && typeof arg === 'object' && 'message' in (arg as { message?: unknown })) {
      const message = (arg as { message?: unknown }).message;
      if (typeof message === 'string') {
        messages.push(message);
      }
    }
  }
  return messages;
};

const shouldSuppressConsole = (args: unknown[]): boolean => {
  const messages = getConsoleMessages(args);
  if (messages.length === 0) return false;
  return messages.some((message) =>
    SUPPRESSED_CONSOLE_PATTERNS.some((pattern) => pattern.test(message))
  );
};

const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

const wrapConsole = (level: 'log' | 'warn' | 'error') => {
  console[level] = (...args: unknown[]) => {
    if (process.env.VITEST_SHOW_LOGS === '1') {
      originalConsole[level](...args);
      return;
    }
    if (!shouldSuppressConsole(args)) {
      originalConsole[level](...args);
    }
  };
};

wrapConsole('log');
wrapConsole('warn');
wrapConsole('error');

// Ensure Testing Library unmounts components between tests to avoid leaking DOM nodes
afterEach(() => {
  cleanup();
  // Force GC when available to keep long runs from creeping in memory
  const maybeGc = (global as typeof globalThis & { gc?: () => void }).gc;
  maybeGc?.();
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Return the key itself for testing
    i18n: {
      language: 'zh',
      changeLanguage: vi.fn(),
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { user: { id: 'auth-user' } } } })),
      signInAnonymously: vi.fn(async () => ({ data: { user: { id: 'auth-user' } }, error: null }))
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      send: vi.fn(),
    })),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    rpc: vi.fn(),
    // Add Edge Functions support for AI testing
    functions: {
      invoke: vi.fn((functionName: string, _options?: unknown) => {
        if (functionName === 'ask-ai') {
          return Promise.resolve({
            data: { reply: 'Mock AI Response from Edge Function' },
            error: null,
          });
        }
        return Promise.resolve({
          data: null,
          error: { message: `Unknown function: ${functionName}` },
        });
      }),
    },
  })),
}));

// Mock @radix-ui/react-slot - 这是 Button 组件依赖的库
vi.mock('@radix-ui/react-slot', () => ({
  Slot: React.forwardRef(({ children, ...props }: React.PropsWithChildren<object>, ref) => {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ref } as React.Attributes);
    }
    return React.createElement('span', { ...props, ref }, children);
  }),
}));

// Helper function to filter out motion-specific props
const filterMotionProps = (props: Record<string, unknown>): Record<string, unknown> => {
  const motionPropsSet = new Set([
    'initial', 'animate', 'exit', 'transition',
    'whileHover', 'whileTap', 'whileDrag', 'whileFocus', 'whileInView',
    'variants', 'drag', 'dragConstraints', 'dragElastic', 'dragMomentum',
    'layoutId', 'layout', 'layoutDependency', 'layoutScroll',
    'onAnimationStart', 'onAnimationComplete', 'onUpdate',
    'onDrag', 'onDragStart', 'onDragEnd',
    'onHoverStart', 'onHoverEnd', 'onTap', 'onTapStart', 'onTapCancel',
    'onPan', 'onPanStart', 'onPanEnd',
    'style', // framer-motion 会增强 style，需要过滤
  ]);

  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !motionPropsSet.has(key))
  );
};

// Mock framer-motion 全局
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_, element: string) => {
      return React.forwardRef((props: React.PropsWithChildren<Record<string, unknown>>, ref) => {
        const { children, ...restProps } = props;
        const filteredProps = filterMotionProps(restProps);
        return React.createElement(element, { ...filteredProps, ref }, children);
      });
    },
  }),
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => React.createElement(React.Fragment, null, children),
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn(), set: vi.fn() }),
  useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
  useTransform: () => 0,
  useSpring: () => ({ get: () => 0, set: vi.fn() }),
  useScroll: () => ({ scrollYProgress: { get: () => 0, set: vi.fn() } }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Audio constructor
global.Audio = vi.fn().mockImplementation(function(this: HTMLAudioElement) {
  return {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    volume: 1,
    currentTime: 0,
    duration: 0,
    paused: true,
    ended: false,
    muted: false,
    src: '',
  } as unknown as HTMLAudioElement;
}) as unknown as typeof Audio;

// Mock AudioContext with proper resume implementation
global.AudioContext = vi.fn().mockImplementation(() => ({
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  })),
  createMediaElementSource: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 440 },
  })),
  resume: vi.fn().mockResolvedValue(undefined),
  suspend: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  state: 'running',
  destination: {} as AudioDestinationNode,
  currentTime: 0,
  sampleRate: 44100,
})) as unknown as typeof AudioContext;

// Also mock webkitAudioContext for Safari compatibility
(global as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext = global.AudioContext;
