 
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

// Create mock store state holder
let mockStoreState: any = {};

// Mock matter-js with all required methods
vi.mock('matter-js', () => ({
  default: {
    Engine: {
      create: () => ({
        world: { bodies: [] },
      }),
      clear: vi.fn(),
    },
    Render: {
      create: () => ({
        canvas: { remove: vi.fn() },
        context: {},
      }),
      run: vi.fn(),
      stop: vi.fn(),
    },
    Runner: {
      create: () => ({}),
      run: vi.fn(),
      stop: vi.fn(),
    },
    Bodies: {
      rectangle: () => ({}),
      circle: () => ({}),
    },
    Composite: {
      add: vi.fn(),
      allBodies: () => [],
      remove: vi.fn(),
    },
    World: {
      clear: vi.fn(),
    },
    Events: {
      on: vi.fn(),
      off: vi.fn(),
    },
  },
}));

// Mock the store with selector support
vi.mock('../../store', () => ({
  useStore: () => mockStoreState,
}));

import { JudgmentZone } from './JudgmentZone';

describe('JudgmentZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = {
      gameState: {
        voteHistory: [],
        seats: [],
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('没有投票历史时正常渲染', () => {
    const { container } = render(<JudgmentZone />);
    expect(container.firstChild).toBeTruthy();
  });

  it('使用自定义尺寸渲染', () => {
    const { container } = render(<JudgmentZone width={400} height={400} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('有投票历史时正常渲染', () => {
    mockStoreState = {
      gameState: {
        voteHistory: [
          { votes: [0, 1, 2], targetSeatId: 3, timestamp: Date.now() },
        ],
        seats: [
          { id: 0, userName: '玩家1', isDead: false },
          { id: 1, userName: '玩家2', isDead: false },
          { id: 2, userName: '玩家3', isDead: false },
          { id: 3, userName: '被提名者', isDead: false },
        ],
      },
    };

    const { container } = render(<JudgmentZone />);
    expect(container.firstChild).toBeTruthy();
  });
});
