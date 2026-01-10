import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

/**
 * Skeleton - 骨架屏组件
 *
 * 用于内容加载时的占位显示，符合哥特式主题
 */

const skeletonVariants = cva(
    "animate-pulse rounded-md",
    {
        variants: {
            variant: {
                default: "bg-stone-800/50",
                ghost: "bg-stone-700/30 backdrop-blur-sm",
                blood: "bg-red-900/20",
                gold: "bg-amber-900/20"
            },
            animation: {
                pulse: "animate-pulse",
                shimmer: "animate-shimmer bg-gradient-to-r from-transparent via-stone-700/30 to-transparent bg-[length:200%_100%]",
                none: ""
            }
        },
        defaultVariants: {
            variant: "default",
            animation: "pulse"
        }
    }
)

export interface SkeletonProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, variant, animation, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(skeletonVariants({ variant, animation, className }))}
            {...props}
        />
    )
)
Skeleton.displayName = "Skeleton"

// ===== 预设骨架组件 =====

/**
 * 文本骨架 - 用于标题或段落占位
 */
export interface SkeletonTextProps extends SkeletonProps {
    /** 行数 */
    lines?: number
    /** 最后一行宽度 */
    lastLineWidth?: string
}

const SkeletonText: React.FC<SkeletonTextProps> = ({
    lines = 3,
    lastLineWidth = "60%",
    className,
    ...props
}) => (
    <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                className="h-4"
                style={{
                    width: i === lines - 1 ? lastLineWidth : "100%"
                }}
                {...props}
            />
        ))}
    </div>
)
SkeletonText.displayName = "SkeletonText"

/**
 * 头像骨架 - 圆形占位
 */
export interface SkeletonAvatarProps extends SkeletonProps {
    size?: "sm" | "md" | "lg" | "xl"
}

const avatarSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
}

const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
    size = "md",
    className,
    ...props
}) => (
    <Skeleton
        className={cn("rounded-full", avatarSizes[size], className)}
        {...props}
    />
)
SkeletonAvatar.displayName = "SkeletonAvatar"

/**
 * 卡片骨架 - 完整卡片占位
 */
export interface SkeletonCardProps extends SkeletonProps {
    showAvatar?: boolean
    showImage?: boolean
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
    showAvatar = true,
    showImage = false,
    className,
    variant = "ghost",
    ...props
}) => (
    <div
        className={cn(
            "rounded-lg border border-stone-800/50 bg-stone-900/30 p-4 space-y-4",
            className
        )}
    >
        {showImage && (
            <Skeleton
                variant={variant}
                className="h-32 w-full rounded-md"
                {...props}
            />
        )}
        <div className="flex items-center gap-3">
            {showAvatar && <SkeletonAvatar variant={variant} {...props} />}
            <div className="flex-1 space-y-2">
                <Skeleton variant={variant} className="h-4 w-1/3" {...props} />
                <Skeleton variant={variant} className="h-3 w-1/2" {...props} />
            </div>
        </div>
        <SkeletonText variant={variant} lines={2} {...props} />
    </div>
)
SkeletonCard.displayName = "SkeletonCard"

/**
 * 玩家座位骨架 - 游戏中的玩家位置占位
 */
const SkeletonPlayerSeat: React.FC<SkeletonProps> = ({
    className,
    variant = "ghost",
    ...props
}) => (
    <div
        className={cn(
            "flex flex-col items-center gap-2 p-3",
            className
        )}
    >
        <SkeletonAvatar size="lg" variant={variant} {...props} />
        <Skeleton variant={variant} className="h-3 w-16" {...props} />
        <Skeleton variant={variant} className="h-5 w-20 rounded-full" {...props} />
    </div>
)
SkeletonPlayerSeat.displayName = "SkeletonPlayerSeat"

/**
 * 角色卡骨架 - 角色信息卡占位
 */
const SkeletonRoleCard: React.FC<SkeletonProps> = ({
    className,
    variant = "ghost",
    ...props
}) => (
    <div
        className={cn(
            "rounded-lg border border-stone-800/50 bg-stone-900/30 p-4",
            className
        )}
    >
        <div className="flex gap-4">
            <Skeleton
                variant={variant}
                className="w-20 h-20 rounded-lg flex-shrink-0"
                {...props}
            />
            <div className="flex-1 space-y-3">
                <Skeleton variant={variant} className="h-5 w-2/3" {...props} />
                <Skeleton variant={variant} className="h-3 w-1/4 rounded-full" {...props} />
                <SkeletonText variant={variant} lines={2} {...props} />
            </div>
        </div>
    </div>
)
SkeletonRoleCard.displayName = "SkeletonRoleCard"

/**
 * 列表骨架 - 列表项占位
 */
export interface SkeletonListProps extends SkeletonProps {
    count?: number
    itemClassName?: string
}

const SkeletonList: React.FC<SkeletonListProps> = ({
    count = 5,
    itemClassName,
    className,
    variant = "ghost",
    ...props
}) => (
    <div className={cn("space-y-3", className)}>
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className={cn("flex items-center gap-3", itemClassName)}
            >
                <SkeletonAvatar size="sm" variant={variant} {...props} />
                <div className="flex-1 space-y-1">
                    <Skeleton
                        variant={variant}
                        className="h-4"
                        style={{ width: `${60 + Math.random() * 30}%` }}
                        {...props}
                    />
                    <Skeleton
                        variant={variant}
                        className="h-3"
                        style={{ width: `${40 + Math.random() * 20}%` }}
                        {...props}
                    />
                </div>
            </div>
        ))}
    </div>
)
SkeletonList.displayName = "SkeletonList"

/**
 * 游戏座位圈骨架 - 用于 Grimoire 加载状态
 */
export interface SkeletonSeatCircleProps extends SkeletonProps {
    seatCount?: number
}

const SkeletonSeatCircle: React.FC<SkeletonSeatCircleProps> = ({
    seatCount = 12,
    className,
    ...props
}) => {
    const seats = Array.from({ length: seatCount })

    return (
        <div className={cn("relative w-full aspect-square max-w-[600px] mx-auto", className)}>
            {/* 中心标志 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Skeleton className="w-24 h-24 rounded-full" {...props} />
            </div>

            {/* 座位 */}
            {seats.map((_, i) => {
                const angle = (i / seatCount) * 2 * Math.PI - Math.PI / 2
                const radius = 42 // percentage
                const x = 50 + radius * Math.cos(angle)
                const y = 50 + radius * Math.sin(angle)

                return (
                    <div
                        key={i}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: `${x}%`,
                            top: `${y}%`
                        }}
                    >
                        <SkeletonPlayerSeat {...props} />
                    </div>
                )
            })}
        </div>
    )
}
SkeletonSeatCircle.displayName = "SkeletonSeatCircle"

export {
    Skeleton,
    SkeletonText,
    SkeletonAvatar,
    SkeletonCard,
    SkeletonPlayerSeat,
    SkeletonRoleCard,
    SkeletonList,
    SkeletonSeatCircle,
    skeletonVariants
}
