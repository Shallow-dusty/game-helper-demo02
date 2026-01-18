import { StoreSlice, GameSlice } from '@/store/types';
import { addSystemMessage } from '@/store/utils';
import { PHASE_LABELS } from '@/constants';
import { calculateNightQueue } from './utils';

export const createPhaseSlice: StoreSlice<Pick<GameSlice, 'setPhase'>> = (set, get) => ({
    setPhase: (phase) => {
        set((state) => {
            if (state.gameState) {
                const oldPhase = state.gameState.phase;
                state.gameState.phase = phase;
                addSystemMessage(state.gameState, `游戏阶段变更为: ${PHASE_LABELS[phase]}`);

                // Bug#5 fix: Clear voting state when leaving VOTING phase
                if (oldPhase === 'VOTING' && phase !== 'VOTING') {
                    state.gameState.voting = null;
                }

                if (phase === 'NIGHT' && oldPhase !== 'NIGHT') {
                    state.gameState.roundInfo.nightCount++;
                    state.gameState.roundInfo.totalRounds++;
                    // 烛光模式由 ST 手动控制，进入夜晚时不自动开启
                    // state.gameState.candlelightEnabled = true;
                }
                if (phase === 'DAY' && oldPhase !== 'DAY') {
                    state.gameState.roundInfo.dayCount++;
                    // 进入白天自动关闭烛光
                    state.gameState.candlelightEnabled = false;
                    // 重置每日提名记录
                    state.gameState.dailyNominations = [];
                }

                // If entering NIGHT, recalculate queue
                if (phase === 'NIGHT') {
                    const isFirstNight = state.gameState.roundInfo.nightCount === 1;
                    const queue = calculateNightQueue(state.gameState.seats, isFirstNight);

                    state.gameState.nightQueue = queue;
                    state.gameState.nightCurrentIndex = -1;
                }
            }
        });
        get().sync();
    }
});
