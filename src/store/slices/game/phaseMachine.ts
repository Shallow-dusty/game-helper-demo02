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
import type { StoreSlice, PhaseMachineSlice, PhaseActorInterface } from '../../types';
import type { Seat } from '@/types';
import { toGamePhase } from '@/lib/machines/phaseMapping';
import {
  onEnterNight,
  onEnterDay,
  onExitVoting,
  resolveDailyExecution,
  addPhaseChangeMessage,
} from './flow/sideEffects';

// Re-export so existing consumers keep working
export type { PhaseMachineSlice } from '../../types';

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

      // Track previous state for transition detection
      let previousXstateValue = 'setup';

      // Subscribe to state changes and sync to Zustand + gameState
      actor.subscribe((snapshot) => {
        const newXstateValue = snapshot.value as string;
        const newPhase = toGamePhase(newXstateValue);
        const oldXstateValue = previousXstateValue;
        previousXstateValue = newXstateValue;

        // 1. Always sync phaseState + phaseContext
        set({
          phaseState: snapshot.value,
          phaseContext: snapshot.context,
        });

        // 2. Sync XState context to gameState (if gameState exists)
        set((state) => {
          if (!state.gameState) return;
          const gs = state.gameState;
          const ctx = snapshot.context;
          const oldPhase = gs.phase;

          // Sync phase-owned fields from XState context
          gs.nightQueue = ctx.nightQueue;
          gs.nightCurrentIndex = ctx.nightCurrentIndex;
          gs.roundInfo = { ...ctx.roundInfo };
          gs.gameOver = ctx.gameOver ? { ...ctx.gameOver } : gs.gameOver;

          // Only update phase + run side-effects if phase actually changed
          if (oldPhase !== newPhase) {
            // Exit side-effects
            if (oldPhase === 'DAY' && newPhase === 'NIGHT') {
              resolveDailyExecution(state);
            }
            if (oldPhase === 'VOTING' && newPhase !== 'VOTING') {
              onExitVoting(state);
            }

            gs.phase = newPhase;
            addPhaseChangeMessage(state, newPhase);

            // Entry side-effects
            if (newPhase === 'NIGHT' && oldPhase !== 'NIGHT') {
              onEnterNight(state);
            }
            if (newPhase === 'DAY' && oldPhase !== 'DAY') {
              onEnterDay(state);
            }
          }
        });

        // 3. Push to Supabase (only if phase changed and sync is available)
        if (oldXstateValue !== newXstateValue) {
          const store = get();
          if (typeof store.sync === 'function') {
            store.sync();
          }
        }
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
