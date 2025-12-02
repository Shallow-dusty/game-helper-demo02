/**
 * Supabase Service Layer for Grimoire Web v2.0
 * 
 * This module provides typed functions to interact with the database
 * for interaction logging and nomination tracking.
 */

import { supabase } from '../store/slices/createConnectionSlice';

// ============================================================================
// Types
// ============================================================================

export type ActionType = 
    | 'NIGHT_ACTION'
    | 'NOMINATION'
    | 'VOTE'
    | 'EXECUTION'
    | 'DEATH'
    | 'REVIVAL'
    | 'ROLE_CHANGE'
    | 'ALIGNMENT_CHANGE'
    | 'INFO_RECEIVED'
    | 'POISON'
    | 'PROTECTION'
    | 'CHAIN_REACTION';

export type ActionResult = 'SUCCESS' | 'BLOCKED' | 'REDIRECTED' | 'FAILED' | 'PENDING';

export type GamePhase = 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN';

export type Team = 'GOOD' | 'EVIL' | 'NEUTRAL';

export interface InteractionLogInput {
    roomId: string;  // Room code (e.g., "1234")
    gameDay: number;
    phase: GamePhase;
    actorSeat?: number;
    actorRole?: string;
    actorTeam?: Team;
    targetSeat?: number;
    targetRole?: string;
    actionType: ActionType;
    payload?: Record<string, unknown>;
    result?: ActionResult;
    resultDetails?: string;
}

export interface InteractionLog extends InteractionLogInput {
    id: string;
    createdAt: string;
}

export interface NominationEligibility {
    canNominate: boolean;
    reason: string | null;
    previousNominee: number | null;
}

export interface NominationResult {
    success: boolean;
    error: string | null;
    nominationId: string | null;
}

export interface NominationRecord {
    id: string;
    gameDay: number;
    nominatorSeat: number;
    nomineeSeat: number;
    wasSeconded: boolean;
    voteCount: number;
    wasExecuted: boolean;
    createdAt: string;
}

// ============================================================================
// Interaction Logging
// ============================================================================

/**
 * Log a game interaction to the database
 */
export async function logInteraction(input: InteractionLogInput): Promise<string | null> {
    try {
        const { data, error } = await supabase.rpc('log_interaction', {
            p_room_id: input.roomId,
            p_game_day: input.gameDay,
            p_phase: input.phase,
            p_actor_seat: input.actorSeat ?? null,
            p_actor_role: input.actorRole ?? null,
            p_actor_team: input.actorTeam ?? null,
            p_target_seat: input.targetSeat ?? null,
            p_target_role: input.targetRole ?? null,
            p_action_type: input.actionType,
            p_payload: input.payload ?? {},
            p_result: input.result ?? 'SUCCESS',
            p_result_details: input.resultDetails ?? null,
        });

        if (error) {
            console.error('Failed to log interaction:', error);
            return null;
        }

        return data as string;
    } catch (err) {
        console.error('Error logging interaction:', err);
        return null;
    }
}

/**
 * Log a night action
 */
export async function logNightAction(
    roomId: string,
    gameDay: number,
    actorSeat: number,
    actorRole: string,
    actorTeam: Team,
    targetSeat: number | undefined,
    targetRole: string | undefined,
    result: ActionResult = 'SUCCESS',
    payload?: Record<string, unknown>
): Promise<string | null> {
    return logInteraction({
        roomId,
        gameDay,
        phase: 'NIGHT',
        actorSeat,
        actorRole,
        actorTeam,
        targetSeat,
        targetRole,
        actionType: 'NIGHT_ACTION',
        payload,
        result,
    });
}

/**
 * Log a death event
 */
export async function logDeath(
    roomId: string,
    gameDay: number,
    phase: GamePhase,
    targetSeat: number,
    targetRole: string,
    _targetTeam: Team,
    cause: string
): Promise<string | null> {
    return logInteraction({
        roomId,
        gameDay,
        phase,
        targetSeat,
        targetRole,
        actionType: 'DEATH',
        payload: { cause },
        result: 'SUCCESS',
    });
}

/**
 * Log an execution
 */
export async function logExecution(
    roomId: string,
    gameDay: number,
    targetSeat: number,
    targetRole: string,
    voteCount: number
): Promise<string | null> {
    return logInteraction({
        roomId,
        gameDay,
        phase: 'DAY',
        targetSeat,
        targetRole,
        actionType: 'EXECUTION',
        payload: { voteCount },
        result: 'SUCCESS',
    });
}

/**
 * Log a chain reaction event
 */
export async function logChainReaction(
    roomId: string,
    gameDay: number,
    phase: GamePhase,
    actorSeat: number,
    actorRole: string,
    targetSeat: number,
    targetRole: string,
    reactionType: string
): Promise<string | null> {
    return logInteraction({
        roomId,
        gameDay,
        phase,
        actorSeat,
        actorRole,
        targetSeat,
        targetRole,
        actionType: 'CHAIN_REACTION',
        payload: { reactionType },
        result: 'SUCCESS',
    });
}

/**
 * Get all interactions for a game
 */
export async function getGameInteractions(
    roomId: string,
    gameDay?: number
): Promise<InteractionLog[]> {
    try {
        const { data, error } = await supabase.rpc('get_game_interactions', {
            p_room_id: roomId,
            p_game_day: gameDay ?? null,
        });

        if (error) {
            console.error('Failed to get game interactions:', error);
            return [];
        }

        return (data as InteractionLog[]) ?? [];
    } catch (err) {
        console.error('Error getting game interactions:', err);
        return [];
    }
}

// ============================================================================
// Nomination Tracking
// ============================================================================

/**
 * Check if a player can nominate today
 */
export async function checkNominationEligibility(
    roomId: string,
    gameDay: number,
    nominatorSeat: number
): Promise<NominationEligibility> {
    try {
        const { data, error } = await supabase.rpc('check_nomination_eligibility', {
            p_room_id: roomId,
            p_game_day: gameDay,
            p_nominator_seat: nominatorSeat,
        });

        if (error) {
            console.error('Failed to check nomination eligibility:', error);
            return { canNominate: true, reason: null, previousNominee: null };
        }

        return data as NominationEligibility;
    } catch (err) {
        console.error('Error checking nomination eligibility:', err);
        return { canNominate: true, reason: null, previousNominee: null };
    }
}

/**
 * Record a new nomination
 */
export async function recordNomination(
    roomId: string,
    gameDay: number,
    nominatorSeat: number,
    nomineeSeat: number
): Promise<NominationResult> {
    try {
        const { data, error } = await supabase.rpc('record_nomination', {
            p_room_id: roomId,
            p_game_day: gameDay,
            p_nominator_seat: nominatorSeat,
            p_nominee_seat: nomineeSeat,
        });

        if (error) {
            console.error('Failed to record nomination:', error);
            return { success: false, error: error.message, nominationId: null };
        }

        return data as NominationResult;
    } catch (err) {
        console.error('Error recording nomination:', err);
        return { success: false, error: 'Unknown error', nominationId: null };
    }
}

/**
 * Update nomination result after voting
 */
export async function updateNominationResult(
    roomId: string,
    gameDay: number,
    nomineeSeat: number,
    wasSeconded: boolean,
    voteCount: number,
    wasExecuted: boolean
): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc('update_nomination_result', {
            p_room_id: roomId,
            p_game_day: gameDay,
            p_nominee_seat: nomineeSeat,
            p_was_seconded: wasSeconded,
            p_vote_count: voteCount,
            p_was_executed: wasExecuted,
        });

        if (error) {
            console.error('Failed to update nomination result:', error);
            return false;
        }

        return data as boolean;
    } catch (err) {
        console.error('Error updating nomination result:', err);
        return false;
    }
}

/**
 * Get nomination history for a game
 */
export async function getNominationHistory(
    roomId: string,
    gameDay?: number
): Promise<NominationRecord[]> {
    try {
        const { data, error } = await supabase.rpc('get_nomination_history', {
            p_room_id: roomId,
            p_game_day: gameDay ?? null,
        });

        if (error) {
            console.error('Failed to get nomination history:', error);
            return [];
        }

        return (data as NominationRecord[]) ?? [];
    } catch (err) {
        console.error('Error getting nomination history:', err);
        return [];
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get team from role type (helper for logging)
 */
export function getTeamFromRoleType(roleType?: string): Team {
    if (!roleType) return 'NEUTRAL';
    
    switch (roleType) {
        case 'TOWNSFOLK':
        case 'OUTSIDER':
            return 'GOOD';
        case 'MINION':
        case 'DEMON':
            return 'EVIL';
        default:
            return 'NEUTRAL';
    }
}

/**
 * Map internal phase names to database phase
 */
export function mapPhase(phase: string): GamePhase {
    switch (phase) {
        case 'DAY':
            return 'DAY';
        case 'NIGHT':
            return 'NIGHT';
        case 'DUSK':
            return 'DUSK';
        default:
            return 'DAY';
    }
}
