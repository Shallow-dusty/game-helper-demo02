/**
 * 音频路径映射模块
 * 集中管理所有音频资源路径，避免硬编码
 */

// ============ BGM 路径常量 ============

export const BGM_PATHS = {
  // 大厅/设置阶段
  LOBBY: '/audio/night.mp3',
  
  // 白天阶段
  DAY: '/audio/day.mp3',
  
  // 夜晚阶段
  NIGHT: '/audio/night.mp3',
  
  // 投票阶段
  VOTING: '/audio/voting.mp3',
  
  // 提名阶段
  NOMINATION: '/audio/nomination.mp3',
  
  // 胜利音乐
  VICTORY_GOOD: '/audio/victory_good.mp3',
  VICTORY_EVIL: '/audio/victory_evil.mp3',
} as const;

// ============ 音效路径常量 ============

export const SFX_PATHS = {
  DRUM_ROLL: '/audio/sfx/drum_roll.mp3',
  SHOCK: '/audio/sfx/shock.mp3',
  CHEER: '/audio/sfx/cheer.mp3',
  BELL: '/audio/sfx/bell.mp3',
  WOLF: '/audio/sfx/wolf.mp3',
  SWORD: '/audio/sfx/sword.mp3',
} as const;

// ============ 类型定义 ============

export type BgmKey = keyof typeof BGM_PATHS;
export type SfxKey = keyof typeof SFX_PATHS;
export type GamePhase = 'SETUP' | 'DAY' | 'NIGHT' | 'NOMINATION' | 'VOTING';

// ============ 阶段到 BGM 的映射 ============

const PHASE_TO_BGM: Record<GamePhase, BgmKey> = {
  SETUP: 'LOBBY',
  DAY: 'DAY',
  NIGHT: 'NIGHT',
  NOMINATION: 'NOMINATION',
  VOTING: 'VOTING',
};

// ============ 辅助函数 ============

/**
 * 获取指定游戏阶段的 BGM 路径
 * @param phase 游戏阶段
 * @returns BGM 文件路径
 */
export function getBgmForPhase(phase: GamePhase): string {
  const bgmKey = PHASE_TO_BGM[phase];
  return BGM_PATHS[bgmKey];
}

/**
 * 获取胜利 BGM 路径
 * @param isGoodVictory 是否善良阵营胜利
 * @returns 胜利 BGM 文件路径
 */
export function getVictoryBgm(isGoodVictory: boolean): string {
  return isGoodVictory ? BGM_PATHS.VICTORY_GOOD : BGM_PATHS.VICTORY_EVIL;
}

/**
 * 获取音效路径
 * @param sfxId 音效ID（小写带下划线格式）
 * @returns 音效文件路径，如果不存在返回 undefined
 */
export function getSfxPath(sfxId: string): string | undefined {
  const key = sfxId.toUpperCase() as SfxKey;
  return SFX_PATHS[key];
}

/**
 * 获取所有可用的 BGM 列表（用于 UI 选择）
 */
export function getAvailableBgmList(): { id: string; name: string; url: string; phase?: GamePhase }[] {
  return [
    { id: 'silence', name: '静音 (Silence)', url: '' },
    { id: 'lobby', name: '神秘大厅 (Mystery)', url: BGM_PATHS.LOBBY, phase: 'SETUP' },
    { id: 'day_village', name: '热闘讨论 (Day)', url: BGM_PATHS.DAY, phase: 'DAY' },
    { id: 'night_ambience', name: '静谧夜晚 (Night)', url: BGM_PATHS.NIGHT, phase: 'NIGHT' },
    { id: 'voting', name: '紧张投票 (Voting)', url: BGM_PATHS.VOTING, phase: 'VOTING' },
    { id: 'nomination', name: '提名阶段 (Nomination)', url: BGM_PATHS.NOMINATION, phase: 'NOMINATION' },
    { id: 'victory_good', name: '善良胜利 (Good Wins)', url: BGM_PATHS.VICTORY_GOOD },
    { id: 'victory_evil', name: '邪恶胜利 (Evil Wins)', url: BGM_PATHS.VICTORY_EVIL },
  ];
}

/**
 * 获取所有可用的音效列表（用于 UI 选择）
 */
export function getAvailableSfxList(): { id: string; name: string; url: string }[] {
  return [
    { id: 'drum_roll', name: '🥁 鼓点', url: SFX_PATHS.DRUM_ROLL },
    { id: 'shock', name: '😱 震惊', url: SFX_PATHS.SHOCK },
    { id: 'cheer', name: '🎉 欢呼', url: SFX_PATHS.CHEER },
    { id: 'bell', name: '🔔 钟声', url: SFX_PATHS.BELL },
    { id: 'wolf', name: '🐺 狼嚎', url: SFX_PATHS.WOLF },
    { id: 'sword', name: '⚔️ 拔剑', url: SFX_PATHS.SWORD },
  ];
}
