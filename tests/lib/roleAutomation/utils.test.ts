/**
 * Role Automation Utils Tests
 *
 * 角色自动化工具函数测试
 */

import { describe, it, expect } from 'vitest';
import {
  isTainted,
  isProtected,
  getRealRoleId,
  getSeenRoleId,
  isEvil,
  getTeamFromRoleId,
  getAlivePlayers,
  getDeadPlayers,
  getNeighbors,
  getAliveNeighbors,
  countEvilPairs,
  findDemon,
  findMinions,
  findRoleSeats,
  getRandomSeat,
  getRandomSeatByTeam,
  generateId,
  applyStatusChange,
  clearNightStatuses,
  formatSeatName,
  formatRoleName,
  isInfoRole,
  hasNightAction
} from '../../../src/lib/roleAutomation/utils';
import type { GameState, Seat } from '../../../src/types';

// 创建测试座位
function createTestSeat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: 0,
    index: 0,
    isEmpty: false,
    isDead: false,
    hasGhostVote: true,
    isNominated: false,
    isNominatedBy: null,
    markedForDeath: false,
    statuses: [],
    hasUsedAbility: false,
    notes: [],
    reminders: [],
    nightReminders: [],
    causeOfDeath: null,
    userId: 'user1',
    userName: 'Player1',
    roleId: null,
    realRoleId: null,
    seenRoleId: null,
    ...overrides
  };
}

// 创建测试游戏状态
function createTestGameState(seats: Seat[]): GameState {
  return {
    seats,
    phase: 'NIGHT',
    voting: null,
    currentScriptId: 'tb',
    messages: [],
    roundInfo: { dayCount: 1, nightCount: 1 },
    voteHistory: [],
    storytellerNotes: [],
    audio: { trackId: null, isPlaying: false, volume: 0.5 },
    allowWhispers: false,
    customScripts: {},
    customRoles: {},
    swapRequests: [],
    vibrationEnabled: true,
    nightQueue: [],
    setupPhase: 'READY',
    rolesRevealed: false
  } as GameState;
}

describe('isTainted', () => {
  it('should return true for POISONED status', () => {
    const seat = createTestSeat({ statuses: ['POISONED'] });
    expect(isTainted(seat)).toBe(true);
  });

  it('should return true for DRUNK status', () => {
    const seat = createTestSeat({ statuses: ['DRUNK'] });
    expect(isTainted(seat)).toBe(true);
  });

  it('should return false for no tainted status', () => {
    const seat = createTestSeat({ statuses: ['PROTECTED'] });
    expect(isTainted(seat)).toBe(false);
  });

  it('should return false for empty statuses', () => {
    const seat = createTestSeat({ statuses: [] });
    expect(isTainted(seat)).toBe(false);
  });
});

describe('isProtected', () => {
  it('should return true for PROTECTED status', () => {
    const seat = createTestSeat({ statuses: ['PROTECTED'] });
    expect(isProtected(seat)).toBe(true);
  });

  it('should return false for no protected status', () => {
    const seat = createTestSeat({ statuses: ['POISONED'] });
    expect(isProtected(seat)).toBe(false);
  });
});

describe('getRealRoleId', () => {
  it('should return realRoleId when available', () => {
    const seat = createTestSeat({ realRoleId: 'drunk', roleId: 'washerwoman' });
    expect(getRealRoleId(seat)).toBe('drunk');
  });

  it('should fallback to roleId when realRoleId is null', () => {
    const seat = createTestSeat({ realRoleId: null, roleId: 'washerwoman' });
    expect(getRealRoleId(seat)).toBe('washerwoman');
  });

  it('should return null when both are null', () => {
    const seat = createTestSeat({ realRoleId: null, roleId: null });
    expect(getRealRoleId(seat)).toBe(null);
  });
});

describe('getSeenRoleId', () => {
  it('should return seenRoleId when available', () => {
    const seat = createTestSeat({ seenRoleId: 'washerwoman', roleId: 'drunk' });
    expect(getSeenRoleId(seat)).toBe('washerwoman');
  });

  it('should fallback to roleId when seenRoleId is null', () => {
    const seat = createTestSeat({ seenRoleId: null, roleId: 'monk' });
    expect(getSeenRoleId(seat)).toBe('monk');
  });
});

describe('getTeamFromRoleId', () => {
  it('should return DEMON for imp', () => {
    expect(getTeamFromRoleId('imp')).toBe('DEMON');
  });

  it('should return DEMON for other demons', () => {
    expect(getTeamFromRoleId('po')).toBe('DEMON');
    expect(getTeamFromRoleId('vortox')).toBe('DEMON');
    expect(getTeamFromRoleId('vigormortis')).toBe('DEMON');
    expect(getTeamFromRoleId('no_dashii')).toBe('DEMON');
    expect(getTeamFromRoleId('fang_gu')).toBe('DEMON');
    expect(getTeamFromRoleId('zombuul')).toBe('DEMON');
  });

  it('should return MINION for minion roles', () => {
    expect(getTeamFromRoleId('poisoner')).toBe('MINION');
    expect(getTeamFromRoleId('spy')).toBe('MINION');
    expect(getTeamFromRoleId('scarlet_woman')).toBe('MINION');
    expect(getTeamFromRoleId('baron')).toBe('MINION');
    expect(getTeamFromRoleId('godfather')).toBe('MINION');
    expect(getTeamFromRoleId('devil_advocate')).toBe('MINION');
    expect(getTeamFromRoleId('assassin')).toBe('MINION');
    expect(getTeamFromRoleId('mastermind')).toBe('MINION');
  });

  it('should return OUTSIDER for outsider roles', () => {
    expect(getTeamFromRoleId('butler')).toBe('OUTSIDER');
    expect(getTeamFromRoleId('drunk')).toBe('OUTSIDER');
    expect(getTeamFromRoleId('recluse')).toBe('OUTSIDER');
    expect(getTeamFromRoleId('saint')).toBe('OUTSIDER');
    expect(getTeamFromRoleId('tinker')).toBe('OUTSIDER');
    expect(getTeamFromRoleId('moonchild')).toBe('OUTSIDER');
    expect(getTeamFromRoleId('goon')).toBe('OUTSIDER');
    expect(getTeamFromRoleId('lunatic')).toBe('OUTSIDER');
  });

  it('should return TOWNSFOLK for townsfolk roles', () => {
    expect(getTeamFromRoleId('washerwoman')).toBe('TOWNSFOLK');
    expect(getTeamFromRoleId('monk')).toBe('TOWNSFOLK');
    expect(getTeamFromRoleId('chef')).toBe('TOWNSFOLK');
    expect(getTeamFromRoleId('empath')).toBe('TOWNSFOLK');
  });

  it('should return TOWNSFOLK for unknown roles', () => {
    expect(getTeamFromRoleId('unknown_role')).toBe('TOWNSFOLK');
  });
});

describe('isEvil', () => {
  it('should return true for demon roles', () => {
    const seat = createTestSeat({ realRoleId: 'imp' });
    const gameState = createTestGameState([seat]);
    expect(isEvil(seat, gameState)).toBe(true);
  });

  it('should return true for minion roles', () => {
    const seat = createTestSeat({ realRoleId: 'poisoner' });
    const gameState = createTestGameState([seat]);
    expect(isEvil(seat, gameState)).toBe(true);
  });

  it('should return false for townsfolk roles', () => {
    const seat = createTestSeat({ realRoleId: 'washerwoman' });
    const gameState = createTestGameState([seat]);
    expect(isEvil(seat, gameState)).toBe(false);
  });

  it('should return false for outsider roles', () => {
    const seat = createTestSeat({ realRoleId: 'drunk' });
    const gameState = createTestGameState([seat]);
    expect(isEvil(seat, gameState)).toBe(false);
  });

  it('should return false for seat without roleId', () => {
    const seat = createTestSeat({ realRoleId: null, roleId: null });
    const gameState = createTestGameState([seat]);
    expect(isEvil(seat, gameState)).toBe(false);
  });
});

describe('getAlivePlayers', () => {
  it('should return only alive players with userId', () => {
    const seats = [
      createTestSeat({ id: 0, isDead: false, userId: 'user1' }),
      createTestSeat({ id: 1, isDead: true, userId: 'user2' }),
      createTestSeat({ id: 2, isDead: false, userId: null }),
      createTestSeat({ id: 3, isDead: false, userId: 'user3' })
    ];
    const gameState = createTestGameState(seats);
    const alive = getAlivePlayers(gameState);

    expect(alive.length).toBe(2);
    expect(alive.map(s => s.id)).toEqual([0, 3]);
  });
});

describe('getDeadPlayers', () => {
  it('should return only dead players with userId', () => {
    const seats = [
      createTestSeat({ id: 0, isDead: false, userId: 'user1' }),
      createTestSeat({ id: 1, isDead: true, userId: 'user2' }),
      createTestSeat({ id: 2, isDead: true, userId: null }),
      createTestSeat({ id: 3, isDead: true, userId: 'user3' })
    ];
    const gameState = createTestGameState(seats);
    const dead = getDeadPlayers(gameState);

    expect(dead.length).toBe(2);
    expect(dead.map(s => s.id)).toEqual([1, 3]);
  });
});

describe('getNeighbors', () => {
  it('should return correct neighbors', () => {
    const seats = [
      createTestSeat({ id: 0 }),
      createTestSeat({ id: 1 }),
      createTestSeat({ id: 2 })
    ];
    const [left, right] = getNeighbors(1, seats);

    expect(left?.id).toBe(0);
    expect(right?.id).toBe(2);
  });

  it('should wrap around for first seat', () => {
    const seats = [
      createTestSeat({ id: 0 }),
      createTestSeat({ id: 1 }),
      createTestSeat({ id: 2 })
    ];
    const [left, right] = getNeighbors(0, seats);

    expect(left?.id).toBe(2);
    expect(right?.id).toBe(1);
  });

  it('should wrap around for last seat', () => {
    const seats = [
      createTestSeat({ id: 0 }),
      createTestSeat({ id: 1 }),
      createTestSeat({ id: 2 })
    ];
    const [left, right] = getNeighbors(2, seats);

    expect(left?.id).toBe(1);
    expect(right?.id).toBe(0);
  });

  it('should return null for empty seats array', () => {
    const [left, right] = getNeighbors(0, []);

    expect(left).toBe(null);
    expect(right).toBe(null);
  });
});

describe('getAliveNeighbors', () => {
  it('should skip dead players', () => {
    const seats = [
      createTestSeat({ id: 0, isDead: false, userId: 'user0' }),
      createTestSeat({ id: 1, isDead: true, userId: 'user1' }),
      createTestSeat({ id: 2, isDead: false, userId: 'user2' }),
      createTestSeat({ id: 3, isDead: true, userId: 'user3' }),
      createTestSeat({ id: 4, isDead: false, userId: 'user4' })
    ];
    const [left, right] = getAliveNeighbors(2, seats);

    expect(left?.id).toBe(0);
    expect(right?.id).toBe(4);
  });

  it('should skip seats without userId', () => {
    const seats = [
      createTestSeat({ id: 0, isDead: false, userId: 'user0' }),
      createTestSeat({ id: 1, isDead: false, userId: null }),
      createTestSeat({ id: 2, isDead: false, userId: 'user2' }),
      createTestSeat({ id: 3, isDead: false, userId: null }),
      createTestSeat({ id: 4, isDead: false, userId: 'user4' })
    ];
    const [left, right] = getAliveNeighbors(2, seats);

    expect(left?.id).toBe(0);
    expect(right?.id).toBe(4);
  });

  it('should return null for empty seats array', () => {
    const [left, right] = getAliveNeighbors(0, []);

    expect(left).toBe(null);
    expect(right).toBe(null);
  });

  it('should return null if no alive neighbors', () => {
    const seats = [
      createTestSeat({ id: 0, isDead: true, userId: 'user0' }),
      createTestSeat({ id: 1, isDead: false, userId: 'user1' }),
      createTestSeat({ id: 2, isDead: true, userId: 'user2' })
    ];
    const [left, right] = getAliveNeighbors(1, seats);

    expect(left).toBe(null);
    expect(right).toBe(null);
  });
});

describe('countEvilPairs', () => {
  it('should count adjacent evil pairs', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'poisoner', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'washerwoman', userId: 'user2' }),
      createTestSeat({ id: 3, realRoleId: 'spy', userId: 'user3' })
    ];
    const gameState = createTestGameState(seats);
    const count = countEvilPairs(gameState);

    // imp-poisoner is a pair, spy-imp wraps around
    expect(count).toBe(2);
  });

  it('should return 0 for no evil pairs', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'washerwoman', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const count = countEvilPairs(gameState);

    expect(count).toBe(0);
  });

  it('should skip dead players', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'poisoner', userId: 'user1', isDead: true }),
      createTestSeat({ id: 2, realRoleId: 'spy', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const count = countEvilPairs(gameState);

    // dead player breaks the chain
    expect(count).toBe(1); // spy-imp wraps around
  });
});

describe('findDemon', () => {
  it('should find alive demon', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'washerwoman', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const demon = findDemon(gameState);

    expect(demon?.id).toBe(1);
  });

  it('should return null for dead demon', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'washerwoman', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1', isDead: true })
    ];
    const gameState = createTestGameState(seats);
    const demon = findDemon(gameState);

    expect(demon).toBe(null);
  });

  it('should return null when no demon', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'washerwoman', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const demon = findDemon(gameState);

    expect(demon).toBe(null);
  });
});

describe('findMinions', () => {
  it('should find all alive minions', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'poisoner', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'spy', userId: 'user2' }),
      createTestSeat({ id: 3, realRoleId: 'scarlet_woman', userId: 'user3', isDead: true })
    ];
    const gameState = createTestGameState(seats);
    const minions = findMinions(gameState);

    expect(minions.length).toBe(2);
    expect(minions.map(s => s.id)).toEqual([0, 2]);
  });
});

describe('findRoleSeats', () => {
  it('should find seats with specific role', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'washerwoman', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'washerwoman', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const found = findRoleSeats(gameState, 'washerwoman');

    expect(found.length).toBe(2);
    expect(found.map(s => s.id)).toEqual([0, 2]);
  });
});

describe('getRandomSeat', () => {
  it('should return a seat from available seats', () => {
    const seats = [
      createTestSeat({ id: 0, userId: 'user0' }),
      createTestSeat({ id: 1, userId: 'user1' }),
      createTestSeat({ id: 2, userId: 'user2' })
    ];
    const seat = getRandomSeat(seats);

    expect(seat).not.toBe(null);
    expect([0, 1, 2]).toContain(seat?.id);
  });

  it('should exclude specified seats', () => {
    const seats = [
      createTestSeat({ id: 0, userId: 'user0' }),
      createTestSeat({ id: 1, userId: 'user1' }),
      createTestSeat({ id: 2, userId: 'user2' })
    ];
    const seat = getRandomSeat(seats, [0, 1]);

    expect(seat?.id).toBe(2);
  });

  it('should return null for empty available seats', () => {
    const seats = [
      createTestSeat({ id: 0, userId: null }),
      createTestSeat({ id: 1, isDead: true, userId: 'user1' })
    ];
    const seat = getRandomSeat(seats);

    expect(seat).toBe(null);
  });
});

describe('getRandomSeatByTeam', () => {
  it('should return seat of specified team', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'washerwoman', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const seat = getRandomSeatByTeam(gameState, 'TOWNSFOLK');

    expect(seat).not.toBe(null);
    expect([1, 2]).toContain(seat?.id);
  });

  it('should return null when no seats of team available', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'washerwoman', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const seat = getRandomSeatByTeam(gameState, 'DEMON');

    expect(seat).toBe(null);
  });

  it('should exclude specified seats', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'washerwoman', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const seat = getRandomSeatByTeam(gameState, 'TOWNSFOLK', [0]);

    expect(seat?.id).toBe(1);
  });
});

describe('generateId', () => {
  it('should generate unique ids', () => {
    const id1 = generateId();
    const id2 = generateId();

    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(0);
  });
});

describe('applyStatusChange', () => {
  it('should add status to seat', () => {
    const seats = [
      createTestSeat({ id: 0, statuses: [] }),
      createTestSeat({ id: 1, statuses: [] })
    ];
    const updated = applyStatusChange(seats, {
      seatId: 0,
      status: 'PROTECTED',
      action: 'add',
      source: 'monk'
    });

    expect(updated[0].statuses).toContain('PROTECTED');
    expect(updated[1].statuses.length).toBe(0);
  });

  it('should remove status from seat', () => {
    const seats = [
      createTestSeat({ id: 0, statuses: ['POISONED', 'PROTECTED'] })
    ];
    const updated = applyStatusChange(seats, {
      seatId: 0,
      status: 'POISONED',
      action: 'remove',
      source: 'system'
    });

    expect(updated[0].statuses).not.toContain('POISONED');
    expect(updated[0].statuses).toContain('PROTECTED');
  });
});

describe('clearNightStatuses', () => {
  it('should remove PROTECTED status', () => {
    const seats = [
      createTestSeat({ id: 0, statuses: ['PROTECTED', 'POISONED'] }),
      createTestSeat({ id: 1, statuses: ['PROTECTED'] })
    ];
    const updated = clearNightStatuses(seats);

    expect(updated[0].statuses).toEqual(['POISONED']);
    expect(updated[1].statuses).toEqual([]);
  });
});

describe('formatSeatName', () => {
  it('should format seat name correctly', () => {
    const seat = createTestSeat({ id: 2, userName: 'Alice' });
    expect(formatSeatName(seat)).toBe('3号 Alice');
  });
});

describe('formatRoleName', () => {
  it('should return Chinese name for known roles', () => {
    expect(formatRoleName('washerwoman')).toBe('洗衣妇');
    expect(formatRoleName('librarian')).toBe('图书管理员');
    expect(formatRoleName('monk')).toBe('僧侣');
    expect(formatRoleName('imp')).toBe('小恶魔');
    expect(formatRoleName('poisoner')).toBe('投毒者');
    expect(formatRoleName('drunk')).toBe('酒鬼');
    expect(formatRoleName('butler')).toBe('管家');
  });

  it('should return roleId for unknown roles', () => {
    expect(formatRoleName('unknown_role')).toBe('unknown_role');
  });
});

describe('isInfoRole', () => {
  it('should return true for info roles', () => {
    expect(isInfoRole('washerwoman')).toBe(true);
    expect(isInfoRole('librarian')).toBe(true);
    expect(isInfoRole('investigator')).toBe(true);
    expect(isInfoRole('chef')).toBe(true);
    expect(isInfoRole('empath')).toBe(true);
    expect(isInfoRole('fortune_teller')).toBe(true);
    expect(isInfoRole('undertaker')).toBe(true);
    expect(isInfoRole('ravenkeeper')).toBe(true);
  });

  it('should return false for non-info roles', () => {
    expect(isInfoRole('monk')).toBe(false);
    expect(isInfoRole('slayer')).toBe(false);
    expect(isInfoRole('imp')).toBe(false);
  });
});

describe('hasNightAction', () => {
  it('should return true for first night roles', () => {
    expect(hasNightAction('poisoner', true)).toBe(true);
    expect(hasNightAction('washerwoman', true)).toBe(true);
    expect(hasNightAction('librarian', true)).toBe(true);
    expect(hasNightAction('investigator', true)).toBe(true);
    expect(hasNightAction('chef', true)).toBe(true);
    expect(hasNightAction('butler', true)).toBe(true);
    expect(hasNightAction('spy', true)).toBe(true);
  });

  it('should return false for roles without first night action', () => {
    expect(hasNightAction('monk', true)).toBe(false);
    expect(hasNightAction('imp', true)).toBe(false);
    expect(hasNightAction('undertaker', true)).toBe(false);
  });

  it('should return true for other night roles', () => {
    expect(hasNightAction('poisoner', false)).toBe(true);
    expect(hasNightAction('monk', false)).toBe(true);
    expect(hasNightAction('imp', false)).toBe(true);
    expect(hasNightAction('empath', false)).toBe(true);
    expect(hasNightAction('undertaker', false)).toBe(true);
  });

  it('should return false for roles without other night action', () => {
    expect(hasNightAction('washerwoman', false)).toBe(false);
    expect(hasNightAction('librarian', false)).toBe(false);
    expect(hasNightAction('chef', false)).toBe(false);
  });
});
