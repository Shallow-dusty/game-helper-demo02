/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhaseIndicator } from './PhaseIndicator';
import * as storeModule from '../../store';

vi.mock('../../store', () => ({
  useStore: vi.fn(),
  ConnectionStatus: {
    connecting: 'connecting',
    connected: 'connected',
    reconnecting: 'reconnecting',
    disconnected: 'disconnected',
  },
}));

// Helper to create a complete mock gameState with all required fields
const createMockGameState = (overrides: Record<string, unknown> = {}) => ({
  roomId: 'TEST123',
  currentScriptId: 'tb',
  phase: 'SETUP' as const,
  setupPhase: 'ASSIGNING' as const,
  rolesRevealed: false,
  allowWhispers: true,
  vibrationEnabled: true,
  seats: [],
  messages: [],
  gameOver: { isOver: false, winner: null, reason: '' },
  audio: { trackId: null, isPlaying: false, volume: 0.5 },
  nightQueue: [],
  nightCurrentIndex: -1,
  voting: null,
  customScripts: {},
  customRoles: {},
  voteHistory: [],
  roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 0 },
  storytellerNotes: [],
  skillDescriptionMode: 'simple' as const,
  aiMessages: [],
  nightActionRequests: [],
  swapRequests: [],
  candlelightEnabled: false,
  dailyNominations: [],
  interactionLog: [],
  ...overrides,
});

// Helper to create a mock user
const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user1',
  name: 'TestUser',
  isStoryteller: false,
  roomId: 'TEST123',
  isSeated: true,
  ...overrides,
});

// Helper to create mock seats
const createMockSeats = (count: number, options: { deadCount?: number } = {}) => {
  const { deadCount = 0 } = options;
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    userId: `user${i}`,
    userName: `Player${i}`,
    isDead: i < deadCount,
    hasGhostVote: false,
    roleId: null,
    realRoleId: null,
    seenRoleId: null,
    reminders: [],
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
  }));
};

describe('PhaseIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== Basic Rendering Tests ====================

  it('renders nothing when no game state', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: null,
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    const { container } = render(<PhaseIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no user', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState(),
        user: null,
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    const { container } = render(<PhaseIndicator />);
    expect(container.firstChild).toBeNull();
  });

  // ==================== Game Over Tests ====================

  it('renders game over message when game is over with good winning', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          gameOver: { isOver: true, winner: 'GOOD', reason: '恶魔死亡' },
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/好人胜利/)).toBeInTheDocument();
    expect(screen.getByText('恶魔死亡')).toBeInTheDocument();
  });

  it('renders game over message when game is over with evil winning', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          gameOver: { isOver: true, winner: 'EVIL', reason: '只剩2人存活' },
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/邪恶胜利/)).toBeInTheDocument();
    expect(screen.getByText('只剩2人存活')).toBeInTheDocument();
  });

  // ==================== Setup Phase Tests ====================

  it('renders assigning phase for storyteller', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          setupPhase: 'ASSIGNING',
          seats: createMockSeats(5),
        }),
        user: createMockUser({ isStoryteller: true }),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/正在分配角色/)).toBeInTheDocument();
    expect(screen.getByText(/5 人局/)).toBeInTheDocument();
  });

  it('renders waiting message for player during assigning phase', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          setupPhase: 'ASSIGNING',
          seats: createMockSeats(7),
        }),
        user: createMockUser({ isStoryteller: false }),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/等待说书人分配角色/)).toBeInTheDocument();
  });

  it('renders ready phase for storyteller', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          setupPhase: 'READY',
          seats: createMockSeats(5),
        }),
        user: createMockUser({ isStoryteller: true }),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText('角色已发放')).toBeInTheDocument();
    expect(screen.getByText('准备开始游戏')).toBeInTheDocument();
  });

  it('renders ready phase for player', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          setupPhase: 'READY',
          seats: createMockSeats(5),
        }),
        user: createMockUser({ isStoryteller: false }),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText('角色已发放')).toBeInTheDocument();
    expect(screen.getByText('可查看规则手册')).toBeInTheDocument();
  });

  // ==================== Night Phase Tests ====================

  it('renders night phase with correct night count', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          phase: 'NIGHT',
          setupPhase: 'STARTED',
          seats: createMockSeats(8, { deadCount: 2 }),
          roundInfo: { dayCount: 2, nightCount: 3, nominationCount: 0, totalRounds: 5 },
          nightQueue: [],
          nightCurrentIndex: -1,
        }),
        user: createMockUser({ isStoryteller: false }),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/第 3 夜/)).toBeInTheDocument();
    expect(screen.getByText(/6\/8 存活/)).toBeInTheDocument();
  });

  it('renders night phase with current role for storyteller', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          phase: 'NIGHT',
          setupPhase: 'STARTED',
          seats: createMockSeats(6, { deadCount: 1 }),
          roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 1 },
          nightQueue: ['washerwoman', 'librarian', 'poisoner', 'imp'],
          nightCurrentIndex: 2,
        }),
        user: createMockUser({ isStoryteller: true }),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/第 1 夜/)).toBeInTheDocument();
    expect(screen.getByText(/当前: poisoner/)).toBeInTheDocument();
  });

  // ==================== Day Phase Tests ====================

  it('renders day phase with correct day count', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          phase: 'DAY',
          setupPhase: 'STARTED',
          seats: createMockSeats(10, { deadCount: 3 }),
          roundInfo: { dayCount: 2, nightCount: 2, nominationCount: 0, totalRounds: 4 },
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/第 2 天/)).toBeInTheDocument();
    expect(screen.getByText(/7\/10 存活 · 讨论阶段/)).toBeInTheDocument();
  });

  // ==================== Nomination Phase Tests ====================

  it('renders nomination phase with correct info', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          phase: 'NOMINATION',
          setupPhase: 'STARTED',
          seats: createMockSeats(7, { deadCount: 2 }),
          roundInfo: { dayCount: 3, nightCount: 3, nominationCount: 2, totalRounds: 6 },
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/第 3 天 · 提名阶段/)).toBeInTheDocument();
    expect(screen.getByText(/提名次数: 2 · 5 人存活/)).toBeInTheDocument();
  });

  // ==================== Voting Phase Tests ====================

  it('renders voting phase with nominee info', () => {
    const seats = createMockSeats(8, { deadCount: 1 });
    seats[3].userName = 'Alice';

    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          phase: 'VOTING',
          setupPhase: 'STARTED',
          seats,
          roundInfo: { dayCount: 2, nightCount: 2, nominationCount: 1, totalRounds: 4 },
          voting: {
            nominatorSeatId: 1,
            nomineeSeatId: 3,
            clockHandSeatId: 5,
            votes: [0, 2, 5],
            isOpen: true,
          },
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/投票中/)).toBeInTheDocument();
    expect(screen.getByText(/被提名者: Alice · 当前 3 票/)).toBeInTheDocument();
  });

  it('renders voting phase with seat number when userName is undefined', () => {
    const seats = createMockSeats(6);
    // Set userName to undefined (not empty string) to trigger fallback
    (seats[2] as { userName: string | undefined }).userName = undefined;

    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          phase: 'VOTING',
          setupPhase: 'STARTED',
          seats,
          roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 1, totalRounds: 1 },
          voting: {
            nominatorSeatId: 0,
            nomineeSeatId: 2,
            clockHandSeatId: 0,
            votes: [],
            isOpen: true,
          },
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/被提名者: 座位 3 · 当前 0 票/)).toBeInTheDocument();
  });

  it('renders voting phase with empty username (shows empty)', () => {
    const seats = createMockSeats(6);
    seats[2].userName = '';

    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          phase: 'VOTING',
          setupPhase: 'STARTED',
          seats,
          roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 1, totalRounds: 1 },
          voting: {
            nominatorSeatId: 0,
            nomineeSeatId: 2,
            clockHandSeatId: 0,
            votes: [],
            isOpen: true,
          },
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    // With empty string userName, ?? operator won't use fallback, so it shows empty
    expect(screen.getByText(/被提名者:.*当前 0 票/)).toBeInTheDocument();
  });

  // ==================== Connection Status Tests ====================

  it('displays connected status', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          setupPhase: 'READY',
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText('已连接')).toBeInTheDocument();
  });

  it('displays connecting status', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          setupPhase: 'READY',
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connecting',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText('连接中')).toBeInTheDocument();
  });

  it('displays reconnecting status', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          setupPhase: 'READY',
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'reconnecting',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText('重连中')).toBeInTheDocument();
  });

  it('displays disconnected status when not offline', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          setupPhase: 'READY',
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'disconnected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText('已断开')).toBeInTheDocument();
  });

  // ==================== Offline Mode Tests ====================

  it('displays offline mode when disconnected and isOffline is true', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          setupPhase: 'READY',
        }),
        user: createMockUser(),
        isOffline: true,
        connectionStatus: 'disconnected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText('离线模式')).toBeInTheDocument();
  });

  // ==================== Room Code Display Tests ====================

  it('displays room code', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          roomId: 'ABC123',
          setupPhase: 'READY',
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText('#ABC123')).toBeInTheDocument();
  });

  // ==================== Custom Script Tests ====================

  it('displays custom script name', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          currentScriptId: 'custom_script_1',
          setupPhase: 'ASSIGNING',
          seats: createMockSeats(5),
          customScripts: {
            custom_script_1: {
              id: 'custom_script_1',
              name: '我的自定义剧本',
              roles: ['imp', 'washerwoman'],
            },
          },
        }),
        user: createMockUser({ isStoryteller: true }),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/我的自定义剧本/)).toBeInTheDocument();
  });

  it('displays default script name for unknown script', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          currentScriptId: 'unknown_script_id',
          setupPhase: 'ASSIGNING',
          seats: createMockSeats(5),
          customScripts: {},
        }),
        user: createMockUser({ isStoryteller: true }),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/自定义剧本/)).toBeInTheDocument();
  });

  // ==================== Virtual Player Tests ====================

  it('counts virtual players correctly', () => {
    const seats = createMockSeats(3);
    // Add virtual players
    seats.push({
      id: 3,
      userId: null,
      userName: 'Virtual1',
      isDead: false,
      hasGhostVote: false,
      roleId: null,
      realRoleId: null,
      seenRoleId: null,
      reminders: [],
      isHandRaised: false,
      isNominated: false,
      hasUsedAbility: false,
      statuses: [],
      isVirtual: true,
    } as unknown as ReturnType<typeof createMockSeats>[0]);
    seats.push({
      id: 4,
      userId: null,
      userName: 'Virtual2',
      isDead: true,
      hasGhostVote: false,
      roleId: null,
      realRoleId: null,
      seenRoleId: null,
      reminders: [],
      isHandRaised: false,
      isNominated: false,
      hasUsedAbility: false,
      statuses: [],
      isVirtual: true,
    } as unknown as ReturnType<typeof createMockSeats>[0]);

    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          phase: 'DAY',
          setupPhase: 'STARTED',
          seats,
          roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 1 },
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    // 3 real players + 2 virtual = 5 total, 1 virtual dead = 4 alive
    expect(screen.getByText(/4\/5 存活/)).toBeInTheDocument();
  });

  // ==================== Edge Cases ====================

  it('renders nothing when phase is SETUP and not in assigning/ready', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          phase: 'SETUP',
          setupPhase: 'STARTED', // This would not happen in reality but tests the edge case
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    const { container } = render(<PhaseIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when phase is VOTING but nomineeSeatId is null', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          phase: 'VOTING',
          setupPhase: 'STARTED',
          seats: createMockSeats(5),
          roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 1 },
          voting: {
            nominatorSeatId: null,
            nomineeSeatId: null,
            clockHandSeatId: null,
            votes: [],
            isOpen: false,
          },
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    const { container } = render(<PhaseIndicator />);
    // No message is set because nomineeSeatId is null, so nothing renders
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when phase is VOTING but voting is null', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          phase: 'VOTING',
          setupPhase: 'STARTED',
          seats: createMockSeats(5),
          roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 1 },
          voting: null,
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    const { container } = render(<PhaseIndicator />);
    // No message is set because voting is null, so nothing renders
    expect(container.firstChild).toBeNull();
  });

  it('handles empty seats array correctly', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: createMockGameState({
          phase: 'DAY',
          setupPhase: 'STARTED',
          seats: [],
          roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 1 },
        }),
        user: createMockUser(),
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/0\/0 存活/)).toBeInTheDocument();
  });
});
