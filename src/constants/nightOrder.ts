/**
 * 夜间行动顺序配置
 *
 * 按剧本分离的夜间行动顺序，符合官方规则
 * 参考: https://wiki.bloodontheclocktower.com/Night_Order
 */

// ============================================================================
// Trouble Brewing (TB) 剧本
// ============================================================================

/** TB 首夜顺序 */
export const TB_NIGHT_ORDER_FIRST = [
  'poisoner',        // 投毒者
  'washerwoman',     // 洗衣妇
  'librarian',       // 图书管理员
  'investigator',    // 调查员
  'chef',            // 厨师
  'empath',          // 共情者
  'fortune_teller',  // 占卜师
  'butler',          // 管家
  'spy',             // 间谍
] as const;

/** TB 其他夜顺序 */
export const TB_NIGHT_ORDER_OTHER = [
  'poisoner',        // 投毒者
  'monk',            // 僧侣
  'scarlet_woman',   // 猩红女巫（恶魔死亡时检查）
  'imp',             // 小恶魔
  'ravenkeeper',     // 守鸦人
  'empath',          // 共情者
  'fortune_teller',  // 占卜师
  'undertaker',      // 掘墓人
  'butler',          // 管家
  'spy',             // 间谍
] as const;

// ============================================================================
// Bad Moon Rising (BMR) 剧本
// ============================================================================

/** BMR 首夜顺序 */
export const BMR_NIGHT_ORDER_FIRST = [
  'lunatic',         // 疯子
  'sailor',          // 水手
  'courtier',        // 侍臣
  'godfather',       // 教父
  'devil_advocate',  // 魔鬼代言人
  'grandmother',     // 祖母
  'chambermaid',     // 女仆
  // 恶魔（首夜通常不行动，但需要唤醒爪牙）
] as const;

/** BMR 其他夜顺序 */
export const BMR_NIGHT_ORDER_OTHER = [
  'sailor',          // 水手
  'innkeeper',       // 旅店老板
  'gambler',         // 赌徒
  'exorcist',        // 驱魔人
  'courtier',        // 侍臣
  'godfather',       // 教父
  'devil_advocate',  // 魔鬼代言人
  'assassin',        // 刺客
  'zombuul',         // 僵尸
  'pukka',           // 普卡
  'shabaloth',       // 沙巴洛斯
  'po',              // 珀
  'goon',            // 暴徒
  'chambermaid',     // 女仆
  'professor',       // 教授
  'tinker',          // 工匠
] as const;

// ============================================================================
// Sects & Violets (SV) 剧本
// ============================================================================

/** SV 首夜顺序 */
export const SV_NIGHT_ORDER_FIRST = [
  'philosopher',     // 哲学家
  'snake_charmer',   // 弄蛇人
  'evil_twin',       // 邪恶双子
  'witch',           // 女巫
  'cerenovus',       // 洗脑师
  'clockmaker',      // 钟表匠
  'dreamer',         // 筑梦师
  'seamstress',      // 裁缝
  'mathematician',   // 数学家
] as const;

/** SV 其他夜顺序 */
export const SV_NIGHT_ORDER_OTHER = [
  'philosopher',     // 哲学家
  'snake_charmer',   // 弄蛇人
  'witch',           // 女巫
  'cerenovus',       // 洗脑师
  'pit_hag',         // 老巫婆
  'fang_gu',         // 方古
  'vigormortis',     // 维果莫蒂斯
  'no_dashii',       // 诺达希
  'vortox',          // 沃托克斯
  'dreamer',         // 筑梦师
  'flowergirl',      // 卖花女
  'town_crier',      // 城镇公告员
  'oracle',          // 神谕者
  'seamstress',      // 裁缝
  'mathematician',   // 数学家
  'juggler',         // 杂耍艺人
  'barber',          // 理发师
  'sweetheart',      // 心上人
  'sage',            // 贤者
] as const;

// ============================================================================
// 按剧本索引
// ============================================================================

export type ScriptId = 'tb' | 'bmr' | 'sv';

export interface ScriptNightOrder {
  first: readonly string[];
  other: readonly string[];
}

/**
 * 按剧本ID获取夜间顺序
 */
export const SCRIPT_NIGHT_ORDERS: Record<ScriptId, ScriptNightOrder> = {
  tb: {
    first: TB_NIGHT_ORDER_FIRST,
    other: TB_NIGHT_ORDER_OTHER,
  },
  bmr: {
    first: BMR_NIGHT_ORDER_FIRST,
    other: BMR_NIGHT_ORDER_OTHER,
  },
  sv: {
    first: SV_NIGHT_ORDER_FIRST,
    other: SV_NIGHT_ORDER_OTHER,
  },
};

/**
 * 获取指定剧本的夜间顺序
 * @param scriptId 剧本ID
 * @param isFirstNight 是否为首夜
 * @returns 夜间行动顺序数组
 */
export function getNightOrder(scriptId: string, isFirstNight: boolean): readonly string[] {
  const scriptOrder = SCRIPT_NIGHT_ORDERS[scriptId as ScriptId];
  if (scriptOrder) {
    return isFirstNight ? scriptOrder.first : scriptOrder.other;
  }
  // 回退到合并顺序（自定义剧本）
  return isFirstNight ? NIGHT_ORDER_FIRST : NIGHT_ORDER_OTHER;
}

// ============================================================================
// 向后兼容：合并所有剧本的夜间顺序
// ============================================================================

/**
 * 合并的首夜顺序（用于自定义剧本或向后兼容）
 * @deprecated 建议使用 getNightOrder(scriptId, true) 获取剧本特定顺序
 */
export const NIGHT_ORDER_FIRST = [
  // SV 角色
  'philosopher', 'snake_charmer', 'evil_twin', 'witch', 'cerenovus',
  // BMR 角色
  'lunatic', 'sailor', 'courtier', 'godfather', 'devil_advocate', 'grandmother',
  'exorcist', 'innkeeper', 'gambler', 'chambermaid',
  // 恶魔（所有剧本）
  'imp', 'zombuul', 'pukka', 'shabaloth', 'po', 'fang_gu', 'vigormortis', 'no_dashii', 'vortox',
  // TB 角色
  'poisoner', 'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller', 'butler', 'spy',
  // SV 信息角色
  'clockmaker', 'dreamer', 'seamstress', 'mathematician',
] as const;

/**
 * 合并的其他夜顺序（用于自定义剧本或向后兼容）
 * @deprecated 建议使用 getNightOrder(scriptId, false) 获取剧本特定顺序
 */
export const NIGHT_ORDER_OTHER = [
  // SV 角色
  'philosopher', 'snake_charmer', 'witch', 'cerenovus', 'pit_hag',
  // BMR 角色
  'sailor', 'innkeeper', 'gambler', 'exorcist', 'courtier', 'godfather', 'devil_advocate', 'assassin',
  // TB 角色
  'poisoner', 'monk',
  // 恶魔
  'imp', 'zombuul', 'pukka', 'shabaloth', 'po', 'fang_gu', 'vigormortis', 'no_dashii', 'vortox',
  // TB 后续角色
  'scarlet_woman', 'ravenkeeper', 'undertaker', 'empath', 'fortune_teller', 'butler', 'spy',
  // SV/BMR 信息角色
  'dreamer', 'flowergirl', 'town_crier', 'oracle', 'seamstress', 'mathematician',
  'juggler', 'artist', 'savant', 'barber', 'sweetheart', 'sage', 'chambermaid',
  'goon', 'professor', 'tinker', 'mutant',
] as const;
