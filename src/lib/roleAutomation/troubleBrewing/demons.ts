/**
 * Trouble Brewing - Demon Role Implementations
 *
 * 暗流涌动剧本 - 恶魔角色自动化实现
 */

import type { GameState, Seat } from '@/types';
import type {
  AbilityContext,
  AbilityResult,
  AutomationSuggestion,
  DeathEvent
} from '../types';
import {
  isTainted,
  isProtected,
  getRealRoleId,
  getAlivePlayers,
  findMinions,
  generateId,
  formatSeatName,
  formatRoleName
} from '../utils';
import { randomInt } from '../../random';

// ==================== 小恶魔 (Imp) ====================

/**
 * 小恶魔能力处理
 * 每夜击杀一名玩家，可以自杀传位给爪牙
 */
export function processImp(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  // 首夜恶魔不行动（在TB中）
  if (context.isFirstNight) {
    return { success: true, suggestions: [] };
  }

  const { targetSeatIds } = context;

  if (!targetSeatIds || targetSeatIds.length === 0) {
    const alivePlayers = getAlivePlayers(gameState);
    const minions = findMinions(gameState);

    // 构建选项 - 使用类型断言来处理 requiresInput
    const options: {
      id: string;
      label: string;
      description?: string;
      result: string;
      requiresInput?: { type: 'player' | 'players' | 'role' | 'text' | 'number'; prompt: string; min?: number; max?: number };
    }[] = [
      {
        id: 'select_target',
        label: '选择击杀目标',
        result: '',
        requiresInput: { type: 'player', prompt: '选择要击杀的玩家' }
      }
    ];

    // 如果有活着的爪牙，添加自杀传位选项
    if (minions.length > 0) {
      options.push({
        id: 'self_kill',
        label: '自杀传位',
        description: `选择一个爪牙（${minions.map(m => formatSeatName(m)).join('、')}）成为新恶魔`,
        result: 'self_kill'
      });
    }

    // FULL_AUTO模式下推荐目标
    let recommendedTarget: Seat | null = null;
    if (context.automationLevel === 'FULL_AUTO') {
      // 避开已知可能有保护的目标（如僧侣保护的）
      const unprotected = alivePlayers.filter(s =>
        s.id !== seatId && !isProtected(s) && s.userId
      );
      // 优先击杀危险角色
      const dangerousRoles = ['slayer', 'fortune_teller', 'empath', 'mayor'];
      const foundTarget = unprotected.find(s => {
        const role = getRealRoleId(s);
        return role && dangerousRoles.includes(role);
      });
      if (foundTarget) {
        recommendedTarget = foundTarget;
      } else if (unprotected.length > 0) {
        recommendedTarget = unprotected[randomInt(0, unprotected.length)] ?? null;
      }
    }

    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'imp',
        seatId,
        type: 'action',
        title: '小恶魔击杀',
        description: '选择一名玩家击杀',
        priority: 100,
        requiresConfirmation: true,
        options: [
          ...(recommendedTarget ? [{
            id: 'recommended',
            label: `推荐：击杀 ${formatSeatName(recommendedTarget)}`,
            isRecommended: true,
            result: String(recommendedTarget.id)
          }] : []),
          ...options
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

  // 检查是否是自杀
  const isSelfKill = targetSeatId === seatId;

  if (isSelfKill) {
    return processImpSelfKill(gameState, seatId, context);
  }

  // 检查目标保护
  const suggestions: AutomationSuggestion[] = [];
  const deaths: DeathEvent[] = [];
  let killPrevented = false;
  let preventedBy = '';

  // 检查僧侣保护
  if (isProtected(targetSeat)) {
    killPrevented = true;
    preventedBy = '僧侣保护';
  }

  // 检查士兵
  const targetRole = getRealRoleId(targetSeat);
  if (targetRole === 'soldier') {
    const soldierSeat = targetSeat;
    if (!isTainted(soldierSeat)) {
      killPrevented = true;
      preventedBy = '士兵免疫';
    }
  }

  if (killPrevented) {
    suggestions.push({
      id: generateId(),
      roleId: 'imp',
      seatId,
      type: 'effect',
      title: '小恶魔击杀被阻止',
      description: `尝试击杀 ${formatSeatName(targetSeat)}，但被 ${preventedBy} 阻止`,
      suggestedResult: `击杀失败 - ${preventedBy}`,
      priority: 95,
      requiresConfirmation: context.automationLevel !== 'FULL_AUTO',
      targetSeatIds: [targetSeatId]
    });

    // 添加被阻止的死亡事件（用于追踪）
    deaths.push({
      seatId: targetSeatId,
      cause: 'demon_kill',
      killerRoleId: 'imp',
      isPreventable: true,
      wasPrevented: true,
      preventedBy: targetRole === 'soldier' ? 'soldier' : 'monk'
    });

    // 添加规则违反选项（如果ST想强制击杀）
    if (context.automationLevel === 'GUIDED') {
      suggestions.push({
        id: generateId(),
        roleId: 'imp',
        seatId,
        type: 'warning',
        title: '规则违反选项',
        description: `确定要无视 ${preventedBy} 强制击杀吗？`,
        priority: 90,
        requiresConfirmation: true,
        options: [
          {
            id: 'respect_rule',
            label: '遵守规则',
            description: '击杀被阻止',
            isRecommended: true,
            result: 'blocked'
          },
          {
            id: 'override_rule',
            label: '⚠️ 强制击杀',
            description: '无视保护规则',
            result: 'override'
          }
        ]
      });
    }
  } else {
    // 正常击杀
    deaths.push({
      seatId: targetSeatId,
      cause: 'demon_kill',
      killerRoleId: 'imp',
      isPreventable: false // 已经通过保护检查
    });

    suggestions.push({
      id: generateId(),
      roleId: 'imp',
      seatId,
      type: 'effect',
      title: '小恶魔击杀',
      description: `击杀 ${formatSeatName(targetSeat)}`,
      suggestedResult: `${formatSeatName(targetSeat)} 死亡`,
      priority: 100,
      requiresConfirmation: context.automationLevel !== 'FULL_AUTO',
      targetSeatIds: [targetSeatId]
    });

    // 检查守鸦人触发
    if (targetRole === 'ravenkeeper' && !isTainted(targetSeat)) {
      suggestions.push({
        id: generateId(),
        roleId: 'ravenkeeper',
        seatId: targetSeatId,
        type: 'action',
        title: '守鸦人能力触发',
        description: '守鸦人死亡，可以选择一名玩家得知其角色',
        priority: 95,
        requiresConfirmation: true,
        options: [{
          id: 'select_target',
          label: '选择查看目标',
          result: '',
          requiresInput: { type: 'player', prompt: '选择要查看角色的玩家' }
        }]
      });
    }
  }

  return { success: true, suggestions, deaths };
}

/**
 * 小恶魔自杀传位处理
 */
function processImpSelfKill(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const minions = findMinions(gameState);

  if (minions.length === 0) {
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'imp',
        seatId,
        type: 'warning',
        title: '自杀传位失败',
        description: '没有存活的爪牙可以传位',
        suggestedResult: '无法自杀（无爪牙）',
        priority: 100,
        requiresConfirmation: true
      }]
    };
  }

  const { additionalData } = context;
  let newDemonSeatId = additionalData?.newDemonSeatId as number | undefined;

  // FULL_AUTO 模式下自动选择第一个爪牙
  if (newDemonSeatId === undefined && context.automationLevel === 'FULL_AUTO' && minions.length > 0) {
    newDemonSeatId = minions[0]!.id;
  }

  if (newDemonSeatId === undefined) {
    // 需要选择传位目标
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'imp',
        seatId,
        type: 'action',
        title: '小恶魔自杀传位',
        description: '选择一个爪牙成为新恶魔',
        priority: 100,
        requiresConfirmation: true,
        options: minions.map(minion => ({
          id: `minion_${minion.id}`,
          label: `传位给 ${formatSeatName(minion)}`,
          description: formatRoleName(getRealRoleId(minion) || 'unknown'),
          isRecommended: minions.length === 1,
          result: String(minion.id)
        }))
      }]
    };
  }

  const newDemonSeat = gameState.seats.find(s => s.id === newDemonSeatId);
  if (!newDemonSeat) {
    return { success: false, suggestions: [], error: '目标座位不存在' };
  }

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'imp',
      seatId,
      type: 'effect',
      title: '小恶魔自杀传位',
      description: `小恶魔自杀，${formatSeatName(newDemonSeat)} 成为新恶魔`,
      suggestedResult: `${formatSeatName(newDemonSeat)} 成为新的小恶魔`,
      priority: 100,
      requiresConfirmation: context.automationLevel !== 'FULL_AUTO',
      targetSeatIds: [seatId, newDemonSeatId]
    }],
    deaths: [{
      seatId,
      cause: 'ability',
      killerRoleId: 'imp',
      isPreventable: false
    }],
    chainReactions: [{
      type: 'imp_transfer',
      description: '小恶魔传位',
      targetSeatId: newDemonSeatId,
      newRoleId: 'imp'
    }]
  };
}

// ==================== 导出所有恶魔处理函数 ====================

export const DEMON_PROCESSORS: Record<string, typeof processImp> = {
  imp: processImp
};
