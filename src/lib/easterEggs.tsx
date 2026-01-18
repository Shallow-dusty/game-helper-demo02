/**
 * Easter Eggs - 彩蛋触发系统
 *
 * 管理血染钟楼主题的趣味性视觉效果
 */

import React from "react"

// ===== 类型定义 =====

export type EasterEggTrigger =
    | "death"           // 玩家死亡
    | "execution"       // 处决成功
    | "nightStart"      // 夜晚开始
    | "dayStart"        // 白天开始
    | "vote"            // 投票
    | "nomination"      // 提名
    | "demonKill"       // 恶魔杀人
    | "ability"         // 能力使用
    | "gameEnd"         // 游戏结束
    | "random"          // 随机触发

export interface EasterEgg {
    id: string
    name: string
    description: string
    trigger: EasterEggTrigger
    probability: number      // 触发概率 0-1
    cooldown: number         // 冷却时间 (毫秒)
    duration: number         // 持续时间 (毫秒)
    enabled: boolean         // 是否启用
    priority: number         // 优先级 (越高越先触发)
}

export interface EasterEggEvent {
    eggId: string
    trigger: EasterEggTrigger
    timestamp: number
    context?: Record<string, unknown>
}

export interface EasterEggState {
    activeEggs: string[]                    // 当前激活的彩蛋
    cooldowns: Record<string, number>       // 冷却中的彩蛋
    history: EasterEggEvent[]               // 历史记录
    settings: EasterEggSettings
}

export interface EasterEggSettings {
    enabled: boolean                        // 总开关
    intensity: "low" | "medium" | "high"    // 效果强度
    reduceMotion: boolean                   // 减少动画 (无障碍)
    enabledEggs: Record<string, boolean>    // 单个彩蛋开关
}

// ===== 预定义彩蛋 =====

export const easterEggs: EasterEgg[] = [
    {
        id: "blood-drip",
        name: "血滴",
        description: "处决或死亡时从屏幕顶部滴落的血滴",
        trigger: "execution",
        probability: 1,
        cooldown: 3000,
        duration: 3000,
        enabled: true,
        priority: 10
    },
    {
        id: "blood-drip-death",
        name: "死亡血滴",
        description: "玩家死亡时的血滴效果",
        trigger: "death",
        probability: 0.8,
        cooldown: 2000,
        duration: 2500,
        enabled: true,
        priority: 9
    },
    {
        id: "ghost-particles",
        name: "幽灵粒子",
        description: "死亡玩家周围飘浮的幽灵粒子",
        trigger: "death",
        probability: 0.7,
        cooldown: 5000,
        duration: 8000,
        enabled: true,
        priority: 5
    },
    {
        id: "midnight-chime",
        name: "午夜钟声",
        description: "夜晚阶段开始时的钟声动画",
        trigger: "nightStart",
        probability: 1,
        cooldown: 0,
        duration: 4000,
        enabled: true,
        priority: 20
    },
    {
        id: "demon-kill-effect",
        name: "恶魔杀戮",
        description: "恶魔杀人时的特殊效果",
        trigger: "demonKill",
        probability: 1,
        cooldown: 0,
        duration: 2000,
        enabled: true,
        priority: 15
    },
    {
        id: "random-ghost",
        name: "随机幽灵",
        description: "随机出现的幽灵粒子",
        trigger: "random",
        probability: 0.05,
        cooldown: 60000,
        duration: 5000,
        enabled: true,
        priority: 1
    }
]

// ===== 默认设置 =====

export const defaultEasterEggSettings: EasterEggSettings = {
    enabled: true,
    intensity: "medium",
    reduceMotion: false,
    enabledEggs: Object.fromEntries(easterEggs.map(egg => [egg.id, egg.enabled]))
}

// ===== 工具函数 =====

/**
 * 检查彩蛋是否应该触发
 */
export function shouldTriggerEasterEgg(
    egg: EasterEgg,
    settings: EasterEggSettings,
    cooldowns: Record<string, number>
): boolean {
    // 总开关
    if (!settings.enabled) return false

    // 单个彩蛋开关
    if (!settings.enabledEggs[egg.id]) return false

    // 减少动画模式下跳过非必要效果
    if (settings.reduceMotion && egg.priority < 10) return false

    // 检查冷却
    const lastTrigger = cooldowns[egg.id] || 0
    if (Date.now() - lastTrigger < egg.cooldown) return false

    // 概率检查
    return Math.random() < egg.probability
}

/**
 * 根据触发条件筛选彩蛋
 */
export function getEasterEggsForTrigger(
    trigger: EasterEggTrigger,
    settings: EasterEggSettings,
    cooldowns: Record<string, number>
): EasterEgg[] {
    return easterEggs
        .filter(egg => egg.trigger === trigger)
        .filter(egg => shouldTriggerEasterEgg(egg, settings, cooldowns))
        .sort((a, b) => b.priority - a.priority)
}

/**
 * 根据强度调整效果参数
 */
export function getIntensityMultiplier(settings: EasterEggSettings): number {
    switch (settings.intensity) {
        case "low": return 0.5
        case "medium": return 1
        case "high": return 1.5
        default: return 1
    }
}

/**
 * 获取彩蛋持续时间（根据强度调整）
 */
export function getEggDuration(egg: EasterEgg, settings: EasterEggSettings): number {
    const multiplier = getIntensityMultiplier(settings)
    return egg.duration * multiplier
}

// ===== React Context =====

interface EasterEggContextValue {
    state: EasterEggState
    trigger: (triggerType: EasterEggTrigger, context?: Record<string, unknown>) => void
    setSettings: (settings: Partial<EasterEggSettings>) => void
    clearActive: () => void
}

const defaultState: EasterEggState = {
    activeEggs: [],
    cooldowns: {},
    history: [],
    settings: defaultEasterEggSettings
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

export const EasterEggContext = React.createContext<EasterEggContextValue>({
    state: defaultState,
    trigger: noop,
    setSettings: noop,
    clearActive: noop
})

// ===== Provider 组件 =====

interface EasterEggProviderProps {
    children: React.ReactNode
    initialSettings?: Partial<EasterEggSettings>
}

export const EasterEggProvider: React.FC<EasterEggProviderProps> = ({
    children,
    initialSettings
}) => {
    const [state, setState] = React.useState<EasterEggState>(() => ({
        ...defaultState,
        settings: { ...defaultEasterEggSettings, ...initialSettings }
    }))

    const trigger = React.useCallback((
        triggerType: EasterEggTrigger,
        context?: Record<string, unknown>
    ) => {
        setState(prev => {
            const eligibleEggs = getEasterEggsForTrigger(
                triggerType,
                prev.settings,
                prev.cooldowns
            )

            if (eligibleEggs.length === 0) return prev

            // 取最高优先级的彩蛋
            const eggToTrigger = eligibleEggs[0]!

            const event: EasterEggEvent = {
                eggId: eggToTrigger.id,
                trigger: triggerType,
                timestamp: Date.now(),
                context
            }

            // 设置自动清除
            const duration = getEggDuration(eggToTrigger, prev.settings)
            setTimeout(() => {
                setState(s => ({
                    ...s,
                    activeEggs: s.activeEggs.filter(id => id !== eggToTrigger.id)
                }))
            }, duration)

            return {
                ...prev,
                activeEggs: [...prev.activeEggs, eggToTrigger.id],
                cooldowns: {
                    ...prev.cooldowns,
                    [eggToTrigger.id]: Date.now()
                },
                history: [...prev.history, event].slice(-50) // 保留最近50条
            }
        })
    }, [])

    const setSettings = React.useCallback((newSettings: Partial<EasterEggSettings>) => {
        setState(prev => ({
            ...prev,
            settings: { ...prev.settings, ...newSettings }
        }))
    }, [])

    const clearActive = React.useCallback(() => {
        setState(prev => ({
            ...prev,
            activeEggs: []
        }))
    }, [])

    // 随机触发检查
    React.useEffect(() => {
        if (!state.settings.enabled) return

        const interval = setInterval(() => {
            const randomEggs = easterEggs.filter(egg => egg.trigger === "random")
            for (const egg of randomEggs) {
                if (shouldTriggerEasterEgg(egg, state.settings, state.cooldowns)) {
                    trigger("random")
                    break
                }
            }
        }, 10000) // 每10秒检查一次

        return () => clearInterval(interval)
    }, [state.settings, state.cooldowns, trigger])

    const value: EasterEggContextValue = {
        state,
        trigger,
        setSettings,
        clearActive
    }

    return (
        <EasterEggContext.Provider value={value}>
            {children}
        </EasterEggContext.Provider>
    )
}

// ===== Hook =====

export function useEasterEgg() {
    const context = React.useContext(EasterEggContext)
    if (!context) {
        throw new Error("useEasterEgg must be used within EasterEggProvider")
    }
    return context
}

/**
 * 检查特定彩蛋是否激活
 */
export function useIsEasterEggActive(eggId: string): boolean {
    const { state } = useEasterEgg()
    return state.activeEggs.includes(eggId)
}

/**
 * 获取彩蛋设置
 */
export function useEasterEggSettings(): [
    EasterEggSettings,
    (settings: Partial<EasterEggSettings>) => void
] {
    const { state, setSettings } = useEasterEgg()
    return [state.settings, setSettings]
}
