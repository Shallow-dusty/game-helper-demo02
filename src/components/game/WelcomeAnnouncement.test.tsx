import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeAnnouncement } from './WelcomeAnnouncement';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('WelcomeAnnouncement', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('应该在未曾关闭时显示公告', () => {
        localStorageMock.getItem.mockReturnValue(null);
        
        render(<WelcomeAnnouncement />);
        
        expect(screen.getByText('欢迎使用血染钟楼魔典')).toBeInTheDocument();
    });

    it('应该在已关闭过后不显示公告', () => {
        localStorageMock.getItem.mockReturnValue('true');
        
        render(<WelcomeAnnouncement />);
        
        expect(screen.queryByText('欢迎使用血染钟楼魔典')).not.toBeInTheDocument();
    });

    it('应该显示主要功能区域', () => {
        localStorageMock.getItem.mockReturnValue(null);
        
        render(<WelcomeAnnouncement />);
        
        expect(screen.getByText('关于魔典')).toBeInTheDocument();
        expect(screen.getByText('主要功能')).toBeInTheDocument();
        expect(screen.getByText('角色分配与管理')).toBeInTheDocument();
        expect(screen.getByText('夜间行动流程')).toBeInTheDocument();
        expect(screen.getByText('投票与提名')).toBeInTheDocument();
        expect(screen.getByText('AI规则咨询助手')).toBeInTheDocument();
    });

    it('应该显示重要说明', () => {
        localStorageMock.getItem.mockReturnValue(null);
        
        render(<WelcomeAnnouncement />);
        
        expect(screen.getByText('重要说明')).toBeInTheDocument();
        expect(screen.getByText('语音通话功能')).toBeInTheDocument();
        expect(screen.getByText('移动端支持')).toBeInTheDocument();
        expect(screen.getByText('实时同步')).toBeInTheDocument();
    });

    it('应该显示快速开始指南', () => {
        localStorageMock.getItem.mockReturnValue(null);
        
        render(<WelcomeAnnouncement />);
        
        expect(screen.getByText('快速开始')).toBeInTheDocument();
    });

    it('点击进入魔典按钮应该关闭公告', () => {
        localStorageMock.getItem.mockReturnValue(null);
        
        render(<WelcomeAnnouncement />);
        
        const button = screen.getByText('进入魔典 →');
        fireEvent.click(button);
        
        expect(screen.queryByText('欢迎使用血染钟楼魔典')).not.toBeInTheDocument();
    });

    it('勾选不再显示后点击进入应该保存设置到 localStorage', () => {
        localStorageMock.getItem.mockReturnValue(null);
        
        render(<WelcomeAnnouncement />);
        
        // 勾选不再显示
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        
        // 点击进入
        const button = screen.getByText('进入魔典 →');
        fireEvent.click(button);
        
        expect(localStorageMock.setItem).toHaveBeenCalledWith('botc_welcome_dismissed_v1', 'true');
    });

    it('不勾选不再显示时不应该保存到 localStorage', () => {
        localStorageMock.getItem.mockReturnValue(null);
        
        render(<WelcomeAnnouncement />);
        
        // 直接点击进入，不勾选
        const button = screen.getByText('进入魔典 →');
        fireEvent.click(button);
        
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
});
