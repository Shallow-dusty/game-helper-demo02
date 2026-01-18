import { StoreSlice, GameSlice } from '@/store/types';
import { addSystemMessage } from '@/store/utils';
import { calculateNightQueue } from './utils';

export const createLifecycleSlice: StoreSlice<Pick<GameSlice, 'startGame' | 'endGame'>> = (set, get) => ({
    startGame: () => {
        set((state) => {
            if (state.gameState) {
                state.gameState.phase = 'NIGHT';
                state.gameState.roundInfo.nightCount = 1;

                // Initialize night queue for first night
                const queue = calculateNightQueue(state.gameState.seats, true);

                state.gameState.nightQueue = queue;
                state.gameState.nightCurrentIndex = -1;

                // 烛光模式由 ST 手动控制，不自动开启
                // state.gameState.candlelightEnabled = true;
            }
        });
        get().sync();
    },

    endGame: (winner: 'GOOD' | 'EVIL', reason: string) => {
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
