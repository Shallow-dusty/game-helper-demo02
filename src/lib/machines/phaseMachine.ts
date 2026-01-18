import { setup, assign } from 'xstate';
import type { Seat } from '../../types';
import { NIGHT_ORDER_FIRST, NIGHT_ORDER_OTHER } from '../../constants';

/**
 * Game Phase State Machine Context
 */
export interface PhaseMachineContext {
  roundInfo: {
    dayCount: number;
    nightCount: number;
    nominationCount: number;
    totalRounds: number;
  };
  nightQueue: string[];
  nightCurrentIndex: number;
  seats: Seat[];
  gameOver: {
    isOver: boolean;
    winner: 'GOOD' | 'EVIL';
    reason: string;
  } | null;
}

/**
 * Game Phase State Machine Events
 */
export type PhaseMachineEvent =
  | { type: 'START_GAME'; seats: Seat[] }
  | { type: 'START_NIGHT' }
  | { type: 'NEXT_NIGHT_ACTION' }
  | { type: 'PREV_NIGHT_ACTION' }
  | { type: 'END_NIGHT' }
  | { type: 'START_DAY' }
  | { type: 'START_VOTING'; nomineeSeatId: number }
  | { type: 'CLOSE_VOTE'; isExecuted: boolean }
  | { type: 'END_GAME'; winner: 'GOOD' | 'EVIL'; reason: string };

/**
 * Calculate night action queue based on alive roles
 */
function calculateNightQueue(seats: Seat[], isFirstNight: boolean): string[] {
  const orderList = isFirstNight ? NIGHT_ORDER_FIRST : NIGHT_ORDER_OTHER;
  const activeRoleIds = seats
    .filter(s => s.realRoleId && !s.isDead)
    .map(s => s.realRoleId!);
  return orderList.filter(roleId => activeRoleIds.includes(roleId));
}

/**
 * Game Phase State Machine
 *
 * States:
 * - setup: Initial state, waiting for game to start
 * - night: Night phase, processing night actions
 * - day: Day phase, discussions and nominations
 * - voting: Active voting on a nominee
 * - gameOver: Final state, game has ended
 *
 * This state machine manages the core game flow transitions
 * and ensures valid state progressions.
 */
export const phaseMachine = setup({
  types: {
    context: {} as PhaseMachineContext,
    events: {} as PhaseMachineEvent,
  },
  guards: {
    /**
     * Check if night queue is complete (next increment would go out of bounds)
     */
    isNightQueueComplete: ({ context }) => {
      return context.nightCurrentIndex + 1 >= context.nightQueue.length;
    },

    /**
     * Check if can start voting (must be in day phase)
     */
    canStartVoting: ({ context }) => {
      return !context.gameOver;
    },

    /**
     * Check if night queue has actions remaining
     */
    hasMoreNightActions: ({ context }) => {
      return context.nightCurrentIndex < context.nightQueue.length - 1;
    },

    /**
     * Check if can go back in night queue
     */
    canGoBackInNightQueue: ({ context }) => {
      return context.nightCurrentIndex > 0;
    },
  },
  actions: {
    /**
     * Initialize game state
     */
    initializeGame: assign({
      roundInfo: () => ({
        dayCount: 0,
        nightCount: 1,
        nominationCount: 0,
        totalRounds: 1,
      }),
      nightQueue: ({ event }) => {
        if (event.type !== 'START_GAME') return [];
        return calculateNightQueue(event.seats, true);
      },
      nightCurrentIndex: -1,
      seats: ({ event }) => {
        if (event.type !== 'START_GAME') return [];
        return event.seats;
      },
      gameOver: null,
    }),

    /**
     * Increment night count and generate night queue
     */
    startNightPhase: assign({
      roundInfo: ({ context }) => ({
        ...context.roundInfo,
        nightCount: context.roundInfo.nightCount + 1,
        totalRounds: context.roundInfo.totalRounds + 1,
      }),
      nightQueue: ({ context }) => {
        const isFirstNight = context.roundInfo.nightCount === 0;
        return calculateNightQueue(context.seats, isFirstNight);
      },
      nightCurrentIndex: -1,
    }),

    /**
     * Increment day count
     */
    startDayPhase: assign({
      roundInfo: ({ context }) => ({
        ...context.roundInfo,
        dayCount: context.roundInfo.dayCount + 1,
        totalRounds: context.roundInfo.totalRounds + 1,
      }),
      nightCurrentIndex: -1,
    }),

    /**
     * Advance to next night action
     */
    advanceNightAction: assign({
      nightCurrentIndex: ({ context }) => context.nightCurrentIndex + 1,
    }),

    /**
     * Go back to previous night action
     */
    rewindNightAction: assign({
      nightCurrentIndex: ({ context }) => Math.max(0, context.nightCurrentIndex - 1),
    }),

    /**
     * Mark game as over
     */
    endGame: assign({
      gameOver: ({ event }) => {
        if (event.type !== 'END_GAME') return null;
        return {
          isOver: true,
          winner: event.winner,
          reason: event.reason,
        };
      },
    }),
  },
}).createMachine({
  id: 'gamePhase',
  initial: 'setup',
  context: {
    roundInfo: {
      dayCount: 0,
      nightCount: 0,
      nominationCount: 0,
      totalRounds: 0,
    },
    nightQueue: [],
    nightCurrentIndex: -1,
    seats: [],
    gameOver: null,
  },
  states: {
    setup: {
      on: {
        START_GAME: {
          target: 'night',
          actions: 'initializeGame',
        },
      },
    },
    night: {
      always: [
        {
          guard: 'isNightQueueComplete',
          target: 'day',
          actions: 'startDayPhase',
        },
      ],
      on: {
        NEXT_NIGHT_ACTION: {
          actions: 'advanceNightAction',
        },
        PREV_NIGHT_ACTION: {
          guard: 'canGoBackInNightQueue',
          actions: 'rewindNightAction',
        },
        END_NIGHT: {
          target: 'day',
          actions: 'startDayPhase',
        },
      },
    },
    day: {
      on: {
        START_VOTING: {
          guard: 'canStartVoting',
          target: 'voting',
        },
        START_NIGHT: {
          target: 'night',
          actions: 'startNightPhase',
        },
        END_GAME: {
          target: 'gameOver',
          actions: 'endGame',
        },
      },
    },
    voting: {
      on: {
        CLOSE_VOTE: {
          target: 'day',
        },
        END_GAME: {
          target: 'gameOver',
          actions: 'endGame',
        },
      },
    },
    gameOver: {
      type: 'final',
    },
  },
});
