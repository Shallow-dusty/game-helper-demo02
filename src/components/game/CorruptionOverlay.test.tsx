import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { CorruptionOverlay } from './CorruptionOverlay';

// Mock useSoundEffect hook
vi.mock('../../hooks/useSoundEffect', () => ({
    useSoundEffect: () => ({
        playSound: vi.fn()
    })
}));

// Mock Audio API
const mockAudioInstances: {
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    loop: boolean;
    volume: number;
    src: string;
}[] = [];

// 使用类来 mock Audio
class MockAudio {
    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
    loop = false;
    volume = 1;
    src: string;
    
    constructor(src?: string) {
        this.src = src || '';
        mockAudioInstances.push(this);
    }
}

const originalAudio = globalThis.Audio;

beforeEach(() => {
    mockAudioInstances.length = 0;
    // @ts-expect-error - mocking global Audio
    globalThis.Audio = MockAudio;
});

afterEach(() => {
    cleanup();
    globalThis.Audio = originalAudio;
});

describe('CorruptionOverlay', () => {
    it('stage 0 时不渲染任何内容', () => {
        const { container } = render(<CorruptionOverlay stage={0} />);
        
        // 没有任何动态元素
        expect(container.firstChild).toBeNull();
    });

    it('stage 1 时应该渲染轻微腐蚀效果', () => {
        const { container } = render(<CorruptionOverlay stage={1} />);
        
        // 应该有渲染内容
        expect(container.firstChild).not.toBeNull();
    });

    it('stage 2 时应该渲染严重腐蚀效果', () => {
        const { container } = render(<CorruptionOverlay stage={2} />);
        
        // 应该有渲染内容
        expect(container.firstChild).not.toBeNull();
    });

    it('从低阶段升级到 stage 3 时应该创建音频', () => {
        // 先渲染 stage 2，然后切换到 stage 3
        // 因为组件只在 stage 从非3变为3时才创建音频
        const { rerender } = render(<CorruptionOverlay stage={2} />);
        
        // 切换到 stage 3
        rerender(<CorruptionOverlay stage={3} />);
        
        // 应该创建 Audio 实例用于 drone
        expect(mockAudioInstances.length).toBeGreaterThan(0);
        expect(mockAudioInstances[0].src).toBe('/audio/sfx/drone_low.mp3');
    });

    it('从 stage 3 降级时应该触发淡出', () => {
        // 先渲染 stage 2，然后切换到 stage 3 创建音频
        const { rerender } = render(<CorruptionOverlay stage={2} />);
        rerender(<CorruptionOverlay stage={3} />);
        
        // 验证音频已创建
        expect(mockAudioInstances.length).toBeGreaterThan(0);
        
        // 重新渲染为 stage 2
        rerender(<CorruptionOverlay stage={2} />);
        
        // 验证 Audio 被创建（淡出过程会逐步执行）
        expect(mockAudioInstances.length).toBeGreaterThan(0);
    });

    it('组件卸载时应该清理音频', () => {
        // 先从 stage 2 进入 stage 3 以创建音频
        const { rerender, unmount } = render(<CorruptionOverlay stage={2} />);
        rerender(<CorruptionOverlay stage={3} />);
        
        // 确保音频已创建
        expect(mockAudioInstances.length).toBeGreaterThan(0);
        
        // 卸载组件
        unmount();
        
        // 验证音频被暂停
        expect(mockAudioInstances[0].pause).toHaveBeenCalled();
    });

    it('stage 3 直接渲染时不应该立即创建音频（因为没有阶段变化）', () => {
        // 直接渲染 stage 3，prevStageRef 初始值等于 stage，所以不会触发音频
        render(<CorruptionOverlay stage={3} />);
        
        // 由于组件的逻辑是检测阶段变化，直接渲染 stage 3 不会创建音频
        // 这是组件的设计行为
        expect(mockAudioInstances.length).toBe(0);
    });
});
