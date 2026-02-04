/**
 * Supabase Service Tests
 * 
 * Tests for database service layer functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getTeamFromRoleType,
    mapPhase,
    logInteraction,
    logNightAction,
    logDeath,
    logExecution,
    logChainReaction,
    checkNominationEligibility,
    recordNomination,
    updateNominationResult,
    getNominationHistory,
} from './supabaseService';

// Mock supabase
const mockRpc = vi.fn();

vi.mock('../store/slices/connection', () => ({
    supabase: {
        rpc: (...args: unknown[]) => mockRpc(...args),
    },
}));

describe('supabaseService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

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

    describe('logInteraction', () => {
        it('should log interaction successfully', async () => {
            mockRpc.mockResolvedValue({ data: 'log-123', error: null });

            const result = await logInteraction({
                roomId: 1,
                gameDay: 1,
                phase: 'NIGHT',
                actorSeat: 0,
                actorRole: 'washerwoman',
                actorTeam: 'GOOD',
                targetSeat: 1,
                targetRole: 'drunk',
                actionType: 'NIGHT_ACTION',
                result: 'SUCCESS',
            });

            expect(result).toBe('log-123');
            expect(mockRpc).toHaveBeenCalledWith('log_interaction', expect.objectContaining({
                p_room_id: 1,
                p_game_day: 1,
                p_phase: 'NIGHT',
                p_actor_seat: 0,
                p_actor_role: 'washerwoman',
                p_action_type: 'NIGHT_ACTION',
            }));
        });

        it('should return null on error', async () => {
            mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });

            const result = await logInteraction({
                roomId: 1,
                gameDay: 1,
                phase: 'DAY',
                actionType: 'NOMINATION',
            });

            expect(result).toBeNull();
        });

        it('should handle exception', async () => {
            mockRpc.mockRejectedValue(new Error('Network error'));

            const result = await logInteraction({
                roomId: 1,
                gameDay: 1,
                phase: 'DAY',
                actionType: 'VOTE',
            });

            expect(result).toBeNull();
        });

        it('should handle optional fields', async () => {
            mockRpc.mockResolvedValue({ data: 'log-456', error: null });

            const result = await logInteraction({
                roomId: 1,
                gameDay: 1,
                phase: 'DAY',
                actionType: 'NOMINATION',
                // No optional fields
            });

            expect(result).toBe('log-456');
            expect(mockRpc).toHaveBeenCalledWith('log_interaction', expect.objectContaining({
                p_actor_seat: null,
                p_actor_role: null,
                p_target_seat: null,
                p_payload: {},
            }));
        });
    });

    describe('logNightAction', () => {
        it('should log night action with all parameters', async () => {
            mockRpc.mockResolvedValue({ data: 'night-log-1', error: null });

            const result = await logNightAction(
                1,
                2,
                0,
                'washerwoman',
                'GOOD',
                1,
                'drunk',
                'SUCCESS',
                { info: 'some info' }
            );

            expect(result).toBe('night-log-1');
            expect(mockRpc).toHaveBeenCalledWith('log_interaction', expect.objectContaining({
                p_phase: 'NIGHT',
                p_action_type: 'NIGHT_ACTION',
                p_actor_seat: 0,
                p_actor_role: 'washerwoman',
                p_target_seat: 1,
            }));
        });

        it('should handle undefined target', async () => {
            mockRpc.mockResolvedValue({ data: 'night-log-2', error: null });

            await logNightAction(
                1,
                1,
                0,
                'empath',
                'GOOD',
                undefined,
                undefined
            );

            // When undefined is passed, the logInteraction converts to null
            expect(mockRpc).toHaveBeenCalledWith('log_interaction', expect.objectContaining({
                p_target_seat: null,
                p_target_role: null,
            }));
        });
    });

    describe('logDeath', () => {
        it('should log death event', async () => {
            mockRpc.mockResolvedValue({ data: 'death-log-1', error: null });

            const result = await logDeath(
                1,
                1,
                'NIGHT',
                3,
                'drunk',
                'GOOD',
                'demon_kill'
            );

            expect(result).toBe('death-log-1');
            expect(mockRpc).toHaveBeenCalledWith('log_interaction', expect.objectContaining({
                p_action_type: 'DEATH',
                p_target_seat: 3,
                p_target_role: 'drunk',
                p_payload: { cause: 'demon_kill' },
            }));
        });
    });

    describe('logExecution', () => {
        it('should log execution event', async () => {
            mockRpc.mockResolvedValue({ data: 'exec-log-1', error: null });

            const result = await logExecution(
                1,
                2,
                5,
                'imp',
                7
            );

            expect(result).toBe('exec-log-1');
            expect(mockRpc).toHaveBeenCalledWith('log_interaction', expect.objectContaining({
                p_phase: 'DAY',
                p_action_type: 'EXECUTION',
                p_target_seat: 5,
                p_target_role: 'imp',
                p_payload: { voteCount: 7 },
            }));
        });
    });

    describe('logChainReaction', () => {
        it('should log chain reaction event', async () => {
            mockRpc.mockResolvedValue({ data: 'chain-log-1', error: null });

            const result = await logChainReaction(
                1,
                1,
                'NIGHT',
                0,
                'scarlet_woman',
                1,
                'imp',
                'demon_swap'
            );

            expect(result).toBe('chain-log-1');
            expect(mockRpc).toHaveBeenCalledWith('log_interaction', expect.objectContaining({
                p_action_type: 'CHAIN_REACTION',
                p_payload: { reactionType: 'demon_swap' },
            }));
        });
    });

    describe('checkNominationEligibility', () => {
        it('should return eligibility when can nominate', async () => {
            mockRpc.mockResolvedValue({
                data: { canNominate: true, reason: null, previousNominee: null },
                error: null,
            });

            const result = await checkNominationEligibility(1, 1, 0);

            expect(result).toEqual({
                canNominate: true,
                reason: null,
                previousNominee: null,
            });
        });

        it('should return reason when cannot nominate', async () => {
            mockRpc.mockResolvedValue({
                data: { canNominate: false, reason: 'Already nominated today', previousNominee: 3 },
                error: null,
            });

            const result = await checkNominationEligibility(1, 1, 0);

            expect(result).toEqual({
                canNominate: false,
                reason: 'Already nominated today',
                previousNominee: 3,
            });
        });

        it('should return can nominate true on error (fail open)', async () => {
            mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC error' } });

            const result = await checkNominationEligibility(1, 1, 0);

            // Fails open - allows nomination on error
            expect(result).toEqual({
                canNominate: true,
                reason: null,
                previousNominee: null,
            });
        });

        it('should handle exception and fail open', async () => {
            mockRpc.mockRejectedValue(new Error('Network error'));

            const result = await checkNominationEligibility(1, 1, 0);

            // Fails open
            expect(result).toEqual({
                canNominate: true,
                reason: null,
                previousNominee: null,
            });
        });
    });

    describe('recordNomination', () => {
        it('should record nomination successfully', async () => {
            mockRpc.mockResolvedValue({
                data: { success: true, error: null, nominationId: 'nom-123' },
                error: null,
            });

            const result = await recordNomination(1, 1, 0, 3);

            expect(result).toEqual({
                success: true,
                error: null,
                nominationId: 'nom-123',
            });
        });

        it('should return error on failure from RPC data', async () => {
            mockRpc.mockResolvedValue({
                data: { success: false, error: 'Player already nominated', nominationId: null },
                error: null,
            });

            const result = await recordNomination(1, 1, 0, 3);

            expect(result).toEqual({
                success: false,
                error: 'Player already nominated',
                nominationId: null,
            });
        });

        it('should handle RPC error', async () => {
            mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });

            const result = await recordNomination(1, 1, 0, 3);

            expect(result).toEqual({
                success: false,
                error: 'DB error',  // The actual implementation uses error.message
                nominationId: null,
            });
        });

        it('should handle exception', async () => {
            mockRpc.mockRejectedValue(new Error('Network error'));

            const result = await recordNomination(1, 1, 0, 3);

            expect(result).toEqual({
                success: false,
                error: 'Unknown error',
                nominationId: null,
            });
        });
    });

    describe('updateNominationResult', () => {
        it('should update nomination result successfully', async () => {
            mockRpc.mockResolvedValue({ data: true, error: null });

            const result = await updateNominationResult(
                1,
                1,
                3,
                true,
                8,
                true
            );

            expect(result).toBe(true);
            expect(mockRpc).toHaveBeenCalledWith('update_nomination_result', {
                p_room_id: 1,
                p_game_day: 1,
                p_nominee_seat: 3,
                p_was_seconded: true,
                p_vote_count: 8,
                p_was_executed: true,
            });
        });

        it('should return false on error', async () => {
            mockRpc.mockResolvedValue({ data: null, error: { message: 'Update failed' } });

            const result = await updateNominationResult(1, 1, 3, false, 2, false);

            expect(result).toBe(false);
        });

        it('should handle exception', async () => {
            mockRpc.mockRejectedValue(new Error('Network error'));

            const result = await updateNominationResult(1, 1, 3, true, 5, true);

            expect(result).toBe(false);
        });
    });

    describe('getNominationHistory', () => {
        it('should get nomination history for game', async () => {
            const mockHistory = [
                {
                    id: 'nom-1',
                    gameDay: 1,
                    nominatorSeat: 0,
                    nomineeSeat: 3,
                    wasSeconded: true,
                    voteCount: 8,
                    wasExecuted: true,
                    createdAt: '2024-01-01T00:00:00Z',
                },
            ];

            mockRpc.mockResolvedValue({ data: mockHistory, error: null });

            const result = await getNominationHistory(1);

            expect(result).toEqual(mockHistory);
            expect(mockRpc).toHaveBeenCalledWith('get_nomination_history', {
                p_room_id: 1,
                p_game_day: null,
            });
        });

        it('should get nomination history for specific day', async () => {
            mockRpc.mockResolvedValue({ data: [], error: null });

            await getNominationHistory(1, 2);

            expect(mockRpc).toHaveBeenCalledWith('get_nomination_history', {
                p_room_id: 1,
                p_game_day: 2,
            });
        });

        it('should return empty array on error', async () => {
            mockRpc.mockResolvedValue({ data: null, error: { message: 'Query failed' } });

            const result = await getNominationHistory(1);

            expect(result).toEqual([]);
        });

        it('should handle null data', async () => {
            mockRpc.mockResolvedValue({ data: null, error: null });

            const result = await getNominationHistory(1);

            expect(result).toEqual([]);
        });
    });
});
