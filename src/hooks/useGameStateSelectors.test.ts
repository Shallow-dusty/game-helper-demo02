import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
    createSelector,
    useVotingState,
    useNightActionState,
    useSeatList,
    useCurrentSeat,
    useGameMessages,
    useGameOverState,
    useRoomInfo,
    usePlayerInfo,
    useConnectionState,
    useVotingStats,
    useCurrentNightRole,
    useAvailableActions,
} from './useGameStateSelectors';
import type { GameState, User, Seat, ChatMessage } from '../types';
import type { ConnectionStatus } from '../store/types';

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

// Mock store state
let mockState: {
    gameState: GameState | null;
    user: User | null;
    connectionStatus: ConnectionStatus;
    isOffline: boolean;
};

// Reset mock state before each test
beforeEach(() => {
    mockState = {
        gameState: null,
        user: null,
        connectionStatus: 'connected',
        isOffline: false,
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
            expect(result.current![0].userName).toBe('Alice');
            expect(result.current![1].userName).toBe('Bob');
            expect(result.current![2].userName).toBe('Charlie');
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
            expect(result.current![0].content).toBe('Hello everyone');
            expect(result.current![1].content).toBe('Game started');
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
});
