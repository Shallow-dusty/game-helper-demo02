 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock framer-motion first
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => React.createElement('div', props, props.children),
    span: (props: any) => React.createElement('span', props, props.children),
    p: (props: any) => React.createElement('p', props, props.children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock useSoundEffect hook
vi.mock('../../hooks/useSoundEffect', () => ({
  useSoundEffect: () => ({
    playSound: vi.fn(),
    playClockTick: vi.fn(),
    preloadSounds: vi.fn(),
  }),
}));

// Create a mock store state holder
let mockStoreState: any = {};

// Mock the store with selector support
vi.mock('../../store', () => ({
  useStore: (selector?: (state: any) => any) => {
    if (selector) {
      return selector(mockStoreState);
    }
    return mockStoreState;
  },
}));

import { DoomsdayClock } from './DoomsdayClock';

describe('DoomsdayClock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = {};
  });

  it('投票未开始时不渲染', () => {
    mockStoreState = {
      gameState: {
        voting: null,
        seats: [],
      },
    };

    const { container } = render(<DoomsdayClock />);
    expect(container.firstChild).toBeNull();
  });

  it('投票关闭时不渲染', () => {
    mockStoreState = {
      gameState: {
        voting: { isOpen: false, votes: [], nomineeSeatId: null },
        seats: [],
      },
    };

    const { container } = render(<DoomsdayClock />);
    expect(container.firstChild).toBeNull();
  });

  it('投票开始时渲染钟面', () => {
    mockStoreState = {
      gameState: {
        voting: { isOpen: true, votes: [], nomineeSeatId: 0 },
        seats: [
          { id: 0, userName: '玩家1', isDead: false },
          { id: 1, userName: '玩家2', isDead: false },
          { id: 2, userName: '玩家3', isDead: false },
        ],
      },
    };

    render(<DoomsdayClock />);

    // 应该显示当前票数 0 (可能有多个 0 元素)
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    // 应该显示所需票数 (3人存活，需要2票)
    expect(screen.getByText(/\/ 2/)).toBeInTheDocument();
  });

  it('显示被提名者信息', () => {
    mockStoreState = {
      gameState: {
        voting: { isOpen: true, votes: [], nomineeSeatId: 1 },
        seats: [
          { id: 0, userName: '玩家1', isDead: false },
          { id: 1, userName: '被提名玩家', isDead: false },
        ],
      },
    };

    render(<DoomsdayClock />);

    expect(screen.getByText('game.doomsdayClock.nominee')).toBeInTheDocument();
    expect(screen.getByText(/被提名玩家/)).toBeInTheDocument();
  });

  it('显示投票者列表', () => {
    mockStoreState = {
      gameState: {
        voting: { isOpen: true, votes: [0, 2], nomineeSeatId: 1 },
        seats: [
          { id: 0, userName: '投票者1', isDead: false },
          { id: 1, userName: '被提名者', isDead: false },
          { id: 2, userName: '投票者2', isDead: false },
        ],
      },
    };

    render(<DoomsdayClock />);

    expect(screen.getByText('投票者1')).toBeInTheDocument();
    expect(screen.getByText('投票者2')).toBeInTheDocument();
  });

  it('票数达标时显示可处决提示', () => {
    mockStoreState = {
      gameState: {
        voting: { isOpen: true, votes: [0, 2], nomineeSeatId: 1 },
        seats: [
          { id: 0, userName: '玩家1', isDead: false },
          { id: 1, userName: '被提名者', isDead: false },
          { id: 2, userName: '玩家3', isDead: false },
        ],
      },
    };

    render(<DoomsdayClock />);

    // 3人存活需要2票，当前2票，应该显示可处决
    expect(screen.getByText('game.doomsdayClock.executable')).toBeInTheDocument();
  });

  it('正确计算处决所需票数', () => {
    // 5人存活需要3票
    mockStoreState = {
      gameState: {
        voting: { isOpen: true, votes: [], nomineeSeatId: 0 },
        seats: [
          { id: 0, userName: '玩家1', isDead: false },
          { id: 1, userName: '玩家2', isDead: false },
          { id: 2, userName: '玩家3', isDead: false },
          { id: 3, userName: '玩家4', isDead: false },
          { id: 4, userName: '玩家5', isDead: false },
        ],
      },
    };

    render(<DoomsdayClock />);

    expect(screen.getByText('/ 3')).toBeInTheDocument();
  });

  it('死亡玩家不计入存活人数', () => {
    // 5人中2人死亡，3人存活需要2票
    mockStoreState = {
      gameState: {
        voting: { isOpen: true, votes: [], nomineeSeatId: 0 },
        seats: [
          { id: 0, userName: '玩家1', isDead: false },
          { id: 1, userName: '玩家2', isDead: true },
          { id: 2, userName: '玩家3', isDead: false },
          { id: 3, userName: '玩家4', isDead: true },
          { id: 4, userName: '玩家5', isDead: false },
        ],
      },
    };

    render(<DoomsdayClock />);

    expect(screen.getByText('/ 2')).toBeInTheDocument();
  });
});
