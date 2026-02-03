/**
 * Game Flow Module - Refactored from monolithic flow.ts (291 lines → 5 modules)
 *
 * This module manages all game flow operations:
 * - Phase transitions (SETUP, NIGHT, DAY, VOTING)
 * - Night action queue and navigation
 * - Voting system (standard + clockwise)
 * - Game lifecycle (start/end)
 * - Additional features (candlelight mode, interaction logs)
 *
 * Refactored on 2026-01-09 as part of Stage 3.1
 */

import { StoreSlice, GameSlice } from '@/store/types';
import { createPhaseSlice } from './phase';
import { createNightSlice } from './night';
import { createVotingSlice } from './voting';
import { createLifecycleSlice } from './lifecycle';
import { createFeaturesSlice } from './features';

/**
 * Unified game flow slice that combines all sub-slices
 *
 * This maintains backward compatibility with the original flow.ts API
 */
export const createGameFlowSlice: StoreSlice<Pick<GameSlice,
    'setPhase' |
    'nightNext' | 'nightPrev' |
    'startVote' | 'nextClockHand' | 'toggleHand' | 'closeVote' |
    'startGame' | 'endGame' |
    'toggleCandlelight' | 'addInteractionLog'
>> = (set, get) => {
    return {
        ...(createPhaseSlice as any)(set, get),
        ...(createNightSlice as any)(set, get),
        ...(createVotingSlice as any)(set, get),
        ...(createLifecycleSlice as any)(set, get),
        ...(createFeaturesSlice as any)(set, get)
    };
};

// Export sub-modules for direct access if needed
export { createPhaseSlice } from './phase';
export { createNightSlice } from './night';
export { createVotingSlice } from './voting';
export { createLifecycleSlice } from './lifecycle';
export { createFeaturesSlice } from './features';
export { calculateNightQueue, calculateVoteResult, getVoteThreshold } from './utils';
