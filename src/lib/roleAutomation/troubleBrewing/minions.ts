/**
 * Trouble Brewing - Minion Role Implementations
 *
 * 暗流涌动剧本 - 爪牙角色自动化实现
 */

import type { GameState, Seat } from '../../../types';
import type {
  AbilityContext,
  AbilityResult,
  AutomationSuggestion
} from '../types';
import {
  isTainted,
  getRealRoleId,
  getAlivePlayers,
  generateId,
  formatSeatName
} from '../utils';

// ==================== 投毒者 (Poisoner) ====================

/**
 * 投毒者能力处理
 * 每夜选择一名玩家，该玩家今晚和明天白天中毒
 */
export function processPoisoner(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  const { targetSeatIds } = context;

  if (!targetSeatIds || targetSeatIds.length === 0) {
    const alivePlayers = getAlivePlayers(gameState).filter(s => s.id !== seatId);

    // 在FULL_AUTO模式下，推荐一个目标
    let recommendedTarget: Seat | null = null;
    if (context.automationLevel === 'FULL_AUTO') {
      // 优先毒信息类角色
      const infoRoles = ['empath', 'fortune_teller', 'slayer', 'monk'];
      const foundTarget = alivePlayers.find(s => {
        const role = getRealRoleId(s);
        return role && infoRoles.includes(role);
      });
      if (foundTarget) {
        recommendedTarget = foundTarget;
      } else if (alivePlayers.length > 0) {
        recommendedTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)] ?? null;
      }
    }

    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'poisoner',
        seatId,
        type: 'action',
        title: '投毒者选择目标',
        description: '选择一名玩家进行投毒',
        priority: 95,
        requiresConfirmation: true,
        options: [
          {
            id: 'select_target',
            label: '选择目标',
            result: '',
            requiresInput: { type: 'player', prompt: '选择要投毒的玩家' }
          },
          ...(recommendedTarget ? [{
            id: 'recommended',
            label: `推荐：投毒 ${formatSeatName(recommendedTarget)}`,
            description: '系统推荐的目标',
            isRecommended: true,
            result: String(recommendedTarget.id)
          }] : [])
        ]
      }]
    };
  }

  const targetSeatId = targetSeatIds[0];
  if (targetSeatId === undefined) {
    return { success: false, suggestions: [], error: '未指定目标' };
  }
  const targetSeat = gameState.seats.find(s => s.id === targetSeatId);

  if (!targetSeat) {
    return { success: false, suggestions: [], error: '目标座位不存在' };
  }

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'poisoner',
      seatId,
      type: 'effect',
      title: '投毒者投毒',
      description: `投毒 ${formatSeatName(targetSeat)}`,
      suggestedResult: `${formatSeatName(targetSeat)} 中毒`,
      priority: 95,
      requiresConfirmation: false,
      targetSeatIds: [targetSeatId]
    }],
    statusChanges: [{
      seatId: targetSeatId,
      status: 'POISONED',
      action: 'add',
      source: 'poisoner',
      duration: 'day' // 持续到明天白天结束
    }]
  };
}

// ==================== 间谍 (Spy) ====================

/**
 * 间谍能力处理
 * 可以查看魔典，可能被探测为好人
 */
export function processSpy(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  const tainted = isTainted(seat);

  // 间谍的能力主要体现在：
  // 1. 可以查看魔典（UI层面的权限）
  // 2. 被信息类角色探测时可能显示为好人

  const suggestions: AutomationSuggestion[] = [];

  // 魔典查看提示
  suggestions.push({
    id: generateId(),
    roleId: 'spy',
    seatId,
    type: 'info',
    title: '间谍能力',
    description: tainted ? '间谍中毒，无法查看魔典' : '间谍可以查看魔典',
    suggestedResult: tainted ? '魔典查看权限：无效' : '魔典查看权限：有效',
    isTainted: tainted,
    priority: 50,
    requiresConfirmation: false
  });

  // 被探测时的选项
  if (context.automationLevel === 'GUIDED') {
    suggestions.push({
      id: generateId(),
      roleId: 'spy',
      seatId,
      type: 'info',
      title: '间谍探测选项',
      description: '当信息角色探测到间谍时，可以选择显示方式',
      priority: 40,
      requiresConfirmation: false,
      options: [
        {
          id: 'show_evil',
          label: '显示为邪恶',
          description: '正常显示为爪牙',
          result: 'evil'
        },
        {
          id: 'show_good',
          label: '显示为好人',
          description: '伪装为镇民/外来者',
          isRecommended: Math.random() > 0.6,
          result: 'good'
        },
        {
          id: 'show_specific',
          label: '显示为特定角色',
          description: '伪装为特定好人角色',
          result: 'specific',
          requiresInput: { type: 'role', prompt: '选择伪装的角色' }
        }
      ]
    });
  }

  return { success: true, suggestions };
}

// ==================== 猩红女郎 (Scarlet Woman) ====================

/**
 * 猩红女郎能力处理
 * 当恶魔死亡时（且存活5+人），变为恶魔
 */
export function processScarletWoman(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  const { additionalData } = context;
  const demonDied = additionalData?.demonDied as boolean | undefined;
  const aliveCount = getAlivePlayers(gameState).length;

  // 检查是否触发变形
  if (demonDied && aliveCount >= 5) {
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'scarlet_woman',
        seatId,
        type: 'effect',
        title: '猩红女郎变形！',
        description: '恶魔死亡且存活5人以上，猩红女郎变为新恶魔',
        suggestedResult: `${formatSeatName(seat)} 成为新的小恶魔`,
        priority: 100,
        requiresConfirmation: context.automationLevel !== 'FULL_AUTO',
        targetSeatIds: [seatId]
      }],
      chainReactions: [{
        type: 'scarlet_woman_transform',
        description: '猩红女郎变为小恶魔',
        targetSeatId: seatId,
        newRoleId: 'imp'
      }]
    };
  }

  // 非触发状态，返回状态提示
  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'scarlet_woman',
      seatId,
      type: 'info',
      title: '猩红女郎状态',
      description: aliveCount >= 5
        ? '如果恶魔死亡，将变为新恶魔'
        : `存活人数不足5人（当前${aliveCount}人），变形能力无效`,
      suggestedResult: aliveCount >= 5 ? '变形能力待机中' : '变形能力无效',
      priority: 60,
      requiresConfirmation: false
    }]
  };
}

// ==================== 男爵 (Baron) ====================

/**
 * 男爵能力处理（设置时）
 * 场上增加2个外来者
 */
export function processBaron(
  gameState: GameState,
  seatId: number,
  _context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  // 男爵的能力在游戏设置时生效，增加2个外来者
  // 这里只返回一个提示
  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'baron',
      seatId,
      type: 'info',
      title: '男爵效果',
      description: '男爵在场，外来者数量 +2',
      suggestedResult: '角色分配时需要增加2个外来者',
      priority: 80,
      requiresConfirmation: false
    }]
  };
}

// ==================== 导出所有爪牙处理函数 ====================

export const MINION_PROCESSORS: Record<string, typeof processPoisoner> = {
  poisoner: processPoisoner,
  spy: processSpy,
  scarlet_woman: processScarletWoman,
  baron: processBaron
};
