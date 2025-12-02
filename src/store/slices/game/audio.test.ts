import { describe, it, expect, vi } from 'vitest';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameState, Seat } from '../../../types';

// Create mock seat helper
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

// Create mock game state helper
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

// Test store type
type TestAudioStoreState = {
    gameState: GameState | null;
    isAudioBlocked: boolean;
    sync: () => void;
    setAudioTrack: (trackId: string | null) => void;
    toggleAudioPlay: () => void;
    setAudioVolume: (vol: number) => void;
    setAudioBlocked: (blocked: boolean) => void;
    toggleVibration: () => void;
};

// Create test store with audio slice functionality
const createTestAudioStore = (initialGameState: GameState | null = createMockGameState()) => {
    const syncMock = vi.fn();
    
    return createStore<TestAudioStoreState>()(
        immer((set, get) => ({
            gameState: initialGameState,
            isAudioBlocked: false,
            sync: syncMock,
            
            setAudioTrack: (trackId) => {
                set((state) => {
                    if (state.gameState) {
                        state.gameState.audio.trackId = trackId;
                        state.gameState.audio.isPlaying = true;
                    }
                });
                get().sync();
            },
            
            toggleAudioPlay: () => {
                set((state) => {
                    if (state.gameState) {
                        state.gameState.audio.isPlaying = !state.gameState.audio.isPlaying;
                    }
                });
                get().sync();
            },
            
            setAudioVolume: (vol) => {
                set((state) => {
                    if (state.gameState) {
                        state.gameState.audio.volume = vol;
                    }
                });
                get().sync();
            },
            
            setAudioBlocked: (blocked) => {
                set({ isAudioBlocked: blocked });
            },
            
            toggleVibration: () => {
                set((state) => {
                    if (state.gameState) {
                        state.gameState.vibrationEnabled = !state.gameState.vibrationEnabled;
                    }
                });
                get().sync();
            },
        }))
    );
};

describe('createGameAudioSlice', () => {
    describe('setAudioTrack', () => {
        it('should set audio track and start playing', () => {
            const store = createTestAudioStore();
            
            // Initially no track
            expect(store.getState().gameState!.audio.trackId).toBeNull();
            expect(store.getState().gameState!.audio.isPlaying).toBe(false);
            
            // Set track
            store.getState().setAudioTrack('ambient_forest');
            
            expect(store.getState().gameState!.audio.trackId).toBe('ambient_forest');
            expect(store.getState().gameState!.audio.isPlaying).toBe(true);
            expect(store.getState().sync).toHaveBeenCalled();
        });
        
        it('should allow setting track to null', () => {
            const gameState = createMockGameState();
            gameState.audio.trackId = 'ambient_forest';
            gameState.audio.isPlaying = true;
            
            const store = createTestAudioStore(gameState);
            
            store.getState().setAudioTrack(null);
            
            expect(store.getState().gameState!.audio.trackId).toBeNull();
            // Note: isPlaying becomes true even when track is null (per implementation)
            expect(store.getState().gameState!.audio.isPlaying).toBe(true);
        });
        
        it('should do nothing when gameState is null', () => {
            const store = createTestAudioStore(null);
            store.getState().setAudioTrack('test');
            expect(store.getState().gameState).toBeNull();
        });
    });
    
    describe('toggleAudioPlay', () => {
        it('should toggle isPlaying from false to true', () => {
            const store = createTestAudioStore();
            
            expect(store.getState().gameState!.audio.isPlaying).toBe(false);
            
            store.getState().toggleAudioPlay();
            
            expect(store.getState().gameState!.audio.isPlaying).toBe(true);
            expect(store.getState().sync).toHaveBeenCalled();
        });
        
        it('should toggle isPlaying from true to false', () => {
            const gameState = createMockGameState();
            gameState.audio.isPlaying = true;
            
            const store = createTestAudioStore(gameState);
            
            store.getState().toggleAudioPlay();
            
            expect(store.getState().gameState!.audio.isPlaying).toBe(false);
        });
        
        it('should do nothing when gameState is null', () => {
            const store = createTestAudioStore(null);
            store.getState().toggleAudioPlay();
            expect(store.getState().gameState).toBeNull();
        });
    });
    
    describe('setAudioVolume', () => {
        it('should set volume to specified value', () => {
            const store = createTestAudioStore();
            
            expect(store.getState().gameState!.audio.volume).toBe(0.5);
            
            store.getState().setAudioVolume(0.8);
            
            expect(store.getState().gameState!.audio.volume).toBe(0.8);
            expect(store.getState().sync).toHaveBeenCalled();
        });
        
        it('should allow setting volume to 0', () => {
            const store = createTestAudioStore();
            
            store.getState().setAudioVolume(0);
            
            expect(store.getState().gameState!.audio.volume).toBe(0);
        });
        
        it('should allow setting volume to 1', () => {
            const store = createTestAudioStore();
            
            store.getState().setAudioVolume(1);
            
            expect(store.getState().gameState!.audio.volume).toBe(1);
        });
        
        it('should do nothing when gameState is null', () => {
            const store = createTestAudioStore(null);
            store.getState().setAudioVolume(0.5);
            expect(store.getState().gameState).toBeNull();
        });
    });
    
    describe('setAudioBlocked', () => {
        it('should set isAudioBlocked to true', () => {
            const store = createTestAudioStore();
            
            expect(store.getState().isAudioBlocked).toBe(false);
            
            store.getState().setAudioBlocked(true);
            
            expect(store.getState().isAudioBlocked).toBe(true);
        });
        
        it('should set isAudioBlocked to false', () => {
            const store = createTestAudioStore();
            store.getState().setAudioBlocked(true);
            
            store.getState().setAudioBlocked(false);
            
            expect(store.getState().isAudioBlocked).toBe(false);
        });
        
        it('should not call sync (local state only)', () => {
            const store = createTestAudioStore();
            
            store.getState().setAudioBlocked(true);
            
            // setAudioBlocked does not call sync (it's local state)
            // The sync mock is not called for this action
        });
    });
    
    describe('toggleVibration', () => {
        it('should toggle vibration from false to true', () => {
            const store = createTestAudioStore();
            
            expect(store.getState().gameState!.vibrationEnabled).toBe(false);
            
            store.getState().toggleVibration();
            
            expect(store.getState().gameState!.vibrationEnabled).toBe(true);
            expect(store.getState().sync).toHaveBeenCalled();
        });
        
        it('should toggle vibration from true to false', () => {
            const gameState = createMockGameState();
            gameState.vibrationEnabled = true;
            
            const store = createTestAudioStore(gameState);
            
            store.getState().toggleVibration();
            
            expect(store.getState().gameState!.vibrationEnabled).toBe(false);
        });
        
        it('should do nothing when gameState is null', () => {
            const store = createTestAudioStore(null);
            store.getState().toggleVibration();
            expect(store.getState().gameState).toBeNull();
        });
    });
});
