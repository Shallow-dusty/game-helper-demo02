/**
 * Role Automation Types
 *
 * 角色自动化系统的类型定义
 * 支持三个自动化级别：新手(全自动)、资深(引导)、神话(手动)
 */

import type { GameState } from '../../types';

/**
 * 自动化级别
 * - FULL_AUTO: 新手模式 - 系统自动处理所有角色效果
 * - GUIDED: 资深模式 - 系统提供建议，ST确认/修改
 * - MANUAL: 神话模式 - ST完全手动处理
 */
export type AutomationLevel = 'FULL_AUTO' | 'GUIDED' | 'MANUAL';

/**
 * 角色能力类型
 */
export type AbilityType =
  | 'info'           // 信息类 (empath, chef, etc.)
  | 'protection'     // 保护类 (monk, soldier)
  | 'kill'           // 击杀类 (imp, slayer)
  | 'poison'         // 中毒类 (poisoner)
  | 'selection'      // 选择类 (butler, fortune_teller)
  | 'passive'        // 被动类 (virgin, saint, mayor)
  | 'transformation' // 变形类 (scarlet_woman)
  | 'special';       // 特殊类 (spy, recluse)

/**
 * 角色能力触发时机
 */
export type TriggerTiming =
  | 'first_night'     // 首夜
  | 'other_night'     // 非首夜
  | 'every_night'     // 每个夜晚
  | 'on_death'        // 死亡时
  | 'on_nomination'   // 被提名时
  | 'on_execution'    // 被处决时
  | 'day_action'      // 白天行动
  | 'passive';        // 被动（始终生效）

/**
 * 自动化建议
 */
export interface AutomationSuggestion {
  /** 建议ID */
  id: string;
  /** 角色ID */
  roleId: string;
  /** 座位ID */
  seatId: number;
  /** 建议类型 */
  type: 'info' | 'action' | 'effect' | 'warning';
  /** 建议标题 */
  title: string;
  /** 建议描述 */
  description: string;
  /** 建议的结果/信息（用于发送给玩家） */
  suggestedResult?: string;
  /** 真实结果（ST参考） */
  realResult?: string;
  /** 是否玩家被干扰（中毒/醉酒） */
  isTainted?: boolean;
  /** 优先级（越高越重要） */
  priority: number;
  /** 可选选项（用于GUIDED模式） */
  options?: AutomationOption[];
  /** 是否需要确认 */
  requiresConfirmation: boolean;
  /** 关联的目标座位 */
  targetSeatIds?: number[];
}

/**
 * 自动化选项（用于GUIDED模式）
 */
export interface AutomationOption {
  id: string;
  label: string;
  description?: string;
  isRecommended?: boolean;
  /** 选择此选项后的结果 */
  result: string;
  /** 需要的额外输入 */
  requiresInput?: {
    type: 'player' | 'players' | 'role' | 'text' | 'number';
    prompt: string;
    min?: number;
    max?: number;
  };
}

/**
 * 角色能力定义
 */
export interface RoleAbilityDef {
  /** 角色ID */
  roleId: string;
  /** 能力类型 */
  abilityType: AbilityType;
  /** 触发时机 */
  timing: TriggerTiming[];
  /** 是否为一次性能力 */
  isOncePerGame?: boolean;
  /** 能力处理函数 */
  process: (
    gameState: GameState,
    seatId: number,
    context: AbilityContext
  ) => AbilityResult;
}

/**
 * 能力处理上下文
 */
export interface AbilityContext {
  /** 自动化级别 */
  automationLevel: AutomationLevel;
  /** 是否首夜 */
  isFirstNight: boolean;
  /** 夜晚计数 */
  nightCount: number;
  /** 白天计数 */
  dayCount: number;
  /** 目标选择（如果有玩家输入） */
  targetSeatIds?: number[];
  /** 额外数据 */
  additionalData?: Record<string, unknown>;
  /** 红鲱鱼目标（占卜师专用） */
  redHerringId?: number;
  /** 被处决的座位ID（殓葬师专用） */
  executedSeatId?: number;
}

/**
 * 能力处理结果
 */
export interface AbilityResult {
  /** 是否成功 */
  success: boolean;
  /** 生成的建议 */
  suggestions: AutomationSuggestion[];
  /** 状态变更（如添加PROTECTED状态） */
  statusChanges?: StatusChange[];
  /** 死亡（如被击杀） */
  deaths?: DeathEvent[];
  /** 连锁反应（如血妖变形） */
  chainReactions?: ChainReaction[];
  /** 游戏结束条件 */
  gameEndCondition?: {
    winner: 'GOOD' | 'EVIL';
    reason: string;
  };
  /** 错误消息 */
  error?: string;
}

/**
 * 状态变更
 */
export interface StatusChange {
  seatId: number;
  status: 'POISONED' | 'DRUNK' | 'PROTECTED' | 'MADNESS';
  action: 'add' | 'remove';
  source: string; // 来源角色ID
  duration?: 'night' | 'day' | 'permanent';
}

/**
 * 死亡事件
 */
export interface DeathEvent {
  seatId: number;
  cause: 'demon_kill' | 'execution' | 'slayer' | 'ability' | 'other';
  killerRoleId?: string;
  isPreventable: boolean;
  /** 如果被保护（如僧侣保护），设置为 true */
  wasPrevented?: boolean;
  preventedBy?: string;
}

/**
 * 连锁反应
 */
export interface ChainReaction {
  type: 'scarlet_woman_transform' | 'imp_transfer' | 'mayor_win' | 'saint_loss' | 'other';
  description: string;
  targetSeatId?: number;
  newRoleId?: string;
}

/**
 * 规则违反确认请求
 */
export interface RuleViolationRequest {
  id: string;
  type: 'protection_override' | 'death_prevention' | 'ability_bypass';
  title: string;
  description: string;
  /** 违反的规则 */
  violatedRule: string;
  /** 需要的确认次数（用于多重确认） */
  confirmationsRequired: number;
  /** 已确认次数 */
  confirmationsReceived: number;
  /** 确认后的回调 */
  onConfirm: () => void;
}

/**
 * 角色自动化配置
 */
export interface RoleAutomationConfig {
  /** 当前自动化级别 */
  level: AutomationLevel;
  /** 是否启用规则检查 */
  enableRuleChecks: boolean;
  /** 规则违反是否需要多重确认 */
  ruleViolationConfirmations: number;
  /** 是否自动应用状态变更 */
  autoApplyStatusChanges: boolean;
  /** 是否自动处理死亡 */
  autoProcessDeaths: boolean;
  /** 特定角色的自定义配置 */
  roleOverrides?: Record<string, {
    level?: AutomationLevel;
    disabled?: boolean;
  }>;
}

/**
 * 默认配置
 */
export const DEFAULT_AUTOMATION_CONFIG: RoleAutomationConfig = {
  level: 'GUIDED',
  enableRuleChecks: true,
  ruleViolationConfirmations: 2,
  autoApplyStatusChanges: true,
  autoProcessDeaths: false,
  roleOverrides: {}
};

/**
 * 角色分类（按自动化复杂度）
 */
export const ROLE_AUTOMATION_CATEGORIES = {
  /** 全自动可处理（无需ST干预） */
  fullyAutomatable: [
    'empath', 'chef', 'washerwoman', 'librarian', 'investigator',
    'soldier', 'drunk', 'saint'
  ],
  /** 需要目标选择 */
  requiresTargetSelection: [
    'fortune_teller', 'monk', 'poisoner', 'imp', 'butler', 'slayer'
  ],
  /** 需要特殊处理 */
  requiresSpecialHandling: [
    'ravenkeeper', 'virgin', 'scarlet_woman', 'mayor', 'spy', 'recluse', 'undertaker'
  ]
} as const;

/**
 * 暗流涌动角色列表
 */
export const TROUBLE_BREWING_ROLES = {
  townsfolk: [
    'washerwoman', 'librarian', 'investigator', 'chef', 'empath',
    'fortune_teller', 'undertaker', 'monk', 'ravenkeeper', 'virgin',
    'slayer', 'soldier', 'mayor'
  ],
  outsiders: ['butler', 'drunk', 'recluse', 'saint'],
  minions: ['poisoner', 'spy', 'scarlet_woman', 'baron'],
  demons: ['imp']
} as const;
