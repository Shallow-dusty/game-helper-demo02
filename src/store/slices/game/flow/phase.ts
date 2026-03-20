import type { Draft } from 'immer';
import { StoreSlice, GameSlice } from '@/store/types';
import type { AppState } from '@/store/types';
import type { GamePhase } from '@/types';
import {
    resolveDailyExecution,
    onEnterNight,
    onEnterDay,
    onExitVoting,
    addPhaseChangeMessage,
} from './sideEffects';

export const applyPhaseChange = (state: Draft<AppState>, phase: GamePhase): void => {
    if (!state.gameState) return;

    const gameState = state.gameState;
    const oldPhase = gameState.phase;
    if (oldPhase === phase) return;

    // Exit side-effects
    if (oldPhase === 'DAY' && phase === 'NIGHT') {
        resolveDailyExecution(state);
    }
    if (oldPhase === 'VOTING' && phase !== 'VOTING') {
        onExitVoting(state);
    }

    gameState.phase = phase;
    addPhaseChangeMessage(state, phase);

    // Entry side-effects
    if (phase === 'NIGHT' && oldPhase !== 'NIGHT') {
        onEnterNight(state);
    }
    if (phase === 'DAY' && oldPhase !== 'DAY') {
        onEnterDay(state);
    }
};

export const createPhaseSlice: StoreSlice<Pick<GameSlice, 'setPhase'>> = (set, get) => ({
    setPhase: (phase) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            applyPhaseChange(state, phase);
        });
        get().sync();
    }
});
