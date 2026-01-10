/**
 * Trouble Brewing Role Automation Index
 *
 * 暗流涌动剧本角色自动化入口
 */

import { TOWNSFOLK_PROCESSORS } from './townsfolk';
import { OUTSIDER_PROCESSORS } from './outsiders';
import { MINION_PROCESSORS } from './minions';
import { DEMON_PROCESSORS } from './demons';
import type { GameState } from '../../../types';
import type { AbilityContext, AbilityResult } from '../types';

// 合并所有角色处理器
export const TROUBLE_BREWING_PROCESSORS: Record<
  string,
  (gameState: GameState, seatId: number, context: AbilityContext) => AbilityResult
> = {
  ...TOWNSFOLK_PROCESSORS,
  ...OUTSIDER_PROCESSORS,
  ...MINION_PROCESSORS,
  ...DEMON_PROCESSORS
};

/**
 * 处理暗流涌动剧本的角色能力
 */
export function processTroubleBrewingRole(
  roleId: string,
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const processor = TROUBLE_BREWING_PROCESSORS[roleId];

  if (!processor) {
    return {
      success: false,
      suggestions: [],
      error: `未知角色: ${roleId}`
    };
  }

  return processor(gameState, seatId, context);
}

// 导出所有子模块
export { TOWNSFOLK_PROCESSORS } from './townsfolk';
export { OUTSIDER_PROCESSORS } from './outsiders';
export { MINION_PROCESSORS } from './minions';
export { DEMON_PROCESSORS } from './demons';

// 导出单个角色处理函数（方便单元测试）
export {
  processWasherwoman,
  processLibrarian,
  processInvestigator,
  processChef,
  processEmpath,
  processFortuneTeller,
  processUndertaker,
  processMonk,
  processRavenkeeper,
  processVirgin,
  processSlayer,
  processSoldier,
  processMayor
} from './townsfolk';

export {
  processButler,
  processDrunk,
  processRecluse,
  processSaint
} from './outsiders';

export {
  processPoisoner,
  processSpy,
  processScarletWoman,
  processBaron
} from './minions';

export {
  processImp
} from './demons';
