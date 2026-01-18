import { StoreSlice, GameSlice } from '@/store/types';

export const createNightSlice: StoreSlice<Pick<GameSlice, 'nightNext' | 'nightPrev'>> = (set, get) => ({
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
    }
});
