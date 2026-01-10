/**
 * Trouble Brewing - Outsider Role Implementations
 *
 * 暗流涌动剧本 - 外来者角色自动化实现
 */

import type { GameState } from '../../../types';
import type {
  AbilityContext,
  AbilityResult
} from '../types';
import {
  isTainted,
  getAlivePlayers,
  generateId,
  formatSeatName,
  formatRoleName
} from '../utils';

// ==================== 管家 (Butler) ====================

/**
 * 管家能力处理
 * 每夜选择一名玩家作为主人，投票时只能在主人投票后投票
 */
export function processButler(
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

    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'butler',
        seatId,
        type: 'action',
        title: '管家选择主人',
        description: '选择一名玩家作为今天的主人',
        priority: 60,
        requiresConfirmation: true,
        options: [
          {
            id: 'select_master',
            label: '选择主人',
            result: '',
            requiresInput: { type: 'player', prompt: '选择你的主人' }
          },
          ...(context.automationLevel === 'FULL_AUTO' && alivePlayers.length > 0 ? [{
            id: 'random',
            label: '随机选择',
            isRecommended: true,
            result: String(alivePlayers[Math.floor(Math.random() * alivePlayers.length)]!.id)
          }] : [])
        ]
      }]
    };
  }

  const masterSeatId = targetSeatIds[0];
  if (masterSeatId === undefined) {
    return { success: false, suggestions: [], error: '未指定主人' };
  }
  const masterSeat = gameState.seats.find(s => s.id === masterSeatId);

  if (!masterSeat) {
    return { success: false, suggestions: [], error: '主人座位不存在' };
  }

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'butler',
      seatId,
      type: 'effect',
      title: '管家选择主人',
      description: `选择 ${formatSeatName(masterSeat)} 作为主人`,
      suggestedResult: `主人：${formatSeatName(masterSeat)}`,
      priority: 60,
      requiresConfirmation: false,
      targetSeatIds: [masterSeatId]
    }]
  };
}

// ==================== 酒鬼 (Drunk) ====================

/**
 * 酒鬼能力处理（设置时）
 * 酒鬼认为自己是某个镇民，但实际上什么能力都没有
 */
export function processDrunk(
  gameState: GameState,
  seatId: number,
  _context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  // 酒鬼的真实角色是 drunk，但 seenRoleId 是他以为的镇民角色
  const seenRole = seat.seenRoleId;
  const realRole = seat.realRoleId;

  if (realRole !== 'drunk') {
    return { success: true, suggestions: [] };
  }

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'drunk',
      seatId,
      type: 'info',
      title: '酒鬼状态',
      description: seenRole
        ? `玩家认为自己是 ${formatRoleName(seenRole)}，实际是酒鬼`
        : '酒鬼身份未设置显示角色',
      suggestedResult: '能力无效，给予假信息',
      priority: 90,
      requiresConfirmation: false
    }]
  };
}

// ==================== 隐士 (Recluse) ====================

/**
 * 隐士能力处理（被动）
 * 可能被探测为邪恶、爪牙或恶魔
 */
export function processRecluse(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  const tainted = isTainted(seat);

  // 隐士是被动能力，在信息生成时考虑
  // 这里返回一个提示给ST
  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'recluse',
      seatId,
      type: 'info',
      title: '隐士状态',
      description: tainted
        ? '隐士中毒，可能无法注册为邪恶'
        : '隐士可能被探测为邪恶/爪牙/恶魔',
      suggestedResult: '信息生成时可选择让隐士显示为邪恶',
      isTainted: tainted,
      priority: 40,
      requiresConfirmation: false,
      options: context.automationLevel === 'GUIDED' ? [
        {
          id: 'show_good',
          label: '显示为好人',
          description: '正常显示',
          result: 'good'
        },
        {
          id: 'show_evil',
          label: '显示为邪恶',
          description: '探测为邪恶阵营',
          isRecommended: Math.random() > 0.5,
          result: 'evil'
        },
        {
          id: 'show_minion',
          label: '显示为爪牙',
          description: '探测为特定爪牙',
          result: 'minion'
        },
        {
          id: 'show_demon',
          label: '显示为恶魔',
          description: '探测为恶魔',
          result: 'demon'
        }
      ] : undefined
    }]
  };
}

// ==================== 圣徒 (Saint) ====================

/**
 * 圣徒能力处理（被动）
 * 如果被处决，邪恶获胜
 */
export function processSaint(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  const { additionalData } = context;
  const isBeingExecuted = additionalData?.isBeingExecuted as boolean | undefined;

  if (!isBeingExecuted) {
    // 圣徒没有被处决，正常状态提示
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'saint',
        seatId,
        type: 'warning',
        title: '圣徒警告',
        description: '如果圣徒被处决，邪恶立即获胜！',
        suggestedResult: '注意保护圣徒',
        priority: 95,
        requiresConfirmation: false
      }]
    };
  }

  // 圣徒被处决
  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'saint',
      seatId,
      type: 'effect',
      title: '圣徒被处决！',
      description: '圣徒被处决，邪恶立即获胜！',
      suggestedResult: '游戏结束 - 邪恶获胜',
      priority: 100,
      requiresConfirmation: context.automationLevel !== 'FULL_AUTO'
    }],
    gameEndCondition: {
      winner: 'EVIL',
      reason: '圣徒被处决'
    }
  };
}

// ==================== 导出所有外来者处理函数 ====================

export const OUTSIDER_PROCESSORS: Record<string, typeof processButler> = {
  butler: processButler,
  drunk: processDrunk,
  recluse: processRecluse,
  saint: processSaint
};
