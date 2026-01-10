/**
 * Flow Re-export Layer Tests
 *
 * Tests for src/store/slices/game/flow.ts
 * This file is a re-export layer, so we test that all exports are available
 */

import { describe, it, expect } from 'vitest';
import * as flowExports from './flow';

describe('flow.ts re-export layer', () => {
    it('should export createGameFlowSlice', () => {
        expect(flowExports.createGameFlowSlice).toBeDefined();
        expect(typeof flowExports.createGameFlowSlice).toBe('function');
    });

    it('should export createPhaseSlice', () => {
        expect(flowExports.createPhaseSlice).toBeDefined();
        expect(typeof flowExports.createPhaseSlice).toBe('function');
    });

    it('should export createNightSlice', () => {
        expect(flowExports.createNightSlice).toBeDefined();
        expect(typeof flowExports.createNightSlice).toBe('function');
    });

    it('should export createVotingSlice', () => {
        expect(flowExports.createVotingSlice).toBeDefined();
        expect(typeof flowExports.createVotingSlice).toBe('function');
    });

    it('should export createLifecycleSlice', () => {
        expect(flowExports.createLifecycleSlice).toBeDefined();
        expect(typeof flowExports.createLifecycleSlice).toBe('function');
    });

    it('should export createFeaturesSlice', () => {
        expect(flowExports.createFeaturesSlice).toBeDefined();
        expect(typeof flowExports.createFeaturesSlice).toBe('function');
    });

    it('should export calculateNightQueue', () => {
        expect(flowExports.calculateNightQueue).toBeDefined();
        expect(typeof flowExports.calculateNightQueue).toBe('function');
    });

    it('should export calculateVoteResult', () => {
        expect(flowExports.calculateVoteResult).toBeDefined();
        expect(typeof flowExports.calculateVoteResult).toBe('function');
    });

    it('should export exactly 8 items', () => {
        const exportKeys = Object.keys(flowExports);
        expect(exportKeys).toHaveLength(8);
        expect(exportKeys).toEqual(expect.arrayContaining([
            'createGameFlowSlice',
            'createPhaseSlice',
            'createNightSlice',
            'createVotingSlice',
            'createLifecycleSlice',
            'createFeaturesSlice',
            'calculateNightQueue',
            'calculateVoteResult'
        ]));
    });
});
