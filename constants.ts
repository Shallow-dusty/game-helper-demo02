
import { RoleDef, ScriptDef } from './types';

export const ROLES: Record<string, RoleDef> = {
  // --- TROUBLE BREWING (TB) ---
  washerwoman: {
    id: 'washerwoman',
    name: '洗衣妇',
    team: 'TOWNSFOLK',
    firstNight: true,
    ability: '开局时，你能得知一名镇民和一位玩家，该玩家是该镇民或另一个特定镇民。',
    detailedDescription: '**官方规则**: 首夜，你会看到两个玩家和一个镇民角色。其中一个玩家是该镇民，另一个可能是任何角色。\n\n**补充说明**:\n• 选人方式：说书人指定\n• 信息可能被下毒或醉酒影响'
  },
  librarian: {
    id: 'librarian',
    name: '图书管理员',
    team: 'TOWNSFOLK',
    firstNight: true,
    ability: '开局时，你能得知一名外来者和一位玩家，该玩家是该外来者或另一个特定外来者。',
    detailedDescription: '**官方规则**: 首夜，你会看到两个玩家和一个外来者角色。其中一个玩家是该外来者。\n\n**补充说明**:\n• 选人方式：说书人指定\n• 如果没有外来者，会显示错误信息'
  },
  investigator: {
    id: 'investigator',
    name: '调查员',
    team: 'TOWNSFOLK',
    firstNight: true,
    ability: '开局时，你能得知两名玩家和一个爪牙身份，这两名玩家其中恰好有一名是该爪牙。',
    detailedDescription: '**官方规则**: 首夜，你会看到两个玩家和一个爪牙角色。其中恰好一个玩家是该爪牙。\n\n**补充说明**:\n• 选人方式：说书人指定\n• 另一个玩家一定不是该爪牙（但可能是其他邪恶角色）'
  },
  chef: {
    id: 'chef',
    name: '厨师',
    team: 'TOWNSFOLK',
    ability: '知晓邪恶玩家的相邻对数。',
    firstNight: true,
    detailedDescription: '**官方规则**: 首夜，说书人会告诉你场上有多少对邻座的邪恶玩家。\n\n**补充说明**:\n• 若ABC三人连坐，AB都是邪恶，BC都是邪恶，则为2对（不是3对）\n• 如果所有邪恶都不相邻，你会得到0\n• 信息可能被下毒或醉酒影响'
  },
  empath: {
    id: 'empath',
    name: '共情者',
    team: 'TOWNSFOLK',
    ability: '知晓邻座有多少邪恶玩家。',
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚（包括首夜），你会得知你的两个邻居中有几个是邪恶阵营。\n\n**补充说明**:\n• 可能的结果：0、1或2\n• 如果你的邻居死亡，仍然计入\n• 如果游戏中途换位，按新位置计算\n• 信息可能被下毒或醉酒影响'
  },
  fortune_teller: {
    id: 'fortune_teller',
    name: '占卜师',
    team: 'TOWNSFOLK',
    ability: '每晚选择两名玩家检测是否为恶魔。',
    otherNight: true,
    icon: '🔮',
    nightAction: { type: 'choose_two_players', prompt: '选择两名玩家进行查验' },
    detailedDescription: '**官方规则**: 每晚，你选择两名玩家。说书人会告诉你，他们中是否有恶魔。如果他们中有一个恶魔，你会得到“是”；如果没有，你会得到“否”。\n\n**补充说明**:\n• 选人方式：你指定\n• 如果你选择的两人中有一个是恶魔，你只会知道“是”，但不知道具体是哪一个。\n• 如果你选择的两人中有一个是红鲱鱼（Red Herring），你也会得到“是”，即使没有恶魔。\n• 红鲱鱼是说书人可以指定的一个非恶魔角色，其效果是让占卜师在选择到他时，总是得到“是”的信息。'
  },
  undertaker: {
    id: 'undertaker',
    name: '掘墓人',
    team: 'TOWNSFOLK',
    ability: '知晓白天被处决玩家的角色。',
    otherNight: true,
    detailedDescription: '**官方规则**: 如果白天有玩家被处决，当晚你会得知该玩家的角色。\n\n**补充说明**:\n• 只有被处决（投票出局）才会触发，被恶魔杀死不触发\n• 如果白天没人被处决，你不会醒来\n• 你得知的是该玩家的真实角色，即使他以为自己是其他角色（如酒鬼）\n• 信息可能被下毒或醉酒影响'
  },
  monk: {
    id: 'monk',
    name: '僧侣',
    team: 'TOWNSFOLK',
    ability: '每晚保护一名玩家免受恶魔伤害。',
    otherNight: true,
    icon: '🛡️',
    nightAction: { type: 'choose_player', prompt: '选择一名玩家进行保护' },
    detailedDescription: '**官方规则**: 每晚（除首夜外），你选择一名玩家，该玩家当晚不会被恶魔杀死。\n\n**补充说明**:\n• 选人方式：你指定\n• 你可以选择自己\n• 只保护恶魔杀死，不保护其他死亡方式（如被处决、刺客）\n• 如果恶魔攻击了你保护的目标，恶魔不会得知\n• 你可以连续多晚保护同一个人'
  },
  ravenkeeper: {
    id: 'ravenkeeper',
    name: '守鸦人',
    team: 'TOWNSFOLK',
    ability: '若在夜晚死亡,选择一名玩家查验身份。',
    otherNight: true,
    icon: '🦅',
    nightAction: { type: 'choose_player', prompt: '选择一名玩家查验身份(仅夜间死亡时)' },
    detailedDescription: '**官方规则**: 如果你在夜间死亡（被恶魔杀死），当晚你立即醒来并选择一名玩家，说书人会告诉你该玩家的角色。\n\n**补充说明**:\n• 选人方式：你指定\n• 只有夜间死亡才触发，白天被处决不触发\n• 你可以选择任何玩家，包括自己\n• 你得知的是真实角色，不受酒鬼等影响\n• 信息可能被下毒或醉酒影响'
  },
  virgin: {
    id: 'virgin',
    name: '处女',
    team: 'TOWNSFOLK',
    ability: '首次被提名为村民时，立即处决提名者。',
    icon: '🕯️',
    detailedDescription: '**官方规则**: 当你首次被一个镇民提名时，该镇民立即被处决。\n\n**补充说明**:\n• 只在首次被提名时触发\n• 只对镇民（TOWNSFOLK）角色有效\n• 如果提名者是外来者、爪牙或恶魔，不会触发\n• 如果你被醉酒或下毒，也不会触发\n• 第二次被提名不会再触发'
  },
  slayer: {
    id: 'slayer',
    name: '杀手',
    team: 'TOWNSFOLK',
    ability: '每局游戏限一次，选择一名玩家击杀恶魔。',
    icon: '🏹',
    detailedDescription: '**官方规则**: 整局游戏中，你可以在白天公开选择一名玩家。如果该玩家是恶魔，他立即死亡。\n\n**补充说明**:\n• 选人方式：你公开宣布\n• 整局只能使用一次，不管是否成功\n• 如果目标不是恶魔，则无事发生\n• 一些特殊恶魔可能不会死亡（如僵尸）\n• ST需要在玩家面板上标记技能已使用'
  },
  soldier: {
    id: 'soldier',
    name: '士兵',
    team: 'TOWNSFOLK',
    ability: '免受恶魔伤害。',
    icon: '🛡️',
    detailedDescription: '**官方规则**: 你不会被恶魔杀死。\n\n**补充说明**:\n• 被动技能，无需操作\n• 只免疫恶魔的攻击，仍然可以被处决、刺客等杀死\n• 如果你被醉酒或下毒，会失去保护\n• 恶魔攻击你时，ST不会告诉恶魔你是士兵'
  },
  mayor: {
    id: 'mayor',
    name: '市长',
    team: 'TOWNSFOLK',
    ability: '若只剩3名玩家，票死别人即可获胜。',
    icon: '🏅',
    detailedDescription: '**官方规则**: 当场上只剩下3名活人时，如果有玩家被处决，好人立即获胜。\n\n**补充说明**:\n• 当有死人的情况下，剩余活人=3时触发\n• 只有处决（投票杀死）才触发，夜间杀死不触发\n• 即使被处决的是好人，好人仍然能获胜\n• 如果你被醉酒或下毒，此效果不生效'
  },
  butler: {
    id: 'butler',
    name: '管家',
    team: 'OUTSIDER',
    ability: '除非主人投票，否则不能投票。',
    otherNight: true,
    detailedDescription: '**官方规则**: 首夜，你选择一名玩家作为你的主人。投票时，只有当你的主人投票时，你才能投票。\n\n**补充说明**:\n• 选人方式：首夜你秘密指定\n• 主人死亡后，你仍然只能跟着他投票\n• 主人不投票时，你不能投票\n• 你不需要和主人投同一人\n• 主人可以是任何阵营'
  },
  drunk: {
    id: 'drunk',
    name: '酒鬼',
    team: 'OUTSIDER',
    ability: '你以为你是村民，其实你不是。',
    icon: '🍺',
    detailedDescription: '**官方规则**: 你不知道自己是酒鬼。你以为自己是一个镇民角色，但实际上你的能力不生效。\n\n**补充说明**:\n• ST会告诉你一个镇民角色，但你实际是酒鬼\n• 你会接收到假信息，可能是真的也可能是假的\n• 如果有角色查验你，他们会看到你被告知的角色\n• 酒鬼是固定的，整局不会变化\n• 酒鬼和被下毒不同，酒鬼是永久性的'
  },
  recluse: {
    id: 'recluse',
    name: '隐士',
    team: 'OUTSIDER',
    ability: '可能被判定为邪恶/爪牙/恶魔。',
    detailedDescription: '**官方规则**: 当其他角色查验你时，ST可以选择让你看起来像是邪恶阵营、爪牙或恶魔。\n\n**补充说明**:\n• 影响占卜师、调查员等查验角色\n• ST可以选择何时让你显示为邪恶\n• 你仍然是好人阵营，只是信息可能错误\n• 你也可能一直显示为外来者\n• 与酒鬼不同，你知道自己是隐士'
  },
  saint: {
    id: 'saint',
    name: '圣徒',
    team: 'OUTSIDER',
    ability: '若被处决，你所在的阵营失败。',
    icon: '☠️',
    detailedDescription: '**官方规则**: 如果你在白天被投票处决，邪恶阵营立即获胜。\n\n**补充说明**:\n• 只有被处决（投票出局）才触发，夜间被杀不触发\n• 即使玩家死亡，只要被处决仍然触发\n• 如果你被醉酒或下毒，不会触发\n• 这是外来者中最危险的角色\n• 爪牙可能会故意提名你'
  },
  poisoner: {
    id: 'poisoner',
    name: '投毒者',
    team: 'MINION',
    ability: '每晚对一名玩家下毒。',
    otherNight: true,
    icon: '🧪',
    nightAction: { type: 'choose_player', prompt: '选择一名玩家下毒' },
    detailedDescription: '**官方规则**: 每晚，你选择一名玩家下毒。被下毒的玩家能力失效，信息变为错误。\n\n**补充说明**:\n• 选人方式：你每晚指定\n• 被下毒的玩家不知道自己被下毒\n• 毒性持续到下一个黑夜\n• 你可以连续多晚选同一个人\n• 下毒后，目标的能力完全无效'
  },
  spy: {
    id: 'spy',
    name: '间谍',
    team: 'MINION',
    ability: '可以查看魔典。',
    otherNight: true,
    icon: '🕵️',
    detailedDescription: '**官方规则**: 每晚，你会看到魔典（所有玩家的角色）。当被查验时，你可能显示为好人或任何角色。\n\n**补充说明**:\n• 你可以看到所有玩家的真实角色\n• 当别人查验你时，ST可以让你显示为任何角色\n• 你可以纪乱洗衣妇、图书管理员等的信息\n• 非常强大的情报角色\n• 你知道谁是酒鬼、谁是隐士'
  },
  scarlet_woman: {
    id: 'scarlet_woman',
    name: '猎红女巫',
    team: 'MINION',
    ability: '若恶魔死亡，你成为新的恶魔。',
    detailedDescription: '**官方规则**: 如果恶魔死亡且场上有至少5名活人，你变成原来的恶魔角色。\n\n**补充说明**:\n• 只有在至少5人活着时才会变身\n• 你会变成恶魔，获得恶魔技能\n• 原恶魔真的死了，你是新恶魔\n• 如果有多个爪牙，只有你会变成恶魔\n• 如果少5人时，你不会变身，好人获胜'
  },
  baron: {
    id: 'baron',
    name: '男爵',
    team: 'MINION',
    ability: '增加2名外来者代替村民。',
    firstNight: true,
    detailedDescription: '**官方规则**: 如果场上有男爵，会额外增加2个外来者，减少2个镇民。\n\n**补充说明**:\n• 这是开局效果，影响角色配置\n• 如果没有男爵，可能没有外来者\n• 如果有男爵，至少有2个外来者\n• 图书管理员会接收到正确信息\n• 男爵死亡后，外来者不会消失'
  },
  imp: {
    id: 'imp',
    name: '小恶魔',
    team: 'DEMON',
    ability: '每晚击杀一名玩家。可以自杀传位。',
    otherNight: true,
    icon: '😈',
    nightAction: { type: 'choose_player', prompt: '选择一名玩家击杀' },
    detailedDescription: '**官方规则**: 每晚，你选择一名玩家杀死。你可以选择自杀，如果你自杀，一名爪牙变成小恶魔。\n\n**补充说明**:\n• 选人方式：你每晚指定\n• 你不能选择同一个爪牙两次\n• 如果你自杀，ST会选择一个爪牙变成恶魔\n• 自杀是主动技能，可以避免被处决\n• 如果目标被僧侣保护或是士兵，无法杀死'
  },

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
