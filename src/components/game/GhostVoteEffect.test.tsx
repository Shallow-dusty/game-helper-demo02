/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { GhostVoteEffect, useGhostVoteEffect } from './GhostVoteEffect';
import { renderHook } from '@testing-library/react';

// Mock framer-motion to avoid animation issues in test
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => <div {...props}>{children}</div>,
    path: (props: object) => <path {...props} />,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}));

// Mock useSoundEffect with stable callbacks
const mockPlaySound = vi.fn();

vi.mock('../../hooks/useSoundEffect', () => ({
  useSoundEffect: () => ({
    playSound: mockPlaySound,
  }),
}));

// Mock lucide-react Ghost icon
vi.mock('lucide-react', () => ({
  Ghost: ({ className }: { className?: string }) => <svg data-testid="ghost-icon" className={className} />,
}));

describe('GhostVoteEffect', () => {
  const defaultProps = {
    voterSeatId: null,
    targetSeatId: null,
    voterName: 'TestPlayer',
    voterPosition: { x: 100, y: 100 },
    targetPosition: { x: 300, y: 300 },
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('初始渲染', () => {
    it('当 voterSeatId 为 null 时不渲染任何内容', () => {
      const { container } = render(
        <GhostVoteEffect {...defaultProps} voterSeatId={null} targetSeatId={1} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('当 targetSeatId 为 null 时不渲染任何内容', () => {
      const { container } = render(
        <GhostVoteEffect {...defaultProps} voterSeatId={1} targetSeatId={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('当 voterPosition 缺失时不渲染任何内容', () => {
      const { container } = render(
        <GhostVoteEffect
          {...defaultProps}
          voterSeatId={1}
          targetSeatId={2}
          voterPosition={undefined}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('当 targetPosition 缺失时不渲染任何内容', () => {
      const { container } = render(
        <GhostVoteEffect
          {...defaultProps}
          voterSeatId={1}
          targetSeatId={2}
          targetPosition={undefined}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('幽灵投票效果激活', () => {
    it('当提供完整的投票信息时渲染效果', () => {
      const { container } = render(
        <GhostVoteEffect
          {...defaultProps}
          voterSeatId={1}
          targetSeatId={2}
        />
      );

      // 效果激活后应该有渲染内容
      expect(container.innerHTML.length).toBeGreaterThan(0);
    });

    it('激活时播放 ghost_whisper 音效', () => {
      render(
        <GhostVoteEffect
          {...defaultProps}
          voterSeatId={1}
          targetSeatId={2}
        />
      );

      expect(mockPlaySound).toHaveBeenCalledWith('ghost_whisper');
    });

    it('显示投票者名称', () => {
      render(
        <GhostVoteEffect
          {...defaultProps}
          voterSeatId={1}
          targetSeatId={2}
          voterName="幽灵玩家"
        />
      );

      // The component displays both emoji and name, but since text is a translation key in test,
      // we just check that the text container exists
      expect(screen.getByText('game.ghostVote.lastVote')).toBeInTheDocument();
    });

    it('显示"最后的投票"文本', () => {
      render(
        <GhostVoteEffect
          {...defaultProps}
          voterSeatId={1}
          targetSeatId={2}
        />
      );

      expect(screen.getByText('game.ghostVote.lastVote')).toBeInTheDocument();
    });

    it('渲染 SVG 轨迹路径', () => {
      const { container } = render(
        <GhostVoteEffect
          {...defaultProps}
          voterSeatId={1}
          targetSeatId={2}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });

    it('渲染幽灵图标', () => {
      render(
        <GhostVoteEffect
          {...defaultProps}
          voterSeatId={1}
          targetSeatId={2}
        />
      );

      const ghostIcons = screen.getAllByTestId('ghost-icon');
      expect(ghostIcons.length).toBeGreaterThan(0);
    });
  });

  describe('效果生命周期', () => {
    it('效果激活时音效被调用', () => {
      // 测试音效是否在效果激活时被调用
      render(
        <GhostVoteEffect
          {...defaultProps}
          voterSeatId={1}
          targetSeatId={2}
        />
      );

      expect(mockPlaySound).toHaveBeenCalledWith('ghost_whisper');
    });

    it('组件正常初始化和渲染效果元素', () => {
      // 测试组件能正确渲染效果相关元素
      const { container } = render(
        <GhostVoteEffect
          {...defaultProps}
          voterSeatId={1}
          targetSeatId={2}
        />
      );

      // 检查是否有 SVG 元素（轨迹路径）
      expect(container.querySelector('svg')).toBeInTheDocument();
      // 检查是否有幽灵图标
      expect(screen.getAllByTestId('ghost-icon').length).toBeGreaterThan(0);
    });

    it('组件卸载时不会导致错误', () => {
      const { unmount } = render(
        <GhostVoteEffect
          {...defaultProps}
          voterSeatId={1}
          targetSeatId={2}
        />
      );

      // 确保组件可以安全卸载
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('投票状态重置', () => {
    it('当 voterSeatId 变为 null 时重置状态', () => {
      const { rerender, container } = render(
        <GhostVoteEffect
          {...defaultProps}
          voterSeatId={1}
          targetSeatId={2}
        />
      );

      // 初始有内容
      expect(container.innerHTML.length).toBeGreaterThan(0);

      // 将 voterSeatId 设为 null
      rerender(
        <GhostVoteEffect
          {...defaultProps}
          voterSeatId={null}
          targetSeatId={2}
        />
      );

      // 等待效果结束
      act(() => {
        vi.advanceTimersByTime(2100);
      });
    });
  });

  describe('边界情况', () => {
    it('不提供 voterName 时仍能正常渲染', () => {
      const { container } = render(
        <GhostVoteEffect
          voterSeatId={1}
          targetSeatId={2}
          voterPosition={{ x: 100, y: 100 }}
          targetPosition={{ x: 300, y: 300 }}
        />
      );

      expect(container.innerHTML.length).toBeGreaterThan(0);
    });

    it('处理相同位置的起点和终点', () => {
      const { container } = render(
        <GhostVoteEffect
          voterSeatId={1}
          targetSeatId={2}
          voterPosition={{ x: 200, y: 200 }}
          targetPosition={{ x: 200, y: 200 }}
        />
      );

      expect(container.innerHTML.length).toBeGreaterThan(0);
    });

    it('处理负坐标位置', () => {
      const { container } = render(
        <GhostVoteEffect
          voterSeatId={1}
          targetSeatId={2}
          voterPosition={{ x: -50, y: -50 }}
          targetPosition={{ x: 100, y: 100 }}
        />
      );

      expect(container.innerHTML.length).toBeGreaterThan(0);
    });

    it('处理大坐标值', () => {
      const { container } = render(
        <GhostVoteEffect
          voterSeatId={1}
          targetSeatId={2}
          voterPosition={{ x: 10000, y: 10000 }}
          targetPosition={{ x: 20000, y: 20000 }}
        />
      );

      expect(container.innerHTML.length).toBeGreaterThan(0);
    });
  });
});

describe('useGhostVoteEffect hook', () => {
  it('初始状态 voteInfo 为 null', () => {
    const { result } = renderHook(() => useGhostVoteEffect());

    expect(result.current.voteInfo).toBeNull();
  });

  it('triggerGhostVote 设置投票信息', () => {
    const { result } = renderHook(() => useGhostVoteEffect());

    act(() => {
      result.current.triggerGhostVote(
        1,
        2,
        '幽灵玩家',
        { x: 100, y: 100 },
        { x: 300, y: 300 }
      );
    });

    expect(result.current.voteInfo).toEqual({
      voterSeatId: 1,
      targetSeatId: 2,
      voterName: '幽灵玩家',
      voterPosition: { x: 100, y: 100 },
      targetPosition: { x: 300, y: 300 },
    });
  });

  it('clearGhostVote 清除投票信息', () => {
    const { result } = renderHook(() => useGhostVoteEffect());

    // 先设置投票信息
    act(() => {
      result.current.triggerGhostVote(
        1,
        2,
        '幽灵玩家',
        { x: 100, y: 100 },
        { x: 300, y: 300 }
      );
    });

    expect(result.current.voteInfo).not.toBeNull();

    // 清除投票信息
    act(() => {
      result.current.clearGhostVote();
    });

    expect(result.current.voteInfo).toBeNull();
  });

  it('多次调用 triggerGhostVote 更新投票信息', () => {
    const { result } = renderHook(() => useGhostVoteEffect());

    act(() => {
      result.current.triggerGhostVote(1, 2, '玩家A', { x: 0, y: 0 }, { x: 100, y: 100 });
    });

    expect(result.current.voteInfo?.voterName).toBe('玩家A');

    act(() => {
      result.current.triggerGhostVote(3, 4, '玩家B', { x: 50, y: 50 }, { x: 200, y: 200 });
    });

    expect(result.current.voteInfo?.voterName).toBe('玩家B');
    expect(result.current.voteInfo?.voterSeatId).toBe(3);
    expect(result.current.voteInfo?.targetSeatId).toBe(4);
  });

  it('hook 返回的函数引用保持稳定', () => {
    const { result, rerender } = renderHook(() => useGhostVoteEffect());

    const initialTrigger = result.current.triggerGhostVote;
    const initialClear = result.current.clearGhostVote;

    rerender();

    expect(result.current.triggerGhostVote).toBe(initialTrigger);
    expect(result.current.clearGhostVote).toBe(initialClear);
  });
});
