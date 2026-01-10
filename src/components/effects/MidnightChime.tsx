import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../../lib/utils"

/**
 * MidnightChime - 午夜钟声效果
 *
 * 夜晚阶段开始时的视觉效果：
 * - 钟摆摇动动画
 * - 屏幕边缘的月光效果
 * - 时钟指针转动
 */

interface ClockHandProps {
    type: "hour" | "minute"
    angle: number
}

const ClockHand: React.FC<ClockHandProps> = ({ type, angle }) => {
    const isHour = type === "hour"
    return (
        <motion.div
            className={cn(
                "absolute left-1/2 bottom-1/2 origin-bottom",
                isHour ? "w-1 h-6 -ml-0.5" : "w-0.5 h-8 -ml-[1px]"
            )}
            style={{
                background: isHour
                    ? "linear-gradient(to top, #c0a060, #8a7040)"
                    : "linear-gradient(to top, #8a7040, #6b5a30)"
            }}
            initial={{ rotate: angle - 30 }}
            animate={{ rotate: angle }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
        />
    )
}

interface BellProps {
    delay: number
    side: "left" | "right"
}

const Bell: React.FC<BellProps> = ({ delay, side }) => {
    const isLeft = side === "left"

    return (
        <motion.div
            className={cn(
                "absolute top-8",
                isLeft ? "left-8" : "right-8"
            )}
            initial={{ rotate: 0 }}
            animate={{
                rotate: [0, isLeft ? 15 : -15, isLeft ? -15 : 15, 0]
            }}
            transition={{
                duration: 0.8,
                delay,
                repeat: 3,
                ease: "easeInOut"
            }}
        >
            {/* 钟体 */}
            <div className="relative">
                <div
                    className="w-8 h-10 rounded-b-full"
                    style={{
                        background: "linear-gradient(135deg, #b8860b 0%, #8b6914 50%, #654321 100%)",
                        boxShadow: "inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.1)"
                    }}
                />
                {/* 钟锤 */}
                <motion.div
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-900"
                    animate={{
                        y: [0, 2, 0]
                    }}
                    transition={{
                        duration: 0.4,
                        delay: delay + 0.2,
                        repeat: 3
                    }}
                />
                {/* 钟顶 */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-3 rounded-t-full bg-amber-700" />
            </div>
        </motion.div>
    )
}

// 声波效果
const SoundWave: React.FC<{ delay: number }> = ({ delay }) => {
    return (
        <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-500/30"
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{
                width: [0, 200, 400],
                height: [0, 200, 400],
                opacity: [0.8, 0.4, 0]
            }}
            transition={{
                duration: 2,
                delay,
                ease: "easeOut"
            }}
        />
    )
}

export interface MidnightChimeProps {
    /** 是否激活效果 */
    active: boolean
    /** 钟声次数 (1-12) */
    chimeCount?: number
    /** 是否显示时钟 */
    showClock?: boolean
    /** 是否显示月光效果 */
    showMoonlight?: boolean
    /** 动画完成回调 */
    onComplete?: () => void
    /** 额外样式类 */
    className?: string
}

export const MidnightChime: React.FC<MidnightChimeProps> = ({
    active,
    chimeCount = 12,
    showClock = true,
    showMoonlight = true,
    onComplete,
    className
}) => {
    const [phase, setPhase] = React.useState<"idle" | "chiming" | "fading">("idle")

    React.useEffect(() => {
        if (!active) return

        setPhase("chiming")
        const totalDuration = 800 * Math.min(chimeCount, 12) + 2000
        const timer = setTimeout(() => {
            setPhase("fading")
            setTimeout(() => {
                setPhase("idle")
                onComplete?.()
            }, 1000)
        }, totalDuration)
        return () => clearTimeout(timer)
    }, [active, chimeCount, onComplete])

    const isActive = phase !== "idle"

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    className={cn(
                        "fixed inset-0 pointer-events-none z-[100]",
                        className
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* 月光渐变背景 */}
                    {showMoonlight && (
                        <motion.div
                            className="absolute inset-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.4, 0.2] }}
                            transition={{ duration: 2 }}
                            style={{
                                background: `
                                    radial-gradient(ellipse at top, rgba(200, 210, 230, 0.15) 0%, transparent 50%),
                                    radial-gradient(ellipse at bottom left, rgba(100, 120, 150, 0.1) 0%, transparent 40%),
                                    radial-gradient(ellipse at bottom right, rgba(100, 120, 150, 0.1) 0%, transparent 40%)
                                `
                            }}
                        />
                    )}

                    {/* 中央时钟 */}
                    {showClock && (
                        <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* 时钟外框 */}
                            <div
                                className="relative w-32 h-32 rounded-full"
                                style={{
                                    background: "linear-gradient(135deg, rgba(30, 20, 15, 0.95) 0%, rgba(15, 10, 8, 0.98) 100%)",
                                    boxShadow: `
                                        0 0 40px rgba(192, 160, 96, 0.3),
                                        inset 0 0 20px rgba(0, 0, 0, 0.5),
                                        0 0 60px rgba(0, 0, 0, 0.5)
                                    `,
                                    border: "3px solid rgba(192, 160, 96, 0.4)"
                                }}
                            >
                                {/* 时钟刻度 */}
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-0.5 h-2 bg-amber-600/60"
                                        style={{
                                            left: "50%",
                                            top: "8px",
                                            transformOrigin: "center 56px",
                                            transform: `translateX(-50%) rotate(${i * 30}deg)`
                                        }}
                                    />
                                ))}

                                {/* 时钟指针 */}
                                <ClockHand type="hour" angle={0} />
                                <ClockHand type="minute" angle={0} />

                                {/* 中心点 */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-600 shadow-lg" />

                                {/* XII 标记 */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 text-amber-500/80 text-xs font-cinzel font-bold">
                                    XII
                                </div>
                            </div>

                            {/* 声波效果 */}
                            {phase === "chiming" && [...Array(Math.min(chimeCount, 4))].map((_, i) => (
                                <SoundWave key={i} delay={i * 0.8} />
                            ))}
                        </motion.div>
                    )}

                    {/* 左右铃铛 */}
                    {phase === "chiming" && (
                        <>
                            <Bell side="left" delay={0.3} />
                            <Bell side="right" delay={0.5} />
                        </>
                    )}

                    {/* 屏幕边缘钟摆阴影 */}
                    <motion.div
                        className="absolute bottom-0 left-0 w-32 h-64 opacity-20"
                        animate={{
                            rotate: [-5, 5, -5]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{
                            background: "linear-gradient(to top, rgba(50, 40, 30, 0.8), transparent)",
                            transformOrigin: "top center"
                        }}
                    />

                    <motion.div
                        className="absolute bottom-0 right-0 w-32 h-64 opacity-20"
                        animate={{
                            rotate: [5, -5, 5]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{
                            background: "linear-gradient(to top, rgba(50, 40, 30, 0.8), transparent)",
                            transformOrigin: "top center"
                        }}
                    />

                    {/* 底部文字 */}
                    <motion.div
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: 0.5 }}
                    >
                        <p className="text-amber-500/80 font-cinzel text-2xl tracking-widest uppercase">
                            Midnight
                        </p>
                        <p className="text-stone-400/60 text-sm mt-1 font-serif italic">
                            The night falls upon the village...
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

MidnightChime.displayName = "MidnightChime"

export default MidnightChime
