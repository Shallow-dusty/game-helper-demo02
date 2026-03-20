import { StoreSlice, GameSlice } from '@/store/types';
import { applyPhaseChange } from './phase';

export const createNightSlice: StoreSlice<Pick<GameSlice, 'nightNext' | 'nightPrev'>> = (set, get) => ({
    nightNext: () => {
        const { phaseActor } = get();
        if (phaseActor) {
            phaseActor.send({ type: 'NEXT_NIGHT_ACTION' });
        } else {
            // Fallback
            set((state) => {
                if (state.gameState) {
                    const queue = state.gameState.nightQueue;
                    if (state.gameState.nightCurrentIndex < queue.length - 1) {
                        state.gameState.nightCurrentIndex++;
                    } else {
                        applyPhaseChange(state, 'DAY');
                        state.gameState.nightCurrentIndex = -1;
                    }
                }
            });
            get().sync();
        }
    },

    nightPrev: () => {
        const { phaseActor } = get();
        if (phaseActor) {
            phaseActor.send({ type: 'PREV_NIGHT_ACTION' });
        } else {
            // Fallback
            set((state) => {
                if (state.gameState) {
                    if (state.gameState.nightCurrentIndex > 0) {
                        state.gameState.nightCurrentIndex--;
                    }
                }
            });
            get().sync();
        }
    }
});
