import type { LucideIconComponent } from '@/lib/lucideRegistry';
import { LUCIDE_ICON_REGISTRY } from '@/lib/lucideRegistry';

/**
 * Emoji 到 Lucide 图标的映射表
 * 用于系统性替换 emoji 为 SVG 图标，契合哥特式暗黑游戏主题
 */
export const ICON_MAP = {
  // 文档和规则
  '📜': LUCIDE_ICON_REGISTRY.ScrollText,
  '📝': LUCIDE_ICON_REGISTRY.FileText,
  '📢': LUCIDE_ICON_REGISTRY.Megaphone,
  '📋': LUCIDE_ICON_REGISTRY.ClipboardList,

  // 游戏角色 - 哥特式主题
  '🎭': LUCIDE_ICON_REGISTRY.Theater,
  '💀': LUCIDE_ICON_REGISTRY.Skull,
  '👻': LUCIDE_ICON_REGISTRY.Ghost,
  '🗡️': LUCIDE_ICON_REGISTRY.Sword,
  '🛡️': LUCIDE_ICON_REGISTRY.Shield,
  '👹': LUCIDE_ICON_REGISTRY.Flame, // Demon
  '🧪': LUCIDE_ICON_REGISTRY.FlaskConical, // Minion
  '⚜️': LUCIDE_ICON_REGISTRY.Crown, // Townsfolk
  '🔮': LUCIDE_ICON_REGISTRY.Eye, // Fortune Teller
  '🔍': LUCIDE_ICON_REGISTRY.Search, // Investigator
  '🙏': LUCIDE_ICON_REGISTRY.HandMetal, // Monk
  '🏹': LUCIDE_ICON_REGISTRY.Target, // Slayer
  '🕯️': LUCIDE_ICON_REGISTRY.Flame, // Virgin
  '🎨': LUCIDE_ICON_REGISTRY.Palette, // Artist
  '🤹': LUCIDE_ICON_REGISTRY.Sparkles, // Juggler

  // 交互和通信
  '💬': LUCIDE_ICON_REGISTRY.MessageCircle,
  '🔊': LUCIDE_ICON_REGISTRY.Volume2,
  '🔇': LUCIDE_ICON_REGISTRY.VolumeX,
  '🔔': LUCIDE_ICON_REGISTRY.Bell,
  '📞': LUCIDE_ICON_REGISTRY.Phone,

  // 功能操作
  '⚙️': LUCIDE_ICON_REGISTRY.Settings,
  '🗑️': LUCIDE_ICON_REGISTRY.Trash2,
  '🔗': LUCIDE_ICON_REGISTRY.Link,
  '🔄': LUCIDE_ICON_REGISTRY.RefreshCw,
  '🗳️': LUCIDE_ICON_REGISTRY.Vote,
  '🏁': LUCIDE_ICON_REGISTRY.Flag,
  '✋': LUCIDE_ICON_REGISTRY.Hand,
  '🚫': LUCIDE_ICON_REGISTRY.Ban,
  '🔒': LUCIDE_ICON_REGISTRY.Lock,
  '🔓': LUCIDE_ICON_REGISTRY.Unlock,
  '⏳': LUCIDE_ICON_REGISTRY.Hourglass,
  '✓': LUCIDE_ICON_REGISTRY.Check,
  '✗': LUCIDE_ICON_REGISTRY.X,
  '⚡': LUCIDE_ICON_REGISTRY.Zap,

  // 信息和帮助
  '💡': LUCIDE_ICON_REGISTRY.Lightbulb,
  '🕵️': LUCIDE_ICON_REGISTRY.Search,
  'ℹ️': LUCIDE_ICON_REGISTRY.Info,
  '❓': LUCIDE_ICON_REGISTRY.HelpCircle,
  '⚠️': LUCIDE_ICON_REGISTRY.AlertTriangle,

  // 游戏状态
  '✨': LUCIDE_ICON_REGISTRY.Sparkles,
  '🌙': LUCIDE_ICON_REGISTRY.Moon,
  '☀️': LUCIDE_ICON_REGISTRY.Sun,
  '🎥': LUCIDE_ICON_REGISTRY.Eye,
  '🍺': LUCIDE_ICON_REGISTRY.Beer,
  '❤️': LUCIDE_ICON_REGISTRY.Heart,
  '💔': LUCIDE_ICON_REGISTRY.HeartCrack,

  // 游戏阶段
  '🌅': LUCIDE_ICON_REGISTRY.Sunrise,
  '🌆': LUCIDE_ICON_REGISTRY.Sunset,
  '🌃': LUCIDE_ICON_REGISTRY.Moon,

  // 其他
  '👤': LUCIDE_ICON_REGISTRY.User,
  '👥': LUCIDE_ICON_REGISTRY.Users,
  '🎲': LUCIDE_ICON_REGISTRY.Dices,
  '🎯': LUCIDE_ICON_REGISTRY.Target,
  '⚖️': LUCIDE_ICON_REGISTRY.Scale,
  '↔️': LUCIDE_ICON_REGISTRY.ArrowLeftRight,
  '🚪': LUCIDE_ICON_REGISTRY.DoorOpen,
  '👁️': LUCIDE_ICON_REGISTRY.Eye,
} as const;

export type EmojiKey = keyof typeof ICON_MAP;

/**
 * 获取图标组件
 * @param emoji - emoji 字符
 * @returns Lucide 图标组件或 null
 */
export function getIconComponent(emoji: string): LucideIconComponent | null {
  return ICON_MAP[emoji as EmojiKey] || null;
}
