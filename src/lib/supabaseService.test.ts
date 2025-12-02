/**
 * Supabase Service Tests
 * 
 * Tests for database service layer functions
 */

import { describe, it, expect } from 'vitest';
import {
    getTeamFromRoleType,
    mapPhase,
} from './supabaseService';

// Note: The actual RPC calls are tested via integration tests
// Here we test the utility functions and type helpers

describe('supabaseService', () => {
    describe('getTeamFromRoleType', () => {
        it('should return GOOD for TOWNSFOLK', () => {
            expect(getTeamFromRoleType('TOWNSFOLK')).toBe('GOOD');
        });

        it('should return GOOD for OUTSIDER', () => {
            expect(getTeamFromRoleType('OUTSIDER')).toBe('GOOD');
        });

        it('should return EVIL for MINION', () => {
            expect(getTeamFromRoleType('MINION')).toBe('EVIL');
        });

        it('should return EVIL for DEMON', () => {
            expect(getTeamFromRoleType('DEMON')).toBe('EVIL');
        });

        it('should return NEUTRAL for undefined', () => {
            expect(getTeamFromRoleType(undefined)).toBe('NEUTRAL');
        });

        it('should return NEUTRAL for unknown type', () => {
            expect(getTeamFromRoleType('TRAVELLER')).toBe('NEUTRAL');
        });
    });

    describe('mapPhase', () => {
        it('should map DAY to DAY', () => {
            expect(mapPhase('DAY')).toBe('DAY');
        });

        it('should map NIGHT to NIGHT', () => {
            expect(mapPhase('NIGHT')).toBe('NIGHT');
        });

        it('should map DUSK to DUSK', () => {
            expect(mapPhase('DUSK')).toBe('DUSK');
        });

        it('should default to DAY for unknown phase', () => {
            expect(mapPhase('VOTING')).toBe('DAY');
            expect(mapPhase('SETUP')).toBe('DAY');
        });
    });
});
