/** @vitest-environment jsdom */

/**
 * NightActionManager Tests
 *
 * Tests for the ST (Storyteller) night action management panel
 * This component displays pending night action requests from players
 * and allows the ST to respond to them
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NightActionManager } from './NightActionManager';
import type { NightActionRequest, Seat } from '../../types';

// Mock data
const mockSeats: Seat[] = [
  {
    id: 0,
    userId: 'user1',
    userName: 'Alice',
    isDead: false,
    hasGhostVote: false,
    roleId: 'washerwoman',
    realRoleId: 'washerwoman',
    seenRoleId: 'washerwoman',
    reminders: [],
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
    isVirtual: false,
  },
  {
    id: 1,
    userId: 'user2',
    userName: 'Bob',
    isDead: false,
    hasGhostVote: false,
    roleId: 'fortune_teller',
    realRoleId: 'fortune_teller',
    seenRoleId: 'fortune_teller',
    reminders: [],
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
    isVirtual: false,
  },
  {
    id: 2,
    userId: 'user3',
    userName: 'DrunkPlayer',
    isDead: false,
    hasGhostVote: false,
    roleId: 'washerwoman', // Seen role
    realRoleId: 'drunk', // Real role is drunk
    seenRoleId: 'washerwoman', // But thinks they are washerwoman
    reminders: [],
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
    isVirtual: false,
  },
];

const mockPendingRequests: NightActionRequest[] = [
  {
    id: 'req-1',
    seatId: 0,
    roleId: 'washerwoman',
    payload: { seatId: 1 },
    status: 'pending',
    timestamp: Date.now(),
  },
  {
    id: 'req-2',
    seatId: 1,
    roleId: 'fortune_teller',
    payload: { seatIds: [0, 2] },
    status: 'pending',
    timestamp: Date.now(),
  },
];

// Mock functions
const mockResolveNightAction = vi.fn();
const mockGetPendingNightActions = vi.fn();

// Default store state
let mockStoreState = {
  gameState: {
    seats: mockSeats,
  },
  user: {
    isStoryteller: true,
  },
  resolveNightAction: mockResolveNightAction,
  getPendingNightActions: mockGetPendingNightActions,
};

// Mock store
vi.mock('../../store', () => ({
  useStore: vi.fn((selector) => selector(mockStoreState)),
}));

// Mock zustand/shallow
vi.mock('zustand/shallow', () => ({
  shallow: vi.fn((a, b) => JSON.stringify(a) === JSON.stringify(b)),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'nightAction.manager.title': '待处理夜间行动',
        'nightAction.manager.pending': '待回复',
        'nightAction.manager.fakeAction': '假行动',
        'nightAction.manager.target': '目标',
        'nightAction.manager.realRole': '实际',
        'nightAction.manager.sendReply': '发送回复',
        'nightAction.manager.skipAction': '跳过',
        'nightAction.manager.replyPlaceholder': '输入回复给玩家的结果...',
        'nightAction.manager.drunkWarning': '此玩家的真实角色是',
        'nightAction.manager.drunkEffect': '他的行动不会生效，但你可以选择告诉他虚假信息。',
        'nightAction.manager.drunkLabel': '酒鬼',
        'nightAction.manager.disguiseLabel': '伪装',
        'nightAction.manager.quickReplies.executed': '已执行',
        'nightAction.manager.quickReplies.noEffect': '无效果',
        'nightAction.manager.quickReplies.targetDead': '目标已死亡',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock constants
vi.mock('../../constants', () => ({
  ROLES: {
    washerwoman: {
      id: 'washerwoman',
      name: '洗衣妇',
      icon: '👕',
      nightAction: {
        type: 'choose_player',
        prompt: '选择一个玩家',
      },
    },
    fortune_teller: {
      id: 'fortune_teller',
      name: '占卜师',
      icon: '🔮',
      nightAction: {
        type: 'choose_two_players',
        prompt: '选择两个玩家',
        options: ['是', '否'],
      },
    },
    drunk: {
      id: 'drunk',
      name: '酒鬼',
      icon: '🍺',
    },
    monk: {
      id: 'monk',
      name: '僧侣',
      icon: '✝️',
      nightAction: {
        type: 'choose_player',
        prompt: '选择保护的玩家',
      },
    },
    chef: {
      id: 'chef',
      name: '厨师',
      icon: '🍳',
      nightAction: {
        type: 'confirm',
        prompt: '确认你的行动',
      },
    },
    empath: {
      id: 'empath',
      name: '共情者',
      icon: '💚',
      nightAction: {
        type: 'confirm',
        prompt: '确认你的行动',
      },
    },
    librarian: {
      id: 'librarian',
      name: '图书管理员',
      icon: '📚',
      nightAction: {
        type: 'choose_player',
        prompt: '选择一个玩家',
      },
    },
    investigator: {
      id: 'investigator',
      name: '调查员',
      icon: '🔍',
      nightAction: {
        type: 'choose_player',
        prompt: '选择一个玩家',
      },
    },
    undertaker: {
      id: 'undertaker',
      name: '殡葬师',
      icon: '⚰️',
      nightAction: {
        type: 'confirm',
        prompt: '确认你的行动',
      },
    },
    unknown_role: {
      id: 'unknown_role',
      name: '未知角色',
    },
  },
}));

// Helper function to find the clickable request card by player name
const findRequestCard = (container: HTMLElement, playerName: string) => {
  // Find all request cards (divs with cursor-pointer class)
  const clickableCards = container.querySelectorAll('.cursor-pointer');
  for (const card of clickableCards) {
    // Check if this card contains the player name in the "font-bold" div (not in target description)
    const nameDiv = card.querySelector('.font-bold');
    if (nameDiv?.textContent?.includes(playerName)) {
      return card as HTMLElement;
    }
  }
  return null;
};

describe('NightActionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPendingNightActions.mockReturnValue(mockPendingRequests);
    mockStoreState = {
      gameState: {
        seats: mockSeats,
      },
      user: {
        isStoryteller: true,
      },
      resolveNightAction: mockResolveNightAction,
      getPendingNightActions: mockGetPendingNightActions,
    };
  });

  describe('Render conditions', () => {
    it('should return null when user is not storyteller', () => {
      mockStoreState = {
        ...mockStoreState,
        user: { isStoryteller: false },
      };

      const { container } = render(<NightActionManager />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when there is no game state', () => {
      mockStoreState = {
        ...mockStoreState,
        gameState: null as unknown as typeof mockStoreState.gameState,
      };

      const { container } = render(<NightActionManager />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when there are no pending requests', () => {
      mockGetPendingNightActions.mockReturnValue([]);

      const { container } = render(<NightActionManager />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when storyteller has pending requests', () => {
      render(<NightActionManager />);

      expect(screen.getByText('待处理夜间行动')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Badge count
    });
  });

  describe('Request display', () => {
    it('should display player name and role for each request', () => {
      render(<NightActionManager />);

      // Check that player names are in font-bold divs
      const boldDivs = document.querySelectorAll('.font-bold');
      const texts = Array.from(boldDivs).map((div) => div.textContent);
      expect(texts.some((t) => t?.includes('Alice'))).toBe(true);
      expect(texts.some((t) => t?.includes('洗衣妇'))).toBe(true);
      expect(texts.some((t) => t?.includes('Bob'))).toBe(true);
      expect(texts.some((t) => t?.includes('占卜师'))).toBe(true);
    });

    it('should display role icons', () => {
      render(<NightActionManager />);

      expect(screen.getByText('👕')).toBeInTheDocument();
      expect(screen.getByText('🔮')).toBeInTheDocument();
    });

    it('should show target description for single target', () => {
      render(<NightActionManager />);

      // First request targets seat 1 (Bob)
      expect(screen.getByText(/目标: Bob/)).toBeInTheDocument();
    });

    it('should show target description for multiple targets', () => {
      render(<NightActionManager />);

      // Second request targets seats 0 and 2 (Alice, DrunkPlayer)
      expect(screen.getByText(/目标: Alice, DrunkPlayer/)).toBeInTheDocument();
    });

    it('should show seat number if user name not found', () => {
      const requestWithUnknownTarget: NightActionRequest[] = [
        {
          id: 'req-unknown',
          seatId: 0,
          roleId: 'washerwoman',
          payload: { seatId: 99 }, // Non-existent seat
          status: 'pending',
          timestamp: Date.now(),
        },
      ];
      mockGetPendingNightActions.mockReturnValue(requestWithUnknownTarget);

      render(<NightActionManager />);

      expect(screen.getByText(/目标: 座位 100/)).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse functionality', () => {
    it('should expand request on click', () => {
      const { container } = render(<NightActionManager />);

      // Click on first request
      const firstRequest = findRequestCard(container, 'Alice');
      expect(firstRequest).not.toBeNull();
      fireEvent.click(firstRequest!);

      // Should show reply textarea and buttons
      expect(screen.getByPlaceholderText('输入回复给玩家的结果...')).toBeInTheDocument();
      expect(screen.getByText('发送回复')).toBeInTheDocument();
      expect(screen.getByText('跳过')).toBeInTheDocument();
    });

    it('should collapse expanded request when clicked again', () => {
      const { container } = render(<NightActionManager />);

      // Click to expand
      const firstRequest = findRequestCard(container, 'Alice');
      fireEvent.click(firstRequest!);
      expect(screen.getByPlaceholderText('输入回复给玩家的结果...')).toBeInTheDocument();

      // Click again to collapse
      fireEvent.click(firstRequest!);
      expect(screen.queryByPlaceholderText('输入回复给玩家的结果...')).not.toBeInTheDocument();
    });

    it('should only have one expanded request at a time', () => {
      const { container } = render(<NightActionManager />);

      // Click first request
      const firstRequest = findRequestCard(container, 'Alice');
      fireEvent.click(firstRequest!);

      // Click second request
      const secondRequest = findRequestCard(container, 'Bob');
      fireEvent.click(secondRequest!);

      // Only one textarea should be visible
      const textareas = screen.getAllByPlaceholderText('输入回复给玩家的结果...');
      expect(textareas).toHaveLength(1);
    });
  });

  describe('Quick reply buttons', () => {
    it('should show role-specific quick replies for washerwoman', () => {
      const { container } = render(<NightActionManager />);

      // Expand washerwoman request
      const firstRequest = findRequestCard(container, 'Alice');
      fireEvent.click(firstRequest!);

      expect(screen.getByText('已执行')).toBeInTheDocument();
      expect(screen.getByText('无效果')).toBeInTheDocument();
    });

    it('should show role-specific quick replies for fortune_teller', () => {
      const { container } = render(<NightActionManager />);

      // Expand fortune_teller request
      const secondRequest = findRequestCard(container, 'Bob');
      fireEvent.click(secondRequest!);

      expect(screen.getByText('已执行')).toBeInTheDocument();
      expect(screen.getByText('无效果')).toBeInTheDocument();
    });

    it('should show default quick replies for unknown roles', () => {
      const unknownRoleRequest: NightActionRequest[] = [
        {
          id: 'req-unknown',
          seatId: 0,
          roleId: 'some_custom_role',
          payload: { confirmed: true },
          status: 'pending',
          timestamp: Date.now(),
        },
      ];
      mockGetPendingNightActions.mockReturnValue(unknownRoleRequest);

      const { container } = render(<NightActionManager />);

      const request = findRequestCard(container, 'Alice');
      fireEvent.click(request!);

      expect(screen.getByText('已执行')).toBeInTheDocument();
      expect(screen.getByText('无效果')).toBeInTheDocument();
      expect(screen.getByText('目标已死亡')).toBeInTheDocument();
    });

    it('should fill textarea with quick reply when clicked', () => {
      const { container } = render(<NightActionManager />);

      // Expand request
      const firstRequest = findRequestCard(container, 'Alice');
      fireEvent.click(firstRequest!);

      // Click quick reply
      const quickReply = screen.getByText('无效果');
      fireEvent.click(quickReply);

      // Check textarea value
      const textarea = screen.getByPlaceholderText<HTMLTextAreaElement>('输入回复给玩家的结果...');
      expect(textarea.value).toBe('无效果');
    });
  });

  describe('Resolve actions', () => {
    it('should resolve with custom input when submit button clicked', () => {
      const { container } = render(<NightActionManager />);

      // Expand request
      const firstRequest = findRequestCard(container, 'Alice');
      fireEvent.click(firstRequest!);

      // Type custom response
      const textarea = screen.getByPlaceholderText('输入回复给玩家的结果...');
      fireEvent.change(textarea, { target: { value: '1号和2号中有一个是洗衣妇' } });

      // Submit
      const submitButton = screen.getByText('发送回复');
      fireEvent.click(submitButton);

      expect(mockResolveNightAction).toHaveBeenCalledWith('req-1', '1号和2号中有一个是洗衣妇');
    });

    it('should resolve with default message when input is empty', () => {
      const { container } = render(<NightActionManager />);

      // Expand request
      const firstRequest = findRequestCard(container, 'Alice');
      fireEvent.click(firstRequest!);

      // Submit without typing anything
      const submitButton = screen.getByText('发送回复');
      fireEvent.click(submitButton);

      expect(mockResolveNightAction).toHaveBeenCalledWith('req-1', '洗衣妇 能力已执行');
    });

    it('should resolve with default message when input is whitespace only', () => {
      const { container } = render(<NightActionManager />);

      // Expand request
      const firstRequest = findRequestCard(container, 'Alice');
      fireEvent.click(firstRequest!);

      // Type only whitespace
      const textarea = screen.getByPlaceholderText('输入回复给玩家的结果...');
      fireEvent.change(textarea, { target: { value: '   ' } });

      // Submit
      const submitButton = screen.getByText('发送回复');
      fireEvent.click(submitButton);

      expect(mockResolveNightAction).toHaveBeenCalledWith('req-1', '洗衣妇 能力已执行');
    });

    it('should skip action with no info message', () => {
      const { container } = render(<NightActionManager />);

      // Expand request
      const firstRequest = findRequestCard(container, 'Alice');
      fireEvent.click(firstRequest!);

      // Click skip button
      const skipButton = screen.getByText('跳过');
      fireEvent.click(skipButton);

      expect(mockResolveNightAction).toHaveBeenCalledWith('req-1', '（无信息）');
    });

    it('should clear input and collapse after resolving', () => {
      const { container } = render(<NightActionManager />);

      // Expand request
      const firstRequest = findRequestCard(container, 'Alice');
      fireEvent.click(firstRequest!);

      // Type and submit
      const textarea = screen.getByPlaceholderText('输入回复给玩家的结果...');
      fireEvent.change(textarea, { target: { value: 'test' } });

      const submitButton = screen.getByText('发送回复');
      fireEvent.click(submitButton);

      // Panel should be collapsed (no textarea visible)
      expect(screen.queryByPlaceholderText('输入回复给玩家的结果...')).not.toBeInTheDocument();
    });
  });

  describe('Drunk/Fake role handling', () => {
    it('should show fake role indicator for drunk player', () => {
      const drunkRequest: NightActionRequest[] = [
        {
          id: 'req-drunk',
          seatId: 2, // DrunkPlayer
          roleId: 'washerwoman', // Thinks they are washerwoman
          payload: { seatId: 0 },
          status: 'pending',
          timestamp: Date.now(),
        },
      ];
      mockGetPendingNightActions.mockReturnValue(drunkRequest);

      render(<NightActionManager />);

      // Should show drunk indicator
      expect(screen.getByText(/伪装/)).toBeInTheDocument();
    });

    it('should show warning about fake action when expanded', () => {
      const drunkRequest: NightActionRequest[] = [
        {
          id: 'req-drunk',
          seatId: 2, // DrunkPlayer
          roleId: 'washerwoman',
          payload: { seatId: 0 },
          status: 'pending',
          timestamp: Date.now(),
        },
      ];
      mockGetPendingNightActions.mockReturnValue(drunkRequest);

      const { container } = render(<NightActionManager />);

      // Expand request
      const request = findRequestCard(container, 'DrunkPlayer');
      fireEvent.click(request!);

      // Should show warning message
      expect(screen.getByText(/此玩家的真实角色是/)).toBeInTheDocument();
      expect(screen.getByText(/不会生效/)).toBeInTheDocument();
    });
  });

  describe('Choice-based target description', () => {
    it('should show option text for binary choice actions', () => {
      const binaryRequest: NightActionRequest[] = [
        {
          id: 'req-binary',
          seatId: 0,
          roleId: 'fortune_teller',
          payload: { choice: 0 },
          status: 'pending',
          timestamp: Date.now(),
        },
      ];
      mockGetPendingNightActions.mockReturnValue(binaryRequest);

      render(<NightActionManager />);

      // Should show the option text
      expect(screen.getByText(/目标: 是/)).toBeInTheDocument();
    });

    it('should show fallback text for choice without options', () => {
      const binaryRequest: NightActionRequest[] = [
        {
          id: 'req-binary',
          seatId: 0,
          roleId: 'unknown_role', // No options defined
          payload: { choice: 2 },
          status: 'pending',
          timestamp: Date.now(),
        },
      ];
      mockGetPendingNightActions.mockReturnValue(binaryRequest);

      render(<NightActionManager />);

      // Should show fallback text
      expect(screen.getByText(/目标: 选项 3/)).toBeInTheDocument();
    });

    it('should show confirmed text when no specific target', () => {
      const confirmRequest: NightActionRequest[] = [
        {
          id: 'req-confirm',
          seatId: 0,
          roleId: 'chef',
          payload: { confirmed: true },
          status: 'pending',
          timestamp: Date.now(),
        },
      ];
      mockGetPendingNightActions.mockReturnValue(confirmRequest);

      render(<NightActionManager />);

      expect(screen.getByText(/目标: 已确认/)).toBeInTheDocument();
    });
  });

  describe('UI status indicators', () => {
    it('should show pending status for normal requests', () => {
      render(<NightActionManager />);

      expect(screen.getAllByText('待回复')).toHaveLength(2);
    });

    it('should show fake action status for drunk requests', () => {
      const drunkRequest: NightActionRequest[] = [
        {
          id: 'req-drunk',
          seatId: 2,
          roleId: 'washerwoman',
          payload: { seatId: 0 },
          status: 'pending',
          timestamp: Date.now(),
        },
      ];
      mockGetPendingNightActions.mockReturnValue(drunkRequest);

      render(<NightActionManager />);

      expect(screen.getByText(/假行动/)).toBeInTheDocument();
    });
  });

  describe('Textarea input handling', () => {
    it('should update input value on change', () => {
      const { container } = render(<NightActionManager />);

      // Expand request
      const firstRequest = findRequestCard(container, 'Alice');
      fireEvent.click(firstRequest!);

      // Type in textarea
      const textarea = screen.getByPlaceholderText<HTMLTextAreaElement>('输入回复给玩家的结果...');
      fireEvent.change(textarea, { target: { value: 'Test input' } });

      expect(textarea.value).toBe('Test input');
    });

    it('should maintain separate inputs for different requests', () => {
      const { container } = render(<NightActionManager />);

      // Expand first request and type
      const firstRequest = findRequestCard(container, 'Alice');
      fireEvent.click(firstRequest!);
      const textarea1 = screen.getByPlaceholderText<HTMLTextAreaElement>('输入回复给玩家的结果...');
      fireEvent.change(textarea1, { target: { value: 'Input for Alice' } });

      // Expand second request
      const secondRequest = findRequestCard(container, 'Bob');
      fireEvent.click(secondRequest!);
      const textarea2 = screen.getByPlaceholderText<HTMLTextAreaElement>('输入回复给玩家的结果...');

      // Second request should have empty input
      expect(textarea2.value).toBe('');

      // Go back to first request
      fireEvent.click(firstRequest!);
      const textarea1Again = screen.getByPlaceholderText<HTMLTextAreaElement>('输入回复给玩家的结果...');

      // First request should retain its input
      expect(textarea1Again.value).toBe('Input for Alice');
    });
  });

  describe('Edge cases', () => {
    it('should handle unknown role ID gracefully', () => {
      const unknownRequest: NightActionRequest[] = [
        {
          id: 'req-unknown',
          seatId: 0,
          roleId: 'non_existent_role',
          payload: { confirmed: true },
          status: 'pending',
          timestamp: Date.now(),
        },
      ];
      mockGetPendingNightActions.mockReturnValue(unknownRequest);

      const { container } = render(<NightActionManager />);

      // Should show role ID as fallback
      expect(screen.getByText(/non_existent_role/)).toBeInTheDocument();
      // Should show HelpCircle SVG icon as fallback for unknown roles
      // The SVG is rendered by lucide-react's HelpCircle component (class: lucide-circle-question-mark)
      const svgIcon = container.querySelector('svg.lucide-circle-question-mark');
      expect(svgIcon).toBeInTheDocument();
    });

    it('should handle empty seats array', () => {
      mockStoreState = {
        ...mockStoreState,
        gameState: {
          seats: [],
        },
      };

      render(<NightActionManager />);

      // Should still render but show seat number instead of name
      expect(screen.getByText(/座位 1/)).toBeInTheDocument();
    });

    it('should use role ID for default message when role not found', () => {
      const unknownRequest: NightActionRequest[] = [
        {
          id: 'req-unknown',
          seatId: 0,
          roleId: 'completely_unknown',
          payload: {},
          status: 'pending',
          timestamp: Date.now(),
        },
      ];
      mockGetPendingNightActions.mockReturnValue(unknownRequest);

      const { container } = render(<NightActionManager />);

      // Find the clickable card - since we have mock seats, it will show 'Alice'
      const request = findRequestCard(container, 'Alice');
      fireEvent.click(request!);
      const submitButton = screen.getByText('发送回复');
      fireEvent.click(submitButton);

      expect(mockResolveNightAction).toHaveBeenCalledWith('req-unknown', 'completely_unknown 能力已执行');
    });
  });
});
