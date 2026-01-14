import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NightActionPanel } from './NightActionPanel';

// Mock i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'nightAction.panel.nightAction': 'Night Action',
                'nightAction.panel.confirmSubmit': 'Confirm Action',
                'nightAction.panel.virtualPlayer': 'Virtual Player',
                'nightAction.panel.dead': 'Dead',
                'nightAction.skip': 'Skip'
            };
            return translations[key] || key;
        }
    })
}));

// Mock store
const mockPerformNightAction = vi.fn();
const mockGameState = {
    seats: [
        { id: 0, userId: 'user-1', userName: '玩家1', isVirtual: false },
        { id: 1, userId: 'user-2', userName: '玩家2', isVirtual: false },
        { id: 2, userId: null, userName: '', isVirtual: true }
    ]
};

vi.mock('../../store', () => ({
    useStore: vi.fn((selector) => {
        const state = {
            gameState: mockGameState,
            performNightAction: mockPerformNightAction
        };
        return selector(state);
    })
}));

// Mock ROLES 和 Z_INDEX
vi.mock('../../constants', () => ({
    ROLES: {
        imp: {
            id: 'imp',
            name: '小鬼',
            icon: '👹',
            nightAction: {
                type: 'choose_player',
                prompt: '选择一个玩家杀死'
            }
        },
        fortune_teller: {
            id: 'fortune_teller',
            name: '占卜师',
            icon: '🔮',
            nightAction: {
                type: 'choose_two_players',
                prompt: '选择两个玩家'
            }
        },
        monk: {
            id: 'monk',
            name: '僧侣',
            icon: '✝️',
            nightAction: {
                type: 'confirm',
                prompt: '确认你的行动'
            }
        },
        washerwoman: {
            id: 'washerwoman',
            name: '洗衣妇',
            icon: '👚'
            // 没有 nightAction
        }
    },
    Z_INDEX: {
        floatingPanel: 100
    }
}));

describe('NightActionPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('应该渲染角色信息 | should render role information', () => {
        render(<NightActionPanel roleId="imp" onComplete={vi.fn()} />);

        expect(screen.getByText(/小鬼|imp/i)).toBeInTheDocument();
        expect(screen.getByText(/night action/i)).toBeInTheDocument();
    });

    it('应该显示夜间行动提示 | should display night action prompt', () => {
        render(<NightActionPanel roleId="imp" onComplete={vi.fn()} />);

        expect(screen.getByText(/"选择一个玩家杀死"/)).toBeInTheDocument();
    });

    it('没有夜间行动时不渲染 | does not render when no night action', () => {
        const { container } = render(<NightActionPanel roleId="washerwoman" onComplete={vi.fn()} />);

        expect(container.firstChild).toBeNull();
    });

    it('应该显示可选择的玩家列表 | should display list of selectable players', () => {
        render(<NightActionPanel roleId="imp" onComplete={vi.fn()} />);

        expect(screen.getByText(/玩家1|player1/i)).toBeInTheDocument();
        expect(screen.getByText(/玩家2|player2/i)).toBeInTheDocument();
    });

    it('choose_player 类型：点击玩家应该选择该玩家 | choose_player type: clicking player should select it', () => {
        render(<NightActionPanel roleId="imp" onComplete={vi.fn()} />);

        const player1 = screen.getByText(/玩家1|player1/i);
        fireEvent.click(player1);

        // 验证选择状态（通过样式或提交按钮状态）
        const confirmButton = screen.getByText(/confirm action|确认行动/i);
        expect(confirmButton).not.toBeDisabled();
    });

    it('choose_player 类型：选择玩家后点击确认应该提交 | choose_player type: should submit after clicking confirm', () => {
        const onComplete = vi.fn();
        render(<NightActionPanel roleId="imp" onComplete={onComplete} />);

        // 选择玩家
        const player1 = screen.getByText(/玩家1|player1/i);
        fireEvent.click(player1);

        // 点击确认
        const confirmButton = screen.getByText(/confirm action|确认行动/i);
        fireEvent.click(confirmButton);

        expect(mockPerformNightAction).toHaveBeenCalledWith({
            roleId: 'imp',
            payload: { seatId: 0 }
        });
        expect(onComplete).toHaveBeenCalled();
    });

    it('choose_two_players 类型：应该允许选择两个玩家 | choose_two_players type: should allow selecting two players', () => {
        render(<NightActionPanel roleId="fortune_teller" onComplete={vi.fn()} />);

        // 选择两个玩家
        const player1 = screen.getByText(/玩家1|player1/i);
        const player2 = screen.getByText(/玩家2|player2/i);

        fireEvent.click(player1);
        fireEvent.click(player2);

        // 确认按钮应该可用
        const confirmButton = screen.getByText(/confirm action|确认行动/i);
        expect(confirmButton).not.toBeDisabled();
    });

    it('choose_two_players 类型：选择满两个后应该提交正确数据 | choose_two_players type: should submit correct data after selecting two', () => {
        const onComplete = vi.fn();
        render(<NightActionPanel roleId="fortune_teller" onComplete={onComplete} />);

        const player1 = screen.getByText(/玩家1|player1/i);
        const player2 = screen.getByText(/玩家2|player2/i);

        fireEvent.click(player1);
        fireEvent.click(player2);

        const confirmButton = screen.getByText(/confirm action|确认行动/i);
        fireEvent.click(confirmButton);

        expect(mockPerformNightAction).toHaveBeenCalledWith({
            roleId: 'fortune_teller',
            payload: { seatIds: [0, 1] }
        });
    });

    it('confirm 类型：应该直接可以确认 | confirm type: should be able to confirm directly', () => {
        const onComplete = vi.fn();
        render(<NightActionPanel roleId="monk" onComplete={onComplete} />);

        const confirmButton = screen.getByText(/confirm action|确认行动/i);
        expect(confirmButton).not.toBeDisabled();

        fireEvent.click(confirmButton);

        expect(mockPerformNightAction).toHaveBeenCalledWith({
            roleId: 'monk',
            payload: { confirmed: true }
        });
        expect(onComplete).toHaveBeenCalled();
    });

    it('choose_two_players 类型：可以取消选择 | choose_two_players type: can deselect', () => {
        render(<NightActionPanel roleId="fortune_teller" onComplete={vi.fn()} />);

        const player1 = screen.getByText(/玩家1|player1/i);

        // 选择
        fireEvent.click(player1);
        // 再次点击取消选择
        fireEvent.click(player1);

        // 确认按钮应该禁用（未选满两个）
        const confirmButton = screen.getByText(/confirm action|确认行动/i);
        expect(confirmButton).toBeDisabled();
    });
});
