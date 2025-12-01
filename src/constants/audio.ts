// 本地音频文件路径（放置于 public/audio/ 目录）
export const AUDIO_TRACKS: Record<string, { name: string, url: string, phase?: string }> = {
  // 默认静音轨道
  silence: {
    name: '静音 (Silence)',
    url: '', // 空URL表示静音
  },
  // 本地音频文件
  lobby: {
    name: '神秘大厅 (Mystery)',
    url: '/audio/night.mp3', // 临时替换为安静的背景音
    phase: 'SETUP'
  },
  day_village: {
    name: '热闘讨论 (Day)',
    url: '/audio/day.mp3',
    phase: 'DAY'
  },
  night_ambience: {
    name: '静谧夜晚 (Night)',
    url: '/audio/night.mp3',
    phase: 'NIGHT'
  },
  voting: {
    name: '紧张投票 (Voting)',
    url: '/audio/voting.mp3',
    phase: 'VOTING'
  },
  nomination: {
    name: '提名阶段 (Nomination)',
    url: '/audio/nomination.mp3',
    phase: 'NOMINATION'
  },
  victory_good: {
    name: '善良胜利 (Good Wins)',
    url: '/audio/victory_good.mp3'
  },
  victory_evil: {
    name: '邪恶胜利 (Evil Wins)',
    url: '/audio/victory_evil.mp3'
  },
};

export const SOUND_EFFECTS = [
  { id: 'drum_roll', name: '🥁 鼓点', url: '/audio/sfx/drum_roll.mp3' },
  { id: 'shock', name: '😱 震惊', url: '/audio/sfx/shock.mp3' },
  { id: 'cheer', name: '🎉 欢呼', url: '/audio/sfx/cheer.mp3' },
  { id: 'bell', name: '🔔 钟声', url: '/audio/sfx/bell.mp3' },
  { id: 'wolf', name: '🐺 狼嚎', url: '/audio/sfx/wolf.mp3' },
  { id: 'sword', name: '⚔️ 拔剑', url: '/audio/sfx/sword.mp3' },
];

// 阶段到音轨的映射
export const PHASE_AUDIO_MAP: Record<string, string> = {
  SETUP: 'lobby',
  DAY: 'day_village',
  NIGHT: 'night_ambience',
  NOMINATION: 'nomination',
  VOTING: 'voting',
};
