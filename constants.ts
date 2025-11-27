
import { RoleDef, ScriptDef } from './types';

// Z-Index 层级管理 - 统一管理所有 z-index 值
export const Z_INDEX = {
  base: 0,           // 基础层
  grimoire: 10,      // 魔典画布
  overlay: 20,       // 遮罩层
  tooltip: 30,       // 提示框
  dropdown: 40,      // 下拉菜单
  modal: 50,         // 模态框
  toast: 60,         // Toast 通知
  phaseIndicator: 30, // 阶段指示器
  contextMenu: 45,   // 右键菜单
} as const;

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
  grandmother: { 
    id: 'grandmother', 
    name: '祖母', 
    team: 'TOWNSFOLK', 
    ability: '知晓孙子是谁，孙子死你也死。', 
    firstNight: true,
    detailedDescription: '**官方规则**: 首夜，你会得知一名好人玩家是你的"孙子"。如果恶魔杀死了你的孙子，你也会死亡。\n\n**补充说明**:\n• 你会知道孙子的具体身份\n• 只有恶魔杀死孙子时你才会死，其他死法不影响你\n• 如果你先死了，孙子不受影响\n• 孙子一定是好人阵营'
  },
  sailor: { 
    id: 'sailor', 
    name: '水手', 
    team: 'TOWNSFOLK', 
    ability: '喝酒。除非醉酒，否则不死。', 
    otherNight: true, 
    icon: '⚓',
    detailedDescription: '**官方规则**: 每晚，你选择一名存活玩家：你们之一会醉酒到明天黄昏。当你没有醉酒时，你不能死亡。\n\n**补充说明**:\n• 你或你选择的人会醉酒（ST决定）\n• 醉酒时你可以被杀死\n• 不能因任何原因死亡（包括处决），除非醉酒\n• 可以选择自己'
  },
  chambermaid: { 
    id: 'chambermaid', 
    name: '女仆', 
    team: 'TOWNSFOLK', 
    ability: '每晚选两名玩家，知晓他们今晚醒没醒。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚，你选择两名存活玩家（非自己）。你会得知他们中有多少人今晚醒来执行了能力。\n\n**补充说明**:\n• 结果可能是0、1或2\n• 恶魔和爪牙的夜间能力也算"醒来"\n• 被动效果（如士兵）不算醒来\n• 中毒/醉酒玩家可能仍会"醒来"但能力无效'
  },
  exorcist: { 
    id: 'exorcist', 
    name: '驱魔人', 
    team: 'TOWNSFOLK', 
    ability: '每晚选择一名玩家，若为恶魔，恶魔无法醒来。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚*，你选择一名玩家（非自己）。如果你选择的是恶魔，恶魔今晚不会醒来行动。\n\n**补充说明**:\n• 被驱魔的恶魔无法杀人\n• 你不会知道是否成功驱魔\n• 每晚只能选一人\n• 连续两晚不能选同一人'
  },
  innkeeper: { 
    id: 'innkeeper', 
    name: '旅店老板', 
    team: 'TOWNSFOLK', 
    ability: '保护两名玩家，其中一人喝醉。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚*，你选择两名玩家（非自己）。他们今晚不能被恶魔杀死，但其中一人会醉酒到明天黄昏。\n\n**补充说明**:\n• 谁醉酒由ST决定\n• 保护只针对恶魔攻击\n• 不能选择自己\n• 醉酒效果持续到次日黄昏'
  },
  gambler: { 
    id: 'gambler', 
    name: '赌徒', 
    team: 'TOWNSFOLK', 
    ability: '猜一名玩家角色，猜对没事，猜错死。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚*，你选择一名玩家并猜测他的角色。如果你猜错了，你死亡。\n\n**补充说明**:\n• 必须猜具体角色，不是阵营\n• 猜对没有任何奖励，只是不死\n• 可以选择自己\n• 如果你中毒/醉酒，可能猜对也会死'
  },
  gossip: { 
    id: 'gossip', 
    name: '造谣者', 
    team: 'TOWNSFOLK', 
    ability: '白天造谣，若为真，当晚死一人。', 
    icon: '💬',
    detailedDescription: '**官方规则**: 每天，你可以公开声明一个关于游戏的陈述。如果你的陈述是真的，当晚会有一名玩家死亡。\n\n**补充说明**:\n• 必须公开声明\n• ST判断陈述真假\n• 谁死由ST决定\n• 中毒/醉酒时说真话也不会触发'
  },
  courtier: { 
    id: 'courtier', 
    name: '侍臣', 
    team: 'TOWNSFOLK', 
    ability: '使一名角色醉酒三天三夜。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 游戏中一次，在夜晚，你选择一名角色。如果场上有该角色，他会醉酒三天三夜，从今晚开始。\n\n**补充说明**:\n• 选择的是角色类型，不是玩家\n• 如果场上没有该角色，无效果\n• 三天三夜从当晚开始计算\n• 只能使用一次'
  },
  professor: { 
    id: 'professor', 
    name: '教授', 
    team: 'TOWNSFOLK', 
    ability: '复活一名死去的村民（限一次）。', 
    otherNight: true, 
    icon: '⚗️',
    detailedDescription: '**官方规则**: 游戏中一次，在夜晚，你选择一名死亡的玩家。如果他是镇民，他复活。\n\n**补充说明**:\n• 只能选死亡的玩家\n• 只有镇民才能被复活\n• 复活后该玩家正常参与游戏\n• 如果选了非镇民，能力被浪费'
  },
  minstrel: { 
    id: 'minstrel', 
    name: '吟游诗人', 
    team: 'TOWNSFOLK', 
    ability: '爪牙死后，所有人醉酒直到明天。',
    detailedDescription: '**官方规则**: 当一名爪牙被处决并死亡时，所有其他玩家立即醉酒直到明天黄昏。\n\n**补充说明**:\n• 只有处决爪牙才触发\n• 恶魔杀死爪牙不触发\n• 醉酒持续到次日黄昏\n• 吟游诗人自己也会醉酒'
  },
  tea_lady: { 
    id: 'tea_lady', 
    name: '茶女郎', 
    team: 'TOWNSFOLK', 
    ability: '若邻居都是好人，他们不死。',
    detailedDescription: '**官方规则**: 如果你的两个存活邻居都是好人，他们不能死亡。\n\n**补充说明**:\n• 必须两个邻居都是好人才生效\n• 保护他们免受任何死亡\n• 如果有一个邻居是邪恶的，无效\n• 死人不算邻居，跳过'
  },
  pacifist: { 
    id: 'pacifist', 
    name: '和平主义者', 
    team: 'TOWNSFOLK', 
    ability: '被处决的好人可能不死。',
    detailedDescription: '**官方规则**: 被处决的好人玩家可能不会死亡。\n\n**补充说明**:\n• 由ST决定是否触发\n• 只影响处决，不影响夜杀\n• 可能有时触发，有时不触发\n• 中毒/醉酒时无效'
  },
  fool: { 
    id: 'fool', 
    name: '弄臣', 
    team: 'TOWNSFOLK', 
    ability: '第一次死不会死。', 
    icon: '🎭',
    detailedDescription: '**官方规则**: 你第一次死亡时，你不会死。\n\n**补充说明**:\n• 任何死法都算，包括处决和夜杀\n• 只触发一次\n• 你不会知道是否已经使用过\n• 中毒/醉酒时可能无效'
  },
  goon: { 
    id: 'goon', 
    name: '暴徒', 
    team: 'OUTSIDER', 
    ability: '第一个选你的玩家变醉酒，你变阵营。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚，第一个选择你作为能力目标的玩家会醉酒到明天黄昏。你会转变为该玩家的阵营。\n\n**补充说明**:\n• 阵营转变是永久的\n• 被邪恶选择后变成邪恶\n• 被好人选择后变成好人\n• 每晚只触发一次'
  },
  lunatic: { 
    id: 'lunatic', 
    name: '疯子', 
    team: 'OUTSIDER', 
    ability: '你以为你是恶魔。', 
    firstNight: true, 
    otherNight: true,
    detailedDescription: '**官方规则**: 你以为自己是恶魔，但实际上你是外来者。说书人会假装你的"攻击"生效。\n\n**补充说明**:\n• 你会每晚选择攻击目标，但无效果\n• ST可能让你的"攻击"看起来成功\n• 真恶魔可能知道谁是疯子\n• 你相信自己是恶魔，行为应该像恶魔'
  },
  tinker: { 
    id: 'tinker', 
    name: '工匠', 
    team: 'OUTSIDER', 
    ability: '你随时可能莫名其妙死亡。',
    detailedDescription: '**官方规则**: 你可能在任何时候死亡。\n\n**补充说明**:\n• 死亡完全由ST决定\n• 可能在白天或夜晚死亡\n• 可能永远不死\n• 这是被动技能，无法控制'
  },
  moonchild: { 
    id: 'moonchild', 
    name: '月之子', 
    team: 'OUTSIDER', 
    ability: '你死后选一名玩家，如果是好人他今晚死。',
    detailedDescription: '**官方规则**: 当你死亡时，如果是在夜晚，你可以选择一名玩家。如果他是好人，他今晚死亡。\n\n**补充说明**:\n• 只有夜间死亡才能触发\n• 白天处决不触发\n• 选择邪恶玩家无效\n• 这是死亡触发的能力'
  },
  godfather: { 
    id: 'godfather', 
    name: '教父', 
    team: 'MINION', 
    ability: '外来者死后，你杀一人。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 如果白天有外来者死亡，你今晚选择一名玩家，他死亡。\n\n**补充说明**:\n• 必须是外来者死亡才触发\n• 镇民死亡不触发\n• 你选择的目标会额外死亡\n• 可以和恶魔的攻击叠加'
  },
  devil_advocate: { 
    id: 'devil_advocate', 
    name: '魔鬼代言人', 
    team: 'MINION', 
    ability: '被处决的玩家不死。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚*，你选择一名存活玩家（非自己）。如果他明天被处决，他不会死亡。\n\n**补充说明**:\n• 保护持续到次日处决\n• 每晚只能选一人\n• 可以保护恶魔\n• 不能保护自己'
  },
  assassin: { 
    id: 'assassin', 
    name: '刺客', 
    team: 'MINION', 
    ability: '限一次，无视保护杀一人。', 
    otherNight: true, 
    icon: '🗡️',
    detailedDescription: '**官方规则**: 游戏中一次，在夜晚，你选择一名玩家。他死亡，即使他有保护。\n\n**补充说明**:\n• 无视所有保护效果\n• 包括僧侣、茶女郎等\n• 只能使用一次\n• 不能在第一夜使用'
  },
  mastermind: { 
    id: 'mastermind', 
    name: '主谋', 
    team: 'MINION', 
    ability: '恶魔死后游戏继续，如果处决了你，恶魔输。',
    detailedDescription: '**官方规则**: 如果恶魔死亡，游戏继续。如果你被处决，邪恶阵营输掉游戏。\n\n**补充说明**:\n• 恶魔死后你需要被处决才算好人赢\n• 这延长了游戏\n• 如果你先死了，无效\n• 需要在恶魔死后的白天处决你'
  },
  zombuul: { 
    id: 'zombuul', 
    name: '僵尸', 
    team: 'DEMON', 
    ability: '第一次死看起来像死，其实没死。没死人晚上才能杀人。', 
    otherNight: true, 
    icon: '🧟',
    detailedDescription: '**官方规则**: 每晚*，如果今天没有人死亡，你选择一名玩家，他死亡。你第一次死亡时，你不会真的死，你会看起来死了。\n\n**补充说明**:\n• 第一次"死亡"后你继续作为僵尸存在\n• 只有当天无人死亡时才能杀人\n• 真正杀死僵尸需要第二次\n• 处决后看起来死了但实际没死'
  },
  pukka: { 
    id: 'pukka', 
    name: '普卡', 
    team: 'DEMON', 
    ability: '每晚选人下毒，该人次晚死亡。', 
    otherNight: true, 
    icon: '🐍',
    detailedDescription: '**官方规则**: 每晚，你选择一名玩家，他中毒。前一晚被你中毒的玩家死亡。\n\n**补充说明**:\n• 今晚选的人明晚才死\n• 被选的人在死亡前一直中毒\n• 第一夜选的人第二夜死\n• 死亡延迟一夜'
  },
  shabaloth: { 
    id: 'shabaloth', 
    name: '沙巴洛斯', 
    team: 'DEMON', 
    ability: '每晚杀两人。可能复活一人。', 
    otherNight: true, 
    icon: '👹',
    detailedDescription: '**官方规则**: 每晚*，你选择两名玩家，他们死亡。一名你杀死的玩家可能在之后某晚复活。\n\n**补充说明**:\n• 每晚必须杀两人\n• 复活由ST决定时机\n• 复活的是你杀的人之一\n• 可能整局都不复活'
  },
  po: { 
    id: 'po', 
    name: '珀', 
    team: 'DEMON', 
    ability: '可以空刀。空刀后每晚杀三人。', 
    otherNight: true, 
    icon: '🎐',
    detailedDescription: '**官方规则**: 每晚*，你可以选择不攻击任何人。如果你这样做，下一晚你可以攻击三名玩家。\n\n**补充说明**:\n• 空刀后次晚必须杀三人\n• 正常情况一晚杀一人\n• 空刀是战略选择\n• 不能连续空刀'
  },

  // --- SECTS & VIOLETS (SV) ---
  clockmaker: { 
    id: 'clockmaker', 
    name: '钟表匠', 
    team: 'TOWNSFOLK', 
    ability: '知晓恶魔与最近爪牙的距离。', 
    firstNight: true,
    detailedDescription: '**官方规则**: 首夜，你得知恶魔和最近的爪牙之间隔了多少个座位。\n\n**补充说明**:\n• 从恶魔数到最近爪牙的座位数\n• 跳过死人不计\n• 如果没有爪牙，你得到0\n• 信息可能被毒/醉影响'
  },
  dreamer: { 
    id: 'dreamer', 
    name: '筑梦师', 
    team: 'TOWNSFOLK', 
    ability: '每晚选玩家，知晓两个身份（一真一假）。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚，你选择一名玩家（非自己）。你会得知两个角色：一个是他的真实角色，一个不是。\n\n**补充说明**:\n• 两个角色之一是正确的\n• ST决定哪个是假的\n• 可以推断信息\n• 被毒/醉时可能两个都错'
  },
  snake_charmer: { 
    id: 'snake_charmer', 
    name: '弄蛇人', 
    team: 'TOWNSFOLK', 
    ability: '每晚选玩家，若是恶魔，你们互换。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚，你选择一名存活玩家。如果他是恶魔，你们互换角色和阵营，你中毒。\n\n**补充说明**:\n• 你变成恶魔，恶魔变成弄蛇人\n• 互换后你会中毒\n• 新恶魔获得恶魔能力\n• 非常危险但强力的能力'
  },
  mathematician: { 
    id: 'mathematician', 
    name: '数学家', 
    team: 'TOWNSFOLK', 
    ability: '知晓有多少玩家因能力获得错误信息。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚，你得知从上个黄昏到现在，有多少玩家因为能力故障而获得错误信息。\n\n**补充说明**:\n• 包括被毒/醉的玩家\n• 也包括被间谍等影响的\n• 帮助验证信息可靠性\n• 0表示所有信息都正确'
  },
  flowergirl: { 
    id: 'flowergirl', 
    name: '卖花女', 
    team: 'TOWNSFOLK', 
    ability: '知晓恶魔今天是否投了票。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚*，你得知恶魔今天是否投了票。\n\n**补充说明**:\n• 只关心恶魔，不包括爪牙\n• 帮助缩小恶魔嫌疑\n• 结果是"是"或"否"\n• 被毒/醉时可能错误'
  },
  town_crier: { 
    id: 'town_crier', 
    name: '城镇公告员', 
    team: 'TOWNSFOLK', 
    ability: '知晓爪牙今天是否投了票。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚*，你得知今天是否有爪牙投了票。\n\n**补充说明**:\n• 任意一个爪牙投票即为"是"\n• 所有爪牙都没投才是"否"\n• 与卖花女配合使用\n• 被毒/醉时可能错误'
  },
  oracle: { 
    id: 'oracle', 
    name: '神谕者', 
    team: 'TOWNSFOLK', 
    ability: '知晓多少死去的玩家是邪恶的。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚*，你得知死亡玩家中有多少是邪恶阵营。\n\n**补充说明**:\n• 统计所有死亡玩家\n• 包括恶魔和爪牙\n• 帮助验证处决是否正确\n• 数字只会增加或不变'
  },
  savant: { 
    id: 'savant', 
    name: '博学者', 
    team: 'TOWNSFOLK', 
    ability: '每天获得两条信息，一真一假。',
    detailedDescription: '**官方规则**: 每天，你可以私下拜访说书人，获得两条关于游戏的信息。一条是真的，一条是假的。\n\n**补充说明**:\n• 必须主动拜访ST\n• 信息可以是任何内容\n• 你不知道哪条真哪条假\n• 是白天能力，不是夜晚'
  },
  seamstress: { 
    id: 'seamstress', 
    name: '裁缝', 
    team: 'TOWNSFOLK', 
    ability: '限一次，检测两名玩家是否同一阵营。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 游戏中一次，在夜晚，你选择两名存活玩家（非自己）。你得知他们是否属于同一阵营。\n\n**补充说明**:\n• 只能使用一次\n• 结果是"相同"或"不同"\n• 好人之间是相同的\n• 被毒/醉时可能错误'
  },
  philosopher: { 
    id: 'philosopher', 
    name: '哲学家', 
    team: 'TOWNSFOLK', 
    ability: '限一次，获得已出场角色能力。',
    detailedDescription: '**官方规则**: 游戏中一次，在夜晚，你选择一个好人角色。你获得该角色的能力。如果场上有该角色，他会中毒。\n\n**补充说明**:\n• 只能选择好人角色\n• 原角色会中毒\n• 你保留哲学家身份但获得新能力\n• 只能使用一次'
  },
  artist: { 
    id: 'artist', 
    name: '艺术家', 
    team: 'TOWNSFOLK', 
    ability: '限一次，问一个是非题。',
    detailedDescription: '**官方规则**: 游戏中一次，在白天，你可以私下问说书人一个关于游戏的是非题，他必须如实回答。\n\n**补充说明**:\n• 问题必须是是/否形式\n• ST必须如实回答\n• 只能问一次\n• 可以问任何游戏相关问题'
  },
  juggler: { 
    id: 'juggler', 
    name: '杂耍艺人', 
    team: 'TOWNSFOLK', 
    ability: '白天猜5个人，晚上知晓猜对几个。', 
    icon: '🤹',
    detailedDescription: '**官方规则**: 在你的第一个白天，公开猜测最多5名玩家的角色。那天晚上，你得知你猜对了多少个。\n\n**补充说明**:\n• 必须公开猜测\n• 最多猜5个人\n• 只能在第一个白天使用\n• 结果是0-5的数字'
  },
  sage: { 
    id: 'sage', 
    name: '贤者', 
    team: 'TOWNSFOLK', 
    ability: '被恶魔杀时，知晓两个恶魔备选。',
    detailedDescription: '**官方规则**: 如果恶魔杀死了你，你会得知两名玩家，其中一人是恶魔。\n\n**补充说明**:\n• 只有被恶魔杀死才触发\n• 被处决不触发\n• 两人中必有恶魔\n• 死后获得信息'
  },
  mutant: { 
    id: 'mutant', 
    name: '变种人', 
    team: 'OUTSIDER', 
    ability: '若对ST以外的人承认自己是外来者，可能会死。',
    detailedDescription: '**官方规则**: 如果你公开声称自己是外来者，你可能会被立即处决。\n\n**补充说明**:\n• 不能承认自己是外来者\n• 说"我是变种人"算承认\n• ST决定是否立即处决\n• 只能对ST说真话'
  },
  sweetheart: { 
    id: 'sweetheart', 
    name: '心上人', 
    team: 'OUTSIDER', 
    ability: '死后一名玩家醉酒。',
    detailedDescription: '**官方规则**: 当你死亡时，一名玩家会醉酒，直到游戏结束。\n\n**补充说明**:\n• 由ST选择谁醉酒\n• 醉酒是永久的\n• 可能是任何玩家\n• 死亡时立即触发'
  },
  barber: { 
    id: 'barber', 
    name: '理发师', 
    team: 'OUTSIDER', 
    ability: '死后恶魔可以互换两名玩家角色。',
    detailedDescription: '**官方规则**: 如果你死亡了，恶魔可以选择两名玩家互换角色。如果有人变成恶魔，死亡的玩家可以复活。\n\n**补充说明**:\n• 恶魔可以选择任意两人\n• 角色互换是永久的\n• 可能改变阵营格局\n• 很危险的外来者'
  },
  klutz: { 
    id: 'klutz', 
    name: '笨蛋', 
    team: 'OUTSIDER', 
    ability: '死后选一名玩家，若是邪恶，游戏输。',
    detailedDescription: '**官方规则**: 当你死亡时，你必须公开选择一名存活玩家。如果你选择的是邪恶玩家，你的阵营输掉游戏。\n\n**补充说明**:\n• 必须选择一人\n• 选错立即输掉\n• 选好人则无事\n• 死亡触发，无论死法'
  },
  witch: { 
    id: 'witch', 
    name: '女巫', 
    team: 'MINION', 
    ability: '诅咒一名玩家，若其提名则死亡。', 
    otherNight: true, 
    icon: '🧙',
    detailedDescription: '**官方规则**: 每晚，你选择一名玩家。如果被诅咒的玩家明天提名任何人，该玩家立即死亡。\n\n**补充说明**:\n• 诅咒持续到次日\n• 提名后立即死亡\n• 不提名就不会触发\n• 强力的爪牙能力'
  },
  cerenovus: { 
    id: 'cerenovus', 
    name: '洗脑师', 
    team: 'MINION', 
    ability: '指定玩家必须疯狂证明自己是某角色。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚，你选择一名玩家和一个好人角色。明天，他们必须假装自己是那个角色，否则可能被处决。\n\n**补充说明**:\n• 被选玩家必须配合\n• 不配合可能被处决\n• 增加混乱和怀疑\n• 每晚可以选不同人'
  },
  pit_hag: { 
    id: 'pit_hag', 
    name: '老巫婆', 
    team: 'MINION', 
    ability: '每晚将一人变成新角色。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚*，你选择一名玩家和一个角色。如果选择合法，他变成那个角色。如果这创造了重复角色，你可能意外杀死玩家。\n\n**补充说明**:\n• 可以改变任何人的角色\n• 可能导致重复角色死亡\n• 非常灵活的能力\n• 不能创建本不存在的角色'
  },
  evil_twin: { 
    id: 'evil_twin', 
    name: '邪恶双子', 
    team: 'MINION', 
    ability: '你有双胞胎。只要你们都活，好人无法赢。',
    detailedDescription: '**官方规则**: 你和一名好人玩家是双胞胎。你们都知道对方是谁。只要你们都活着，好人不能获胜。\n\n**补充说明**:\n• 双胞胎互相知道身份\n• 好人双胞胎不知道谁是邪恶的\n• 必须处决邪恶双子\n• 非常强力的防守能力'
  },
  fang_gu: { 
    id: 'fang_gu', 
    name: '方古', 
    team: 'DEMON', 
    ability: '若杀外来者，他变恶魔你死。', 
    otherNight: true, 
    icon: '👹',
    detailedDescription: '**官方规则**: 每晚*，你选择一名玩家，他死亡。如果你杀死了外来者，你死亡，他变成方古。如果只剩4人时有外来者死亡，邪恶获胜。\n\n**补充说明**:\n• 杀外来者会"传染"\n• 新方古获得恶魔身份\n• 可能意外改变游戏走向\n• 4人局时杀外来者直接赢'
  },
  vigormortis: { 
    id: 'vigormortis', 
    name: '维果莫蒂斯', 
    team: 'DEMON', 
    ability: '杀爪牙，爪牙保留能力且看起来活着。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚*，你选择一名玩家，他死亡。如果你杀死了爪牙，他保留能力且看起来活着，邻座的镇民中毒。\n\n**补充说明**:\n• 爪牙死后继续行动\n• 看起来没死\n• 邻座镇民被毒\n• 非常复杂的恶魔'
  },
  no_dashii: { 
    id: 'no_dashii', 
    name: '诺达希', 
    team: 'DEMON', 
    ability: '邻居中毒。', 
    otherNight: true,
    detailedDescription: '**官方规则**: 每晚*，你选择一名玩家，他死亡。你的两个活着的镇民邻居中毒。\n\n**补充说明**:\n• 邻座镇民始终中毒\n• 只影响镇民，不影响外来者\n• 隐蔽且强力\n• 邻居变化时毒会转移'
  },
  vortox: { 
    id: 'vortox', 
    name: '沃托克斯', 
    team: 'DEMON', 
    ability: '所有人信息皆假。没人被处决则邪恶赢。', 
    otherNight: true, 
    icon: '🌀',
    detailedDescription: '**官方规则**: 每晚*，你选择一名玩家，他死亡。所有镇民的信息都是错误的。如果连续一天没有人被处决，邪恶获胜。\n\n**补充说明**:\n• 所有镇民信息反转\n• 每天必须处决否则输\n• 非常混乱的恶魔\n• 需要反向思考信息'
  },
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
// NOTE: Only include roles that are defined in ROLES object above.
export const NIGHT_ORDER_FIRST = [
  'philosopher', 'poisoner', 'snake_charmer', 'evil_twin', 'witch', 'cerenovus',
  'minstrel', 'godfather', 'devil_advocate', 'lunatic', 'exorcist', 'innkeeper', 'gambler', 'chambermaid', 'sailor', 'courtier',
  'grandmother', 'imp', 'zombuul', 'pukka', 'shabaloth', 'po', 'fang_gu', 'vigormortis', 'no_dashii', 'vortox',
  'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller', 'butler', 'spy',
  'clockmaker', 'dreamer', 'seamstress', 'mathematician'
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

export const AUDIO_TRACKS: Record<string, { name: string, url: string, phase?: string }> = {
  // 使用 SoundJay.com 免费音效 (CC0 公共领域)
  // 注意：这些是短音效循环，适合游戏氛围
  lobby: { 
    name: '神秘大厅 (Mystery)', 
    url: 'https://www.soundjay.com/clock/sounds/grandfather-clock-1.mp3',
    phase: 'SETUP'
  },
  day_village: { 
    name: '热闘讨论 (Day)', 
    url: 'https://www.soundjay.com/nature/sounds/crickets-1.mp3',
    phase: 'DAY'
  },
  night_ambience: { 
    name: '静谧夜晚 (Night)', 
    url: 'https://www.soundjay.com/ambient/sounds/rain-02.mp3',
    phase: 'NIGHT'
  },
  voting: { 
    name: '紧张投票 (Voting)', 
    url: 'https://www.soundjay.com/clock/sounds/clock-ticking-4.mp3',
    phase: 'VOTING'
  },
  nomination: {
    name: '提名阶段 (Nomination)',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
    phase: 'NOMINATION'
  },
  victory_good: {
    name: '善良胜利 (Good Wins)',
    url: 'https://www.soundjay.com/misc/sounds/magic-chime-02.mp3'
  },
  victory_evil: {
    name: '邪恶胜利 (Evil Wins)',
    url: 'https://www.soundjay.com/nature/sounds/thunder-01.mp3'
  },
};

// 阶段到音轨的映射
export const PHASE_AUDIO_MAP: Record<string, string> = {
  SETUP: 'lobby',
  DAY: 'day_village',
  NIGHT: 'night_ambience',
  NOMINATION: 'nomination',
  VOTING: 'voting',
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
