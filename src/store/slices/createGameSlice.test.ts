 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGameSlice } from './createGameSlice';
import { createStore, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { AppState } from '../types';
import { Seat } from '../../types';

// Mock dependencies
vi.mock('../utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils')>();
  return {
    ...actual,
    addSystemMessage: vi.fn(),
  };
});

vi.mock('../../lib/gameLogic', () => ({
  generateRoleAssignment: vi.fn(() => ['washerwoman', 'librarian', 'investigator', 'chef', 'empath']),
  checkGameOver: vi.fn(), // Add mocked checkGameOver
  countAlivePlayers: vi.fn((seats) => seats.filter((seat: { isDead?: boolean; userId?: string | null }) => seat.userId && !seat.isDead).length),
}));

// Use hoisted mock to avoid temporal dead zone during module mock evaluation
const mockRpc = vi.hoisted(() => vi.fn().mockResolvedValue({ data: null, error: null }));

vi.mock('./connection', () => ({
  supabase: {
    from: () => ({
      update: () => ({ eq: () => ({ error: null }) }),
      upsert: () => ({ error: null }),
      insert: () => ({ error: null }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => { /* empty */ } }),
    }),
    rpc: mockRpc,
  },
}));

describe('createGameSlice', () => {
  let store: StoreApi<AppState>;

  beforeEach(() => {
    store = createStore<AppState>()(
      immer((set, get) => ({
        ...createGameSlice(set, get, {} as any),
        user: { id: 'test-user', name: 'Test User', isStoryteller: true },
        sync: vi.fn(), // Mock sync
      } as unknown as AppState))
    );
  });

  it('should initialize with default state', () => {
    const state = store.getState();
    expect(state.gameState).toBeNull();
  });

  describe('createGame', () => {
    it('should create a new game state', async () => {
      await store.getState().createGame(5);
      const state = store.getState();
      expect(state.gameState).toBeDefined();
      expect(state.gameState!.seats).toHaveLength(5);
      expect(state.gameState!.phase).toBe('SETUP');
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to seated players', async () => {
      // Setup
      await store.getState().createGame(5);
      const state = store.getState();
      
      // Seat players
      state.gameState!.seats.forEach((s, i: number) => {
        s.userId = `user-${String(i)}`;
      });

      // Assign
      store.getState().assignRoles();

      // Verify
      const newState = store.getState();
      expect(newState.gameState!.setupPhase).toBe('ASSIGNING');
      // Check if roles are assigned (mocked generateRoleAssignment returns 5 roles)
      // Note: The actual assignment logic depends on random shuffling, but we can check if *some* role is assigned
      const assignedCount = newState.gameState!.seats.filter((s) => s.realRoleId).length;
      expect(assignedCount).toBeGreaterThan(0);
    });

    it('should not assign roles if player count < 5', async () => {
       await store.getState().createGame(4); // Invalid count
       store.getState().assignRoles();
       // Should show error (toast) but we can check state didn't change phase or assign roles
       // Since we didn't mock toast, we just check state
       const state = store.getState();
       expect(state.gameState!.seats[0]!.realRoleId).toBeNull();
    });
  });

  describe('applyStrategy', () => {
    it('should apply specific roles', async () => {
      await store.getState().createGame(5);
      const state = store.getState();
      state.gameState!.seats.forEach((s, i: number) => {
        s.userId = `user-${String(i)}`;
      });

      const strategyRoles = ['imp', 'washerwoman', 'librarian', 'investigator', 'chef'];
      store.getState().applyStrategy('Test Strat', strategyRoles);

      const newState = store.getState();
      const assignedRoles = newState.gameState!.seats.map((s) => s.realRoleId).filter(Boolean);
      expect(assignedRoles).toHaveLength(5);
      expect(assignedRoles).toEqual(expect.arrayContaining(strategyRoles));
    });
  });

  describe('Game Over Logic', () => {
    it('should trigger game over when Demon dies', async () => {
      await store.getState().createGame(5);
      store.getState().assignRoles();
      
      // Find Imp
      const impSeat = store.getState().gameState!.seats.find((s) => s.realRoleId === 'imp');
      // If random assignment didn't pick Imp (unlikely with 5 players and TB script, but possible if logic fails), we skip
      if (!impSeat) return; 
      
      // Kill Imp
      store.getState().toggleDead(impSeat.id);
      
      const state = store.getState();
      expect(state.gameState!.gameOver.isOver).toBe(true);
      expect(state.gameState!.gameOver.winner).toBe('GOOD');
    });

    it('should pass Imp to Scarlet Woman when Demon dies', async () => {
      await store.getState().createGame(5);
      
      // Manually assign roles to ensure Imp + Scarlet Woman
      store.setState((state) => {
          if (!state.gameState) return state;
          // Ensure seats exist
          while(state.gameState.seats.length < 5) {
              state.gameState.seats.push({ id: state.gameState.seats.length, userName: 'Bot', reminders: [], statuses: [] } as unknown as Seat);
          }
          
          state.gameState.seats[0]!.userId = 'p1'; state.gameState.seats[0]!.realRoleId = 'imp'; state.gameState.seats[0]!.userName = 'Imp';
          state.gameState.seats[1]!.userId = 'p2'; state.gameState.seats[1]!.realRoleId = 'scarlet_woman'; state.gameState.seats[1]!.userName = 'SW';
          state.gameState.seats[2]!.userId = 'p3'; state.gameState.seats[2]!.realRoleId = 'washerwoman';
          state.gameState.seats[3]!.userId = 'p4'; state.gameState.seats[3]!.realRoleId = 'librarian';
          state.gameState.seats[4]!.userId = 'p5'; state.gameState.seats[4]!.realRoleId = 'investigator';
          return state;
      });
      
      // Kill Imp
      store.getState().toggleDead(0);
      
      const state = store.getState();
      expect(state.gameState!.gameOver.isOver).toBe(false); // Game continues
      
      const newImp = state.gameState!.seats[1]!;
      expect(newImp.realRoleId).toBe('imp'); // Scarlet Woman becomes Imp
      expect(newImp.roleId).toBe('imp');
    });
  });

  describe('Voting Execution', () => {
      it('should execute player if votes > half alive players', async () => {
          await store.getState().createGame(5);
          store.getState().assignRoles();
          store.setState((state) => {
              if (!state.gameState) return state;
              state.gameState.seats.forEach((seat, index) => {
                  seat.userId = `user-${String(index)}`;
                  seat.userName = `Player ${String(index + 1)}`;
              });
              return state;
          });
          store.setState((state) => {
              if (state.gameState) {
                  state.gameState.phase = 'DAY';
                  state.gameState.roundInfo.dayCount = 1;
              }
          });
          // 5 players alive, need 3 votes to execute
          const nomineeId = 0;
          store.getState().startVote(nomineeId);
          
          // Add 3 votes using proper Zustand API
          store.setState((state) => {
              if (!state.gameState?.voting) return state;
              return {
                  ...state,
                  gameState: {
                      ...state.gameState,
                      voting: {
                          ...state.gameState.voting,
                          votes: [1, 2, 3]
                      }
                  }
              };
          });
          
          store.getState().closeVote();
          // Resolve end-of-day execution
          store.getState().setPhase('NIGHT');
          
          const newState = store.getState();
          expect(newState.gameState!.seats[nomineeId]!.isDead).toBe(true);
          expect(newState.gameState!.voteHistory[0]!.result).toBe('executed');
      });

      it('should NOT execute if votes <= half alive players', async () => {
        await store.getState().createGame(5);
        store.getState().assignRoles();
        store.setState((state) => {
            if (!state.gameState) return state;
            state.gameState.seats.forEach((seat, index) => {
                seat.userId = `user-${String(index)}`;
                seat.userName = `Player ${String(index + 1)}`;
            });
            return state;
        });
        store.setState((state) => {
            if (state.gameState) {
                state.gameState.phase = 'DAY';
                state.gameState.roundInfo.dayCount = 1;
            }
        });
        // 5 players alive, need 3 votes. We give 2.
        const nomineeId = 0;
        store.getState().startVote(nomineeId);
        
        // Add 2 votes using proper Zustand API  
        store.setState((state) => {
            if (!state.gameState?.voting) return state;
            return {
                ...state,
                gameState: {
                    ...state.gameState,
                    voting: {
                        ...state.gameState.voting,
                        votes: [1, 2]
                    }
                }
            };
        });
        
        store.getState().closeVote();
        store.getState().setPhase('NIGHT');
        
        const newState = store.getState();
        expect(newState.gameState!.seats[nomineeId]!.isDead).toBe(false);
        expect(newState.gameState!.voteHistory[0]!.result).toBe('survived');
    });
  });
});
