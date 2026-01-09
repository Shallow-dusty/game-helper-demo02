/**
 * Phase Machine Slice - XState Integration
 *
 * This slice integrates the XState phaseMachine into the Zustand store.
 * It manages the phase state machine actor and syncs state changes.
 */

import { createActor, type Actor } from 'xstate';
import { phaseMachine, type PhaseMachineContext, type PhaseMachineEvent } from '../../../lib/machines/phaseMachine';
import type { StoreSlice } from '../../types';
import type { Seat, Team } from '../../../types';

export interface PhaseMachineSlice {
  // XState actor instance
  phaseActor: Actor<typeof phaseMachine> | null;

  // Current phase machine state
  phaseState: 'setup' | 'night' | 'day' | 'voting' | 'gameOver';

  // Current phase machine context
  phaseContext: PhaseMachineContext;

  // Actions to send events to the machine
  phaseMachine: {
    startGame: (seats: Seat[]) => void;
    startNight: () => void;
    nextNightAction: () => void;
    prevNightAction: () => void;
    endNight: () => void;
    startVoting: (nomineeSeatId: number) => void;
    closeVote: (isExecuted: boolean) => void;
    endGame: (winner: Team, reason: string) => void;
  };

  // Initialize the phase machine actor
  initializePhaseMachine: () => void;

  // Stop the phase machine actor
  stopPhaseMachine: () => void;
}

export const createPhaseMachineSlice: StoreSlice<PhaseMachineSlice> = (set, get) => {
  // Initial context matching machine's initial context
  const initialContext: PhaseMachineContext = {
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
  };

  return {
    phaseActor: null,
    phaseState: 'setup',
    phaseContext: initialContext,

    phaseMachine: {
      startGame: (seats: Seat[]) => {
        const { phaseActor } = get();
        if (phaseActor) {
          phaseActor.send({ type: 'START_GAME', seats });
        }
      },

      startNight: () => {
        const { phaseActor } = get();
        if (phaseActor) {
          phaseActor.send({ type: 'START_NIGHT' });
        }
      },

      nextNightAction: () => {
        const { phaseActor } = get();
        if (phaseActor) {
          phaseActor.send({ type: 'NEXT_NIGHT_ACTION' });
        }
      },

      prevNightAction: () => {
        const { phaseActor } = get();
        if (phaseActor) {
          phaseActor.send({ type: 'PREV_NIGHT_ACTION' });
        }
      },

      endNight: () => {
        const { phaseActor } = get();
        if (phaseActor) {
          phaseActor.send({ type: 'END_NIGHT' });
        }
      },

      startVoting: (nomineeSeatId: number) => {
        const { phaseActor } = get();
        if (phaseActor) {
          phaseActor.send({ type: 'START_VOTING', nomineeSeatId });
        }
      },

      closeVote: (isExecuted: boolean) => {
        const { phaseActor } = get();
        if (phaseActor) {
          phaseActor.send({ type: 'CLOSE_VOTE', isExecuted });
        }
      },

      endGame: (winner: Team, reason: string) => {
        const { phaseActor } = get();
        if (phaseActor) {
          phaseActor.send({ type: 'END_GAME', winner, reason });
        }
      },
    },

    initializePhaseMachine: () => {
      // Stop existing actor if any
      const existing = get().phaseActor;
      if (existing) {
        existing.stop();
      }

      // Create and start new actor
      const actor = createActor(phaseMachine);

      // Subscribe to state changes and sync to Zustand
      actor.subscribe((snapshot) => {
        set({
          phaseState: snapshot.value,
          phaseContext: snapshot.context,
        });
      });

      actor.start();

      // Store actor in Zustand
      set({ phaseActor: actor });
    },

    stopPhaseMachine: () => {
      const { phaseActor } = get();
      if (phaseActor) {
        phaseActor.stop();
        set({
          phaseActor: null,
          phaseState: 'setup',
          phaseContext: initialContext,
        });
      }
    },
  };
};
