/**
 * Phase Machine Slice - XState Integration
 *
 * This slice integrates the XState phaseMachine into the Zustand store.
 * It manages the phase state machine actor and syncs state changes.
 *
 * NOTE: ESLint warnings for @typescript-eslint/no-unsafe-* rules are suppressed
 * in this file due to complex type inference issues between XState v5 and
 * Zustand's immer middleware. The StoreSlice type causes generic parameters
 * to resolve to `error` type. The runtime behavior is correct and type-safe
 * based on the explicit interface definitions.
 */

 
 
 

import { createActor } from 'xstate';
import { phaseMachine, type PhaseMachineContext } from '@/lib/machines/phaseMachine';
import type { StoreSlice } from '../../types';
import type { Seat } from '@/types';

/**
 * Actor interface for sending events to the phase machine.
 * We define this explicitly to avoid complex XState type inference issues
 * with Zustand's immer middleware.
 */
interface PhaseActorInterface {
  send: (event: {
    type: string;
    seats?: Seat[];
    scriptId?: string;
    nomineeSeatId?: number;
    isExecuted?: boolean;
    winner?: 'GOOD' | 'EVIL';
    reason?: string;
  }) => void;
  stop: () => void;
  subscribe: (callback: (snapshot: { value: string; context: PhaseMachineContext }) => void) => { unsubscribe: () => void };
  start: () => void;
}

export interface PhaseMachineSlice {
  // XState actor instance
  phaseActor: PhaseActorInterface | null;

  // Current phase machine state
  phaseState: 'setup' | 'night' | 'day' | 'voting' | 'gameOver';

  // Current phase machine context
  phaseContext: PhaseMachineContext;

  // Actions to send events to the machine
    phaseMachine: {
    startGame: (seats: Seat[], scriptId?: string) => void;
    startNight: () => void;
    nextNightAction: () => void;
    prevNightAction: () => void;
    endNight: () => void;
    startVoting: (nomineeSeatId: number) => void;
    closeVote: (isExecuted: boolean) => void;
    endGame: (winner: 'GOOD' | 'EVIL', reason: string) => void;
  };

  // Initialize the phase machine actor
  initializePhaseMachine: () => void;

  // Stop the phase machine actor
  stopPhaseMachine: () => void;
}

export const createPhaseMachineSlice: StoreSlice<PhaseMachineSlice> = (set, get) => {
  // Initial context matching machine's initial context
  const initialContext: PhaseMachineContext = {
    scriptId: 'tb',
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
      startGame: (seats: Seat[], scriptId?: string) => {
        const { phaseActor } = get();
        phaseActor?.send({ type: 'START_GAME', seats, scriptId });
      },

      startNight: () => {
        const { phaseActor } = get();
        phaseActor?.send({ type: 'START_NIGHT' });
      },

      nextNightAction: () => {
        const { phaseActor } = get();
        phaseActor?.send({ type: 'NEXT_NIGHT_ACTION' });
      },

      prevNightAction: () => {
        const { phaseActor } = get();
        phaseActor?.send({ type: 'PREV_NIGHT_ACTION' });
      },

      endNight: () => {
        const { phaseActor } = get();
        phaseActor?.send({ type: 'END_NIGHT' });
      },

      startVoting: (nomineeSeatId: number) => {
        const { phaseActor } = get();
        phaseActor?.send({ type: 'START_VOTING', nomineeSeatId });
      },

      closeVote: (isExecuted: boolean) => {
        const { phaseActor } = get();
        phaseActor?.send({ type: 'CLOSE_VOTE', isExecuted });
      },

      endGame: (winner: 'GOOD' | 'EVIL', reason: string) => {
        const { phaseActor } = get();
        phaseActor?.send({ type: 'END_GAME', winner, reason });
      },
    },

    initializePhaseMachine: () => {
      // Stop existing actor if any
      const existing = get().phaseActor;
      existing?.stop();

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

      // Store actor in Zustand (cast to our interface)
      set({ phaseActor: actor as unknown as PhaseActorInterface });
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
