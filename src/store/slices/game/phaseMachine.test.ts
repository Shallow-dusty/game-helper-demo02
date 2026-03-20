import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createPhaseMachineSlice } from './phaseMachine';
import type { Seat, GameState } from '@/types';
import type { AppState, PhaseMachineSlice } from '../../types';

describe('PhaseMachine Slice Integration', () => {
  const mockSet = vi.fn();
  const mockGet = vi.fn();
  let slice: ReturnType<typeof createPhaseMachineSlice>;

  const mockSeats: Seat[] = [
    { id: 0, roleId: 'imp', userName: 'Player1', isDead: false, hasGhostVote: false, userId: 'user1', realRoleId: 'imp', seenRoleId: 'imp', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
    { id: 1, roleId: 'washerwoman', userName: 'Player2', isDead: false, hasGhostVote: false, userId: 'user2', realRoleId: 'washerwoman', seenRoleId: 'washerwoman', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
    { id: 2, roleId: 'empath', userName: 'Player3', isDead: false, hasGhostVote: false, userId: 'user3', realRoleId: 'empath', seenRoleId: 'empath', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
  ];

  beforeEach(() => {
    mockSet.mockClear();
    mockGet.mockClear();

    // Make mockSet actually update the slice object
    mockSet.mockImplementation((updates: any) => {
      if (typeof updates === 'function') {
        // If updates is a function (Immer style), we'd need full Immer support
        // For now just assign directly
        return;
      }
      Object.assign(slice, updates);
    });

    slice = createPhaseMachineSlice(mockSet, mockGet as any, {} as any);
    mockGet.mockReturnValue(slice);
  });

  describe('Initialization', () => {
    it('should start with null actor and setup state', () => {
      expect(slice.phaseActor).toBeNull();
      expect(slice.phaseState).toBe('setup');
      expect(slice.phaseContext.roundInfo.nightCount).toBe(0);
      expect(slice.phaseContext.roundInfo.dayCount).toBe(0);
    });

    it('should initialize phase machine actor', () => {
      slice.initializePhaseMachine();

      expect(slice.phaseActor).not.toBeNull();
      expect(mockSet).toHaveBeenCalled();
    });

    it('should subscribe to actor state changes', () => {
      slice.initializePhaseMachine();

      // mockSet should have been called to update phaseState and phaseContext
      expect(mockSet).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      slice.initializePhaseMachine();
      mockSet.mockClear();
    });

    it('should send START_GAME event', () => {
      slice.phaseMachine.startGame(mockSeats);

      // Check that state was updated
      expect(slice.phaseState).toBe('night');
      expect(slice.phaseContext.seats).toEqual(mockSeats);
      expect(slice.phaseContext.roundInfo.nightCount).toBe(1);
    });

    it('should send NEXT_NIGHT_ACTION event', () => {
      slice.phaseMachine.startGame(mockSeats);
      slice.phaseMachine.nextNightAction();

      expect(slice.phaseContext.nightCurrentIndex).toBe(0);
    });

    it('should send END_NIGHT event', () => {
      slice.phaseMachine.startGame(mockSeats);
      slice.phaseMachine.endNight();

      expect(slice.phaseState).toBe('day');
      expect(slice.phaseContext.roundInfo.dayCount).toBe(1);
    });

    it('should send START_VOTING event', () => {
      slice.phaseMachine.startGame(mockSeats);
      slice.phaseMachine.endNight();
      slice.phaseMachine.startVoting(0);

      expect(slice.phaseState).toBe('voting');
    });

    it('should send CLOSE_VOTE event', () => {
      slice.phaseMachine.startGame(mockSeats);
      slice.phaseMachine.endNight();
      slice.phaseMachine.startVoting(0);
      slice.phaseMachine.closeVote(false);

      expect(slice.phaseState).toBe('day');
    });

    it('should send END_GAME event', () => {
      slice.phaseMachine.startGame(mockSeats);
      slice.phaseMachine.endNight();
      slice.phaseMachine.endGame('GOOD', 'Demon executed');

      expect(slice.phaseState).toBe('gameOver');
      expect(slice.phaseContext.gameOver).toEqual({
        isOver: true,
        winner: 'GOOD',
        reason: 'Demon executed',
      });
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      slice.initializePhaseMachine();
    });

    it('should stop phase machine actor', () => {
      slice.stopPhaseMachine();

      expect(slice.phaseActor).toBeNull();
      expect(slice.phaseState).toBe('setup');
    });

    it('should handle stopping when no actor exists', () => {
      slice.stopPhaseMachine();

      // Call again with no actor
      slice.stopPhaseMachine();

      // Should not throw
      expect(slice.phaseActor).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle events when actor is null', () => {
      // Don't initialize actor
      slice.phaseMachine.startGame(mockSeats);

      // Should not throw
      expect(slice.phaseActor).toBeNull();
    });

    it('should restart actor if initialized twice', () => {
      slice.initializePhaseMachine();
      const firstActor = slice.phaseActor;

      slice.initializePhaseMachine();
      const secondActor = slice.phaseActor;

      expect(secondActor).not.toBeNull();
      expect(secondActor).not.toBe(firstActor);
    });
  });
});

// ──────────────────────────────────────────────────────────────────
// Integration tests: subscription handler syncing XState → gameState
// ──────────────────────────────────────────────────────────────────

// Mock side-effects so we can verify they're called without full game logic
vi.mock('./flow/sideEffects', () => ({
  onEnterNight: vi.fn(),
  onEnterDay: vi.fn(),
  onExitVoting: vi.fn(),
  resolveDailyExecution: vi.fn(),
  addPhaseChangeMessage: vi.fn(),
}));

import {
  onEnterNight,
  onEnterDay,
  onExitVoting,
  resolveDailyExecution,
  addPhaseChangeMessage,
} from './flow/sideEffects';

/**
 * Minimal AppState-like store that has both phaseMachine slice and a gameState,
 * allowing the subscription handler in initializePhaseMachine to sync fields.
 */
type TestStore = PhaseMachineSlice & {
  gameState: GameState | null;
  sync: () => void;
};

function createTestStore(gameState: GameState | null = null) {
  const syncFn = vi.fn();
  return {
    store: createStore<TestStore>()(
      immer((set, get) => ({
        ...createPhaseMachineSlice(
          set as any,
          get as any,
          {} as any,
        ),
        gameState,
        sync: syncFn,
      })),
    ),
    syncFn,
  };
}

function makeGameState(overrides?: Partial<GameState>): GameState {
  return {
    roomId: 'test-room',
    currentScriptId: 'tb',
    phase: 'SETUP',
    setupPhase: 'STARTED',
    rolesRevealed: false,
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
    roundInfo: { dayCount: 0, nightCount: 0, nominationCount: 0, totalRounds: 0 },
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [],
    swapRequests: [],
    candlelightEnabled: false,
    dailyNominations: [],
    dailyExecutionCompleted: false,
    interactionLog: [],
    ...overrides,
  };
}

const testSeats: Seat[] = [
  { id: 0, roleId: 'imp', userName: 'P1', isDead: false, hasGhostVote: false, userId: 'u1', realRoleId: 'imp', seenRoleId: 'imp', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
  { id: 1, roleId: 'washerwoman', userName: 'P2', isDead: false, hasGhostVote: false, userId: 'u2', realRoleId: 'washerwoman', seenRoleId: 'washerwoman', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
  { id: 2, roleId: 'empath', userName: 'P3', isDead: false, hasGhostVote: false, userId: 'u3', realRoleId: 'empath', seenRoleId: 'empath', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
];

describe('PhaseMachine subscription handler (XState → gameState sync)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('syncs phaseState and phaseContext on START_GAME', () => {
    const { store } = createTestStore(makeGameState());
    store.getState().initializePhaseMachine();

    store.getState().phaseMachine.startGame(testSeats);

    const s = store.getState();
    expect(s.phaseState).toBe('night');
    expect(s.phaseContext.roundInfo.nightCount).toBe(1);
    expect(s.phaseContext.seats).toEqual(testSeats);
  });

  it('syncs nightQueue and nightCurrentIndex to gameState', () => {
    const { store } = createTestStore(makeGameState());
    store.getState().initializePhaseMachine();
    store.getState().phaseMachine.startGame(testSeats);

    const gs = store.getState().gameState!;
    // nightQueue should be synced from XState context
    expect(gs.nightQueue).toEqual(store.getState().phaseContext.nightQueue);
    expect(gs.nightCurrentIndex).toBe(store.getState().phaseContext.nightCurrentIndex);
  });

  it('syncs roundInfo to gameState', () => {
    const { store } = createTestStore(makeGameState());
    store.getState().initializePhaseMachine();
    store.getState().phaseMachine.startGame(testSeats);

    const gs = store.getState().gameState!;
    expect(gs.roundInfo.nightCount).toBe(store.getState().phaseContext.roundInfo.nightCount);
  });

  it('updates gameState.phase on phase transition', () => {
    const { store } = createTestStore(makeGameState());
    store.getState().initializePhaseMachine();
    store.getState().phaseMachine.startGame(testSeats);

    expect(store.getState().gameState!.phase).toBe('NIGHT');

    store.getState().phaseMachine.endNight();
    expect(store.getState().gameState!.phase).toBe('DAY');
  });

  it('calls addPhaseChangeMessage on phase transition', () => {
    const { store } = createTestStore(makeGameState());
    store.getState().initializePhaseMachine();

    store.getState().phaseMachine.startGame(testSeats);
    // SETUP → NIGHT triggers addPhaseChangeMessage
    expect(addPhaseChangeMessage).toHaveBeenCalled();
  });

  it('calls onEnterNight side-effect when entering NIGHT', () => {
    const { store } = createTestStore(makeGameState());
    store.getState().initializePhaseMachine();

    store.getState().phaseMachine.startGame(testSeats);
    // setup → night triggers onEnterNight
    expect(onEnterNight).toHaveBeenCalled();
  });

  it('calls onEnterDay side-effect when entering DAY', () => {
    const { store } = createTestStore(makeGameState());
    store.getState().initializePhaseMachine();
    store.getState().phaseMachine.startGame(testSeats);
    vi.clearAllMocks();

    store.getState().phaseMachine.endNight();
    expect(onEnterDay).toHaveBeenCalled();
  });

  it('calls onExitVoting when leaving VOTING phase', () => {
    const { store } = createTestStore(makeGameState());
    store.getState().initializePhaseMachine();
    store.getState().phaseMachine.startGame(testSeats);
    store.getState().phaseMachine.endNight();
    store.getState().phaseMachine.startVoting(0);
    vi.clearAllMocks();

    store.getState().phaseMachine.closeVote(false);
    expect(onExitVoting).toHaveBeenCalled();
  });

  it('calls resolveDailyExecution on DAY→NIGHT transition', () => {
    const { store } = createTestStore(makeGameState());
    store.getState().initializePhaseMachine();
    store.getState().phaseMachine.startGame(testSeats);
    store.getState().phaseMachine.endNight(); // now in DAY
    vi.clearAllMocks();

    store.getState().phaseMachine.startNight(); // DAY → NIGHT
    expect(resolveDailyExecution).toHaveBeenCalled();
  });

  it('calls sync() on phase change', () => {
    const { store, syncFn } = createTestStore(makeGameState());
    store.getState().initializePhaseMachine();
    syncFn.mockClear();

    store.getState().phaseMachine.startGame(testSeats);
    // setup → night is a phase change, sync should be called
    expect(syncFn).toHaveBeenCalled();
  });

  it('syncs gameOver to gameState when END_GAME is sent', () => {
    const { store } = createTestStore(makeGameState());
    store.getState().initializePhaseMachine();
    store.getState().phaseMachine.startGame(testSeats);
    store.getState().phaseMachine.endNight();

    store.getState().phaseMachine.endGame('EVIL', 'Demon wins');

    const gs = store.getState().gameState!;
    expect(gs.gameOver).toEqual({
      isOver: true,
      winner: 'EVIL',
      reason: 'Demon wins',
    });
  });

  it('does not run side-effects when gameState is null', () => {
    const { store } = createTestStore(null);
    store.getState().initializePhaseMachine();

    // This should not throw even without gameState
    store.getState().phaseMachine.startGame(testSeats);

    expect(store.getState().phaseState).toBe('night');
    // Side-effects should not be called since gameState is null
    // (the set callback early-returns if !state.gameState)
    expect(onEnterNight).not.toHaveBeenCalled();
  });

  it('does not call sync() when phase stays the same (e.g. NEXT_NIGHT_ACTION)', () => {
    const { store, syncFn } = createTestStore(makeGameState());
    store.getState().initializePhaseMachine();
    store.getState().phaseMachine.startGame(testSeats);
    syncFn.mockClear();

    // NEXT_NIGHT_ACTION changes context but not the xstate value (still 'night')
    store.getState().phaseMachine.nextNightAction();
    expect(syncFn).not.toHaveBeenCalled();
  });

  it('handles full game cycle: SETUP → NIGHT → DAY → VOTING → DAY → NIGHT → gameOver', () => {
    const { store } = createTestStore(makeGameState());
    store.getState().initializePhaseMachine();

    // SETUP → NIGHT
    store.getState().phaseMachine.startGame(testSeats);
    expect(store.getState().gameState!.phase).toBe('NIGHT');

    // NIGHT → DAY
    store.getState().phaseMachine.endNight();
    expect(store.getState().gameState!.phase).toBe('DAY');

    // DAY → VOTING
    store.getState().phaseMachine.startVoting(0);
    expect(store.getState().gameState!.phase).toBe('VOTING');

    // VOTING → DAY
    store.getState().phaseMachine.closeVote(false);
    expect(store.getState().gameState!.phase).toBe('DAY');

    // DAY → NIGHT
    store.getState().phaseMachine.startNight();
    expect(store.getState().gameState!.phase).toBe('NIGHT');

    // NIGHT → DAY → gameOver
    store.getState().phaseMachine.endNight();
    store.getState().phaseMachine.endGame('GOOD', 'Demon slain');
    expect(store.getState().gameState!.phase).toBe('SETUP'); // gameOver maps to SETUP via toGamePhase fallback
    expect(store.getState().gameState!.gameOver).toEqual({
      isOver: true,
      winner: 'GOOD',
      reason: 'Demon slain',
    });
  });
});
