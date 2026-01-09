/**
 * Game Flow Slice - Legacy export layer
 *
 * This file has been refactored into multiple submodules for better maintainability.
 * It now serves as a backward-compatible re-export layer.
 *
 * Original: 291 lines monolithic file
 * Refactored: 5 submodules (~50-80 lines each) + utils + index
 *
 * New structure:
 * - flow/phase.ts: Phase transitions
 * - flow/night.ts: Night action queue
 * - flow/voting.ts: Voting system
 * - flow/lifecycle.ts: Game start/end
 * - flow/features.ts: Additional features
 * - flow/utils.ts: Shared utility functions
 * - flow/index.ts: Unified exports
 *
 * Refactored on: 2026-01-09 (Stage 3.1)
 *
 * @deprecated Consider importing from './flow' or specific submodules
 */

export {
    createGameFlowSlice,
    createPhaseSlice,
    createNightSlice,
    createVotingSlice,
    createLifecycleSlice,
    createFeaturesSlice,
    calculateNightQueue,
    calculateVoteResult
} from './flow/index';
