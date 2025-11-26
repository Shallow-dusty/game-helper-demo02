
import { RoleDef, ScriptDef } from './types';

export const ROLES: Record<string, RoleDef> = {
  // --- TROUBLE BREWING (TB) ---
  washerwoman: { id: 'washerwoman', name: '洗衣妇', team: 'TOWNSFOLK', ability: '开局知晓一张村民牌。', firstNight: true },
  librarian: { id: 'librarian', name: '图书管理员', team: 'TOWNSFOLK', ability: '开局知晓一张外来者牌。', firstNight: true },
  investigator: { id: 'investigator', name: '调查员', team: 'TOWNSFOLK', ability: '开局知晓一张爪牙牌。', firstNight: true },
  chef: { id: 'chef', name: '厨师', team: 'TOWNSFOLK', ability: '知晓邪恶玩家的相邻对数。', firstNight: true },
  empath: { id: 'empath', name: '共情者', team: 'TOWNSFOLK', ability: '知晓邻座有多少邪恶玩家。', otherNight: true },
  fortune_teller: { id: 'fortune_teller', name: '占卜师', team: 'TOWNSFOLK', ability: '每晚选择两名玩家检测是否为恶魔。', otherNight: true, icon: '🔮', nightAction: { type: 'choose_two_players', prompt: '选择两名玩家进行查验' } },
  undertaker: { id: 'undertaker', name: '掘墓人', team: 'TOWNSFOLK', ability: '知晓白天被处决玩家的角色。', otherNight: true },
  monk: { id: 'monk', name: '僧侣', team: 'TOWNSFOLK', ability: '每晚保护一名玩家免受恶魔伤害。', otherNight: true, icon: '🛡️', nightAction: { type: 'choose_player', prompt: '选择一名玩家进行保护' } },
  ravenkeeper: { id: 'ravenkeeper', name: '守鸦人', team: 'TOWNSFOLK', ability: '若在夜晚死亡,选择一名玩家查验身份。', otherNight: true, icon: '🦅', nightAction: { type: 'choose_player', prompt: '选择一名玩家查验身份(仅夜间死亡时)' } },
  virgin: { id: 'virgin', name: '处女', team: 'TOWNSFOLK', ability: '首次被提名为村民时，立即处决提名者。', icon: '🕯️' },
  slayer: { id: 'slayer', name: '杀手', team: 'TOWNSFOLK', ability: '每局游戏限一次，选择一名玩家击杀恶魔。', icon: '🏹' },
  soldier: { id: 'soldier', name: '士兵', team: 'TOWNSFOLK', ability: '免受恶魔伤害。', icon: '🛡️' },
  mayor: { id: 'mayor', name: '市长', team: 'TOWNSFOLK', ability: '若只剩3名玩家，票死别人即可获胜。', icon: '🏅' },
  butler: { id: 'butler', name: '管家', team: 'OUTSIDER', ability: '除非主人投票，否则不能投票。', otherNight: true },
  drunk: { id: 'drunk', name: '酒鬼', team: 'OUTSIDER', ability: '你以为你是村民，其实你不是。', icon: '🍺' },
  recluse: { id: 'recluse', name: '隐士', team: 'OUTSIDER', ability: '可能被判定为邪恶/爪牙/恶魔。' },
  saint: { id: 'saint', name: '圣徒', team: 'OUTSIDER', ability: '若被处决，你所在的阵营失败。', icon: '☠️' },
  poisoner: { id: 'poisoner', name: '投毒者', team: 'MINION', ability: '每晚对一名玩家下毒。', otherNight: true, icon: '🧪', nightAction: { type: 'choose_player', prompt: '选择一名玩家下毒' } },
  spy: { id: 'spy', name: '间谍', team: 'MINION', ability: '可以查看魔典。', otherNight: true, icon: '🕵️' },
  scarlet_woman: { id: 'scarlet_woman', name: '猩红女巫', team: 'MINION', ability: '若恶魔死亡，你成为新的恶魔。' },
  baron: { id: 'baron', name: '男爵', team: 'MINION', ability: '增加2名外来者代替村民。', firstNight: true },
  imp: { id: 'imp', name: '小恶魔', team: 'DEMON', ability: '每晚击杀一名玩家。可以自杀传位。', otherNight: true, icon: '😈', nightAction: { type: 'choose_player', prompt: '选择一名玩家击杀' } },

  // --- BAD MOON RISING (BMR) ---
  grandmother: { id: 'grandmother', name: '祖母', team: 'TOWNSFOLK', ability: '知晓孙子是谁，孙子死你也死。', firstNight: true },
  sailor: { id: 'sailor', name: '水手', team: 'TOWNSFOLK', ability: '喝酒。除非醉酒，否则不死。', otherNight: true, icon: '⚓' },
  chambermaid: { id: 'chambermaid', name: '女仆', team: 'TOWNSFOLK', ability: '每晚选两名玩家，知晓他们今晚醒没醒。', otherNight: true },
  exorcist: { id: 'exorcist', name: '驱魔人', team: 'TOWNSFOLK', ability: '每晚选择一名玩家，若为恶魔，恶魔无法醒来。', otherNight: true },
  innkeeper: { id: 'innkeeper', name: '旅店老板', team: 'TOWNSFOLK', ability: '保护两名玩家，其中一人喝醉。', otherNight: true },
  gambler: { id: 'gambler', name: '赌徒', team: 'TOWNSFOLK', ability: '猜一名玩家角色，猜对没事，猜错死。', otherNight: true },
  gossip: { id: 'gossip', name: '造谣者', team: 'TOWNSFOLK', ability: '白天造谣，若为真，当晚死一人。', icon: '💬' },
  courtier: { id: 'courtier', name: '侍臣', team: 'TOWNSFOLK', ability: '使一名角色醉酒三天三夜。', otherNight: true },
  professor: { id: 'professor', name: '教授', team: 'TOWNSFOLK', ability: '复活一名死去的村民（限一次）。', otherNight: true, icon: '⚗️' },
  minstrel: { id: 'minstrel', name: '吟游诗人', team: 'TOWNSFOLK', ability: '爪牙死后，所有人醉酒直到明天。' },
  tea_lady: { id: 'tea_lady', name: '茶女郎', team: 'TOWNSFOLK', ability: '若邻居都是好人，他们不死。' },
  pacifist: { id: 'pacifist', name: '和平主义者', team: 'TOWNSFOLK', ability: '被处决的好人可能不死。' },
  fool: { id: 'fool', name: '弄臣', team: 'TOWNSFOLK', ability: '第一次死不会死。', icon: '🎭' },
  goon: { id: 'goon', name: '暴徒', team: 'OUTSIDER', ability: '第一个选你的玩家变醉酒，你变阵营。', otherNight: true },
  lunatic: { id: 'lunatic', name: '疯子', team: 'OUTSIDER', ability: '你以为你是恶魔。', firstNight: true, otherNight: true },
  tinker: { id: 'tinker', name: '工匠', team: 'OUTSIDER', ability: '你随时可能莫名其妙死亡。' },
  moonchild: { id: 'moonchild', name: '月之子', team: 'OUTSIDER', ability: '你死后选一名玩家，如果是好人他今晚死。' },
  godfather: { id: 'godfather', name: '教父', team: 'MINION', ability: '外来者死后，你杀一人。', otherNight: true },
  devil_advocate: { id: 'devil_advocate', name: '魔鬼代言人', team: 'MINION', ability: '被处决的玩家不死。', otherNight: true },
  assassin: { id: 'assassin', name: '刺客', team: 'MINION', ability: '限一次，无视保护杀一人。', otherNight: true, icon: '🗡️' },
  mastermind: { id: 'mastermind', name: '主谋', team: 'MINION', ability: '恶魔死后游戏继续，如果处决了你，恶魔输。' },
  zombuul: { id: 'zombuul', name: '僵尸', team: 'DEMON', ability: '第一次死看起来像死，其实没死。没死人晚上才能杀人。', otherNight: true, icon: '🧟' },
  pukka: { id: 'pukka', name: '普卡', team: 'DEMON', ability: '每晚选人下毒，该人次晚死亡。', otherNight: true, icon: '🐍' },
  shabaloth: { id: 'shabaloth', name: '沙巴洛斯', team: 'DEMON', ability: '每晚杀两人。可能复活一人。', otherNight: true, icon: '👹' },
  po: { id: 'po', name: '珀', team: 'DEMON', ability: '可以空刀。空刀后每晚杀三人。', otherNight: true, icon: '🎐' },

  // --- SECTS & VIOLETS (SV) ---
  clockmaker: { id: 'clockmaker', name: '钟表匠', team: 'TOWNSFOLK', ability: '知晓恶魔与最近爪牙的距离。', firstNight: true },
  dreamer: { id: 'dreamer', name: '筑梦师', team: 'TOWNSFOLK', ability: '每晚选玩家，知晓两个身份（一真一假）。', otherNight: true },
  snake_charmer: { id: 'snake_charmer', name: '弄蛇人', team: 'TOWNSFOLK', ability: '每晚选玩家，若是恶魔，你们互换。', otherNight: true },
  mathematician: { id: 'mathematician', name: '数学家', team: 'TOWNSFOLK', ability: '知晓有多少玩家因能力获得错误信息。', otherNight: true },
  flowergirl: { id: 'flowergirl', name: '卖花女', team: 'TOWNSFOLK', ability: '知晓恶魔今天是否投了票。', otherNight: true },
  town_crier: { id: 'town_crier', name: '城镇公告员', team: 'TOWNSFOLK', ability: '知晓爪牙今天是否投了票。', otherNight: true },
  oracle: { id: 'oracle', name: '神谕者', team: 'TOWNSFOLK', ability: '知晓多少死去的玩家是邪恶的。', otherNight: true },
  savant: { id: 'savant', name: '博学者', team: 'TOWNSFOLK', ability: '每天获得两条信息，一真一假。' },
  seamstress: { id: 'seamstress', name: '裁缝', team: 'TOWNSFOLK', ability: '限一次，检测两名玩家是否同一阵营。', otherNight: true },
  philosopher: { id: 'philosopher', name: '哲学家', team: 'TOWNSFOLK', ability: '限一次，获得已出场角色能力。' },
  artist: { id: 'artist', name: '艺术家', team: 'TOWNSFOLK', ability: '限一次，问一个是非题。' },
  juggler: { id: 'juggler', name: '杂耍艺人', team: 'TOWNSFOLK', ability: '白天猜5个人，晚上知晓猜对几个。', icon: '🤹' },
  sage: { id: 'sage', name: '贤者', team: 'TOWNSFOLK', ability: '被恶魔杀时，知晓两个恶魔备选。' },
  mutant: { id: 'mutant', name: '变种人', team: 'OUTSIDER', ability: '若对ST以外的人承认自己是外来者，可能会死。' },
  sweetheart: { id: 'sweetheart', name: '心上人', team: 'OUTSIDER', ability: '死后一名玩家醉酒。' },
  barber: { id: 'barber', name: '理发师', team: 'OUTSIDER', ability: '死后恶魔可以互换两名玩家角色。' },
  klutz: { id: 'klutz', name: '笨蛋', team: 'OUTSIDER', ability: '死后选一名玩家，若是邪恶，游戏输。' },
  witch: { id: 'witch', name: '女巫', team: 'MINION', ability: '诅咒一名玩家，若其提名则死亡。', otherNight: true, icon: '🧙' },
  cerenovus: { id: 'cerenovus', name: '洗脑师', team: 'MINION', ability: '指定玩家必须疯狂证明自己是某角色。', otherNight: true },
  pit_hag: { id: 'pit_hag', name: '老巫婆', team: 'MINION', ability: '每晚将一人变成新角色。', otherNight: true },
  evil_twin: { id: 'evil_twin', name: '邪恶双子', team: 'MINION', ability: '你有双胞胎。只要你们都活，好人无法赢。' },
  fang_gu: { id: 'fang_gu', name: '方古', team: 'DEMON', ability: '若杀外来者，他变恶魔你死。', otherNight: true, icon: '👹' },
  vigormortis: { id: 'vigormortis', name: '维果莫蒂斯', team: 'DEMON', ability: '杀爪牙，爪牙保留能力且看起来活着。', otherNight: true },
  no_dashii: { id: 'no_dashii', name: '诺达希', team: 'DEMON', ability: '邻居中毒。', otherNight: true },
  vortox: { id: 'vortox', name: '沃托克斯', team: 'DEMON', ability: '所有人信息皆假。没人被处决则邪恶赢。', otherNight: true, icon: '🌀' },
};

export const SCRIPTS: Record<string, ScriptDef> = {
  'tb': {
    id: 'tb',
    name: '暗流涌动 (Trouble Brewing)',
    roles: [
      'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller', 'undertaker', 'monk', 'ravenkeeper', 'virgin', 'slayer', 'soldier', 'mayor',
      'butler', 'drunk', 'recluse', 'saint',
      'poisoner', 'spy', 'scarlet_woman', 'baron',
      'imp'
    ]
  },
  'bmr': {
    id: 'bmr',
    name: '血月升起 (Bad Moon Rising)',
    roles: [
      'grandmother', 'sailor', 'chambermaid', 'exorcist', 'innkeeper', 'gambler', 'gossip', 'courtier', 'professor', 'minstrel', 'tea_lady', 'pacifist', 'fool',
      'goon', 'lunatic', 'tinker', 'moonchild',
      'godfather', 'devil_advocate', 'assassin', 'mastermind',
      'zombuul', 'pukka', 'shabaloth', 'po'
    ]
  },
  'sv': {
    id: 'sv',
    name: '紫罗兰教派 (Sects & Violets)',
    roles: [
      'clockmaker', 'dreamer', 'snake_charmer', 'mathematician', 'flowergirl', 'town_crier', 'oracle', 'savant', 'seamstress', 'philosopher', 'artist', 'juggler', 'sage',
      'mutant', 'sweetheart', 'barber', 'klutz',
      'witch', 'cerenovus', 'pit_hag', 'evil_twin',
      'fang_gu', 'vigormortis', 'no_dashii', 'vortox'
    ]
  }
};

export const TEAM_COLORS = {
  TOWNSFOLK: '#3b82f6', // Blue
  OUTSIDER: '#0ea5e9', // Light Blue
  MINION: '#f97316', // Orange
  DEMON: '#ef4444', // Red
  TRAVELER: '#a855f7', // Purple
};

// Night orders are usually dynamic based on script. 
// For simplicity in this demo, we merge them or check presence.
// In a real app, define night order per script.
export const NIGHT_ORDER_FIRST = [
  'philosopher', 'barman', 'poisoner', 'snake_charmer', 'bookworm', 'evil_twin', 'witch', 'cerenovus',
  'minstrel', 'godfather', 'devil_advocate', 'lunatic', 'exorcist', 'innkeeper', 'gambler', 'chambermaid', 'sailor', 'courtier',
  'grandmother', 'demon', 'imp', 'zombuul', 'pukka', 'shabaloth', 'po', 'fang_gu', 'vigormortis', 'no_dashii', 'vortox',
  'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller', 'butler', 'spy',
  'steward', 'knight', 'shaman', 'clockmaker', 'dreamer', 'seamstress', 'mathematician', 'noble', 'pixie'
];

export const NIGHT_ORDER_OTHER = [
  'philosopher', 'poisoner', 'snake_charmer', 'witch', 'cerenovus', 'pit_hag',
  'monk', 'exorcist', 'innkeeper', 'gambler', 'chambermaid', 'sailor', 'courtier',
  'godfather', 'devil_advocate', 'assassin',
  'imp', 'zombuul', 'pukka', 'shabaloth', 'po', 'fang_gu', 'vigormortis', 'no_dashii', 'vortox',
  'scarlet_woman', 'ravenkeeper', 'undertaker', 'empath', 'fortune_teller', 'butler', 'spy',
  'dreamer', 'flowergirl', 'town_crier', 'oracle', 'seamstress', 'mathematician', 'juggler', 'artist', 'savant', 'barber', 'sweetheart', 'sage', 'mutant'
];

export const PHASE_LABELS: Record<string, string> = {
  SETUP: '准备阶段',
  NIGHT: '夜晚',
  DAY: '白天',
  NOMINATION: '提名',
  VOTING: '投票',
};

export const TEAM_LABELS: Record<string, string> = {
  TOWNSFOLK: '村民',
  OUTSIDER: '外来者',
  MINION: '爪牙',
  DEMON: '恶魔',
  TRAVELER: '旅行者',
};

export const STATUS_ICONS: Record<string, string> = {
  'POISONED': '🤢',
  'DRUNK': '🍺',
  'PROTECTED': '🛡️',
  'MADNESS': '🤪'
};

export const AUDIO_TRACKS: Record<string, { name: string, url: string }> = {
  lobby: { name: '神秘大厅 (Mystery)', url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_1be8a84784.mp3' },
  day_village: { name: '热闹集市 (Day)', url: 'https://cdn.pixabay.com/download/audio/2022/10/28/audio_b82a693e79.mp3' },
  night_ambience: { name: '静谧午夜 (Quiet)', url: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_91b0290b7c.mp3' },
  night_horror: { name: '恐怖时刻 (Horror)', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
  voting: { name: '审判之时 (Voting)', url: 'https://cdn.pixabay.com/download/audio/2020/09/14/audio_a03f5519d3.mp3' },
};

export const PRESET_REMINDERS = [
  { text: '中毒', icon: '🤢', color: 'text-green-400' },
  { text: '醉酒', icon: '🍺', color: 'text-amber-400' },
  { text: '保护', icon: '🛡️', color: 'text-blue-400' },
  { text: '死亡', icon: '💀', color: 'text-red-500' },
  { text: '疯狂', icon: '🤪', color: 'text-purple-400' },
  { text: '复活', icon: '🌅', color: 'text-yellow-200' },
  { text: '自定义', icon: '📝', color: 'text-stone-300' },
];

export const STATUS_OPTIONS = [
  { id: 'POISONED', label: '中毒 (Poison)', icon: '🤢' },
  { id: 'DRUNK', label: '醉酒 (Drunk)', icon: '🍺' },
  { id: 'PROTECTED', label: '保护 (Protect)', icon: '🛡️' },
  { id: 'MADNESS', label: '疯狂 (Madness)', icon: '🤪' },
];
