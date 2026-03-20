import { describe, it, expect } from 'vitest';
import { toGamePhase, toXstateValue, phaseToEvent } from './phaseMapping';
import type { GamePhase } from '../../types';

describe('phaseMapping', () => {
  describe('toGamePhase', () => {
    it.each([
      ['setup', 'SETUP'],
      ['night', 'NIGHT'],
      ['day', 'DAY'],
      ['nomination', 'NOMINATION'],
      ['voting', 'VOTING'],
    ] as const)('maps XState "%s" → GamePhase "%s"', (xstate, expected) => {
      expect(toGamePhase(xstate)).toBe(expected);
    });

    it('falls back to SETUP for unknown XState values', () => {
      expect(toGamePhase('gameOver')).toBe('SETUP');
      expect(toGamePhase('unknown')).toBe('SETUP');
      expect(toGamePhase('')).toBe('SETUP');
    });
  });

  describe('toXstateValue', () => {
    it.each([
      ['SETUP', 'setup'],
      ['NIGHT', 'night'],
      ['DAY', 'day'],
      ['NOMINATION', 'nomination'],
      ['VOTING', 'voting'],
    ] as const)('maps GamePhase "%s" → XState "%s"', (phase, expected) => {
      expect(toXstateValue(phase as GamePhase)).toBe(expected);
    });
  });

  describe('phaseToEvent', () => {
    it('returns START_NIGHT for NIGHT target', () => {
      expect(phaseToEvent('NIGHT', 'day')).toEqual({ type: 'START_NIGHT' });
      expect(phaseToEvent('NIGHT', 'setup')).toEqual({ type: 'START_NIGHT' });
    });

    it('returns END_NIGHT when transitioning from night to DAY', () => {
      expect(phaseToEvent('DAY', 'night')).toEqual({ type: 'END_NIGHT' });
    });

    it('returns START_DAY fallback when transitioning to DAY from non-night state', () => {
      expect(phaseToEvent('DAY', 'voting')).toEqual({ type: 'START_DAY' });
      expect(phaseToEvent('DAY', 'day')).toEqual({ type: 'START_DAY' });
    });

    it('returns START_VOTING for VOTING target', () => {
      expect(phaseToEvent('VOTING', 'day')).toEqual({ type: 'START_VOTING' });
    });

    it('returns START_NOMINATION for NOMINATION target', () => {
      expect(phaseToEvent('NOMINATION', 'day')).toEqual({ type: 'START_NOMINATION' });
    });

    it('returns null for SETUP target (only reachable by restart)', () => {
      expect(phaseToEvent('SETUP', 'night')).toBeNull();
      expect(phaseToEvent('SETUP', 'day')).toBeNull();
    });

    it('returns null for unknown target phase', () => {
      expect(phaseToEvent('UNKNOWN' as GamePhase, 'day')).toBeNull();
    });
  });
});
