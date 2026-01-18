/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AIChronicler } from './chronicler';
import type { GameState, Seat } from '../types';

// 创建测试用的座位数据
function createTestSeat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: 0,
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

// 创建测试用的游戏状态
function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    roomId: 'test-room-id',
    currentScriptId: 'tb',
    phase: 'DAY',
    setupPhase: 'STARTED',
    rolesRevealed: true,
    allowWhispers: true,
    vibrationEnabled: false,
    seats: [],
    swapRequests: [],
    messages: [],
    gameOver: { isOver: false, winner: null, reason: '' },
    audio: { trackId: null, isPlaying: false, volume: 0.5 },
    nightQueue: [],
    nightCurrentIndex: 0,
    voting: null,
    customScripts: {},
    customRoles: {},
    voteHistory: [],
    roundInfo: {
      dayCount: 1,
      nightCount: 1,
      nominationCount: 0,
      totalRounds: 0
    },
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [],
    candlelightEnabled: false,
    dailyNominations: [],
    interactionLog: [],
    ...overrides
  };
}

describe('AIChronicler', () => {
  let chronicler: AIChronicler;

  beforeEach(() => {
    chronicler = new AIChronicler();
  });

  describe('recordGameStart', () => {
    it('records game start event', () => {
      chronicler.recordGameStart(8, '暗流涌动');
      const events = chronicler.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('game_start');
      expect(events[0]!.details).toContain('8名玩家');
      expect(events[0]!.details).toContain('暗流涌动');
    });
  });

  describe('recordPhaseChange', () => {
    it('records day phase change', () => {
      chronicler.recordPhaseChange('DAY', 1);
      const events = chronicler.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('phase_change');
      expect(events[0]!.details).toContain('白天');
    });

    it('records night phase change', () => {
      chronicler.recordPhaseChange('NIGHT', 2);
      const events = chronicler.getEvents();
      expect(events[0]!.details).toContain('夜晚');
      expect(events[0]!.details).toContain('第2轮');
    });
  });

  describe('recordNomination', () => {
    it('records nomination event', () => {
      chronicler.recordNomination(1, 3, '玩家A', '玩家C');
      const events = chronicler.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('nomination');
      expect(events[0]!.actor).toBe(1);
      expect(events[0]!.target).toBe(3);
    });
  });

  describe('recordVoteCast', () => {
    it('records regular vote cast', () => {
      chronicler.recordVoteCast(1, 3, '玩家A', false);
      const events = chronicler.getEvents();
      expect(events[0]!.type).toBe('vote_cast');
      expect(events[0]!.details).toContain('赞成票');
    });

    it('records ghost vote', () => {
      chronicler.recordVoteCast(2, 3, '玩家B', true);
      const events = chronicler.getEvents();
      expect(events[0]!.details).toContain('幽灵');
    });
  });

  describe('recordVoteResult', () => {
    it('records execution result', () => {
      chronicler.recordVoteResult(3, '玩家C', 5, 4, 'executed');
      const events = chronicler.getEvents();
      expect(events[0]!.type).toBe('vote_end');
      expect(events[0]!.details).toContain('被处决');
    });

    it('records survival result', () => {
      chronicler.recordVoteResult(3, '玩家C', 2, 4, 'survived');
      const events = chronicler.getEvents();
      expect(events[0]!.details).toContain('幸存');
    });
  });

  describe('recordExecution', () => {
    it('records execution event', () => {
      chronicler.recordExecution(5, '玩家E', '小鬼');
      const events = chronicler.getEvents();
      expect(events[0]!.type).toBe('execution');
      expect(events[0]!.target).toBe(5);
      expect(events[0]!.details).toContain('被处决');
    });
  });

  describe('recordDeath', () => {
    it('records death event', () => {
      chronicler.recordDeath(5, '玩家E', '被恶魔杀死');
      const events = chronicler.getEvents();
      expect(events[0]!.type).toBe('death');
      expect(events[0]!.target).toBe(5);
    });

    it('records death with role', () => {
      chronicler.recordDeath(5, '玩家E', '被杀', '洗衣妇');
      const events = chronicler.getEvents();
      expect(events[0]!.details).toContain('洗衣妇');
    });
  });

  describe('recordAbilityUse', () => {
    it('records ability use with targets', () => {
      chronicler.recordAbilityUse(2, '占卜', [3, 4], '查验结果');
      const events = chronicler.getEvents();
      expect(events[0]!.type).toBe('ability_use');
      expect(events[0]!.targets).toEqual([3, 4]);
    });

    it('records ability use without targets', () => {
      chronicler.recordAbilityUse(2, '自爆');
      const events = chronicler.getEvents();
      expect(events[0]!.type).toBe('ability_use');
    });
  });

  describe('recordInfoReveal', () => {
    it('records info reveal event', () => {
      chronicler.recordInfoReveal(1, '你是好人');
      const events = chronicler.getEvents();
      expect(events[0]!.type).toBe('info_reveal');
      expect(events[0]!.details).toContain('获得信息');
    });
  });

  describe('recordWhisper', () => {
    it('records whisper event', () => {
      chronicler.recordWhisper(1, 3);
      const events = chronicler.getEvents();
      expect(events[0]!.type).toBe('whisper');
      expect(events[0]!.actor).toBe(1);
      expect(events[0]!.target).toBe(3);
    });
  });

  describe('recordGameEnd', () => {
    it('records game end for good', () => {
      chronicler.recordGameEnd('GOOD', '恶魔被处决');
      const events = chronicler.getEvents();
      expect(events[0]!.type).toBe('game_end');
      expect(events[0]!.details).toContain('善良阵营');
    });

    it('records game end for evil', () => {
      chronicler.recordGameEnd('EVIL', '仅剩2人存活');
      const events = chronicler.getEvents();
      expect(events[0]!.details).toContain('邪恶阵营');
    });
  });

  describe('getEvents', () => {
    it('returns all recorded events', () => {
      chronicler.recordGameStart(5, '测试');
      chronicler.recordPhaseChange('DAY', 1);
      expect(chronicler.getEvents()).toHaveLength(2);
    });
  });

  describe('generateNarrative', () => {
    it('generates narrative segments', () => {
      chronicler.recordGameStart(5, '测试');
      chronicler.recordPhaseChange('DAY', 1);
      chronicler.recordNomination(1, 2, 'A', 'B');
      const narrative = chronicler.generateNarrative();
      expect(narrative).toBeDefined();
      expect(Array.isArray(narrative)).toBe(true);
    });

    it('calculates tension based on deaths', () => {
      chronicler.recordPhaseChange('DAY', 1);
      chronicler.recordDeath(1, 'A', '被杀');
      chronicler.recordDeath(2, 'B', '被杀');
      const narrative = chronicler.generateNarrative();
      expect(narrative[0]!.tension).toBeGreaterThan(0);
    });
  });

  describe('getCurrentContext', () => {
    it('returns current game context string', () => {
      chronicler.recordGameStart(5, '测试');
      const context = chronicler.getCurrentContext();
      expect(typeof context).toBe('string');
      expect(context.length).toBeGreaterThan(0);
    });
  });

  describe('getKeyMoments', () => {
    it('returns key moments from events', () => {
      chronicler.recordGameStart(5, '测试');
      chronicler.recordExecution(1, '玩家A', '小鬼');
      chronicler.recordGameEnd('GOOD', '胜利');
      const keyMoments = chronicler.getKeyMoments();
      expect(keyMoments.length).toBeGreaterThan(0);
    });
  });

  describe('getChronicle', () => {
    it('returns full chronicle record', () => {
      chronicler.recordGameStart(5, '测试');
      const chronicle = chronicler.getChronicle('game-123');
      expect(chronicle.gameId).toBe('game-123');
      expect(chronicle.events).toHaveLength(1);
      expect(chronicle.narrative).toBeDefined();
      expect(chronicle.currentContext).toBeDefined();
    });
  });

  describe('reset', () => {
    it('clears all events', () => {
      chronicler.recordGameStart(5, '测试');
      chronicler.reset();
      expect(chronicler.getEvents()).toHaveLength(0);
    });
  });

  describe('syncFromGameState', () => {
    it('syncs vote history from game state', () => {
      const gameState = createTestGameState({
        seats: [
          createTestSeat({ id: 0, userName: '玩家A', isDead: false }),
          createTestSeat({ id: 1, userName: '玩家B', isDead: false }),
        ],
        voteHistory: [
          {
            nomineeSeatId: 1,
            nominatorSeatId: 0,
            timestamp: Date.now(),
            round: 1,
            votes: [0, 2, 3, 4, 5],
            voteCount: 5,
            result: 'executed',
          },
        ],
      });

      chronicler.syncFromGameState(gameState);
      const events = chronicler.getEvents();
      expect(events.some(e => e.type === 'vote_end')).toBe(true);
    });

    it('syncs death information from game state', () => {
      const gameState = createTestGameState({
        seats: [
          createTestSeat({ id: 0, userName: '玩家A', isDead: true, realRoleId: 'washerwoman' }),
        ],
        voteHistory: [],
      });

      chronicler.syncFromGameState(gameState);
      const events = chronicler.getEvents();
      expect(events.some(e => e.type === 'death')).toBe(true);
    });

    it('does not duplicate existing events', () => {
      const gameState = createTestGameState({
        seats: [
          createTestSeat({ id: 0, userName: '玩家A', isDead: false }),
          createTestSeat({ id: 1, userName: '玩家B', isDead: false }),
        ],
        voteHistory: [
          {
            nomineeSeatId: 1,
            nominatorSeatId: 0,
            timestamp: Date.now(),
            round: 1,
            votes: [0, 2, 3, 4, 5],
            voteCount: 5,
            result: 'executed',
          },
        ],
      });

      chronicler.syncFromGameState(gameState);
      chronicler.syncFromGameState(gameState);
      const voteEvents = chronicler.getEvents().filter(e => e.type === 'vote_end');
      expect(voteEvents.length).toBe(1);
    });
  });
});
