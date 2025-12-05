import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';

// Ensure Testing Library unmounts components between tests to avoid leaking DOM nodes
afterEach(() => {
  cleanup();
  // Force GC when available to keep long runs from creeping in memory
  const maybeGc = (global as typeof globalThis & { gc?: () => void }).gc;
  maybeGc?.();
});

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      send: vi.fn(),
    })),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    rpc: vi.fn(),
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

// Mock framer-motion 全局
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: React.PropsWithChildren<object>, ref) => 
      React.createElement('div', { ...props, ref }, children)),
    button: React.forwardRef(({ children, ...props }: React.PropsWithChildren<object>, ref) => 
      React.createElement('button', { ...props, ref }, children)),
    span: React.forwardRef(({ children, ...props }: React.PropsWithChildren<object>, ref) => 
      React.createElement('span', { ...props, ref }, children)),
    path: (props: object) => React.createElement('path', props),
    svg: ({ children, ...props }: React.PropsWithChildren<object>) => 
      React.createElement('svg', props, children),
    g: ({ children, ...props }: React.PropsWithChildren<object>) => 
      React.createElement('g', props, children),
    circle: (props: object) => React.createElement('circle', props),
    rect: (props: object) => React.createElement('rect', props),
    line: (props: object) => React.createElement('line', props),
    p: ({ children, ...props }: React.PropsWithChildren<object>) => 
      React.createElement('p', props, children),
    h1: ({ children, ...props }: React.PropsWithChildren<object>) => 
      React.createElement('h1', props, children),
    h2: ({ children, ...props }: React.PropsWithChildren<object>) => 
      React.createElement('h2', props, children),
    h3: ({ children, ...props }: React.PropsWithChildren<object>) => 
      React.createElement('h3', props, children),
    section: ({ children, ...props }: React.PropsWithChildren<object>) => 
      React.createElement('section', props, children),
    article: ({ children, ...props }: React.PropsWithChildren<object>) => 
      React.createElement('article', props, children),
    ul: ({ children, ...props }: React.PropsWithChildren<object>) => 
      React.createElement('ul', props, children),
    li: ({ children, ...props }: React.PropsWithChildren<object>) => 
      React.createElement('li', props, children),
    img: (props: object) => React.createElement('img', props),
    a: ({ children, ...props }: React.PropsWithChildren<object>) => 
      React.createElement('a', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => React.createElement(React.Fragment, null, children),
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
  useTransform: () => 0,
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

// Mock AudioContext
global.AudioContext = vi.fn().mockImplementation(() => ({
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 1 },
  })),
  createMediaElementSource: vi.fn(() => ({
    connect: vi.fn(),
  })),
  resume: vi.fn(),
  suspend: vi.fn(),
  state: 'running',
}));
