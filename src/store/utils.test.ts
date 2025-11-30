import { describe, it, expect } from 'vitest';
import { splitGameState, mergeGameState, filterSeatForUser, filterGameStateForUser } from './utils';
import { GameState, Seat } from '../types';

describe('utils', () => {
  const mockSeat: Seat = {
    id: 0,
    userId: 'user1',
    userName: 'Player 1',
    isDead: false,
    hasGhostVote: true,
    roleId: 'washerwoman', // seenRole
    realRoleId: 'drunk',   // realRole
    seenRoleId: 'washerwoman',
    reminders: [],
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
    voteLocked: false,
    isVirtual: false
  };

  const mockGameState: GameState = {
    roomId: 'ABCD',
    currentScriptId: 'tb',
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: false,
    vibrationEnabled: false,
    seats: [mockSeat],
    swapRequests: [],
    messages: [],
    gameOver: { isOver: false, winner: null, reason: '' },
    audio: { trackId: null, isPlaying: false, volume: 0.5 },
    nightQueue: [],
    nightCurrentIndex: -1,
    voting: null,
    customScripts: {},
    customRoles: {},
    voteHistory: [],
    roundInfo: { dayCount: 0, nightCount: 0, nominationCount: 0, totalRounds: 0 },
    storytellerNotes: [{ id: '1', content: 'Secret Note', timestamp: 123, type: 'manual' }],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: []
  };

  describe('splitGameState', () => {
    it('should remove sensitive data from public state', () => {
      const { publicState } = splitGameState(mockGameState);
      expect(publicState.seats![0]!.realRoleId).toBeNull();
      expect(publicState.storytellerNotes).toHaveLength(0);
    });

    it('should preserve sensitive data in secret state', () => {
      const { secretState } = splitGameState(mockGameState);
      expect(secretState.seats![0]!.realRoleId).toBe('drunk');
      expect(secretState.storytellerNotes).toHaveLength(1);
    });
  });

  describe('mergeGameState', () => {
    it('should merge secret state back into public state', () => {
      const { publicState, secretState } = splitGameState(mockGameState);
      const merged = mergeGameState(publicState, secretState);
      expect(merged.seats![0]!.realRoleId).toBe('drunk');
      expect(merged.storytellerNotes).toHaveLength(1);
    });
  });

  describe('filterSeatForUser', () => {
    it('should allow ST to see everything', () => {
      const result = filterSeatForUser(mockSeat, 'st-1', true);
      expect(result).toEqual(mockSeat);
    });

    it('should allow player to see their own seenRole but hide realRole if different', () => {
      const result = filterSeatForUser(mockSeat, 'user1', false);
      
      expect(result.roleId).toBe('washerwoman');
      expect(result.seenRoleId).toBe('washerwoman');
      expect(result.realRoleId).toBeNull();
    });

    it('should hide sensitive info from other players', () => {
      const result = filterSeatForUser(mockSeat, 'user-2', false);
      
      expect(result.roleId).toBeNull();
      expect(result.realRoleId).toBeNull();
      expect(result.seenRoleId).toBeNull();
      expect(result.statuses).toEqual([]);
      expect(result.hasUsedAbility).toBe(false);
    });

    it('should allow Spy to see real roles', () => {
      // Spy viewing another player
      const result = filterSeatForUser(mockSeat, 'spy-user', false, 'spy');
      expect(result.realRoleId).toBe('drunk');
      expect(result.roleId).toBe('washerwoman'); // Spy sees seenRole as roleId
    });
  });

  describe('filterGameStateForUser (Privacy)', () => {
      it('should hide private system messages from other players', () => {
          const stateWithPrivateMsg: GameState = {
              ...mockGameState,
              messages: [
                  {
                      id: '1',
                      senderId: 'system',
                      senderName: 'System',
                      recipientId: 'target-user', // Private message
                      content: 'You are the Demon',
                      timestamp: 123,
                      type: 'system',
                      isPrivate: true
                  }
              ]
          };

          // User who is NOT the recipient
          const filtered = filterGameStateForUser(stateWithPrivateMsg, 'other-user', false);
          expect(filtered.messages).toHaveLength(0);
      });

      it('should show private system messages to the recipient', () => {
        const stateWithPrivateMsg: GameState = {
            ...mockGameState,
            messages: [
                {
                    id: '1',
                    senderId: 'system',
                    senderName: 'System',
                    recipientId: 'target-user', // Private message
                    content: 'You are the Demon',
                    timestamp: 123,
                    type: 'system',
                    isPrivate: true
                }
            ]
        };

        // User who IS the recipient
        const filtered = filterGameStateForUser(stateWithPrivateMsg, 'target-user', false);
        expect(filtered.messages).toHaveLength(1);
    });
  });
});
