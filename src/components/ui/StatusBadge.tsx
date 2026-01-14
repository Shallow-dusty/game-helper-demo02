import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { useTranslation } from "react-i18next"
import { cn } from "../../lib/utils"

/**
 * StatusBadge - 状态徽章组件
 *
 * 用于显示玩家/角色状态的小型徽章
 */

const statusBadgeVariants = cva(
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200",
    {
        variants: {
            status: {
                // 存活状态
                alive: "bg-green-500/20 text-green-400 border border-green-500/30",
                // 死亡状态
                dead: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
                // 中毒状态
                poisoned: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
                // 被保护状态
                protected: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
                // 被提名状态
                nominated: "bg-red-500/20 text-red-400 border border-red-500/30",
                // 醉酒状态
                drunk: "bg-violet-500/20 text-violet-400 border border-violet-500/30",
                // 被标记死亡
                marked: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
                // 善良阵营
                good: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                // 邪恶阵营
                evil: "bg-red-600/20 text-red-400 border border-red-600/30",
                // 中立/未知
                neutral: "bg-stone-500/20 text-stone-400 border border-stone-500/30",
                // 信息提示
                info: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
                // 警告
                warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                // 成功
                success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            },
            size: {
                sm: "text-[10px] px-1.5 py-0.5",
                md: "text-xs px-2 py-0.5",
                lg: "text-sm px-2.5 py-1"
            },
            glow: {
                none: "",
                soft: "shadow-sm",
                medium: "shadow-md",
                strong: "shadow-lg"
            },
            animated: {
                none: "",
                pulse: "animate-pulse",
                breath: "animate-breath"
            }
        },
        compoundVariants: [
            // 中毒状态带脉冲动画
            {
                status: "poisoned",
                glow: "medium",
                className: "shadow-[0_0_8px_rgba(168,85,247,0.4)]"
            },
            // 被保护状态带金色光晕
            {
                status: "protected",
                glow: "medium",
                className: "shadow-[0_0_8px_rgba(251,191,36,0.4)]"
            },
            // 被提名状态带红色光晕
            {
                status: "nominated",
                glow: "medium",
                className: "shadow-[0_0_8px_rgba(239,68,68,0.4)]"
            },
            // 被标记死亡带红色闪烁
            {
                status: "marked",
                animated: "pulse",
                className: "shadow-[0_0_10px_rgba(244,63,94,0.5)]"
            }
        ],
        defaultVariants: {
            status: "neutral",
            size: "md",
            glow: "none",
            animated: "none"
        }
    }
)

// 状态图标映射
const statusIcons: Record<string, string> = {
    alive: "●",
    dead: "✕",
    poisoned: "☠",
    protected: "🛡",
    nominated: "⚔",
    drunk: "🍺",
    marked: "💀",
    good: "★",
    evil: "☆",
    neutral: "○",
    info: "ℹ",
    warning: "⚠",
    success: "✓"
}

// 使用 hook 获取状态标签
const useStatusLabels = () => {
    const { t } = useTranslation();
    return {
        alive: t('ui.statusBadge.alive'),
        dead: t('ui.statusBadge.dead'),
        poisoned: t('ui.statusBadge.poisoned'),
        protected: t('ui.statusBadge.protected'),
        nominated: t('ui.statusBadge.nominated'),
        drunk: t('ui.statusBadge.drunk'),
        marked: t('ui.statusBadge.marked'),
        good: t('ui.statusBadge.good'),
        evil: t('ui.statusBadge.evil'),
        neutral: t('ui.statusBadge.neutral'),
        info: t('ui.statusBadge.info'),
        warning: t('ui.statusBadge.warning'),
        success: t('ui.statusBadge.success')
    };
};

export interface StatusBadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
    /** 显示图标 */
    showIcon?: boolean
    /** 自定义图标 */
    icon?: React.ReactNode
    /** 自定义标签文字 */
    label?: string
    /** 是否只显示图标 */
    iconOnly?: boolean
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
    ({
        className,
        status,
        size,
        glow,
        animated,
        showIcon = true,
        icon,
        label,
        iconOnly = false,
        children,
        ...props
    }, ref) => {
        const statusLabels = useStatusLabels();
        const statusKey = status || "neutral"
        const displayIcon = icon || (showIcon ? statusIcons[statusKey] : null)
        const displayLabel = label || statusLabels[statusKey]

        return (
            <span
                ref={ref}
                className={cn(statusBadgeVariants({ status, size, glow, animated, className }))}
                {...props}
            >
                {displayIcon && <span className="flex-shrink-0">{displayIcon}</span>}
                {!iconOnly && (children || displayLabel)}
            </span>
        )
    }
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge, statusBadgeVariants, statusIcons, useStatusLabels }
