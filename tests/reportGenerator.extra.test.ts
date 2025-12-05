import { describe, it, expect } from 'vitest';
import { generateAfterActionReport, formatReportAsText } from '../src/lib/reportGenerator';
import type { GameState, Seat, ChatMessage, VoteRecord } from '../src/types';

const makeSeat = (id: number, overrides: Partial<Seat> = {}): Seat => ({
  id,
  seatIndex: id,
  userId: `u${id}`,
  userName: `玩家${id}`,
  roleId: null,
  realRoleId: null,
  seenRoleId: null,
  isDead: false,
  hasGhostVote: true,
  hasUsedAbility: false,
  statuses: [],
  reminders: [],
  isHandRaised: false,
  isNominated: false,
  ...overrides,
});

const baseGameState = (overrides: Partial<GameState> = {}): GameState => ({
  roomId: 'room-x',
  currentScriptId: 'tb',
  phase: 'DAY',
  setupPhase: 'STARTED',
  rolesRevealed: true,
  allowWhispers: true,
  vibrationEnabled: false,
  seats: [makeSeat(0), makeSeat(1)],
  messages: [],
  gameOver: { isOver: true, winner: 'GOOD', reason: '测试原因' },
  audio: { trackId: null, isPlaying: false, volume: 0.5 },
  nightQueue: [],
  nightCurrentIndex: -1,
  voting: null,
  customScripts: {},
  customRoles: {},
  voteHistory: [],
  roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 1 },
  storytellerNotes: [],
  skillDescriptionMode: 'simple',
  aiMessages: [],
  nightActionRequests: [],
  swapRequests: [],
  candlelightEnabled: false,
  dailyNominations: [],
  interactionLog: [],
  ...overrides,
});

describe('reportGenerator extra coverage', () => {
  it('handles empty vote history and messages gracefully', () => {
    const state = baseGameState();
    const report = generateAfterActionReport(state);
    expect(report.timeline.length).toBe(0);
    expect(report.statistics.totalVotes).toBe(0);
    expect(report.statistics.totalExecutions).toBe(0);
  });

  it('extracts different system events into timeline', () => {
    const now = Date.now();
    const messages: ChatMessage[] = [
      {
        id: 'm1',
        senderId: 'system',
        senderName: '系统',
        recipientId: null,
        type: 'system',
        content: '游戏阶段变更：夜晚',
        timestamp: now - 30,
      },
      {
        id: 'm2',
        senderId: 'system',
        senderName: '系统',
        recipientId: null,
        type: 'system',
        content: '某玩家被处决并死亡',
        timestamp: now - 20,
      },
      {
        id: 'm3',
        senderId: 'system',
        senderName: '系统',
        recipientId: null,
        type: 'system',
        content: '游戏结束，邪恶阵营胜利',
        timestamp: now - 10,
      },
    ];

    const state = baseGameState({ messages });
    const report = generateAfterActionReport(state);

    const types = report.timeline.map((e) => e.type);
    expect(types).toContain('phase_change');
    expect(types).toContain('death');
    expect(types).toContain('game_end');
  });

  it('extracts vote events with different results and metadata', () => {
    const votes: VoteRecord[] = [
      {
        round: 1,
        nominatorSeatId: 0,
        nomineeSeatId: 1,
        votes: [0],
        voteCount: 1,
        timestamp: 1,
        result: 'executed',
      },
      {
        round: 2,
        nominatorSeatId: 1,
        nomineeSeatId: 0,
        votes: [1],
        voteCount: 1,
        timestamp: 2,
        result: 'survived',
      },
      {
        round: 3,
        nominatorSeatId: 0,
        nomineeSeatId: 1,
        votes: [],
        voteCount: 0,
        timestamp: 3,
        result: 'cancelled',
      },
    ];

    const seats = [makeSeat(0), makeSeat(1)];
    const state = baseGameState({ voteHistory: votes, seats });
    const report = generateAfterActionReport(state);

    const voteEvents = report.timeline.filter((e) => e.type === 'vote');
    expect(voteEvents).toHaveLength(3);
    voteEvents.forEach((e, idx) => {
      expect(e.metadata?.result).toBe(votes[idx].result);
      expect(e.metadata?.voteCount).toBe(votes[idx].voteCount);
    });
  });

  it('calculates player summaries including misled and tainted flags', () => {
    const seats = [
      makeSeat(0, {
        realRoleId: 'washerwoman',
        seenRoleId: 'librarian',
        statuses: ['POISONED'],
      }),
      makeSeat(1, {
        realRoleId: 'imp',
        seenRoleId: 'imp',
        statuses: ['DRUNK'],
      }),
    ];

    const state = baseGameState({ seats });
    const report = generateAfterActionReport(state);

    const [p0, p1] = report.playerSummaries;
    expect(p0.wasMisled).toBe(true);
    expect(p0.wasTainted).toBe(true);
    expect(p1.wasMisled).toBe(false);
    expect(p1.wasTainted).toBe(true);
  });

  it('computes statistics for good and evil survivors', () => {
    const seats = [
      makeSeat(0, { realRoleId: 'washerwoman', isDead: false }),
      makeSeat(1, { realRoleId: 'imp', isDead: false }),
    ];
    const state = baseGameState({ seats });
    const report = generateAfterActionReport(state);

    expect(report.statistics.goodSurvivors).toBeGreaterThanOrEqual(1);
    expect(report.statistics.evilSurvivors).toBeGreaterThanOrEqual(1);
  });

  it('returns null MVP when all scores are zero', () => {
    const seats = [
      makeSeat(0, { realRoleId: null, isDead: true }),
      makeSeat(1, { realRoleId: null, isDead: true }),
    ];
    const state = baseGameState({ seats, gameOver: { isOver: true, winner: null, reason: '' } });
    state.roundInfo.totalRounds = 0;
    const report = generateAfterActionReport(state);
    expect(report.mvp).toBeNull();
  });

  it('formats report as readable text with key sections', () => {
    const state = baseGameState();
    const report = generateAfterActionReport(state);
    const text = formatReportAsText(report);

    expect(text).toContain('血染钟楼');
    expect(text).toContain('玩家列表');
    expect(text).toContain('统计数据');
  });
});
