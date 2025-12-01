import { StoreSlice, GameSlice } from '../../types';

export const createGameNightSlice: StoreSlice<Pick<GameSlice, 'performNightAction' | 'submitNightAction' | 'resolveNightAction' | 'getPendingNightActions'>> = (set, get) => ({
    performNightAction: (_action) => {
        // Placeholder
    },

    submitNightAction: (_action) => {
        // Placeholder
    },

    resolveNightAction: (requestId, result) => {
        set((state) => {
            if (state.gameState) {
                const req = state.gameState.nightActionRequests.find(r => r.id === requestId);
                if (req) {
                    req.status = 'resolved';
                    req.result = result;
                }
            }
        });
        get().sync();
    },

    getPendingNightActions: () => {
        const state = get().gameState;
        return state ? state.nightActionRequests.filter(r => r.status === 'pending') : [];
    }
});
