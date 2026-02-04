import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../../lib/utils"

/**
 * BloodDrip - 血滴动画效果
 *
 * 从屏幕顶部滴落的血滴效果，用于：
 * - 玩家死亡时
 * - 处决成功时
 * - 恶魔杀人时
 */

interface BloodDropProps {
    id: string
    x: number           // 水平位置 (0-100%)
    delay: number       // 延迟开始 (秒)
    duration: number    // 下落时长 (秒)
    size: "sm" | "md" | "lg"
    onComplete?: () => void
}

const sizeClasses = {
    sm: "w-1 h-8",
    md: "w-1.5 h-12",
    lg: "w-2 h-16"
}

const BloodDrop: React.FC<BloodDropProps> = ({
    id,
    x,
    delay,
    duration,
    size,
    onComplete
}) => {
    return (
        <motion.div
            key={id}
            className={cn(
                "absolute top-0 rounded-b-full",
                "bg-gradient-to-b from-red-700 via-red-800 to-red-900",
                "shadow-[0_0_10px_rgba(220,38,38,0.6)]",
                sizeClasses[size]
            )}
            style={{ left: `${x}%` }}
            initial={{
                y: -50,
                opacity: 0,
                scaleY: 0.5
            }}
            animate={{
                y: "100vh",
                opacity: [0, 1, 1, 0.8, 0],
                scaleY: [0.5, 1, 1.2, 1, 0.8]
            }}
            transition={{
                duration: duration,
                delay: delay,
                ease: [0.4, 0, 0.6, 1]
            }}
            onAnimationComplete={onComplete}
        >
            {/* 血滴尾迹 */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-600/50 to-transparent blur-sm" />

            {/* 血滴高光 */}
            <div className="absolute top-1 left-0.5 w-0.5 h-2 bg-red-400/40 rounded-full blur-[1px]" />
        </motion.div>
    )
}

// 血滴溅射效果
const BloodSplatter: React.FC<{ x: number; delay: number }> = ({ x, delay }) => {
    return (
        <motion.div
            className="absolute bottom-0"
            style={{ left: `${x}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
                scale: [0, 1.2, 1],
                opacity: [0, 1, 0]
            }}
            transition={{
                duration: 0.6,
                delay: delay + 1.8,
                ease: "easeOut"
            }}
        >
            {/* 主溅射点 */}
            <div className="relative w-4 h-2">
                <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-red-800 rounded-full blur-sm" />
                {/* 小溅射点 */}
                <div className="absolute -left-1 top-0 w-1 h-1 bg-red-700 rounded-full" />
                <div className="absolute -right-1 top-0.5 w-1.5 h-1.5 bg-red-700 rounded-full" />
                <div className="absolute left-0 -top-1 w-0.5 h-0.5 bg-red-600 rounded-full" />
            </div>
        </motion.div>
    )
}

export interface BloodDripProps {
    /** 是否显示效果 */
    active: boolean
    /** 血滴数量 */
    dropCount?: number
    /** 效果强度: light 轻微, normal 正常, intense 强烈 */
    intensity?: "light" | "normal" | "intense"
    /** 动画完成回调 */
    onComplete?: () => void
    /** 额外样式类 */
    className?: string
}

// 根据强度生成血滴配置
const generateDrops = (
    count: number,
    intensity: "light" | "normal" | "intense"
): Omit<BloodDropProps, "onComplete">[] => {
    const drops: Omit<BloodDropProps, "onComplete">[] = []

    const intensityConfig: Record<"light" | "normal" | "intense", { sizeWeights: { sm: number; md: number; lg: number }; durationRange: [number, number] }> = {
        light: { sizeWeights: { sm: 0.7, md: 0.25, lg: 0.05 }, durationRange: [2, 3] },
        normal: { sizeWeights: { sm: 0.4, md: 0.4, lg: 0.2 }, durationRange: [1.5, 2.5] },
        intense: { sizeWeights: { sm: 0.2, md: 0.4, lg: 0.4 }, durationRange: [1, 2] }
    }

    const config = intensityConfig[intensity]

    for (let i = 0; i < count; i++) {
        const rand = Math.random()
        let size: "sm" | "md" | "lg"
        if (rand < config.sizeWeights.sm) size = "sm"
        else if (rand < config.sizeWeights.sm + config.sizeWeights.md) size = "md"
        else size = "lg"

        drops.push({
            id: `drop-${Date.now()}-${i}`,
            x: 5 + Math.random() * 90, // 5-95% 避免边缘
            delay: Math.random() * 0.8,
            duration: config.durationRange[0] + Math.random() * (config.durationRange[1] - config.durationRange[0]),
            size
        })
    }

    return drops
}

export const BloodDrip: React.FC<BloodDripProps> = ({
    active,
    dropCount = 5,
    intensity = "normal",
    onComplete,
    className
}) => {
    const [drops, setDrops] = React.useState<Omit<BloodDropProps, "onComplete">[]>([])
    const [, setCompletedCount] = React.useState(0)

    React.useEffect(() => {
        if (active) {
            setDrops(generateDrops(dropCount, intensity))
            setCompletedCount(0)
        } else {
            setDrops([])
        }
    }, [active, dropCount, intensity])

    const handleDropComplete = React.useCallback(() => {
        setCompletedCount(prev => {
            const newCount = prev + 1
            if (newCount >= dropCount && onComplete) {
                // 延迟调用以等待溅射动画完成
                setTimeout(onComplete, 800)
            }
            return newCount
        })
    }, [dropCount, onComplete])

    return (
        <AnimatePresence>
            {active && drops.length > 0 && (
                <motion.div
                    className={cn(
                        "fixed inset-0 pointer-events-none overflow-hidden",
                        "z-[100]",
                        className
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* 顶部红色光晕 */}
                    <motion.div
                        className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-red-900/30 to-transparent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.6, 0.3] }}
                        transition={{ duration: 0.5 }}
                    />

                    {/* 血滴 */}
                    {drops.map((drop) => (
                        <BloodDrop
                            key={drop.id}
                            {...drop}
                            onComplete={handleDropComplete}
                        />
                    ))}

                    {/* 底部溅射 */}
                    {drops.map((drop) => (
                        <BloodSplatter
                            key={`splatter-${drop.id}`}
                            x={drop.x}
                            delay={drop.delay}
                        />
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

BloodDrip.displayName = "BloodDrip"

export default BloodDrip
