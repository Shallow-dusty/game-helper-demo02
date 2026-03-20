import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
    createSelector,
    // Basic selectors
    useSeats,
    usePhase,
    useVoting,
    useNightQueue,
    useNightCurrentIndex,
    useCurrentScriptId,
    useSetupPhase,
    useRolesRevealed,
    useCandlelightEnabled,
    useMessages,
    useRoomId,
    useGameOver,
    useUser,
    useConnectionStatus,
    useIsOffline,
    // Composite selectors
    useVotingState,
    useNightActionState,
    useSeatList,
    useGameMessages,
    useRoomInfo,
    usePlayerInfo,
    useConnectionState,
    useGrimoireState,
    useAppState,
    // Derived selectors
    useCurrentSeat,
    useGameOverState,
    useVotingStats,
    useCurrentNightRole,
    useAvailableActions,
    useAlivePlayersCount,
    useDeadPlayers,
    // Action selectors
    useGameActions,
    useUIActions,
} from './useGameStateSelectors';
import type { GameState, User, Seat, ChatMessage } from '../types';
import type { ConnectionStatus, AppState } from '../store/types';

// Helper to create mock seats
const createMockSeat = (overrides: Partial<Seat> = {}): Seat => ({
    id: 0,
    userId: null,
    userName: '',
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
    ...overrides,
});

// Helper to create mock game state
const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
    roomId: 'room-123',
    currentScriptId: 'tb',
    phase: 'DAY',
    setupPhase: 'STARTED',
    rolesRevealed: true,
    allowWhispers: true,
    vibrationEnabled: false,
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
    roundInfo: { dayCount: 1, nightCount: 0, nominationCount: 0, totalRounds: 0 },
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [],
    swapRequests: [],
    candlelightEnabled: false,
    dailyExecutionCompleted: false,
    dailyNominations: [],
    interactionLog: [],
    ...overrides,
});

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    name: 'Test User',
    isStoryteller: false,
    roomId: 'room-123',
    isSeated: true,
    ...overrides,
});

// Mock action functions
const mockActions = {
    joinSeat: vi.fn(),
    leaveSeat: vi.fn(),
    toggleDead: vi.fn(),
    toggleAbilityUsed: vi.fn(),
    toggleStatus: vi.fn(),
    startVote: vi.fn(),
    assignRole: vi.fn(),
    addReminder: vi.fn(),
    removeReminder: vi.fn(),
    forceLeaveSeat: vi.fn(),
    removeVirtualPlayer: vi.fn(),
    swapSeats: vi.fn(),
    requestSeatSwap: vi.fn(),
    setPhase: vi.fn(),
    nightNext: vi.fn(),
    nightPrev: vi.fn(),
    closeVote: vi.fn(),
    nextClockHand: vi.fn(),
    toggleHand: vi.fn(),
    toggleAudioPlay: vi.fn(),
    openRolePanel: vi.fn(),
    closeRolePanel: vi.fn(),
    toggleSidebar: vi.fn(),
    closeTruthReveal: vi.fn(),
    closeReport: vi.fn(),
};

// Mock store state
let mockState: {
    gameState: GameState | null;
    user: User | null;
    connectionStatus: ConnectionStatus;
    isOffline: boolean;
    isAudioBlocked: boolean;
    roleReferenceMode: 'modal' | 'sidebar';
    isRolePanelOpen: boolean;
    isSidebarExpanded: boolean;
    isTruthRevealOpen: boolean;
    isReportOpen: boolean;
} & typeof mockActions;

// Reset mock state before each test
beforeEach(() => {
    mockState = {
        gameState: null,
        user: null,
        connectionStatus: 'connected',
        isOffline: false,
        isAudioBlocked: false,
        roleReferenceMode: 'modal',
        isRolePanelOpen: false,
        isSidebarExpanded: false,
        isTruthRevealOpen: false,
        isReportOpen: false,
        ...mockActions,
    };
});

// Mock the store
vi.mock('../store', () => ({
    useStore: vi.fn((selector: (state: typeof mockState) => unknown) => {
        return selector(mockState);
    }),
}));

describe('useGameStateSelectors', () => {
    // ============================================================
    // createSelector tests
    // ============================================================
    describe('createSelector', () => {
        it('should return the selector function as-is', () => {
            const selector = (state: { value: number }) => state.value;
            const result = createSelector(selector);
            expect(result).toBe(selector);
        });

        it('should work with equality check parameter (ignored but accepted)', () => {
            const selector = (state: { value: number }) => state.value;
            const equalityCheck = (a: number, b: number) => a === b;
            const result = createSelector(selector, equalityCheck);
            expect(result).toBe(selector);
        });
    });

    // ============================================================
    // Basic selectors - single property access
    // ============================================================
    describe('basic selectors', () => {
        describe('useSeats', () => {
            it('should return undefined when gameState is null', () => {
                mockState.gameState = null;
                const { result } = renderHook(() => useSeats());
                expect(result.current).toBeUndefined();
            });

            it('should return seats from gameState', () => {
                const seats = [createMockSeat({ id: 0 }), createMockSeat({ id: 1 })];
                mockState.gameState = createMockGameState({ seats });
                const { result } = renderHook(() => useSeats());
                expect(result.current).toHaveLength(2);
            });
        });

        describe('usePhase', () => {
            it('should return undefined when gameState is null', () => {
                mockState.gameState = null;
                const { result } = renderHook(() => usePhase());
                expect(result.current).toBeUndefined();
            });

            it('should return phase from gameState', () => {
                mockState.gameState = createMockGameState({ phase: 'NIGHT' });
                const { result } = renderHook(() => usePhase());
                expect(result.current).toBe('NIGHT');
            });
        });

        describe('useVoting', () => {
            it('should return undefined when gameState is null', () => {
                mockState.gameState = null;
                const { result } = renderHook(() => useVoting());
                expect(result.current).toBeUndefined();
            });

            it('should return voting from gameState', () => {
                const voting = {
                    nominatorSeatId: 0,
                    nomineeSeatId: 1,
                    clockHandSeatId: null,
                    votes: [],
                    isOpen: true,
                };
                mockState.gameState = createMockGameState({ voting });
                const { result } = renderHook(() => useVoting());
                expect(result.current).toEqual(voting);
            });
        });

        describe('useNightQueue', () => {
            it('should return undefined when gameState is null', () => {
                mockState.gameState = null;
                const { result } = renderHook(() => useNightQueue());
                expect(result.current).toBeUndefined();
            });

            it('should return nightQueue from gameState', () => {
                mockState.gameState = createMockGameState({ nightQueue: ['imp', 'spy'] });
                const { result } = renderHook(() => useNightQueue());
                expect(result.current).toEqual(['imp', 'spy']);
            });
        });

        describe('useNightCurrentIndex', () => {
            it('should return undefined when gameState is null', () => {
                mockState.gameState = null;
                const { result } = renderHook(() => useNightCurrentIndex());
                expect(result.current).toBeUndefined();
            });

            it('should return nightCurrentIndex from gameState', () => {
                mockState.gameState = createMockGameState({ nightCurrentIndex: 2 });
                const { result } = renderHook(() => useNightCurrentIndex());
                expect(result.current).toBe(2);
            });
        });

        describe('useCurrentScriptId', () => {
            it('should return undefined when gameState is null', () => {
                mockState.gameState = null;
                const { result } = renderHook(() => useCurrentScriptId());
                expect(result.current).toBeUndefined();
            });

            it('should return currentScriptId from gameState', () => {
                mockState.gameState = createMockGameState({ currentScriptId: 'bmr' });
                const { result } = renderHook(() => useCurrentScriptId());
                expect(result.current).toBe('bmr');
            });
        });

        describe('useSetupPhase', () => {
            it('should return undefined when gameState is null', () => {
                mockState.gameState = null;
                const { result } = renderHook(() => useSetupPhase());
                expect(result.current).toBeUndefined();
            });

            it('should return setupPhase from gameState', () => {
                mockState.gameState = createMockGameState({ setupPhase: 'STARTED' });
                const { result } = renderHook(() => useSetupPhase());
                expect(result.current).toBe('STARTED');
            });
        });

        describe('useRolesRevealed', () => {
            it('should return undefined when gameState is null', () => {
                mockState.gameState = null;
                const { result } = renderHook(() => useRolesRevealed());
                expect(result.current).toBeUndefined();
            });

            it('should return rolesRevealed from gameState', () => {
                mockState.gameState = createMockGameState({ rolesRevealed: true });
                const { result } = renderHook(() => useRolesRevealed());
                expect(result.current).toBe(true);
            });

            it('should return false when roles are hidden', () => {
                mockState.gameState = createMockGameState({ rolesRevealed: false });
                const { result } = renderHook(() => useRolesRevealed());
                expect(result.current).toBe(false);
            });
        });

        describe('useCandlelightEnabled', () => {
            it('should return undefined when gameState is null', () => {
                mockState.gameState = null;
                const { result } = renderHook(() => useCandlelightEnabled());
                expect(result.current).toBeUndefined();
            });

            it('should return candlelightEnabled from gameState', () => {
                mockState.gameState = createMockGameState({ candlelightEnabled: true });
                const { result } = renderHook(() => useCandlelightEnabled());
                expect(result.current).toBe(true);
            });
        });

        describe('useMessages', () => {
            it('should return undefined when gameState is null', () => {
                mockState.gameState = null;
                const { result } = renderHook(() => useMessages());
                expect(result.current).toBeUndefined();
            });

            it('should return messages from gameState', () => {
                const messages: ChatMessage[] = [{
                    id: 'msg-1',
                    senderId: 'user-1',
                    senderName: 'Alice',
                    recipientId: null,
                    content: 'Hello',
                    timestamp: Date.now(),
                    type: 'chat',
                }];
                mockState.gameState = createMockGameState({ messages });
                const { result } = renderHook(() => useMessages());
                expect(result.current).toHaveLength(1);
            });
        });

        describe('useRoomId', () => {
            it('should return undefined when gameState is null', () => {
                mockState.gameState = null;
                const { result } = renderHook(() => useRoomId());
                expect(result.current).toBeUndefined();
            });

            it('should return roomId from gameState', () => {
                mockState.gameState = createMockGameState({ roomId: 'test-room' });
                const { result } = renderHook(() => useRoomId());
                expect(result.current).toBe('test-room');
            });
        });

        describe('useGameOver', () => {
            it('should return undefined when gameState is null', () => {
                mockState.gameState = null;
                const { result } = renderHook(() => useGameOver());
                expect(result.current).toBeUndefined();
            });

            it('should return gameOver from gameState', () => {
                const gameOver = { isOver: true, winner: 'GOOD' as const, reason: 'Demon killed' };
                mockState.gameState = createMockGameState({ gameOver });
                const { result } = renderHook(() => useGameOver());
                expect(result.current).toEqual(gameOver);
            });
        });

        describe('useUser', () => {
            it('should return null when user is null', () => {
                mockState.user = null;
                const { result } = renderHook(() => useUser());
                expect(result.current).toBeNull();
            });

            it('should return user from state', () => {
                mockState.user = createMockUser({ name: 'Alice' });
                const { result } = renderHook(() => useUser());
                expect(result.current!.name).toBe('Alice');
            });
        });

        describe('useConnectionStatus', () => {
            it('should return connectionStatus from state', () => {
                mockState.connectionStatus = 'connected';
                const { result } = renderHook(() => useConnectionStatus());
                expect(result.current).toBe('connected');
            });

            it('should return disconnected status', () => {
                mockState.connectionStatus = 'disconnected';
                const { result } = renderHook(() => useConnectionStatus());
                expect(result.current).toBe('disconnected');
            });
        });

        describe('useIsOffline', () => {
            it('should return false when online', () => {
                mockState.isOffline = false;
                const { result } = renderHook(() => useIsOffline());
                expect(result.current).toBe(false);
            });

            it('should return true when offline', () => {
                mockState.isOffline = true;
                const { result } = renderHook(() => useIsOffline());
                expect(result.current).toBe(true);
            });
        });
    });

    // ============================================================
    // useVotingState tests
    // ============================================================
    describe('useVotingState', () => {
        it('should return undefined voting and phase when gameState is null', () => {
            mockState.gameState = null;
            const { result } = renderHook(() => useVotingState());

            expect(result.current.voting).toBeUndefined();
            expect(result.current.phase).toBeUndefined();
        });

        it('should return voting and phase from gameState', () => {
            mockState.gameState = createMockGameState({
                phase: 'VOTING',
                voting: {
                    nominatorSeatId: 1,
                    nomineeSeatId: 2,
                    clockHandSeatId: 3,
                    votes: [1, 3],
                    isOpen: true,
                },
            });

            const { result } = renderHook(() => useVotingState());

            expect(result.current.voting).toEqual({
                nominatorSeatId: 1,
                nomineeSeatId: 2,
                clockHandSeatId: 3,
                votes: [1, 3],
                isOpen: true,
            });
            expect(result.current.phase).toBe('VOTING');
        });

        it('should return null voting when voting is null', () => {
            mockState.gameState = createMockGameState({
                phase: 'DAY',
                voting: null,
            });

            const { result } = renderHook(() => useVotingState());

            expect(result.current.voting).toBeNull();
            expect(result.current.phase).toBe('DAY');
        });
    });

    // ============================================================
    // useNightActionState tests
    // ============================================================
    describe('useNightActionState', () => {
        it('should return undefined values when gameState is null', () => {
            mockState.gameState = null;
            const { result } = renderHook(() => useNightActionState());

            expect(result.current.phase).toBeUndefined();
            expect(result.current.nightQueue).toBeUndefined();
            expect(result.current.nightCurrentIndex).toBeUndefined();
            expect(result.current.nightActionRequests).toBeUndefined();
        });

        it('should return night action state from gameState', () => {
            mockState.gameState = createMockGameState({
                phase: 'NIGHT',
                nightQueue: ['imp', 'spy', 'poisoner'],
                nightCurrentIndex: 1,
                nightActionRequests: [
                    {
                        id: 'req-1',
                        seatId: 0,
                        roleId: 'spy',
                        payload: { seatId: 2 },
                        status: 'pending',
                        timestamp: Date.now(),
                    },
                ],
            });

            const { result } = renderHook(() => useNightActionState());

            expect(result.current.phase).toBe('NIGHT');
            expect(result.current.nightQueue).toEqual(['imp', 'spy', 'poisoner']);
            expect(result.current.nightCurrentIndex).toBe(1);
            expect(result.current.nightActionRequests).toHaveLength(1);
        });

        it('should handle empty nightQueue', () => {
            mockState.gameState = createMockGameState({
                phase: 'NIGHT',
                nightQueue: [],
                nightCurrentIndex: -1,
            });

            const { result } = renderHook(() => useNightActionState());

            expect(result.current.nightQueue).toEqual([]);
            expect(result.current.nightCurrentIndex).toBe(-1);
        });
    });

    // ============================================================
    // useSeatList tests
    // ============================================================
    describe('useSeatList', () => {
        it('should return undefined when gameState is null', () => {
            mockState.gameState = null;
            const { result } = renderHook(() => useSeatList());

            expect(result.current).toBeUndefined();
        });

        it('should return empty array when seats is empty', () => {
            mockState.gameState = createMockGameState({ seats: [] });
            const { result } = renderHook(() => useSeatList());

            expect(result.current).toEqual([]);
        });

        it('should return all seats from gameState', () => {
            const seats = [
                createMockSeat({ id: 0, userName: 'Alice' }),
                createMockSeat({ id: 1, userName: 'Bob' }),
                createMockSeat({ id: 2, userName: 'Charlie' }),
            ];
            mockState.gameState = createMockGameState({ seats });

            const { result } = renderHook(() => useSeatList());

            expect(result.current).toHaveLength(3);
            expect(result.current![0]!.userName).toBe('Alice');
            expect(result.current![1]!.userName).toBe('Bob');
            expect(result.current![2]!.userName).toBe('Charlie');
        });
    });

    // ============================================================
    // useCurrentSeat tests
    // ============================================================
    describe('useCurrentSeat', () => {
        it('should return undefined when user is null', () => {
            mockState.user = null;
            mockState.gameState = createMockGameState({
                seats: [createMockSeat({ id: 0, userId: 'user-1' })],
            });

            const { result } = renderHook(() => useCurrentSeat());

            expect(result.current).toBeUndefined();
        });

        it('should return undefined when seats is undefined', () => {
            mockState.user = createMockUser({ id: 'user-1' });
            mockState.gameState = null;

            const { result } = renderHook(() => useCurrentSeat());

            expect(result.current).toBeUndefined();
        });

        it('should return undefined when user has no seat', () => {
            mockState.user = createMockUser({ id: 'user-999' });
            mockState.gameState = createMockGameState({
                seats: [
                    createMockSeat({ id: 0, userId: 'user-1' }),
                    createMockSeat({ id: 1, userId: 'user-2' }),
                ],
            });

            const { result } = renderHook(() => useCurrentSeat());

            expect(result.current).toBeUndefined();
        });

        it('should return the seat matching current user', () => {
            mockState.user = createMockUser({ id: 'user-2' });
            mockState.gameState = createMockGameState({
                seats: [
                    createMockSeat({ id: 0, userId: 'user-1', userName: 'Alice' }),
                    createMockSeat({ id: 1, userId: 'user-2', userName: 'Bob' }),
                    createMockSeat({ id: 2, userId: 'user-3', userName: 'Charlie' }),
                ],
            });

            const { result } = renderHook(() => useCurrentSeat());

            expect(result.current).toBeDefined();
            expect(result.current!.id).toBe(1);
            expect(result.current!.userName).toBe('Bob');
        });

        it('should handle seats with null userId', () => {
            mockState.user = createMockUser({ id: 'user-1' });
            mockState.gameState = createMockGameState({
                seats: [
                    createMockSeat({ id: 0, userId: null }),
                    createMockSeat({ id: 1, userId: 'user-1', userName: 'Alice' }),
                ],
            });

            const { result } = renderHook(() => useCurrentSeat());

            expect(result.current!.id).toBe(1);
        });
    });

    // ============================================================
    // useGameMessages tests
    // ============================================================
    describe('useGameMessages', () => {
        it('should return undefined when gameState is null', () => {
            mockState.gameState = null;
            const { result } = renderHook(() => useGameMessages());

            expect(result.current).toBeUndefined();
        });

        it('should return empty array when messages is empty', () => {
            mockState.gameState = createMockGameState({ messages: [] });
            const { result } = renderHook(() => useGameMessages());

            expect(result.current).toEqual([]);
        });

        it('should return all messages from gameState', () => {
            const messages: ChatMessage[] = [
                {
                    id: 'msg-1',
                    senderId: 'user-1',
                    senderName: 'Alice',
                    recipientId: null,
                    content: 'Hello everyone',
                    timestamp: Date.now(),
                    type: 'chat',
                },
                {
                    id: 'msg-2',
                    senderId: 'system',
                    senderName: 'System',
                    recipientId: null,
                    content: 'Game started',
                    timestamp: Date.now(),
                    type: 'system',
                },
            ];
            mockState.gameState = createMockGameState({ messages });

            const { result } = renderHook(() => useGameMessages());

            expect(result.current).toHaveLength(2);
            expect(result.current![0]!.content).toBe('Hello everyone');
            expect(result.current![1]!.content).toBe('Game started');
        });
    });

    // ============================================================
    // useGameOverState tests
    // ============================================================
    describe('useGameOverState', () => {
        it('should return undefined gameOver when gameState is null', () => {
            mockState.gameState = null;
            const { result } = renderHook(() => useGameOverState());

            expect(result.current.gameOver).toBeUndefined();
            expect(result.current.winner).toBeUndefined();
            expect(result.current.reason).toBeUndefined();
        });

        it('should return game over state when game is not over', () => {
            mockState.gameState = createMockGameState({
                gameOver: { isOver: false, winner: null, reason: '' },
            });

            const { result } = renderHook(() => useGameOverState());

            expect(result.current.gameOver!.isOver).toBe(false);
            expect(result.current.winner).toBeNull();
            expect(result.current.reason).toBe('');
        });

        it('should return game over state when GOOD wins', () => {
            mockState.gameState = createMockGameState({
                gameOver: { isOver: true, winner: 'GOOD', reason: 'Demon executed' },
            });

            const { result } = renderHook(() => useGameOverState());

            expect(result.current.gameOver!.isOver).toBe(true);
            expect(result.current.winner).toBe('GOOD');
            expect(result.current.reason).toBe('Demon executed');
        });

        it('should return game over state when EVIL wins', () => {
            mockState.gameState = createMockGameState({
                gameOver: { isOver: true, winner: 'EVIL', reason: 'Only 2 alive' },
            });

            const { result } = renderHook(() => useGameOverState());

            expect(result.current.gameOver!.isOver).toBe(true);
            expect(result.current.winner).toBe('EVIL');
            expect(result.current.reason).toBe('Only 2 alive');
        });
    });

    // ============================================================
    // useRoomInfo tests
    // ============================================================
    describe('useRoomInfo', () => {
        it('should return undefined values when gameState is null', () => {
            mockState.gameState = null;
            const { result } = renderHook(() => useRoomInfo());

            expect(result.current.roomId).toBeUndefined();
            expect(result.current.phase).toBeUndefined();
            expect(result.current.currentScriptId).toBeUndefined();
        });

        it('should return room info from gameState', () => {
            mockState.gameState = createMockGameState({
                roomId: 'test-room',
                phase: 'NIGHT',
                currentScriptId: 'bmr',
            });

            const { result } = renderHook(() => useRoomInfo());

            expect(result.current.roomId).toBe('test-room');
            expect(result.current.phase).toBe('NIGHT');
            expect(result.current.currentScriptId).toBe('bmr');
        });
    });

    // ============================================================
    // usePlayerInfo tests
    // ============================================================
    describe('usePlayerInfo', () => {
        it('should return null user when user is null', () => {
            mockState.user = null;
            const { result } = renderHook(() => usePlayerInfo());

            expect(result.current.user).toBeNull();
            expect(result.current.isStoryteller).toBeUndefined();
            expect(result.current.isSeated).toBeUndefined();
        });

        it('should return player info for regular player', () => {
            mockState.user = createMockUser({
                isStoryteller: false,
                isSeated: true,
            });

            const { result } = renderHook(() => usePlayerInfo());

            expect(result.current.user).not.toBeNull();
            expect(result.current.isStoryteller).toBe(false);
            expect(result.current.isSeated).toBe(true);
        });

        it('should return player info for storyteller', () => {
            mockState.user = createMockUser({
                isStoryteller: true,
                isSeated: false,
            });

            const { result } = renderHook(() => usePlayerInfo());

            expect(result.current.isStoryteller).toBe(true);
            expect(result.current.isSeated).toBe(false);
        });

        it('should return player info for observer', () => {
            mockState.user = createMockUser({
                isStoryteller: false,
                isSeated: false,
                isObserver: true,
            });

            const { result } = renderHook(() => usePlayerInfo());

            expect(result.current.isStoryteller).toBe(false);
            expect(result.current.isSeated).toBe(false);
        });
    });

    // ============================================================
    // useConnectionState tests
    // ============================================================
    describe('useConnectionState', () => {
        it('should return connected state', () => {
            mockState.connectionStatus = 'connected';
            mockState.isOffline = false;

            const { result } = renderHook(() => useConnectionState());

            expect(result.current.connectionStatus).toBe('connected');
            expect(result.current.isOffline).toBe(false);
        });

        it('should return disconnected state', () => {
            mockState.connectionStatus = 'disconnected';
            mockState.isOffline = true;

            const { result } = renderHook(() => useConnectionState());

            expect(result.current.connectionStatus).toBe('disconnected');
            expect(result.current.isOffline).toBe(true);
        });

        it('should return connecting state', () => {
            mockState.connectionStatus = 'connecting';
            mockState.isOffline = false;

            const { result } = renderHook(() => useConnectionState());

            expect(result.current.connectionStatus).toBe('connecting');
            expect(result.current.isOffline).toBe(false);
        });

        it('should return reconnecting state', () => {
            mockState.connectionStatus = 'reconnecting';
            mockState.isOffline = false;

            const { result } = renderHook(() => useConnectionState());

            expect(result.current.connectionStatus).toBe('reconnecting');
            expect(result.current.isOffline).toBe(false);
        });
    });

    // ============================================================
    // useGrimoireState tests
    // ============================================================
    describe('useGrimoireState', () => {
        it('should return undefined values when gameState is null', () => {
            mockState.gameState = null;
            const { result } = renderHook(() => useGrimoireState());

            expect(result.current.seats).toBeUndefined();
            expect(result.current.phase).toBeUndefined();
            expect(result.current.voting).toBeUndefined();
            expect(result.current.setupPhase).toBeUndefined();
            expect(result.current.rolesRevealed).toBeUndefined();
            expect(result.current.candlelightEnabled).toBeUndefined();
            expect(result.current.currentScriptId).toBeUndefined();
        });

        it('should return grimoire state from gameState', () => {
            const seats = [createMockSeat({ id: 0 }), createMockSeat({ id: 1 })];
            const voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: null,
                votes: [],
                isOpen: true,
            };
            mockState.gameState = createMockGameState({
                seats,
                phase: 'DAY',
                voting,
                setupPhase: 'STARTED',
                rolesRevealed: true,
                candlelightEnabled: false,
                currentScriptId: 'tb',
            });

            const { result } = renderHook(() => useGrimoireState());

            expect(result.current.seats).toHaveLength(2);
            expect(result.current.phase).toBe('DAY');
            expect(result.current.voting).toEqual(voting);
            expect(result.current.setupPhase).toBe('STARTED');
            expect(result.current.rolesRevealed).toBe(true);
            expect(result.current.candlelightEnabled).toBe(false);
            expect(result.current.currentScriptId).toBe('tb');
        });
    });

    // ============================================================
    // useAppState tests
    // ============================================================
    describe('useAppState', () => {
        it('should return null gameState when gameState is null', () => {
            mockState.gameState = null;
            mockState.user = null;

            const { result } = renderHook(() => useAppState());

            expect(result.current.user).toBeNull();
            expect(result.current.gameState).toBeNull();
        });

        it('should return projected gameState with only roomId and phase', () => {
            mockState.user = createMockUser();
            mockState.gameState = createMockGameState({
                roomId: 'my-room',
                phase: 'NIGHT',
                seats: [createMockSeat({ id: 0 })],
            });
            mockState.isAudioBlocked = true;
            mockState.roleReferenceMode = 'sidebar';
            mockState.isRolePanelOpen = true;
            mockState.isSidebarExpanded = true;
            mockState.isTruthRevealOpen = false;
            mockState.isReportOpen = false;

            const { result } = renderHook(() => useAppState());

            expect(result.current.user).not.toBeNull();
            expect(result.current.gameState).toEqual({
                roomId: 'my-room',
                phase: 'NIGHT',
            });
            // Should NOT include full gameState fields like seats
            expect((result.current.gameState as Record<string, unknown>)?.seats).toBeUndefined();
            expect(result.current.isAudioBlocked).toBe(true);
            expect(result.current.roleReferenceMode).toBe('sidebar');
            expect(result.current.isRolePanelOpen).toBe(true);
            expect(result.current.isSidebarExpanded).toBe(true);
            expect(result.current.isTruthRevealOpen).toBe(false);
            expect(result.current.isReportOpen).toBe(false);
        });

        it('should return default UI state values', () => {
            mockState.gameState = null;

            const { result } = renderHook(() => useAppState());

            expect(result.current.isAudioBlocked).toBe(false);
            expect(result.current.roleReferenceMode).toBe('modal');
            expect(result.current.isRolePanelOpen).toBe(false);
            expect(result.current.isSidebarExpanded).toBe(false);
            expect(result.current.isTruthRevealOpen).toBe(false);
            expect(result.current.isReportOpen).toBe(false);
        });
    });

    // ============================================================
    // useVotingStats tests
    // ============================================================
    describe('useVotingStats', () => {
        it('should return null when seats is undefined', () => {
            mockState.gameState = null;
            const { result } = renderHook(() => useVotingStats());

            expect(result.current).toBeNull();
        });

        it('should return null when voting is undefined', () => {
            mockState.gameState = createMockGameState({
                seats: [createMockSeat()],
                voting: null,
            });

            const { result } = renderHook(() => useVotingStats());

            expect(result.current).toBeNull();
        });

        it('should calculate stats with no hands raised', () => {
            mockState.gameState = createMockGameState({
                seats: [
                    createMockSeat({ id: 0, isHandRaised: false, isDead: false }),
                    createMockSeat({ id: 1, isHandRaised: false, isDead: false }),
                    createMockSeat({ id: 2, isHandRaised: false, isDead: false }),
                ],
                voting: {
                    nominatorSeatId: 0,
                    nomineeSeatId: 1,
                    clockHandSeatId: null,
                    votes: [],
                    isOpen: true,
                },
            });

            const { result } = renderHook(() => useVotingStats());

            expect(result.current).not.toBeNull();
            expect(result.current!.handsRaised).toBe(0);
            expect(result.current!.totalVoters).toBe(3);
            expect(result.current!.percentage).toBe(0);
            expect(result.current!.isOpen).toBe(true);
            expect(result.current!.nomineeSeatId).toBe(1);
        });

        it('should calculate stats with some hands raised', () => {
            mockState.gameState = createMockGameState({
                seats: [
                    createMockSeat({ id: 0, isHandRaised: true, isDead: false }),
                    createMockSeat({ id: 1, isHandRaised: false, isDead: false }),
                    createMockSeat({ id: 2, isHandRaised: true, isDead: false }),
                    createMockSeat({ id: 3, isHandRaised: false, isDead: false }),
                ],
                voting: {
                    nominatorSeatId: 0,
                    nomineeSeatId: 2,
                    clockHandSeatId: 0,
                    votes: [0, 2],
                    isOpen: true,
                },
            });

            const { result } = renderHook(() => useVotingStats());

            expect(result.current!.handsRaised).toBe(2);
            expect(result.current!.totalVoters).toBe(4);
            expect(result.current!.percentage).toBe(50);
        });

        it('should exclude dead players from hands raised and total voters', () => {
            mockState.gameState = createMockGameState({
                seats: [
                    createMockSeat({ id: 0, isHandRaised: true, isDead: false }),
                    createMockSeat({ id: 1, isHandRaised: true, isDead: true }), // Dead, hand raised but doesn't count
                    createMockSeat({ id: 2, isHandRaised: false, isDead: false }),
                    createMockSeat({ id: 3, isHandRaised: false, isDead: true }), // Dead
                ],
                voting: {
                    nominatorSeatId: 0,
                    nomineeSeatId: 2,
                    clockHandSeatId: null,
                    votes: [],
                    isOpen: true,
                },
            });

            const { result } = renderHook(() => useVotingStats());

            expect(result.current!.handsRaised).toBe(1); // Only seat 0
            expect(result.current!.totalVoters).toBe(2); // Seats 0 and 2
            expect(result.current!.percentage).toBe(50);
        });

        it('should handle all players dead (edge case)', () => {
            mockState.gameState = createMockGameState({
                seats: [
                    createMockSeat({ id: 0, isHandRaised: true, isDead: true }),
                    createMockSeat({ id: 1, isHandRaised: false, isDead: true }),
                ],
                voting: {
                    nominatorSeatId: null,
                    nomineeSeatId: null,
                    clockHandSeatId: null,
                    votes: [],
                    isOpen: false,
                },
            });

            const { result } = renderHook(() => useVotingStats());

            expect(result.current!.handsRaised).toBe(0);
            expect(result.current!.totalVoters).toBe(0);
            expect(result.current!.percentage).toBe(0); // Division by zero handled
        });

        it('should return voting state info', () => {
            mockState.gameState = createMockGameState({
                seats: [createMockSeat({ id: 0, isDead: false })],
                voting: {
                    nominatorSeatId: 0,
                    nomineeSeatId: 1,
                    clockHandSeatId: null,
                    votes: [],
                    isOpen: false,
                },
            });

            const { result } = renderHook(() => useVotingStats());

            expect(result.current!.isOpen).toBe(false);
            expect(result.current!.nomineeSeatId).toBe(1);
        });
    });

    // ============================================================
    // useCurrentNightRole tests
    // ============================================================
    describe('useCurrentNightRole', () => {
        it('should return null when gameState is null', () => {
            mockState.gameState = null;
            const { result } = renderHook(() => useCurrentNightRole());

            expect(result.current).toBeNull();
        });

        it('should return null when phase is not NIGHT', () => {
            mockState.gameState = createMockGameState({
                phase: 'DAY',
                nightQueue: ['imp', 'poisoner'],
                nightCurrentIndex: 0,
            });

            const { result } = renderHook(() => useCurrentNightRole());

            expect(result.current).toBeNull();
        });

        it('should return null when phase is SETUP', () => {
            mockState.gameState = createMockGameState({
                phase: 'SETUP',
                nightQueue: ['imp'],
                nightCurrentIndex: 0,
            });

            const { result } = renderHook(() => useCurrentNightRole());

            expect(result.current).toBeNull();
        });

        it('should return current role from night queue', () => {
            mockState.gameState = createMockGameState({
                phase: 'NIGHT',
                nightQueue: ['poisoner', 'spy', 'imp'],
                nightCurrentIndex: 1,
            });

            const { result } = renderHook(() => useCurrentNightRole());

            expect(result.current).toBe('spy');
        });

        it('should return first role at index 0', () => {
            mockState.gameState = createMockGameState({
                phase: 'NIGHT',
                nightQueue: ['poisoner', 'spy', 'imp'],
                nightCurrentIndex: 0,
            });

            const { result } = renderHook(() => useCurrentNightRole());

            expect(result.current).toBe('poisoner');
        });

        it('should return last role at last index', () => {
            mockState.gameState = createMockGameState({
                phase: 'NIGHT',
                nightQueue: ['poisoner', 'spy', 'imp'],
                nightCurrentIndex: 2,
            });

            const { result } = renderHook(() => useCurrentNightRole());

            expect(result.current).toBe('imp');
        });

        it('should return null when nightCurrentIndex is -1 (not started)', () => {
            mockState.gameState = createMockGameState({
                phase: 'NIGHT',
                nightQueue: ['poisoner', 'spy'],
                nightCurrentIndex: -1,
            });

            const { result } = renderHook(() => useCurrentNightRole());

            expect(result.current).toBeNull();
        });

        it('should return null when nightQueue is empty', () => {
            mockState.gameState = createMockGameState({
                phase: 'NIGHT',
                nightQueue: [],
                nightCurrentIndex: 0,
            });

            const { result } = renderHook(() => useCurrentNightRole());

            expect(result.current).toBeNull();
        });

        it('should return null when index is out of bounds', () => {
            mockState.gameState = createMockGameState({
                phase: 'NIGHT',
                nightQueue: ['poisoner'],
                nightCurrentIndex: 5, // Out of bounds
            });

            const { result } = renderHook(() => useCurrentNightRole());

            expect(result.current).toBeNull();
        });

        it('should default to index 0 when nightCurrentIndex is undefined', () => {
            mockState.gameState = createMockGameState({
                phase: 'NIGHT',
                nightQueue: ['poisoner', 'imp'],
            });
            // Force nightCurrentIndex to undefined to test nullish coalescing
            (mockState.gameState as Record<string, unknown>).nightCurrentIndex = undefined;

            const { result } = renderHook(() => useCurrentNightRole());

            expect(result.current).toBe('poisoner');
        });
    });

    // ============================================================
    // useAvailableActions tests
    // ============================================================
    describe('useAvailableActions', () => {
        it('should return empty array when user is null', () => {
            mockState.user = null;
            mockState.gameState = createMockGameState();

            const { result } = renderHook(() => useAvailableActions());

            expect(result.current).toEqual([]);
        });

        it('should return empty array when gameState is null', () => {
            mockState.user = createMockUser();
            mockState.gameState = null;

            const { result } = renderHook(() => useAvailableActions());

            expect(result.current).toEqual([]);
        });

        it('should return empty array when user has no seat', () => {
            mockState.user = createMockUser({ id: 'user-999' });
            mockState.gameState = createMockGameState({
                seats: [createMockSeat({ id: 0, userId: 'user-1' })],
            });

            const { result } = renderHook(() => useAvailableActions());

            expect(result.current).toEqual([]);
        });

        it('should return storyteller actions for storyteller', () => {
            mockState.user = createMockUser({ id: 'user-1', isStoryteller: true });
            mockState.gameState = createMockGameState({
                phase: 'DAY',
                seats: [createMockSeat({ id: 0, userId: 'user-1' })],
            });

            const { result } = renderHook(() => useAvailableActions());

            expect(result.current).toContain('advance_phase');
            expect(result.current).toContain('update_reminders');
        });

        it('should return raise_hand action during DAY phase with open voting', () => {
            mockState.user = createMockUser({ id: 'user-1', isStoryteller: false });
            mockState.gameState = createMockGameState({
                phase: 'DAY',
                seats: [createMockSeat({ id: 0, userId: 'user-1' })],
                voting: {
                    nominatorSeatId: 1,
                    nomineeSeatId: 2,
                    clockHandSeatId: null,
                    votes: [],
                    isOpen: true,
                },
            });

            const { result } = renderHook(() => useAvailableActions());

            expect(result.current).toContain('raise_hand');
        });

        it('should not return raise_hand when voting is closed', () => {
            mockState.user = createMockUser({ id: 'user-1', isStoryteller: false });
            mockState.gameState = createMockGameState({
                phase: 'DAY',
                seats: [createMockSeat({ id: 0, userId: 'user-1' })],
                voting: {
                    nominatorSeatId: 1,
                    nomineeSeatId: 2,
                    clockHandSeatId: null,
                    votes: [],
                    isOpen: false,
                },
            });

            const { result } = renderHook(() => useAvailableActions());

            expect(result.current).not.toContain('raise_hand');
        });

        it('should not return raise_hand when voting is null', () => {
            mockState.user = createMockUser({ id: 'user-1', isStoryteller: false });
            mockState.gameState = createMockGameState({
                phase: 'DAY',
                seats: [createMockSeat({ id: 0, userId: 'user-1' })],
                voting: null,
            });

            const { result } = renderHook(() => useAvailableActions());

            expect(result.current).not.toContain('raise_hand');
        });

        it('should return night_action when it is players turn during NIGHT', () => {
            mockState.user = createMockUser({ id: 'user-1', isStoryteller: false });
            mockState.gameState = createMockGameState({
                phase: 'NIGHT',
                seats: [createMockSeat({ id: 0, userId: 'user-1', seenRoleId: 'poisoner' })],
                nightQueue: ['poisoner', 'imp'],
                nightCurrentIndex: 0,
            });

            const { result } = renderHook(() => useAvailableActions());

            expect(result.current).toContain('night_action');
        });

        it('should not return night_action when it is not players turn', () => {
            mockState.user = createMockUser({ id: 'user-1', isStoryteller: false });
            mockState.gameState = createMockGameState({
                phase: 'NIGHT',
                seats: [createMockSeat({ id: 0, userId: 'user-1', seenRoleId: 'poisoner' })],
                nightQueue: ['imp', 'poisoner'],
                nightCurrentIndex: 0, // Current role is 'imp', not 'poisoner'
            });

            const { result } = renderHook(() => useAvailableActions());

            expect(result.current).not.toContain('night_action');
        });

        it('should not return night_action during DAY phase', () => {
            mockState.user = createMockUser({ id: 'user-1', isStoryteller: false });
            mockState.gameState = createMockGameState({
                phase: 'DAY',
                seats: [createMockSeat({ id: 0, userId: 'user-1', seenRoleId: 'poisoner' })],
                nightQueue: ['poisoner'],
                nightCurrentIndex: 0,
            });

            const { result } = renderHook(() => useAvailableActions());

            expect(result.current).not.toContain('night_action');
        });

        it('should return multiple actions when applicable', () => {
            mockState.user = createMockUser({ id: 'user-1', isStoryteller: true });
            mockState.gameState = createMockGameState({
                phase: 'DAY',
                seats: [createMockSeat({ id: 0, userId: 'user-1' })],
                voting: {
                    nominatorSeatId: 1,
                    nomineeSeatId: 2,
                    clockHandSeatId: null,
                    votes: [],
                    isOpen: true,
                },
            });

            const { result } = renderHook(() => useAvailableActions());

            expect(result.current).toContain('advance_phase');
            expect(result.current).toContain('update_reminders');
            expect(result.current).toContain('raise_hand');
        });

        it('should handle player with null seenRoleId', () => {
            mockState.user = createMockUser({ id: 'user-1', isStoryteller: false });
            mockState.gameState = createMockGameState({
                phase: 'NIGHT',
                seats: [createMockSeat({ id: 0, userId: 'user-1', seenRoleId: null })],
                nightQueue: ['poisoner'],
                nightCurrentIndex: 0,
            });

            const { result } = renderHook(() => useAvailableActions());

            expect(result.current).not.toContain('night_action');
        });
    });

    // ============================================================
    // useAlivePlayersCount tests
    // ============================================================
    describe('useAlivePlayersCount', () => {
        it('should return 0 when gameState is null', () => {
            mockState.gameState = null;
            const { result } = renderHook(() => useAlivePlayersCount());

            expect(result.current).toBe(0);
        });

        it('should return 0 when all seats are empty', () => {
            mockState.gameState = createMockGameState({ seats: [] });
            const { result } = renderHook(() => useAlivePlayersCount());

            expect(result.current).toBe(0);
        });

        it('should count all alive players', () => {
            mockState.gameState = createMockGameState({
                seats: [
                    createMockSeat({ id: 0, isDead: false }),
                    createMockSeat({ id: 1, isDead: false }),
                    createMockSeat({ id: 2, isDead: false }),
                ],
            });

            const { result } = renderHook(() => useAlivePlayersCount());

            expect(result.current).toBe(3);
        });

        it('should exclude dead players from count', () => {
            mockState.gameState = createMockGameState({
                seats: [
                    createMockSeat({ id: 0, isDead: false }),
                    createMockSeat({ id: 1, isDead: true }),
                    createMockSeat({ id: 2, isDead: false }),
                    createMockSeat({ id: 3, isDead: true }),
                ],
            });

            const { result } = renderHook(() => useAlivePlayersCount());

            expect(result.current).toBe(2);
        });

        it('should return 0 when all players are dead', () => {
            mockState.gameState = createMockGameState({
                seats: [
                    createMockSeat({ id: 0, isDead: true }),
                    createMockSeat({ id: 1, isDead: true }),
                ],
            });

            const { result } = renderHook(() => useAlivePlayersCount());

            expect(result.current).toBe(0);
        });
    });

    // ============================================================
    // useDeadPlayers tests
    // ============================================================
    describe('useDeadPlayers', () => {
        it('should return empty array when gameState is null', () => {
            mockState.gameState = null;
            const { result } = renderHook(() => useDeadPlayers());

            expect(result.current).toEqual([]);
        });

        it('should return empty array when no players are dead', () => {
            mockState.gameState = createMockGameState({
                seats: [
                    createMockSeat({ id: 0, isDead: false }),
                    createMockSeat({ id: 1, isDead: false }),
                ],
            });

            const { result } = renderHook(() => useDeadPlayers());

            expect(result.current).toEqual([]);
        });

        it('should return only dead players', () => {
            mockState.gameState = createMockGameState({
                seats: [
                    createMockSeat({ id: 0, isDead: false, userName: 'Alice' }),
                    createMockSeat({ id: 1, isDead: true, userName: 'Bob' }),
                    createMockSeat({ id: 2, isDead: false, userName: 'Charlie' }),
                    createMockSeat({ id: 3, isDead: true, userName: 'Dave' }),
                ],
            });

            const { result } = renderHook(() => useDeadPlayers());

            expect(result.current).toHaveLength(2);
            expect(result.current[0]!.userName).toBe('Bob');
            expect(result.current[1]!.userName).toBe('Dave');
        });

        it('should return all players when all are dead', () => {
            mockState.gameState = createMockGameState({
                seats: [
                    createMockSeat({ id: 0, isDead: true }),
                    createMockSeat({ id: 1, isDead: true }),
                    createMockSeat({ id: 2, isDead: true }),
                ],
            });

            const { result } = renderHook(() => useDeadPlayers());

            expect(result.current).toHaveLength(3);
        });

        it('should return empty array when seats is empty', () => {
            mockState.gameState = createMockGameState({ seats: [] });

            const { result } = renderHook(() => useDeadPlayers());

            expect(result.current).toEqual([]);
        });
    });

    // ============================================================
    // useGameActions tests
    // ============================================================
    describe('useGameActions', () => {
        it('should return all game action functions', () => {
            const { result } = renderHook(() => useGameActions());

            expect(result.current.joinSeat).toBeDefined();
            expect(result.current.leaveSeat).toBeDefined();
            expect(result.current.toggleDead).toBeDefined();
            expect(result.current.toggleAbilityUsed).toBeDefined();
            expect(result.current.toggleStatus).toBeDefined();
            expect(result.current.startVote).toBeDefined();
            expect(result.current.assignRole).toBeDefined();
            expect(result.current.addReminder).toBeDefined();
            expect(result.current.removeReminder).toBeDefined();
            expect(result.current.forceLeaveSeat).toBeDefined();
            expect(result.current.removeVirtualPlayer).toBeDefined();
            expect(result.current.swapSeats).toBeDefined();
            expect(result.current.requestSeatSwap).toBeDefined();
            expect(result.current.setPhase).toBeDefined();
            expect(result.current.nightNext).toBeDefined();
            expect(result.current.nightPrev).toBeDefined();
            expect(result.current.closeVote).toBeDefined();
            expect(result.current.nextClockHand).toBeDefined();
            expect(result.current.toggleHand).toBeDefined();
        });

        it('should return functions that are callable', () => {
            const { result } = renderHook(() => useGameActions());

            expect(typeof result.current.joinSeat).toBe('function');
            expect(typeof result.current.toggleDead).toBe('function');
            expect(typeof result.current.setPhase).toBe('function');
        });
    });

    // ============================================================
    // useUIActions tests
    // ============================================================
    describe('useUIActions', () => {
        it('should return all UI action functions', () => {
            const { result } = renderHook(() => useUIActions());

            expect(result.current.toggleAudioPlay).toBeDefined();
            expect(result.current.openRolePanel).toBeDefined();
            expect(result.current.closeRolePanel).toBeDefined();
            expect(result.current.toggleSidebar).toBeDefined();
            expect(result.current.closeTruthReveal).toBeDefined();
            expect(result.current.closeReport).toBeDefined();
        });

        it('should return functions that are callable', () => {
            const { result } = renderHook(() => useUIActions());

            expect(typeof result.current.toggleAudioPlay).toBe('function');
            expect(typeof result.current.openRolePanel).toBe('function');
            expect(typeof result.current.closeTruthReveal).toBe('function');
        });
    });
});
