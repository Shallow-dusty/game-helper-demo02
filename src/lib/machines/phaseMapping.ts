/**
 * Bidirectional mapping between XState phase states and GamePhase values.
 *
 * XState uses lowercase state names; GamePhase uses uppercase.
 * This module is the single source of truth for the mapping.
 */
import type { GamePhase } from '../../types';

/** XState state value → GamePhase */
const xstateToGamePhase: Record<string, GamePhase> = {
  setup: 'SETUP',
  night: 'NIGHT',
  day: 'DAY',
  nomination: 'NOMINATION',
  voting: 'VOTING',
};

/** GamePhase → XState state value */
const gamePhaseToXstate: Record<GamePhase, string> = {
  SETUP: 'setup',
  NIGHT: 'night',
  DAY: 'day',
  NOMINATION: 'nomination',
  VOTING: 'voting',
};

export function toGamePhase(xstateValue: string): GamePhase {
  return xstateToGamePhase[xstateValue] ?? 'SETUP';
}

export function toXstateValue(phase: GamePhase): string {
  return gamePhaseToXstate[phase];
}

/**
 * Map a GamePhase target to the appropriate XState event, given the current XState state.
 * Returns null if no valid transition exists (the machine's guards will catch invalid ones).
 */
export function phaseToEvent(
  targetPhase: GamePhase,
  currentXstateState: string,
): { type: string; [key: string]: unknown } | null {
  switch (targetPhase) {
    case 'NIGHT':
      return { type: 'START_NIGHT' };
    case 'DAY':
      // From night → END_NIGHT, from voting → CLOSE_VOTE (caller should handle voting separately)
      if (currentXstateState === 'night') return { type: 'END_NIGHT' };
      return { type: 'START_DAY' }; // fallback — won't match any transition, machine ignores
    case 'VOTING':
      return { type: 'START_VOTING' };
    case 'NOMINATION':
      return { type: 'START_NOMINATION' };
    case 'SETUP':
      return null; // SETUP is only reachable by restarting the machine
    default:
      return null;
  }
}
