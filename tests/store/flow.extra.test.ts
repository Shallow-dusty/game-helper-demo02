import { describe, it, expect, vi } from 'vitest';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, Seat, User } from '../../src/types';

// Mock supabase
vi.mock('../../src/store/slices/connection', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn().mockResolvedValue({ error: null }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((cb) => { if (cb) cb('SUBSCRIBED'); return { unsubscribe: vi.fn() }; }),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('../../src/store/utils', () => ({
  addSystemMessage: vi.fn(),
}));

vi.mock('../../src/lib/supabaseService', () => ({
  logExecution: vi.fn().mockResolvedValue(undefined),
  updateNominationResult: vi.fn().mockResolvedValue(undefined),
}));

const createMockSeat = (id: number, overrides?: Partial<Seat>): Seat => ({
  id,
  userId: null,
  userName: `座位 ${id + 1}`,
  isDead: false,
  hasGhostVote: true,
  roleId: null,
  realRoleId: null,
  seenRoleId: null,
  reminders: [],
  isHandRaised: false,
  isNominated: false,
  hasUsedAbility: false,
  statuses: [],
  voteLocked: false,
  isVirtual: false,
  ...overrides,
});

const createMockGameState = (seatCount = 5): GameState => ({
  roomId: 'TEST123',
  currentScriptId: 'tb',
  phase: 'SETUP',
  setupPhase: 'ASSIGNING',
  rolesRevealed: false,
  allowWhispers: false,
  vibrationEnabled: false,
  seats: Array.from({ length: seatCount }, (_, i) => createMockSeat(i)),
  swapRequests: [],
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
  candlelightEnabled: false,
  dailyExecutionCompleted: false,
  dailyNominations: [],
  interactionLog: [],
});

type TestStoreState = {
  user: User | null;
  gameState: GameState | null;
  sync: () => void;
  setPhase: (phase: GameState['phase']) => void;
  nightNext: () => void;
  nightPrev: () => void;
  startVote: (nomineeId: number) => void;
  toggleCandlelight: () => void;
};

const createTestStore = (
  initialGameState: GameState | null = createMockGameState(),
  initialUser: User | null = { id: 'u1', name: 'User', roomId: 'TEST123', isStoryteller: true, isSeated: false }
) => {
  const syncMock = vi.fn();
  return createStore<TestStoreState>()(
    immer((set, get) => ({
      user: initialUser,
      gameState: initialGameState,
      sync: syncMock,

      toggleCandlelight: () => {
        set((state) => {
          if (state.gameState) {
            state.gameState.candlelightEnabled = !state.gameState.candlelightEnabled;
          }
        });
        get().sync();
      },

      setPhase: (phase) => {
        set((state) => {
          if (state.gameState) {
            const oldPhase = state.gameState.phase;
            state.gameState.phase = phase;

            if (phase === 'NIGHT' && oldPhase !== 'NIGHT') {
              state.gameState.roundInfo.nightCount++;
              state.gameState.roundInfo.totalRounds++;
            }
            if (phase === 'DAY' && oldPhase !== 'DAY') {
              state.gameState.roundInfo.dayCount++;
              state.gameState.candlelightEnabled = false;
              state.gameState.dailyNominations = [];
            }
            if (phase === 'NIGHT') {
              state.gameState.nightQueue = [];
              state.gameState.nightCurrentIndex = -1;
            }
          }
        });
        get().sync();
      },

      nightNext: () => {
        set((state) => {
          if (state.gameState) {
            const queue = state.gameState.nightQueue;
            if (state.gameState.nightCurrentIndex < queue.length - 1) {
              state.gameState.nightCurrentIndex++;
            } else {
              state.gameState.phase = 'DAY';
              state.gameState.nightCurrentIndex = -1;
              state.gameState.roundInfo.dayCount++;
            }
          }
        });
        get().sync();
      },

      nightPrev: () => {
        set((state) => {
          if (state.gameState) {
            if (state.gameState.nightCurrentIndex > 0) {
              state.gameState.nightCurrentIndex--;
            }
          }
        });
        get().sync();
      },

      startVote: (nomineeId) => {
        set((state) => {
          if (state.gameState) {
            state.gameState.voting = {
              nominatorSeatId: null,
              nomineeSeatId: nomineeId,
              clockHandSeatId: nomineeId,
              votes: [],
              isOpen: true,
            };
            state.gameState.phase = 'VOTING';
          }
        });
        get().sync();
      },
    }))
  );
};

describe('createGameFlowSlice extra', () => {
  describe('toggleCandlelight', () => {
    it('toggles candlelightEnabled', () => {
      const store = createTestStore();
      expect(store.getState().gameState!.candlelightEnabled).toBe(false);
      store.getState().toggleCandlelight();
      expect(store.getState().gameState!.candlelightEnabled).toBe(true);
      store.getState().toggleCandlelight();
      expect(store.getState().gameState!.candlelightEnabled).toBe(false);
    });
  });

  describe('setPhase', () => {
    it('increments nightCount and totalRounds on NIGHT', () => {
      const store = createTestStore();
      store.getState().setPhase('NIGHT');
      expect(store.getState().gameState!.roundInfo.nightCount).toBe(1);
      expect(store.getState().gameState!.roundInfo.totalRounds).toBe(1);
    });

    it('increments dayCount and resets candlelight on DAY', () => {
      const gs = createMockGameState();
      gs.candlelightEnabled = true;
      const store = createTestStore(gs);
      store.getState().setPhase('DAY');
      expect(store.getState().gameState!.roundInfo.dayCount).toBe(1);
      expect(store.getState().gameState!.candlelightEnabled).toBe(false);
    });
  });

  describe('nightNext / nightPrev', () => {
    it('nightNext advances index or switches to DAY', () => {
      const gs = createMockGameState();
      gs.nightQueue = ['washerwoman', 'empath'];
      gs.nightCurrentIndex = 0;
      const store = createTestStore(gs);

      store.getState().nightNext();
      expect(store.getState().gameState!.nightCurrentIndex).toBe(1);

      store.getState().nightNext();
      expect(store.getState().gameState!.phase).toBe('DAY');
      expect(store.getState().gameState!.nightCurrentIndex).toBe(-1);
    });

    it('nightPrev decrements index but not below 0', () => {
      const gs = createMockGameState();
      gs.nightQueue = ['washerwoman', 'empath'];
      gs.nightCurrentIndex = 1;
      const store = createTestStore(gs);

      store.getState().nightPrev();
      expect(store.getState().gameState!.nightCurrentIndex).toBe(0);

      store.getState().nightPrev();
      expect(store.getState().gameState!.nightCurrentIndex).toBe(0);
    });
  });

  describe('startVote', () => {
    it('creates voting state and sets phase to VOTING', () => {
      const store = createTestStore();
      store.setState((state) => {
        if (state.gameState) {
          state.gameState.phase = 'DAY';
          state.gameState.roundInfo.dayCount = 1;
          state.gameState.seats[2]!.userId = 'u2';
          state.gameState.seats[2]!.userName = '玩家2';
        }
      });
      store.getState().startVote(2);
      expect(store.getState().gameState!.voting).toMatchObject({
        nomineeSeatId: 2,
        clockHandSeatId: 2,
        votes: [],
        isOpen: true,
      });
      expect(store.getState().gameState!.phase).toBe('VOTING');
    });
  });
});
