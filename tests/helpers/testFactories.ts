/**
 * Test Factories - 测试辅助函数
 *
 * 创建符合当前类型定义的测试数据
 */

import type { GameState, Seat, Reminder, RoundInfo, SeatStatus, ChatMessage, StorytellerNote } from '../../src/types';

/**
 * 创建测试用的座位数据
 */
export function createTestSeat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: 1,
    userId: null,
    userName: '',
    isDead: false,
    hasGhostVote: true,
    roleId: null,
    realRoleId: null,
    seenRoleId: null,
    reminders: [],
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
    ...overrides
  };
}

/**
 * 创建测试用的提醒数据
 */
export function createTestReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 'reminder-1',
    text: 'Test reminder',
    sourceRole: 'washerwoman',
    seatId: 1,
    ...overrides
  };
}

/**
 * 创建测试用的轮次信息
 */
export function createTestRoundInfo(overrides: Partial<RoundInfo> = {}): RoundInfo {
  return {
    dayCount: 0,
    nightCount: 0,
    nominationCount: 0,
    totalRounds: 0,
    ...overrides
  };
}

/**
 * 创建测试用的聊天消息
 */
export function createTestChatMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'msg-1',
    senderId: 'user-1',
    senderName: 'Test User',
    recipientId: null,
    content: 'Test message',
    timestamp: Date.now(),
    type: 'chat',
    ...overrides
  };
}

/**
 * 创建测试用的说书人笔记
 */
export function createTestStorytellerNote(overrides: Partial<StorytellerNote> = {}): StorytellerNote {
  return {
    id: 'note-1',
    content: 'Test note',
    timestamp: Date.now(),
    type: 'manual',
    ...overrides
  };
}

/**
 * 创建测试用的游戏状态
 */
export function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    roomId: 'TEST123',
    currentScriptId: 'tb',
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: true,
    vibrationEnabled: false,
    seats: [],
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
    roundInfo: createTestRoundInfo(),
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [],
    candlelightEnabled: false,
    dailyExecutionCompleted: false,
    dailyNominations: [],
    interactionLog: [],
    ...overrides
  };
}

/**
 * 创建带有多个座位的测试游戏状态
 */
export function createTestGameStateWithSeats(
  seatCount: number,
  overrides: Partial<GameState> = {}
): GameState {
  const seats: Seat[] = Array.from({ length: seatCount }, (_, i) =>
    createTestSeat({
      id: i,
      userId: `user-${i}`,
      userName: `Player ${i + 1}`
    })
  );
  return createTestGameState({ seats, ...overrides });
}

/**
 * 辅助类型 - 座位状态
 */
export const TEST_SEAT_STATUSES: SeatStatus[] = ['POISONED', 'DRUNK', 'PROTECTED', 'MADNESS'];
