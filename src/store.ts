import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { AppState } from './store/types';
import { uiSlice } from './store/slices/ui';
import { connectionSlice } from './store/slices/connection';
import { aiSlice } from './store/slices/ai';
import { gameSlice } from './store/slices/game';
import { createPhaseMachineSlice } from './store/slices/game/phaseMachine';
import { filterSeatForUser, filterGameStateForUser } from './store/utils'; // We need to extract these
import { AI_CONFIG } from './store/aiConfig';

// Re-export types and helpers for compatibility
export * from './types';
export * from './store/types';
export { AI_CONFIG };
export { filterSeatForUser, filterGameStateForUser };

export const useStore = create<AppState>()(
    immer((...a) => ({
        ...uiSlice(...a),
        ...connectionSlice(...a),
        ...aiSlice(...a),
        ...gameSlice(...a),
        ...createPhaseMachineSlice(...a),
    }))
);
