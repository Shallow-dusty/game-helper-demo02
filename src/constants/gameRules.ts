/**
 * 游戏规则常量
 *
 * 定义《血染钟楼》游戏的核心规则数值，避免魔法数字
 */

export const GAME_RULES = {
  /**
   * 邪恶胜利所需的最少存活人数阈值
   * 当存活人数 <= 2 时，邪恶阵营获胜
   */
  EVIL_WIN_THRESHOLD: 2,

  /**
   * 市长技能触发的存活人数
   * 当场上剩余 3 人且市长存活时，处决任何人好人立即获胜
   */
  MAYOR_TRIGGER_COUNT: 3,

  /**
   * 处决所需的投票比例
   * 需要达到存活人数的一半（至少 50%）才能处决
   */
  EXECUTION_VOTE_RATIO: 0.5,
} as const;
