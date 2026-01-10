import * as React from "react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import { cn } from "../../lib/utils"

/**
 * GhostParticles - 幽灵粒子效果
 *
 * 飘浮的幽灵粒子效果，用于：
 * - 死亡玩家座位周围
 * - 夜晚阶段背景氛围
 * - 鬼魂相关角色能力触发
 */

interface GhostParticle {
    id: string
    x: number
    y: number
    size: number
    opacity: number
    duration: number
    delay: number
}

const generateParticles = (count: number, bounds: { width: number; height: number }): GhostParticle[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `ghost-${String(Date.now())}-${String(i)}`,
        x: Math.random() * bounds.width,
        y: Math.random() * bounds.height,
        size: 4 + Math.random() * 8,
        opacity: 0.3 + Math.random() * 0.4,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 2
    }))
}

interface GhostParticleItemProps {
    particle: GhostParticle
    mouseX: number
    mouseY: number
    avoidMouse: boolean
}

const GhostParticleItem: React.FC<GhostParticleItemProps> = ({
    particle,
    mouseX,
    mouseY,
    avoidMouse
}) => {
    const x = useMotionValue(particle.x)
    const y = useMotionValue(particle.y)

    const springX = useSpring(x, { stiffness: 50, damping: 20 })
    const springY = useSpring(y, { stiffness: 50, damping: 20 })

    // 鼠标躲避效果
    React.useEffect(() => {
        if (!avoidMouse) return

        const dx = particle.x - mouseX
        const dy = particle.y - mouseY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const avoidRadius = 80

        if (distance < avoidRadius && distance > 0) {
            const force = (avoidRadius - distance) / avoidRadius
            const pushX = (dx / distance) * force * 40
            const pushY = (dy / distance) * force * 40
            x.set(particle.x + pushX)
            y.set(particle.y + pushY)
        } else {
            x.set(particle.x)
            y.set(particle.y)
        }
    }, [mouseX, mouseY, particle.x, particle.y, avoidMouse, x, y])

    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{
                x: springX,
                y: springY,
                width: particle.size,
                height: particle.size
            }}
            initial={{
                opacity: 0,
                scale: 0
            }}
            animate={{
                opacity: [0, particle.opacity, particle.opacity * 0.5, particle.opacity, 0],
                scale: [0.5, 1, 1.2, 1, 0.5],
                y: [particle.y, particle.y - 20, particle.y + 10, particle.y - 15, particle.y]
            }}
            transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            {/* 幽灵粒子主体 */}
            <div
                className="w-full h-full rounded-full"
                style={{
                    background: `radial-gradient(circle, rgba(200, 200, 220, ${String(particle.opacity)}) 0%, rgba(150, 150, 180, ${String(particle.opacity * 0.5)}) 50%, transparent 70%)`,
                    boxShadow: `0 0 ${String(particle.size * 2)}px rgba(200, 200, 220, ${String(particle.opacity * 0.5)})`
                }}
            />

            {/* 幽灵尾迹 */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm"
                style={{
                    width: particle.size * 1.5,
                    height: particle.size * 1.5,
                    background: `radial-gradient(circle, rgba(180, 180, 200, ${String(particle.opacity * 0.3)}) 0%, transparent 70%)`
                }}
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.3, 0.5]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </motion.div>
    )
}

export interface GhostParticlesProps {
    /** 是否激活效果 */
    active: boolean
    /** 粒子数量 */
    particleCount?: number
    /** 是否响应鼠标躲避 */
    avoidMouse?: boolean
    /** 容器宽度 (默认 100%) */
    width?: number | string
    /** 容器高度 (默认 100%) */
    height?: number | string
    /** 变体样式 */
    variant?: "default" | "death" | "spirit" | "ethereal"
    /** 额外样式类 */
    className?: string
}

const variantStyles = {
    default: "",
    death: "mix-blend-screen",
    spirit: "mix-blend-overlay",
    ethereal: "mix-blend-soft-light"
}

export const GhostParticles: React.FC<GhostParticlesProps> = ({
    active,
    particleCount = 15,
    avoidMouse = true,
    width = "100%",
    height = "100%",
    variant = "default",
    className
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [particles, setParticles] = React.useState<GhostParticle[]>([])
    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 })
    const [, setBounds] = React.useState({ width: 300, height: 300 })

    // 初始化粒子
    React.useEffect(() => {
        if (active && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            setBounds({ width: rect.width, height: rect.height })
            setParticles(generateParticles(particleCount, { width: rect.width, height: rect.height }))
        } else {
            setParticles([])
        }
    }, [active, particleCount])

    // 鼠标追踪
    React.useEffect(() => {
        if (!avoidMouse || !containerRef.current) return

        const handleMouseMove = (e: MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
                setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                })
            }
        }

        const container = containerRef.current
        container.addEventListener("mousemove", handleMouseMove)
        return () => container.removeEventListener("mousemove", handleMouseMove)
    }, [avoidMouse])

    // 周期性重新生成粒子位置
    React.useEffect(() => {
        if (!active) return

        const interval = setInterval(() => {
            setParticles(prev =>
                prev.map(p => ({
                    ...p,
                    x: p.x + (Math.random() - 0.5) * 30,
                    y: p.y + (Math.random() - 0.5) * 30
                }))
            )
        }, 3000)

        return () => clearInterval(interval)
    }, [active])

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative overflow-hidden pointer-events-auto",
                variantStyles[variant],
                className
            )}
            style={{ width, height }}
        >
            <AnimatePresence>
                {active && particles.map((particle) => (
                    <GhostParticleItem
                        key={particle.id}
                        particle={particle}
                        mouseX={mousePos.x}
                        mouseY={mousePos.y}
                        avoidMouse={avoidMouse}
                    />
                ))}
            </AnimatePresence>

            {/* 背景雾气效果 */}
            {active && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "radial-gradient(ellipse at center, rgba(100, 100, 130, 0.1) 0%, transparent 70%)"
                        }}
                    />
                </motion.div>
            )}
        </div>
    )
}

GhostParticles.displayName = "GhostParticles"

// 预设配置导出
export const ghostParticlePresets = {
    /** 死亡玩家周围 - 少量、缓慢 */
    death: {
        particleCount: 8,
        avoidMouse: true,
        variant: "death" as const
    },
    /** 夜晚背景 - 大量、稀疏 */
    nightAmbient: {
        particleCount: 25,
        avoidMouse: false,
        variant: "ethereal" as const
    },
    /** 灵媒能力 - 中等、活跃 */
    spiritMedium: {
        particleCount: 15,
        avoidMouse: true,
        variant: "spirit" as const
    }
}

export default GhostParticles
