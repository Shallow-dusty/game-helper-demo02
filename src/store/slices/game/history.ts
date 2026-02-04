import { StoreSlice, GameSlice } from '../../types';

export const createGameHistorySlice: StoreSlice<Pick<GameSlice, 'fetchGameHistory' | 'saveGameHistory'>> = (_set, _get) => ({
    fetchGameHistory: () => {
        return Promise.resolve([]);
    },

    saveGameHistory: (_game) => {
        return Promise.resolve();
    }
});
