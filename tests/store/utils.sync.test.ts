/**
 * Store Utils Extended Tests
 *
 * Store工具函数扩展测试 - 数据同步和视野过滤
 */

import { describe, it, expect } from 'vitest';
import { splitGameState, mergeGameState, filterSeatForUser, filterGameStateForUser, addSystemMessage } from '../../src/store/utils';
import type { GameState, Seat } from '../../src/types';

// Helper to create a test seat
function createTestSeat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: 1,
    userId: 'user1',
    userName: 'Player 1',
    isDead: false,
    hasGhostVote: true,
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: true,
    statuses: ['POISONED'],
    reminders: [
      { id: 'r1', text: 'Public reminder', sourceRole: 'public', seatId: 0 },
      { id: 'r2', text: 'Secret reminder', sourceRole: 'imp', seatId: 0 }
    ],
    roleId: 'washerwoman',
    realRoleId: 'drunk',
    seenRoleId: 'washerwoman',
    ...overrides
  };
}

// Helper to create a test game state
function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    roomId: 'TEST123',
    currentScriptId: 'tb',
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: true,
    vibrationEnabled: false,
    seats: [
      createTestSeat({ id: 1, userId: 'user1', userName: 'Player 1', realRoleId: 'drunk', seenRoleId: 'washerwoman' }),
      createTestSeat({ id: 2, userId: 'user2', userName: 'Player 2', realRoleId: 'imp', seenRoleId: 'imp' }),
      createTestSeat({ id: 3, userId: 'user3', userName: 'Player 3', realRoleId: 'empath', seenRoleId: 'empath' })
    ],
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
    storytellerNotes: [
      { id: 'note1', content: '玩家1是酒鬼', timestamp: Date.now(), type: 'manual' },
      { id: 'note2', content: '玩家2是恶魔', timestamp: Date.now(), type: 'manual' }
    ],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [
      { id: 'req1', seatId: 1, roleId: 'washerwoman', prompt: '选择目标', status: 'pending' },
      { id: 'req2', seatId: 2, roleId: 'imp', prompt: '选择击杀目标', status: 'pending' }
    ],
    candlelightEnabled: false,
    dailyNominations: [],
    interactionLog: [],
    ...overrides
  } as GameState;
}

describe('splitGameState 进阶测试', () => {
  it('should handle multiple seats with different real roles', () => {
    const gameState = createTestGameState();
    const { publicState, secretState } = splitGameState(gameState);

    // All seats should have realRoleId stripped in public state
    publicState.seats.forEach(seat => {
      expect(seat.realRoleId).toBeNull();
    });

    // Secret state should preserve all real roles
    expect(secretState.seats).toHaveLength(3);
    expect(secretState.seats?.[0]?.realRoleId).toBe('drunk');
    expect(secretState.seats?.[1]?.realRoleId).toBe('imp');
    expect(secretState.seats?.[2]?.realRoleId).toBe('empath');
  });

  it('should handle empty storyteller notes', () => {
    const gameState = createTestGameState({ storytellerNotes: [] });
    const { publicState, secretState } = splitGameState(gameState);

    expect(publicState.storytellerNotes).toHaveLength(0);
    expect(secretState.storytellerNotes).toHaveLength(0);
  });

  it('should preserve other game state properties', () => {
    const gameState = createTestGameState({
      phase: 'NIGHT',
      candlelightEnabled: true,
      voting: { nominatorSeatId: 1, nomineeSeatId: 1, clockHandSeatId: null, votes: [], isOpen: false }
    });
    const { publicState } = splitGameState(gameState);

    expect(publicState.phase).toBe('NIGHT');
    expect(publicState.candlelightEnabled).toBe(true);
    expect(publicState.voting).toEqual({ nominatorSeatId: 1, nomineeSeatId: 1, clockHandSeatId: null, votes: [], isOpen: false });
  });

  it('should not mutate original game state', () => {
    const gameState = createTestGameState();
    const originalRealRoleId = gameState.seats[0]?.realRoleId;

    splitGameState(gameState);

    // Original should not be modified
    expect(gameState.seats[0]?.realRoleId).toBe(originalRealRoleId);
  });
});

describe('mergeGameState 进阶测试', () => {
  it('should handle null secret state', () => {
    const gameState = createTestGameState();
    const { publicState } = splitGameState(gameState);

    // @ts-ignore - testing null handling
    const merged = mergeGameState(publicState, null);
    expect(merged).toEqual(publicState);
  });

  it('should handle empty secret seats array', () => {
    const gameState = createTestGameState();
    const { publicState } = splitGameState(gameState);

    const merged = mergeGameState(publicState, { seats: [] });
    // Should not crash, seats should remain unchanged
    expect(merged.seats).toHaveLength(3);
  });

  it('should handle mismatched seat IDs', () => {
    const gameState = createTestGameState();
    const { publicState } = splitGameState(gameState);

    const merged = mergeGameState(publicState, {
      seats: [{
        id: 999,
        realRoleId: 'unknown',
        seenRoleId: null,
        reminders: [],
        statuses: [],
        hasUsedAbility: false
      }]
    });

    // Should not crash, seat 999 doesn't exist so nothing changes
    expect(merged.seats[0]?.realRoleId).toBeNull();
  });

  it('should merge storyteller notes correctly', () => {
    const gameState = createTestGameState();
    const { publicState } = splitGameState(gameState);

    const newNotes = [
      { id: 'new1', content: 'New note', timestamp: Date.now(), type: 'manual' as const }
    ];

    const merged = mergeGameState(publicState, { storytellerNotes: newNotes });
    expect(merged.storytellerNotes).toHaveLength(1);
    expect(merged.storytellerNotes[0]?.content).toBe('New note');
  });

  it('should preserve all data after round-trip', () => {
    const gameState = createTestGameState({
      messages: [
        { id: 'm1', senderId: 'user1', senderName: 'P1', content: 'Hello', timestamp: Date.now(), type: 'chat', recipientId: null }
      ],
      voteHistory: [{ round: 1, nominatorSeatId: 1, nomineeSeatId: 2, votes: [1, 3, 4], voteCount: 3, timestamp: Date.now(), result: 'executed' }]
    });

    const { publicState, secretState } = splitGameState(gameState);
    const merged = mergeGameState(publicState, secretState);

    // Verify data integrity
    expect(merged.seats[0]?.realRoleId).toBe('drunk');
    expect(merged.storytellerNotes).toHaveLength(2);
    // Messages are synced via game_messages, not stored in game state
    expect(merged.messages).toHaveLength(0);
    expect(merged.voteHistory).toHaveLength(1);
  });
});

describe('filterSeatForUser 进阶测试', () => {
  it('should filter statuses for other players', () => {
    const seat = createTestSeat({ statuses: ['POISONED', 'DRUNK'] });
    const filtered = filterSeatForUser(seat, 'other-user', false);

    expect(filtered.statuses).toEqual([]);
  });

  it('should filter reminders by source role', () => {
    const seat = createTestSeat({
      reminders: [
        { id: 'r1', text: 'Public', sourceRole: 'public', seatId: 0 },
        { id: 'r2', text: 'Private', sourceRole: 'imp', seatId: 0 }
      ]
    });

    const filtered = filterSeatForUser(seat, 'other-user', false);

    // Only public reminders should be visible
    expect(filtered.reminders).toHaveLength(1);
    expect(filtered.reminders[0]?.text).toBe('Public');
  });

  it('should hide hasUsedAbility for other players', () => {
    const seat = createTestSeat({ hasUsedAbility: true });
    const filtered = filterSeatForUser(seat, 'other-user', false);

    expect(filtered.hasUsedAbility).toBe(false);
  });

  it('should allow player to see their own statuses', () => {
    const seat = createTestSeat({ userId: 'user1', statuses: ['POISONED'] });
    const filtered = filterSeatForUser(seat, 'user1', false);

    // Player can see their own statuses
    expect(filtered.statuses).toContain('POISONED');
  });

  it('should show spy the realRoleId of other players', () => {
    const seat = createTestSeat({ userId: 'target', realRoleId: 'imp', seenRoleId: 'empath' });
    const filtered = filterSeatForUser(seat, 'spy-user', false, 'spy');

    expect(filtered.realRoleId).toBe('imp');
    expect(filtered.roleId).toBe('empath'); // seenRoleId shown as roleId
  });
});

describe('filterGameStateForUser 进阶测试', () => {
  it('should filter all seats for non-storyteller', () => {
    const gameState = createTestGameState();
    const filtered = filterGameStateForUser(gameState, 'user1', false);

    // User1 should see their own role
    const user1Seat = filtered.seats.find(s => s.userId === 'user1');
    expect(user1Seat?.roleId).toBe('washerwoman');
    expect(user1Seat?.realRoleId).toBeNull();

    // Other seats should be hidden
    const user2Seat = filtered.seats.find(s => s.userId === 'user2');
    expect(user2Seat?.roleId).toBeNull();
    expect(user2Seat?.realRoleId).toBeNull();
  });

  it('should filter night action requests for players', () => {
    const gameState = createTestGameState();
    const filtered = filterGameStateForUser(gameState, 'user1', false);

    // Player should only see their own night action requests
    // Note: user1 is seat 1
    const seatId = gameState.seats.find(s => s.userId === 'user1')?.id;
    const visibleRequests = filtered.nightActionRequests.filter(r => r.seatId === seatId);
    expect(filtered.nightActionRequests).toEqual(visibleRequests);
  });

  it('should show all night action requests to storyteller', () => {
    const gameState = createTestGameState();
    const filtered = filterGameStateForUser(gameState, 'st-id', true);

    expect(filtered.nightActionRequests).toHaveLength(2);
  });

  it('should filter private messages correctly', () => {
    const gameState = createTestGameState({
      messages: [
        { id: 'm1', senderId: 'system', senderName: 'System', recipientId: 'user1', content: 'Private to user1', timestamp: Date.now(), type: 'system', isPrivate: true },
        { id: 'm2', senderId: 'system', senderName: 'System', recipientId: 'user2', content: 'Private to user2', timestamp: Date.now(), type: 'system', isPrivate: true },
        { id: 'm3', senderId: 'system', senderName: 'System', recipientId: null, content: 'Public message', timestamp: Date.now(), type: 'system' }
      ]
    });

    const filtered = filterGameStateForUser(gameState, 'user1', false);

    expect(filtered.messages).toHaveLength(2); // Their private message + public message
    expect(filtered.messages.some(m => m.content === 'Private to user1')).toBe(true);
    expect(filtered.messages.some(m => m.content === 'Public message')).toBe(true);
    expect(filtered.messages.some(m => m.content === 'Private to user2')).toBe(false);
  });

  it('should show all messages to storyteller', () => {
    const gameState = createTestGameState({
      messages: [
        { id: 'm1', senderId: 'system', senderName: 'System', recipientId: 'user1', content: 'Private', timestamp: Date.now(), type: 'system', isPrivate: true },
        { id: 'm2', senderId: 'system', senderName: 'System', recipientId: null, content: 'Public', timestamp: Date.now(), type: 'system' }
      ]
    });

    const filtered = filterGameStateForUser(gameState, 'st-id', true);
    expect(filtered.messages).toHaveLength(2);
  });

  it('should allow sender to see their own private messages', () => {
    const gameState = createTestGameState({
      messages: [
        { id: 'm1', senderId: 'user1', senderName: 'P1', recipientId: 'user2', content: 'DM to user2', timestamp: Date.now(), type: 'chat', isPrivate: true }
      ]
    });

    const filtered = filterGameStateForUser(gameState, 'user1', false);
    expect(filtered.messages).toHaveLength(1);
  });
});

describe('addSystemMessage', () => {
  it('should add system message to game state', () => {
    const gameState = createTestGameState({ messages: [] });
    addSystemMessage(gameState, '游戏开始！');

    expect(gameState.messages).toHaveLength(1);
    expect(gameState.messages[0]?.content).toBe('游戏开始！');
    expect(gameState.messages[0]?.type).toBe('system');
    expect(gameState.messages[0]?.senderId).toBe('system');
    expect(gameState.messages[0]?.senderName).toBe('系统');
    expect(gameState.messages[0]?.isPrivate).toBe(false);
  });

  it('should add private system message', () => {
    const gameState = createTestGameState({ messages: [] });
    addSystemMessage(gameState, '你是恶魔！', 'target-user');

    expect(gameState.messages).toHaveLength(1);
    expect(gameState.messages[0]?.recipientId).toBe('target-user');
    expect(gameState.messages[0]?.isPrivate).toBe(true);
  });

  it('should generate unique message IDs', () => {
    const gameState = createTestGameState({ messages: [] });
    addSystemMessage(gameState, 'Message 1');
    addSystemMessage(gameState, 'Message 2');

    expect(gameState.messages).toHaveLength(2);
    expect(gameState.messages[0]?.id).not.toBe(gameState.messages[1]?.id);
  });

  it('should include timestamp', () => {
    const gameState = createTestGameState({ messages: [] });
    const before = Date.now();
    addSystemMessage(gameState, 'Test');
    const after = Date.now();

    const timestamp = gameState.messages[0]?.timestamp;
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});
