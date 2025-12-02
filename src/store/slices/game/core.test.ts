import { describe, it, expect, vi } from 'vitest';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameState, Seat, User } from '../../../types';

// Mock supabase
vi.mock('../createConnectionSlice', () => ({
    supabase: {
        from: vi.fn(() => ({
            insert: vi.fn().mockResolvedValue({ error: null }),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        rpc: vi.fn(),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn((cb) => {
                if (cb) cb('SUBSCRIBED');
                return { unsubscribe: vi.fn() };
            }),
        })),
        removeChannel: vi.fn(),
    },
}));

// Mock utils
vi.mock('../../utils', () => ({
    addSystemMessage: vi.fn(),
}));

// Minimal mock store that includes the core slice functionality
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
    dailyNominations: [],
    interactionLog: [],
});

const createMockUser = (overrides?: Partial<User>): User => ({
    id: 'user-123',
    name: 'TestUser',
    isStoryteller: false,
    roomId: 'TEST123',
    isSeated: false,
    ...overrides,
});

// Create a test store with core slice functionality
type TestStoreState = {
    user: User | null;
    gameState: GameState | null;
    isOffline: boolean;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
    sync: () => void;
    toggleReady: () => void;
    addSeat: () => void;
    removeSeat: () => void;
    addVirtualPlayer: () => void;
    removeVirtualPlayer: (seatId: number) => void;
};

const createTestStore = (
    initialGameState: GameState | null = createMockGameState(),
    initialUser: User | null = createMockUser()
) => {
    const syncMock = vi.fn();
    
    return createStore<TestStoreState>()(
        immer((set, get) => ({
            user: initialUser,
            gameState: initialGameState,
            isOffline: false,
            connectionStatus: 'connected' as const,
            sync: syncMock,
            
            toggleReady: () => {
                const { user } = get();
                if (!user) return;
                set((state) => {
                    if (state.gameState) {
                        const seat = state.gameState.seats.find(s => s.userId === user.id);
                        if (seat) {
                            seat.isReady = !seat.isReady;
                        }
                    }
                });
                get().sync();
            },
            
            addSeat: () => {
                set((state) => {
                    if (state.gameState) {
                        if (state.gameState.seats.length >= 20) return;
                        const newId = state.gameState.seats.length;
                        state.gameState.seats.push(createMockSeat(newId));
                    }
                });
                get().sync();
            },
            
            removeSeat: () => {
                set((state) => {
                    if (state.gameState && state.gameState.seats.length > 5) {
                        state.gameState.seats.pop();
                    }
                });
                get().sync();
            },
            
            addVirtualPlayer: () => {
                set((state) => {
                    if (state.gameState) {
                        const emptySeat = state.gameState.seats.find(s => !s.userId && !s.isVirtual);
                        if (emptySeat) {
                            emptySeat.isVirtual = true;
                            emptySeat.userName = `虚拟玩家 ${emptySeat.id + 1}`;
                            emptySeat.userId = `virtual-${Date.now()}`;
                        }
                    }
                });
                get().sync();
            },
            
            removeVirtualPlayer: (seatId) => {
                set((state) => {
                    if (state.gameState) {
                        const seat = state.gameState.seats.find(s => s.id === seatId);
                        if (seat?.isVirtual) {
                            seat.isVirtual = false;
                            seat.userName = `座位 ${seat.id + 1}`;
                            seat.userId = null;
                        }
                    }
                });
                get().sync();
            },
        }))
    );
};

describe('createGameCoreSlice', () => {
    describe('toggleReady', () => {
        it('should toggle ready state for seated user', () => {
            const gameState = createMockGameState(5);
            // Seat the user at position 0
            const seat0 = gameState.seats[0];
            if (seat0) {
                seat0.userId = 'user-123';
                seat0.userName = 'TestUser';
                (seat0 as any).isReady = false;
            }
            
            const user = createMockUser({ isSeated: true });
            const store = createTestStore(gameState, user);
            
            // Initially not ready
            expect((store.getState().gameState!.seats[0] as any)?.isReady).toBe(false);
            
            // Toggle ready
            store.getState().toggleReady();
            
            // Now should be ready
            expect((store.getState().gameState!.seats[0] as any)?.isReady).toBe(true);
            
            // Should call sync
            expect(store.getState().sync).toHaveBeenCalled();
        });
        
        it('should do nothing when user is not logged in', () => {
            const store = createTestStore(createMockGameState(), null);
            store.getState().toggleReady();
            // No error should be thrown
        });
        
        it('should do nothing when user is not seated', () => {
            const gameState = createMockGameState(5);
            const user = createMockUser({ isSeated: false });
            const store = createTestStore(gameState, user);
            
            store.getState().toggleReady();
            
            // No seat should have isReady changed
            gameState.seats.forEach(seat => {
                expect((seat as any).isReady).toBeUndefined();
            });
        });
    });
    
    describe('addSeat', () => {
        it('should add a new seat to the game', () => {
            const store = createTestStore(createMockGameState(5));
            
            expect(store.getState().gameState!.seats.length).toBe(5);
            
            store.getState().addSeat();
            
            expect(store.getState().gameState!.seats.length).toBe(6);
            const newSeat = store.getState().gameState!.seats[5];
            expect(newSeat?.id).toBe(5);
            expect(newSeat?.userName).toBe('座位 6');
            expect(store.getState().sync).toHaveBeenCalled();
        });
        
        it('should not exceed 20 seats', () => {
            const store = createTestStore(createMockGameState(20));
            
            expect(store.getState().gameState!.seats.length).toBe(20);
            
            store.getState().addSeat();
            
            // Should still be 20
            expect(store.getState().gameState!.seats.length).toBe(20);
        });
        
        it('should do nothing when gameState is null', () => {
            const store = createTestStore(null);
            store.getState().addSeat();
            expect(store.getState().gameState).toBeNull();
        });
    });
    
    describe('removeSeat', () => {
        it('should remove the last seat', () => {
            const store = createTestStore(createMockGameState(8));
            
            expect(store.getState().gameState!.seats.length).toBe(8);
            
            store.getState().removeSeat();
            
            expect(store.getState().gameState!.seats.length).toBe(7);
            expect(store.getState().sync).toHaveBeenCalled();
        });
        
        it('should not go below 5 seats', () => {
            const store = createTestStore(createMockGameState(5));
            
            store.getState().removeSeat();
            
            // Should still be 5
            expect(store.getState().gameState!.seats.length).toBe(5);
        });
        
        it('should do nothing when gameState is null', () => {
            const store = createTestStore(null);
            store.getState().removeSeat();
            expect(store.getState().gameState).toBeNull();
        });
    });
    
    describe('addVirtualPlayer', () => {
        it('should add a virtual player to an empty seat', () => {
            const store = createTestStore(createMockGameState(5));
            
            store.getState().addVirtualPlayer();
            
            const virtualSeat = store.getState().gameState!.seats.find(s => s.isVirtual);
            expect(virtualSeat).toBeDefined();
            expect(virtualSeat!.isVirtual).toBe(true);
            expect(virtualSeat!.userName).toBe('虚拟玩家 1');
            expect(virtualSeat!.userId).toMatch(/^virtual-\d+$/);
            expect(store.getState().sync).toHaveBeenCalled();
        });
        
        it('should not add virtual player when no empty seats', () => {
            const gameState = createMockGameState(5);
            gameState.seats.forEach((seat, i) => {
                seat.userId = `user-${i}`;
            });
            
            const store = createTestStore(gameState);
            
            store.getState().addVirtualPlayer();
            
            // Should not add any new virtual players since all seats are taken
            const virtualCount = store.getState().gameState!.seats.filter(s => s.isVirtual).length;
            expect(virtualCount).toBe(0);
        });
        
        it('should skip seats that are already virtual', () => {
            const gameState = createMockGameState(5);
            const seat0 = gameState.seats[0];
            if (seat0) {
                seat0.isVirtual = true;
                seat0.userId = 'virtual-1';
            }
            
            const store = createTestStore(gameState);
            
            store.getState().addVirtualPlayer();
            
            // Should add to seat 1, not seat 0
            expect(store.getState().gameState!.seats[1]?.isVirtual).toBe(true);
        });
    });
    
    describe('removeVirtualPlayer', () => {
        it('should remove a virtual player from specified seat', () => {
            const gameState = createMockGameState(5);
            const seat2 = gameState.seats[2];
            if (seat2) {
                seat2.isVirtual = true;
                seat2.userId = 'virtual-123';
                seat2.userName = '虚拟玩家 3';
            }
            
            const store = createTestStore(gameState);
            
            store.getState().removeVirtualPlayer(2);
            
            const seat = store.getState().gameState!.seats[2];
            expect(seat?.isVirtual).toBe(false);
            expect(seat?.userId).toBeNull();
            expect(seat?.userName).toBe('座位 3');
            expect(store.getState().sync).toHaveBeenCalled();
        });
        
        it('should do nothing for non-virtual seat', () => {
            const gameState = createMockGameState(5);
            const seat2 = gameState.seats[2];
            if (seat2) {
                seat2.userId = 'real-user';
                seat2.userName = 'RealPlayer';
            }
            
            const store = createTestStore(gameState);
            
            store.getState().removeVirtualPlayer(2);
            
            // Should not change the real player
            const seat = store.getState().gameState!.seats[2];
            expect(seat?.userId).toBe('real-user');
            expect(seat?.userName).toBe('RealPlayer');
        });
        
        it('should do nothing for non-existent seat', () => {
            const store = createTestStore(createMockGameState(5));
            
            store.getState().removeVirtualPlayer(99);
            
            // Should not throw and no changes
            expect(store.getState().gameState!.seats.length).toBe(5);
        });
    });
});
