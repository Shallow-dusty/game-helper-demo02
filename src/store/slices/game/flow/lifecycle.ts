import { StoreSlice, GameSlice } from '@/store/types';
import { addSystemMessage } from '@/store/utils';
import { applyPhaseChange } from './phase';

export const createLifecycleSlice: StoreSlice<Pick<GameSlice, 'startGame' | 'endGame'>> = (set, get) => ({
    startGame: () => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                // Ensure counters start clean
                state.gameState.roundInfo.nightCount = 0;
                state.gameState.roundInfo.dayCount = 0;
                state.gameState.roundInfo.nominationCount = 0;
                state.gameState.roundInfo.totalRounds = 0;
                state.gameState.dailyExecutionCompleted = false;
                state.gameState.dailyNominations = [];

                applyPhaseChange(state, 'NIGHT');

                // 烛光模式由 ST 手动控制，不自动开启
                // state.gameState.candlelightEnabled = true;
            }
        });
        get().sync();
    },

    endGame: (winner: 'GOOD' | 'EVIL', reason: string) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.gameOver = {
                    isOver: true,
                    winner,
                    reason
                };
                addSystemMessage(state.gameState, `游戏结束！${winner === 'GOOD' ? '好人' : '邪恶'} 获胜 - ${reason}`);

                // 游戏结束时关闭烛光模式
                state.gameState.candlelightEnabled = false;
            }
        });
        get().sync();
    }
});
