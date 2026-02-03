import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

type LucideIconComponent = React.ComponentType<LucideIcons.LucideProps>;
export type LucideIconName = {
  [K in keyof typeof LucideIcons]: typeof LucideIcons[K] extends LucideIconComponent ? K : never
}[keyof typeof LucideIcons];

interface IconProps {
  /** Lucide 图标名称或组件 */
  icon: LucideIconName | LucideIconComponent;
  /** 尺寸变体 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 颜色变体（基于哥特式暗黑主题）*/
  variant?: 'default' | 'accent' | 'blood' | 'holy' | 'evil' | 'muted' | 'ghost';
  /** 自定义 className */
  className?: string;
  /** 是否显示悬浮动画 */
  animated?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-12 h-12',
};

const variantMap = {
  default: 'text-gothic-text', // 羊皮纸色
  accent: 'text-gothic-accent', // 金色
  blood: 'text-gothic-blood', // 血色
  holy: 'text-gothic-holy', // 神圣黄色
  evil: 'text-gothic-evil', // 邪恶紫色
  muted: 'text-gothic-muted', // 暗金色
  ghost: 'text-purple-400', // 幽灵紫色
};

/**
 * 统一图标组件 - 哥特式暗黑主题
 *
 * 使用 Lucide React 图标库，契合 Blood on the Clocktower 的神秘氛围
 * 支持多种尺寸和颜色变体，自动适配哥特式设计系统
 */
export const Icon: React.FC<IconProps> = ({
  icon,
  size = 'md',
  variant = 'default',
  className,
  animated = false,
  clickable = false,
}) => {
  const IconComponent = typeof icon === 'string' ? (LucideIcons[icon] as LucideIconComponent) : icon;

  if (!IconComponent) {
    console.warn(`Icon "${String(icon)}" not found in Lucide icons`);
    return null;
  }

  return (
    <IconComponent
      className={cn(
        sizeMap[size],
        variantMap[variant],
        animated && 'transition-transform duration-200 hover:scale-110',
        clickable && 'cursor-pointer',
        className
      )}
      aria-hidden="true"
    />
  );
};

/**
 * 便捷图标组件 - 直接使用 emoji 映射
 */
export const EmojiIcon: React.FC<Omit<IconProps, 'icon'> & { emoji: string }> = ({ emoji, ...props }) => {
  // 从 iconMap 动态导入
  const iconName = {
    '📜': 'ScrollText',
    '💬': 'MessageCircle',
    '⚙️': 'Settings',
    '💀': 'Skull',
    '🎭': 'Theater',
    '✨': 'Sparkles',
    '🛡️': 'Shield',
    '🌙': 'Moon',
    '☀️': 'Sun',
    '🗳️': 'Vote',
    '✋': 'Hand',
    '👻': 'Ghost',
    '🔒': 'Lock',
    '⏳': 'Hourglass',
  }[emoji] as LucideIconName | undefined;

  if (!iconName) {
    return <span className={cn('text-sm', props.className)}>{emoji}</span>;
  }

  return <Icon icon={iconName} {...props} />;
};
