/**
 * Role Automation Utilities
 *
 * 角色自动化的工具函数
 */

import type { GameState, Seat, Team } from '../../types';
import type { StatusChange } from './types';

/**
 * 检查座位是否被干扰（中毒/醉酒）
 */
export function isTainted(seat: Seat): boolean {
  return seat.statuses.includes('POISONED') || seat.statuses.includes('DRUNK');
}

/**
 * 检查座位是否被保护（僧侣保护）
 */
export function isProtected(seat: Seat): boolean {
  return seat.statuses.includes('PROTECTED');
}

/**
 * 获取真实角色ID（考虑酒鬼等情况）
 */
export function getRealRoleId(seat: Seat): string | null {
  return seat.realRoleId || seat.roleId;
}

/**
 * 获取显示角色ID（玩家看到的）
 */
export function getSeenRoleId(seat: Seat): string | null {
  return seat.seenRoleId || seat.roleId;
}

/**
 * 检查是否为邪恶阵营
 */
export function isEvil(seat: Seat, gameState: GameState): boolean {
  const roleId = getRealRoleId(seat);
  if (!roleId) return false;

  const allRoles = { ...gameState.customRoles };
  const role = allRoles[roleId];
  if (!role) {
    // 从常量中检查
    return ['MINION', 'DEMON'].includes(getTeamFromRoleId(roleId));
  }
  return role.team === 'MINION' || role.team === 'DEMON';
}

/**
 * 从角色ID获取阵营（简化版，用于无GameState情况）
 */
export function getTeamFromRoleId(roleId: string): Team {
  const evilRoles = [
    'imp', 'poisoner', 'spy', 'scarlet_woman', 'baron',
    'godfather', 'devil_advocate', 'assassin', 'mastermind',
    'po', 'vigormortis', 'no_dashii', 'vortox', 'fang_gu', 'zombuul'
  ];

  const outsiders = [
    'butler', 'drunk', 'recluse', 'saint',
    'tinker', 'moonchild', 'goon', 'lunatic',
    'sweetheart', 'barber', 'klutz', 'mutant'
  ];

  if (evilRoles.includes(roleId)) {
    return roleId === 'imp' || roleId === 'po' || roleId === 'vortox'
      || roleId === 'vigormortis' || roleId === 'no_dashii'
      || roleId === 'fang_gu' || roleId === 'zombuul'
      ? 'DEMON'
      : 'MINION';
  }
  if (outsiders.includes(roleId)) return 'OUTSIDER';
  return 'TOWNSFOLK';
}

/**
 * 获取存活玩家
 */
export function getAlivePlayers(gameState: GameState): Seat[] {
  return gameState.seats.filter(s => !s.isDead && s.userId);
}

/**
 * 获取死亡玩家
 */
export function getDeadPlayers(gameState: GameState): Seat[] {
  return gameState.seats.filter(s => s.isDead && s.userId);
}

/**
 * 获取相邻座位
 */
export function getNeighbors(seatId: number, seats: Seat[]): [Seat | null, Seat | null] {
  const totalSeats = seats.length;
  if (totalSeats === 0) return [null, null];

  const prevId = (seatId - 1 + totalSeats) % totalSeats;
  const nextId = (seatId + 1) % totalSeats;

  return [
    seats.find(s => s.id === prevId) || null,
    seats.find(s => s.id === nextId) || null
  ];
}

/**
 * 获取存活的相邻座位（跳过死亡玩家）
 */
export function getAliveNeighbors(seatId: number, seats: Seat[]): [Seat | null, Seat | null] {
  const totalSeats = seats.length;
  if (totalSeats === 0) return [null, null];

  let leftNeighbor: Seat | null = null;
  let rightNeighbor: Seat | null = null;

  // 向左查找
  for (let i = 1; i < totalSeats; i++) {
    const checkId = (seatId - i + totalSeats) % totalSeats;
    const seat = seats.find(s => s.id === checkId);
    if (seat && !seat.isDead && seat.userId) {
      leftNeighbor = seat;
      break;
    }
  }

  // 向右查找
  for (let i = 1; i < totalSeats; i++) {
    const checkId = (seatId + i) % totalSeats;
    const seat = seats.find(s => s.id === checkId);
    if (seat && !seat.isDead && seat.userId) {
      rightNeighbor = seat;
      break;
    }
  }

  return [leftNeighbor, rightNeighbor];
}

/**
 * 计算邪恶玩家对数（相邻）
 */
export function countEvilPairs(gameState: GameState): number {
  const seats = gameState.seats;
  let count = 0;

  for (let i = 0; i < seats.length; i++) {
    const current = seats[i];
    const next = seats[(i + 1) % seats.length];

    if (current && next && current.userId && next.userId && !current.isDead && !next.isDead) {
      if (isEvil(current, gameState) && isEvil(next, gameState)) {
        count++;
      }
    }
  }

  return count;
}

/**
 * 查找恶魔
 */
export function findDemon(gameState: GameState): Seat | null {
  return gameState.seats.find(s => {
    const roleId = getRealRoleId(s);
    return roleId && getTeamFromRoleId(roleId) === 'DEMON' && !s.isDead;
  }) || null;
}

/**
 * 查找所有爪牙
 */
export function findMinions(gameState: GameState): Seat[] {
  return gameState.seats.filter(s => {
    const roleId = getRealRoleId(s);
    return roleId && getTeamFromRoleId(roleId) === 'MINION' && !s.isDead;
  });
}

/**
 * 查找特定角色
 */
export function findRoleSeats(gameState: GameState, roleId: string): Seat[] {
  return gameState.seats.filter(s => getRealRoleId(s) === roleId);
}

/**
 * 获取随机座位（排除指定座位）
 */
export function getRandomSeat(seats: Seat[], excludeIds: number[] = []): Seat | null {
  const available = seats.filter(s =>
    s.userId && !s.isDead && !excludeIds.includes(s.id)
  );
  if (available.length === 0) return null;
  const selected = available[Math.floor(Math.random() * available.length)];
  return selected ?? null;
}

/**
 * 获取随机角色类型的座位
 */
export function getRandomSeatByTeam(
  gameState: GameState,
  team: Team,
  excludeIds: number[] = []
): Seat | null {
  const seats = gameState.seats.filter(s => {
    if (!s.userId || s.isDead || excludeIds.includes(s.id)) return false;
    const roleId = getRealRoleId(s);
    if (!roleId) return false;
    return getTeamFromRoleId(roleId) === team;
  });

  if (seats.length === 0) return null;
  const selected = seats[Math.floor(Math.random() * seats.length)];
  return selected ?? null;
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 应用状态变更
 */
export function applyStatusChange(
  seats: Seat[],
  change: StatusChange
): Seat[] {
  return seats.map(seat => {
    if (seat.id !== change.seatId) return seat;

    const newStatuses = change.action === 'add'
      ? [...seat.statuses, change.status]
      : seat.statuses.filter(s => s !== change.status);

    return {
      ...seat,
      statuses: newStatuses
    };
  });
}

/**
 * 清除夜间临时状态（如保护）
 */
export function clearNightStatuses(seats: Seat[]): Seat[] {
  return seats.map(seat => ({
    ...seat,
    statuses: seat.statuses.filter(s => s !== 'PROTECTED')
  }));
}

/**
 * 格式化座位显示名
 */
export function formatSeatName(seat: Seat): string {
  return `${seat.id + 1}号 ${seat.userName}`;
}

/**
 * 格式化角色名（从角色ID）
 */
export function formatRoleName(roleId: string): string {
  const roleNames: Record<string, string> = {
    // 镇民
    washerwoman: '洗衣妇',
    librarian: '图书管理员',
    investigator: '调查员',
    chef: '厨师',
    empath: '共情者',
    fortune_teller: '占卜师',
    undertaker: '殓葬师',
    monk: '僧侣',
    ravenkeeper: '守鸦人',
    virgin: '圣女',
    slayer: '杀手',
    soldier: '士兵',
    mayor: '市长',
    // 外来者
    butler: '管家',
    drunk: '酒鬼',
    recluse: '隐士',
    saint: '圣徒',
    // 爪牙
    poisoner: '投毒者',
    spy: '间谍',
    scarlet_woman: '猩红女郎',
    baron: '男爵',
    // 恶魔
    imp: '小恶魔'
  };
  return roleNames[roleId] || roleId;
}

/**
 * 检查是否为信息类角色
 */
export function isInfoRole(roleId: string): boolean {
  const infoRoles = [
    'washerwoman', 'librarian', 'investigator', 'chef',
    'empath', 'fortune_teller', 'undertaker', 'ravenkeeper'
  ];
  return infoRoles.includes(roleId);
}

/**
 * 检查是否为夜间行动角色
 */
export function hasNightAction(roleId: string, isFirstNight: boolean): boolean {
  const firstNightRoles = [
    'poisoner', 'washerwoman', 'librarian', 'investigator',
    'chef', 'empath', 'fortune_teller', 'butler', 'spy'
  ];

  const otherNightRoles = [
    'poisoner', 'monk', 'imp', 'empath', 'fortune_teller',
    'undertaker', 'butler', 'spy'
  ];

  return isFirstNight
    ? firstNightRoles.includes(roleId)
    : otherNightRoles.includes(roleId);
}
