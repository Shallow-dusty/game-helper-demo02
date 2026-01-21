import * as LucideIcons from 'lucide-react';

/**
 * Emoji 到 Lucide 图标的映射表
 * 用于系统性替换 emoji 为 SVG 图标，契合哥特式暗黑游戏主题
 */
export const ICON_MAP = {
  // 文档和规则
  '📜': LucideIcons.ScrollText,
  '📝': LucideIcons.FileText,
  '📢': LucideIcons.Megaphone,
  '📋': LucideIcons.ClipboardList,

  // 游戏角色 - 哥特式主题
  '🎭': LucideIcons.Theater,
  '💀': LucideIcons.Skull,
  '👻': LucideIcons.Ghost,
  '🗡️': LucideIcons.Sword,
  '🛡️': LucideIcons.Shield,
  '👹': LucideIcons.Flame, // Demon
  '🧪': LucideIcons.FlaskConical, // Minion
  '⚜️': LucideIcons.Crown, // Townsfolk
  '🔮': LucideIcons.Eye, // Fortune Teller
  '🔍': LucideIcons.Search, // Investigator
  '🙏': LucideIcons.HandMetal, // Monk
  '🏹': LucideIcons.Target, // Slayer
  '🕯️': LucideIcons.Flame, // Virgin
  '🎨': LucideIcons.Palette, // Artist
  '🤹': LucideIcons.Sparkles, // Juggler

  // 交互和通信
  '💬': LucideIcons.MessageCircle,
  '🔊': LucideIcons.Volume2,
  '🔇': LucideIcons.VolumeX,
  '🔔': LucideIcons.Bell,
  '📞': LucideIcons.Phone,

  // 功能操作
  '⚙️': LucideIcons.Settings,
  '🗑️': LucideIcons.Trash2,
  '🔗': LucideIcons.Link,
  '🔄': LucideIcons.RefreshCw,
  '🗳️': LucideIcons.Vote,
  '🏁': LucideIcons.Flag,
  '✋': LucideIcons.Hand,
  '🚫': LucideIcons.Ban,
  '🔒': LucideIcons.Lock,
  '🔓': LucideIcons.Unlock,
  '⏳': LucideIcons.Hourglass,
  '✓': LucideIcons.Check,
  '✗': LucideIcons.X,
  '⚡': LucideIcons.Zap,

  // 信息和帮助
  '💡': LucideIcons.Lightbulb,
  '🕵️': LucideIcons.Search,
  'ℹ️': LucideIcons.Info,
  '❓': LucideIcons.HelpCircle,
  '⚠️': LucideIcons.AlertTriangle,

  // 游戏状态
  '✨': LucideIcons.Sparkles,
  '🌙': LucideIcons.Moon,
  '☀️': LucideIcons.Sun,
  '🎥': LucideIcons.Eye,
  '🍺': LucideIcons.Beer,
  '❤️': LucideIcons.Heart,
  '💔': LucideIcons.HeartCrack,

  // 游戏阶段
  '🌅': LucideIcons.Sunrise,
  '🌆': LucideIcons.Sunset,
  '🌃': LucideIcons.Moon,

  // 其他
  '👤': LucideIcons.User,
  '👥': LucideIcons.Users,
  '🎲': LucideIcons.Dices,
  '🎯': LucideIcons.Target,
  '⚖️': LucideIcons.Scale,
  '↔️': LucideIcons.ArrowLeftRight,
  '🚪': LucideIcons.DoorOpen,
  '👁️': LucideIcons.Eye,
} as const;

export type EmojiKey = keyof typeof ICON_MAP;

/**
 * 获取图标组件
 * @param emoji - emoji 字符
 * @returns Lucide 图标组件或 null
 */
export function getIconComponent(emoji: string): React.ComponentType<LucideIcons.LucideProps> | null {
  return ICON_MAP[emoji as EmojiKey] || null;
}
