import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TruthReveal } from './TruthReveal';

// Mock store with stable reference to avoid rerunning effects on every render
const mockGameState = {
    gameState: {
        seats: [
            { id: 0, userName: '玩家1', realRoleId: 'imp', seenRoleId: 'imp', isDead: false, statuses: [] },
            { id: 1, userName: '玩家2', realRoleId: 'washerwoman', seenRoleId: 'washerwoman', isDead: false, statuses: [] },
        ],
        gameOver: { isOver: true, winner: 'evil', reason: '恶魔获胜' },
    },
};

vi.mock('../../store', () => ({
    useStore: vi.fn((selector) => selector(mockGameState)),
}));

// Mock useSoundEffect with stable callbacks to avoid re-running effects
const mockPlaySound = vi.fn();
const mockPreloadSounds = vi.fn();

vi.mock('../../hooks/useSoundEffect', () => ({
    useSoundEffect: () => ({
        playSound: mockPlaySound,
        preloadSounds: mockPreloadSounds,
    }),
}));

// Mock Confetti
vi.mock('./Confetti', () => ({
    Confetti: () => null
}));

describe('TruthReveal', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('关闭状态不渲染主要内容', () => {
        const { container } = render(<TruthReveal isOpen={false} onClose={vi.fn()} />);
        
        // 关闭时应该返回空或隐藏
        expect(container.textContent).toBe('');
    });

    it('打开状态应该渲染内容', () => {
        render(<TruthReveal isOpen={true} onClose={vi.fn()} />);
        
        // 应该有一些渲染内容
        expect(document.body.textContent?.length).toBeGreaterThan(0);
    });
});
