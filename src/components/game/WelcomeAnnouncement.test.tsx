import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeAnnouncement } from './WelcomeAnnouncement';

// Mock useStore
vi.mock('../../store', () => ({
    useStore: () => ({
        setAudioMode: vi.fn(),
        audioSettings: {
            mode: 'online'
        }
    })
}));

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

        // First shows audio setup
        expect(screen.getByText('game.welcomeAnnouncement.audioSetup.title')).toBeInTheDocument();

        // Click confirm to proceed to welcome
        const confirmButton = screen.getByText('game.welcomeAnnouncement.audioSetup.confirmSetup', { exact: false });
        fireEvent.click(confirmButton);

        expect(screen.getByText('game.welcomeAnnouncement.welcome.title')).toBeInTheDocument();
    });

    it('应该在已关闭过后不显示公告', () => {
        localStorageMock.getItem.mockReturnValue('true');

        render(<WelcomeAnnouncement />);

        expect(screen.queryByText('game.welcomeAnnouncement.welcome.title')).not.toBeInTheDocument();
    });

    it('应该显示主要功能区域', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(<WelcomeAnnouncement />);

        // Complete audio setup first
        const confirmButton = screen.getByText('game.welcomeAnnouncement.audioSetup.confirmSetup', { exact: false });
        fireEvent.click(confirmButton);

        expect(screen.getByText('game.welcomeAnnouncement.welcome.about')).toBeInTheDocument();
        expect(screen.getByText('game.welcomeAnnouncement.welcome.features')).toBeInTheDocument();
        expect(screen.getByText('game.welcomeAnnouncement.welcome.feature1Title')).toBeInTheDocument();
        expect(screen.getByText('game.welcomeAnnouncement.welcome.feature2Title')).toBeInTheDocument();
        expect(screen.getByText('game.welcomeAnnouncement.welcome.feature3Title')).toBeInTheDocument();
        expect(screen.getByText('game.welcomeAnnouncement.welcome.feature4Title')).toBeInTheDocument();
    });

    it('应该显示重要说明', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(<WelcomeAnnouncement />);

        // Complete audio setup first
        const confirmButton = screen.getByText('game.welcomeAnnouncement.audioSetup.confirmSetup', { exact: false });
        fireEvent.click(confirmButton);

        expect(screen.getByText('game.welcomeAnnouncement.welcome.important')).toBeInTheDocument();
        expect(screen.getByText('game.welcomeAnnouncement.welcome.voiceTitle')).toBeInTheDocument();
        expect(screen.getByText('game.welcomeAnnouncement.welcome.mobileTitle')).toBeInTheDocument();
        expect(screen.getByText('game.welcomeAnnouncement.welcome.syncTitle')).toBeInTheDocument();
    });

    it('应该显示快速开始指南', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(<WelcomeAnnouncement />);

        // Complete audio setup first
        const confirmButton = screen.getByText('game.welcomeAnnouncement.audioSetup.confirmSetup', { exact: false });
        fireEvent.click(confirmButton);

        expect(screen.getByText('game.welcomeAnnouncement.welcome.quickStart')).toBeInTheDocument();
    });

    it('点击进入魔典按钮应该关闭公告', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(<WelcomeAnnouncement />);

        // Complete audio setup first
        const confirmButton = screen.getByText('game.welcomeAnnouncement.audioSetup.confirmSetup', { exact: false });
        fireEvent.click(confirmButton);

        const button = screen.getByText('game.welcomeAnnouncement.welcome.enterGrimoire', { exact: false });
        fireEvent.click(button);

        expect(screen.queryByText('game.welcomeAnnouncement.welcome.title')).not.toBeInTheDocument();
    });

    it('勾选不再显示后点击进入应该保存设置到 localStorage', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(<WelcomeAnnouncement />);

        // Complete audio setup first
        const confirmButton = screen.getByText('game.welcomeAnnouncement.audioSetup.confirmSetup', { exact: false });
        fireEvent.click(confirmButton);

        // 勾选不再显示
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        // 点击进入
        const button = screen.getByText('game.welcomeAnnouncement.welcome.enterGrimoire', { exact: false });
        fireEvent.click(button);

        expect(localStorageMock.setItem).toHaveBeenCalledWith('botc_welcome_dismissed_v1', 'true');
    });

    it('不勾选不再显示时不应该保存到 localStorage', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(<WelcomeAnnouncement />);

        // Complete audio setup first
        const confirmButton = screen.getByText('game.welcomeAnnouncement.audioSetup.confirmSetup', { exact: false });
        fireEvent.click(confirmButton);

        // 直接点击进入，不勾选
        const button = screen.getByText('game.welcomeAnnouncement.welcome.enterGrimoire', { exact: false });
        fireEvent.click(button);

        expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
});
