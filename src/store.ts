import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { AppState } from './store/types';
import { createUISlice } from './store/slices/createUISlice';
import { createConnectionSlice } from './store/slices/createConnectionSlice';
import { createAISlice } from './store/slices/createAISlice';
import { createGameSlice } from './store/slices/createGameSlice';
import { filterSeatForUser, filterGameStateForUser } from './store/utils'; // We need to extract these
import { getAiConfig } from './store/aiConfig';

// Re-export types and helpers for compatibility
export * from './types';
export * from './store/types';
export { getAiConfig };
export { filterSeatForUser, filterGameStateForUser };

export const useStore = create<AppState>()(
    immer((...a) => ({
        ...createUISlice(...a),
        ...createConnectionSlice(...a),
        ...createAISlice(...a),
        ...createGameSlice(...a),
    }))
);
