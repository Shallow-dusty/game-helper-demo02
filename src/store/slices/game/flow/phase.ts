import type { Draft } from 'immer';
import { StoreSlice, GameSlice } from '@/store/types';
import type { AppState } from '@/store/types';
import type { GamePhase } from '@/types';
import { phaseToEvent } from '@/lib/machines/phaseMapping';
import {
    resolveDailyExecution,
    onEnterNight,
    onEnterDay,
    onExitVoting,
    addPhaseChangeMessage,
} from './sideEffects';

/** Legacy direct-mutation path (used when phaseActor is unavailable). */
export const applyPhaseChange = (state: Draft<AppState>, phase: GamePhase): void => {
    if (!state.gameState) return;
    const gs = state.gameState;
    const oldPhase = gs.phase;
    if (oldPhase === phase) return;

    if (oldPhase === 'DAY' && phase === 'NIGHT') resolveDailyExecution(state);
    if (oldPhase === 'VOTING' && phase !== 'VOTING') onExitVoting(state);

    gs.phase = phase;
    addPhaseChangeMessage(state, phase);

    if (phase === 'NIGHT' && oldPhase !== 'NIGHT') onEnterNight(state);
    if (phase === 'DAY' && oldPhase !== 'DAY') onEnterDay(state);
};

export const createPhaseSlice: StoreSlice<Pick<GameSlice, 'setPhase'>> = (set, get) => ({
    setPhase: (phase) => {
        if (!get().user?.isStoryteller) return;
        const { phaseActor, phaseState } = get();

        if (phaseActor) {
            const event = phaseToEvent(phase, phaseState);
            if (event) phaseActor.send(event);
        } else {
            // Fallback
            set((state) => { applyPhaseChange(state, phase); });
            get().sync();
        }
    }
});
