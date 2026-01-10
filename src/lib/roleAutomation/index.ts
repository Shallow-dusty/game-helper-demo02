/**
 * Role Automation Module
 *
 * 角色自动化模块 - 为 ST 提供角色能力的自动化处理
 *
 * 功能：
 * 1. 三级自动化：FULL_AUTO（新手）、GUIDED（资深）、MANUAL（神话）
 * 2. 信息类角色自动生成信息
 * 3. 保护/击杀类角色自动处理
 * 4. 规则违反警告和多重确认
 * 5. 连锁反应检测
 *
 * 使用方式：
 * ```typescript
 * import { getAutomationEngine, AutomationLevel } from './lib/roleAutomation';
 *
 * const engine = getAutomationEngine({ level: 'GUIDED' });
 *
 * // 处理夜间阶段
 * const results = engine.processNightPhase(gameState, nightQueue, currentIndex);
 *
 * // 获取建议
 * const suggestions = engine.getPendingSuggestions();
 *
 * // 确认建议
 * engine.confirmSuggestion(suggestion.id);
 * ```
 */

// 导出类型
export type {
  AutomationLevel,
  AbilityType,
  TriggerTiming,
  AutomationSuggestion,
  AutomationOption,
  RoleAbilityDef,
  AbilityContext,
  AbilityResult,
  StatusChange,
  DeathEvent,
  ChainReaction,
  RuleViolationRequest,
  RoleAutomationConfig
} from './types';

export {
  DEFAULT_AUTOMATION_CONFIG,
  ROLE_AUTOMATION_CATEGORIES,
  TROUBLE_BREWING_ROLES
} from './types';

// 导出引擎
export {
  RoleAutomationEngine,
  getAutomationEngine,
  resetAutomationEngine
} from './engine';

// 导出工具函数
export {
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
} from './utils';

// 导出 Trouble Brewing 角色处理器
export {
  processTroubleBrewingRole,
  TROUBLE_BREWING_PROCESSORS,
  TOWNSFOLK_PROCESSORS,
  OUTSIDER_PROCESSORS,
  MINION_PROCESSORS,
  DEMON_PROCESSORS
} from './troubleBrewing';
