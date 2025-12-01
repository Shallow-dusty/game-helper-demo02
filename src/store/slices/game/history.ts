import { StoreSlice, GameSlice } from '../../types';

export const createGameHistorySlice: StoreSlice<Pick<GameSlice, 'fetchGameHistory' | 'saveGameHistory'>> = (_set, _get) => ({
    fetchGameHistory: async () => {
        return [];
    },

    saveGameHistory: async (_game) => {
        // Placeholder
    }
});
