/**
 * Role Automation Engine
 *
 * 角色自动化引擎 - 协调所有角色的自动化处理
 */

import type { GameState, Seat } from '../../types';
import type {
  AutomationLevel,
  RoleAutomationConfig,
  AbilityContext,
  AbilityResult,
  AutomationSuggestion,
  StatusChange,
  DeathEvent,
  ChainReaction
} from './types';
import { processTroubleBrewingRole } from './troubleBrewing';
import { getRealRoleId } from './utils';

/**
 * 角色自动化引擎
 */
export class RoleAutomationEngine {
  private config: RoleAutomationConfig;
  private pendingSuggestions: Map<string, AutomationSuggestion>;
  private pendingDeaths: DeathEvent[];
  private pendingStatusChanges: StatusChange[];
  private pendingChainReactions: ChainReaction[];

  constructor(config?: Partial<RoleAutomationConfig>) {
    this.config = {
      level: 'GUIDED',
      enableRuleChecks: true,
      ruleViolationConfirmations: 2,
      autoApplyStatusChanges: true,
      autoProcessDeaths: false,
      ...config
    };
    this.pendingSuggestions = new Map();
    this.pendingDeaths = [];
    this.pendingStatusChanges = [];
    this.pendingChainReactions = [];
  }

  /**
   * 设置自动化级别
   */
  setAutomationLevel(level: AutomationLevel): void {
    this.config.level = level;
  }

  /**
   * 获取当前自动化级别
   */
  getAutomationLevel(): AutomationLevel {
    return this.config.level;
  }

  /**
   * 处理夜间阶段的所有角色
   */
  processNightPhase(
    gameState: GameState,
    nightQueue: string[],
    currentIndex: number
  ): AbilityResult[] {
    const results: AbilityResult[] = [];
    const isFirstNight = gameState.roundInfo.nightCount === 1;

    // 获取当前需要处理的角色
    const currentRoleId = nightQueue[currentIndex];
    if (!currentRoleId) {
      return results;
    }

    // 找到所有拥有该角色的存活玩家
    const seatsWithRole = gameState.seats.filter(seat => {
      const roleId = getRealRoleId(seat);
      return roleId === currentRoleId && !seat.isDead;
    });

    for (const seat of seatsWithRole) {
      const context: AbilityContext = {
        automationLevel: this.config.level,
        isFirstNight,
        nightCount: gameState.roundInfo.nightCount,
        dayCount: gameState.roundInfo.dayCount
      };

      const result = this.processRoleAbility(
        gameState,
        seat.id,
        currentRoleId,
        context
      );

      results.push(result);

      // 收集所有建议和效果
      if (result.success) {
        result.suggestions.forEach(s => {
          this.pendingSuggestions.set(s.id, s);
        });
        if (result.statusChanges) {
          this.pendingStatusChanges.push(...result.statusChanges);
        }
        if (result.deaths) {
          this.pendingDeaths.push(...result.deaths);
        }
        if (result.chainReactions) {
          this.pendingChainReactions.push(...result.chainReactions);
        }
      }
    }

    return results;
  }

  /**
   * 处理单个角色的能力
   */
  processRoleAbility(
    gameState: GameState,
    seatId: number,
    roleId: string,
    context: AbilityContext
  ): AbilityResult {
    // 根据剧本选择处理器
    const scriptId = gameState.currentScriptId;

    // 目前只支持 Trouble Brewing
    if (scriptId === 'tb' || !scriptId) {
      return processTroubleBrewingRole(roleId, gameState, seatId, context);
    }

    // 未来可以添加其他剧本支持
    return {
      success: false,
      suggestions: [],
      error: `不支持的剧本: ${scriptId}`
    };
  }

  /**
   * 获取所有待处理的建议
   */
  getPendingSuggestions(): AutomationSuggestion[] {
    return Array.from(this.pendingSuggestions.values())
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取指定座位的建议
   */
  getSuggestionsForSeat(seatId: number): AutomationSuggestion[] {
    return this.getPendingSuggestions().filter(s => s.seatId === seatId);
  }

  /**
   * 确认建议
   */
  confirmSuggestion(suggestionId: string): AutomationSuggestion | null {
    const suggestion = this.pendingSuggestions.get(suggestionId);
    if (suggestion) {
      this.pendingSuggestions.delete(suggestionId);
    }
    return suggestion || null;
  }

  /**
   * 拒绝/移除建议
   */
  dismissSuggestion(suggestionId: string): void {
    this.pendingSuggestions.delete(suggestionId);
  }

  /**
   * 清除所有待处理项
   */
  clearPending(): void {
    this.pendingSuggestions.clear();
    this.pendingDeaths = [];
    this.pendingStatusChanges = [];
    this.pendingChainReactions = [];
  }

  /**
   * 获取待处理的死亡事件
   */
  getPendingDeaths(): DeathEvent[] {
    return [...this.pendingDeaths];
  }

  /**
   * 获取待处理的状态变更
   */
  getPendingStatusChanges(): StatusChange[] {
    return [...this.pendingStatusChanges];
  }

  /**
   * 获取待处理的连锁反应
   */
  getPendingChainReactions(): ChainReaction[] {
    return [...this.pendingChainReactions];
  }

  /**
   * 应用状态变更到游戏状态
   */
  applyStatusChanges(seats: Seat[]): Seat[] {
    let updatedSeats = [...seats];

    for (const change of this.pendingStatusChanges) {
      updatedSeats = updatedSeats.map(seat => {
        if (seat.id !== change.seatId) return seat;

        const newStatuses = change.action === 'add'
          ? [...seat.statuses, change.status]
          : seat.statuses.filter(s => s !== change.status);

        return { ...seat, statuses: newStatuses };
      });
    }

    this.pendingStatusChanges = [];
    return updatedSeats;
  }

  /**
   * 应用死亡事件
   */
  applyDeaths(seats: Seat[]): { seats: Seat[]; deadSeats: Seat[] } {
    const deadSeats: Seat[] = [];
    const updatedSeats = [...seats];

    for (const death of this.pendingDeaths) {
      if (death.wasPrevented) continue;

      const seatIndex = updatedSeats.findIndex(s => s.id === death.seatId);
      if (seatIndex !== -1) {
        const existingSeat = updatedSeats[seatIndex];
        if (existingSeat) {
          const deadSeat: Seat = { ...existingSeat, isDead: true };
          updatedSeats[seatIndex] = deadSeat;
          deadSeats.push(deadSeat);
        }
      }
    }

    this.pendingDeaths = [];
    return { seats: updatedSeats, deadSeats };
  }

  /**
   * 生成夜间开始时的所有信息建议
   * 用于 FULL_AUTO 模式
   */
  generateAllNightSuggestions(gameState: GameState): AbilityResult {
    const isFirstNight = gameState.roundInfo.nightCount === 1;
    const allSuggestions: AutomationSuggestion[] = [];
    const allStatusChanges: StatusChange[] = [];
    const allDeaths: DeathEvent[] = [];
    const allChainReactions: ChainReaction[] = [];

    // 遍历夜间队列中的所有角色
    for (const roleId of gameState.nightQueue) {
      const seatsWithRole = gameState.seats.filter(seat => {
        const seatRoleId = getRealRoleId(seat);
        return seatRoleId === roleId && !seat.isDead;
      });

      for (const seat of seatsWithRole) {
        const context: AbilityContext = {
          automationLevel: this.config.level,
          isFirstNight,
          nightCount: gameState.roundInfo.nightCount,
          dayCount: gameState.roundInfo.dayCount
        };

        const result = this.processRoleAbility(gameState, seat.id, roleId, context);

        if (result.success) {
          allSuggestions.push(...result.suggestions);
          if (result.statusChanges) allStatusChanges.push(...result.statusChanges);
          if (result.deaths) allDeaths.push(...result.deaths);
          if (result.chainReactions) allChainReactions.push(...result.chainReactions);
        }
      }
    }

    return {
      success: true,
      suggestions: allSuggestions.sort((a, b) => b.priority - a.priority),
      statusChanges: allStatusChanges,
      deaths: allDeaths,
      chainReactions: allChainReactions
    };
  }

  /**
   * 检查游戏结束条件
   */
  checkGameEndConditions(gameState: GameState): { shouldEnd: boolean; winner?: 'GOOD' | 'EVIL'; reason?: string } {
    const alivePlayers = gameState.seats.filter(s => !s.isDead && s.userId);

    // 检查恶魔是否死亡
    const demon = alivePlayers.find(s => {
      const role = getRealRoleId(s);
      return role === 'imp';
    });

    if (!demon) {
      // 检查是否有猩红女郎可以变形
      const scarletWoman = alivePlayers.find(s => {
        const role = getRealRoleId(s);
        return role === 'scarlet_woman';
      });

      if (!scarletWoman || alivePlayers.length < 5) {
        return {
          shouldEnd: true,
          winner: 'GOOD',
          reason: '恶魔被消灭'
        };
      }
    }

    // 检查是否只剩2人（包括恶魔）
    if (alivePlayers.length <= 2 && demon) {
      return {
        shouldEnd: true,
        winner: 'EVIL',
        reason: '邪恶阵营获胜（存活人数不足）'
      };
    }

    // 检查市长胜利条件（3人且没有处决）
    // 这需要在白天处决结算时检查

    return { shouldEnd: false };
  }

  /**
   * 获取配置
   */
  getConfig(): RoleAutomationConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RoleAutomationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// 导出单例（可选使用）
let engineInstance: RoleAutomationEngine | null = null;

export function getAutomationEngine(config?: Partial<RoleAutomationConfig>): RoleAutomationEngine {
  if (!engineInstance) {
    engineInstance = new RoleAutomationEngine(config);
  }
  return engineInstance;
}

export function resetAutomationEngine(): void {
  engineInstance = null;
}
