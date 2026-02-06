 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createGameSlice } from '../../src/store/slices/createGameSlice';
import { createConnectionSlice } from '../../src/store/slices/connection';
import { createAISlice } from '../../src/store/slices/createAISlice';
import { createUISlice } from '../../src/store/slices/createUISlice';
import { AppState } from '../../src/store/types';

// Mock everything needed for a full flow
vi.mock('../../src/store/utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../src/store/utils')>();
    return {
        ...actual,
        addSystemMessage: vi.fn(),
    };
});

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: () => ({
            update: () => ({ eq: () => ({ error: null }) }),
            upsert: () => ({ error: null }),
            insert: () => ({ error: null }),
            select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
        }),
        channel: () => ({
            on: () => ({ subscribe: () => { /* empty */ } }),
            subscribe: () => { /* empty */ },
            unsubscribe: () => { /* empty */ },
        }),
        removeChannel: () => { /* empty */ },
    })),
}));

vi.mock('../../src/store/slices/connection', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../src/store/slices/connection')>();
    return {
        ...actual,
        ensureAuthenticatedUser: vi.fn(async () => ({ id: 'st-1' })),
        createConnectionSlice: (_set, _get) => ({
            user: { id: 'st-1', name: 'Storyteller', isStoryteller: true },
            sync: vi.fn(),
            syncToCloud: vi.fn(),
            // Add other necessary properties if needed by the slice
            connectionStatus: 'connected',
            isOffline: false,
            login: vi.fn(),
            joinGame: vi.fn(),
            spectateGame: vi.fn(),
            leaveGame: vi.fn(),
            refreshFromCloud: vi.fn(),
            _setIsReceivingUpdate: vi.fn(),
            _setRealtimeChannel: vi.fn(),
            _getRealtimeChannel: vi.fn(),
        })
    };
});

vi.mock('../../src/store/slices/createGameSlice', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../src/store/slices/createGameSlice')>();
    return {
        ...actual,
        // We can override specific methods if needed, but using the real one is fine for integration
        // provided we mock the side effects (like sync) which is handled by createConnectionSlice mock
    };
});

describe('Game Flow Integration', () => {
    let store: StoreApi<AppState>;

    beforeEach(() => {
        store = createStore<AppState>()(
            immer((set, get) => ({
                ...createGameSlice(set, get, {} as any),
                ...createConnectionSlice(set, get, {} as any),
                ...createAISlice(set, get, {} as any),
                ...createUISlice(set, get, {} as any),
            } as unknown as AppState))
        );
    });

    it('should simulate a full game loop', async () => {
        // 1. Setup
        await store.getState().createGame(5);
        let state = store.getState();
        expect(state.gameState!.phase).toBe('SETUP');

        // 2. Seat Players
        state.gameState!.seats.forEach((s, i: number) => {
            s.userId = `p-${String(i)}`;
            s.userName = `Player ${String(i)}`;
        });

        // 3. Assign Roles
        store.getState().assignRoles();
        state = store.getState();
        expect(state.gameState!.setupPhase).toBe('ASSIGNING');
        
        // 4. Distribute Roles (Start Game)
        store.getState().distributeRoles();
        store.getState().startGame();
        state = store.getState();
        expect(state.gameState!.phase).toBe('NIGHT');
        expect(state.gameState!.roundInfo.nightCount).toBe(1);

        // 5. Day Phase
        store.getState().setPhase('DAY'); // Night -> Day
        state = store.getState();
        expect(state.gameState!.phase).toBe('DAY');
        expect(state.gameState!.roundInfo.dayCount).toBe(1);

        // 6. Nomination & Voting (Simulated)
        // ... (complex to mock fully without UI interaction, but we can check state transitions)

        // 7. Game Over
        store.getState().endGame('EVIL', 'Evil Wins');
        state = store.getState();
        expect(state.gameState!.gameOver.isOver).toBe(true);
        expect(state.gameState!.gameOver.reason).toBe('Evil Wins');
    });
});
