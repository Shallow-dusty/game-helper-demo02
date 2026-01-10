import type { GameState } from '../types';
import { ROLES } from '../constants/roles';

/**
 * 连锁结算检测模块
 * 
 * 检测游戏中的连锁反应：
 * - 祖母-孙子 死亡联动
 * - 月之子 死亡联动
 * - 僧侣保护检测
 * - 游戏结束条件检测
 */

export interface ChainReactionEvent {
  type: 'death' | 'protection' | 'game_end' | 'ability_trigger';
  title: string;
  message: string;
  affectedSeatIds: number[];
  suggestedAction: 'mark_dead' | 'ignore' | 'end_game' | 'cancel_kill';
  priority: 'high' | 'medium' | 'low';
  data?: Record<string, unknown>;
}

/**
 * 检测祖母-孙子联动
 * 当孙子死亡时，祖母也应该死亡
 */
export function checkGrandmotherChain(gameState: GameState, deadSeatId: number): ChainReactionEvent | null {
  const deadSeat = gameState.seats[deadSeatId];
  if (!deadSeat) return null;
  
  // 检查死者是否是"圣婴"或有孙子标记的角色
  // 在 Blood on the Clocktower 中，Grandmother 选择一个玩家作为她的孙子
  // 这里我们检查是否有 Grandmother 角色，并且死者与她有关联
  
  const grandmotherSeat = gameState.seats.find(s => {
    const roleId = s.realRoleId ?? s.seenRoleId;
    return roleId === 'grandmother' && !s.isDead;
  });
  
  if (!grandmotherSeat) return null;
  
  // 检查是否有提醒标记表明死者是孙子
  const hasGrandchildReminder = grandmotherSeat.reminders.some(
    r => r.text.includes('孙子') || r.text.includes('Grandchild')
  );
  
  // 或者检查是否死者座位上有相关提醒
  const isMarkedGrandchild = deadSeat.reminders.some(
    r => r.sourceRole === 'grandmother' || r.text.includes('祖母')
  );
  
  if (hasGrandchildReminder || isMarkedGrandchild) {
    return {
      type: 'death',
      title: '⚡ 祖母连锁死亡',
      message: `检测到 ${deadSeat.userName}（孙子）已死亡，是否标记 ${grandmotherSeat.userName}（祖母）死亡？`,
      affectedSeatIds: [grandmotherSeat.id],
      suggestedAction: 'mark_dead',
      priority: 'high'
    };
  }
  
  return null;
}

/**
 * 检测月之子联动
 * 当月之子选择的玩家死亡时，月之子也死亡
 */
export function checkMoonchildChain(gameState: GameState, deadSeatId: number): ChainReactionEvent | null {
  const deadSeat = gameState.seats[deadSeatId];
  if (!deadSeat) return null;
  
  // 检查是否有 Moonchild 角色选择了这个死者
  const moonchildSeat = gameState.seats.find(s => {
    const roleId = s.realRoleId ?? s.seenRoleId;
    if (roleId !== 'moonchild' || s.isDead) return false;
    
    // 检查提醒标记
    return s.reminders.some(
      r => r.text.includes(deadSeat.userName) || r.seatId === deadSeatId
    );
  });
  
  if (moonchildSeat) {
    return {
      type: 'death',
      title: '🌙 月之子连锁死亡',
      message: `检测到月之子选择的玩家 ${deadSeat.userName} 已死亡，是否标记 ${moonchildSeat.userName}（月之子）死亡？`,
      affectedSeatIds: [moonchildSeat.id],
      suggestedAction: 'mark_dead',
      priority: 'high'
    };
  }
  
  return null;
}

/**
 * 检测僧侣保护
 * 当恶魔攻击被僧侣保护的玩家时，阻止死亡
 */
export function checkMonkProtection(gameState: GameState, targetSeatId: number): ChainReactionEvent | null {
  const targetSeat = gameState.seats[targetSeatId];
  if (!targetSeat) return null;
  
  // 检查目标是否有 PROTECTED 状态
  if (targetSeat.statuses.includes('PROTECTED')) {
    return {
      type: 'protection',
      title: '🛡️ 僧侣保护生效',
      message: `${targetSeat.userName} 被僧侣保护，本次攻击无效。是否取消此次击杀？`,
      affectedSeatIds: [targetSeatId],
      suggestedAction: 'cancel_kill',
      priority: 'high'
    };
  }
  
  // 检查是否有僧侣的提醒标记
  const hasMonkReminder = targetSeat.reminders.some(
    r => r.sourceRole === 'monk' || r.text.includes('保护') || r.text.includes('Protected')
  );
  
  if (hasMonkReminder) {
    return {
      type: 'protection',
      title: '🛡️ 僧侣保护可能生效',
      message: `${targetSeat.userName} 可能被僧侣保护，请确认是否取消此次击杀？`,
      affectedSeatIds: [targetSeatId],
      suggestedAction: 'cancel_kill',
      priority: 'medium'
    };
  }
  
  return null;
}

/**
 * 检测游戏结束条件
 */
export function checkGameEndCondition(gameState: GameState): ChainReactionEvent | null {
  const aliveSeats = gameState.seats.filter(s => !s.isDead);
  
  // 检测恶魔是否死亡
  const demonAlive = aliveSeats.some(s => {
    const roleId = s.realRoleId ?? s.seenRoleId;
    return roleId && ROLES[roleId]?.team === 'DEMON';
  });
  
  if (!demonAlive) {
    return {
      type: 'game_end',
      title: '🎉 游戏结束',
      message: '恶魔已死亡，善良阵营获胜！是否结束游戏？',
      affectedSeatIds: [],
      suggestedAction: 'end_game',
      priority: 'high',
      data: { winner: 'GOOD', reason: '恶魔死亡' }
    };
  }
  
  // 检测存活人数（包含恶魔的情况下，只剩2人时邪恶获胜）
  // 此时 demonAlive 必为 true（否则已在上方返回）
  if (aliveSeats.length <= 2) {
    const aliveCount = aliveSeats.length;
    return {
      type: 'game_end',
      title: '💀 游戏结束',
      message: `仅剩 ${String(aliveCount)} 名玩家存活（含恶魔），邪恶阵营获胜！是否结束游戏？`,
      affectedSeatIds: [],
      suggestedAction: 'end_game',
      priority: 'high',
      data: { winner: 'EVIL', reason: '存活人数过少' }
    };
  }
  
  return null;
}

/**
 * 检测圣徒处决
 * 如果圣徒被处决，善良方失败
 */
export function checkSaintExecution(gameState: GameState, executedSeatId: number): ChainReactionEvent | null {
  const executedSeat = gameState.seats[executedSeatId];
  if (!executedSeat) return null;
  const roleId = executedSeat.realRoleId ?? executedSeat.seenRoleId;
  
  if (roleId === 'saint') {
    return {
      type: 'game_end',
      title: '😇 圣徒被处决',
      message: `${executedSeat.userName}（圣徒）被处决，邪恶阵营获胜！是否结束游戏？`,
      affectedSeatIds: [executedSeatId],
      suggestedAction: 'end_game',
      priority: 'high',
      data: { winner: 'EVIL', reason: '圣徒被处决' }
    };
  }
  
  return null;
}

/**
 * 综合检测所有连锁反应
 * 返回所有需要确认的事件列表
 */
export function detectChainReactions(
  gameState: GameState,
  triggerType: 'death' | 'execution' | 'night_kill',
  affectedSeatId: number
): ChainReactionEvent[] {
  const events: ChainReactionEvent[] = [];
  
  if (triggerType === 'death' || triggerType === 'night_kill') {
    // 检测祖母连锁
    const grandmotherEvent = checkGrandmotherChain(gameState, affectedSeatId);
    if (grandmotherEvent) events.push(grandmotherEvent);
    
    // 检测月之子连锁
    const moonchildEvent = checkMoonchildChain(gameState, affectedSeatId);
    if (moonchildEvent) events.push(moonchildEvent);
    
    // 检测游戏结束
    const gameEndEvent = checkGameEndCondition(gameState);
    if (gameEndEvent) events.push(gameEndEvent);
  }
  
  if (triggerType === 'night_kill') {
    // 检测僧侣保护
    const monkEvent = checkMonkProtection(gameState, affectedSeatId);
    if (monkEvent) events.push(monkEvent);
  }
  
  if (triggerType === 'execution') {
    // 检测圣徒处决
    const saintEvent = checkSaintExecution(gameState, affectedSeatId);
    if (saintEvent) events.push(saintEvent);
    
    // 处决后也检测游戏结束
    const gameEndEvent = checkGameEndCondition(gameState);
    if (gameEndEvent) events.push(gameEndEvent);
  }
  
  // 按优先级排序
  return events.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
