import { StoreSlice, GameSlice } from '@/store/types';
import { addSystemMessage } from '@/store/utils';
import { applyPhaseChange } from './phase';

export const createLifecycleSlice: StoreSlice<Pick<GameSlice, 'startGame' | 'endGame'>> = (set, get) => ({
    startGame: () => {
        if (!get().user?.isStoryteller) return;
        const { phaseActor, gameState } = get();
        if (!gameState) return;

        // Reset Zustand-only fields
        set((state) => {
            if (state.gameState) {
                state.gameState.dailyExecutionCompleted = false;
                state.gameState.dailyNominations = [];
            }
        });

        if (phaseActor) {
            // XState path: roundInfo reset, nightQueue calc, phase → NIGHT
            phaseActor.send({
                type: 'START_GAME',
                seats: gameState.seats,
                scriptId: gameState.currentScriptId,
            });
        } else {
            // Fallback (no machine): direct mutation
            set((state) => {
                if (state.gameState) {
                    state.gameState.roundInfo = { nightCount: 0, dayCount: 0, nominationCount: 0, totalRounds: 0 };
                    applyPhaseChange(state, 'NIGHT');
                }
            });
            get().sync();
        }
    },

    endGame: (winner: 'GOOD' | 'EVIL', reason: string) => {
        if (!get().user?.isStoryteller) return;
        const { phaseActor } = get();

        set((state) => {
            if (state.gameState) {
                state.gameState.candlelightEnabled = false;
            }
        });

        if (phaseActor) {
            phaseActor.send({ type: 'END_GAME', winner, reason });
        } else {
            // Fallback
            set((state) => {
                if (state.gameState) {
                    state.gameState.gameOver = { isOver: true, winner, reason };
                    addSystemMessage(state.gameState, `游戏结束！${winner === 'GOOD' ? '好人' : '邪恶'} 获胜 - ${reason}`);
                }
            });
            get().sync();
        }
    }
});
