/**
 * BloodPact - 血契仪式
 * 
 * 邪恶阵营首夜互相确认视觉效果
 * - 红色火焰粒子标记恶魔爪牙座位
 * - 恶魔图腾显示
 * - 暗红色氛围光晕
 */

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import { useTranslation } from 'react-i18next';

interface BloodPactProps {
    isActive: boolean;
    /** 邪恶座位ID列表 (爪牙) */
    minionSeatIds: number[];
    /** 恶魔座位ID (可选，用于显示特殊图腾) */
    demonSeatId?: number;
    /** 座位位置信息 */
    seatPositions: { id: number; x: number; y: number }[];
    /** 动画完成回调 */
    onComplete?: () => void;
    /** 容器尺寸 */
    containerSize?: { width: number; height: number };
}

// 火焰粒子组件
const FlameParticle: React.FC<{ 
    x: number; 
    y: number; 
    delay?: number;
    size?: number;
}> = ({ x, y, delay = 0, size = 20 }) => {
    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{ 
                left: x - size / 2, 
                top: y - size / 2,
                width: size,
                height: size * 1.5,
            }}
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0.3, 1, 1.2, 0.5],
                y: [10, 0, -20, -40],
            }}
            transition={{
                duration: 2,
                delay,
                times: [0, 0.2, 0.7, 1],
                repeat: Infinity,
                repeatDelay: 0.5,
            }}
        >
            {/* 火焰核心 */}
            <div 
                className="w-full h-full rounded-full"
                style={{
                    background: `radial-gradient(ellipse at center bottom, 
                        rgba(255, 220, 100, 1) 0%, 
                        rgba(255, 120, 50, 0.9) 30%, 
                        rgba(180, 30, 30, 0.7) 60%, 
                        transparent 100%)`,
                    filter: 'blur(2px)',
                    animation: 'flame-flicker 0.15s ease-in-out infinite alternate',
                }}
            />
        </motion.div>
    );
};

// 恶魔图腾组件
const DemonTotem: React.FC<{ 
    x: number; 
    y: number;
}> = ({ x, y }) => {
    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{ 
                left: x - 40, 
                top: y - 40,
                width: 80,
                height: 80,
            }}
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ 
                opacity: 1, 
                scale: 1, 
                rotate: 0,
            }}
            transition={{
                duration: 1,
                type: 'spring',
                stiffness: 100,
            }}
        >
            {/* 外圈光晕 */}
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(180, 30, 30, 0.4) 0%, transparent 70%)',
                    filter: 'blur(10px)',
                }}
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                }}
            />
            
            {/* 恶魔符号 */}
            <div 
                className="absolute inset-0 flex items-center justify-center text-4xl"
                style={{
                    filter: 'drop-shadow(0 0 10px rgba(255, 50, 50, 0.8))',
                }}
            >
                👿
            </div>
            
            {/* 符文圆环 */}
            <svg 
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 80 80"
            >
                <motion.circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="rgba(180, 30, 30, 0.6)"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    style={{ transformOrigin: '40px 40px' }}
                />
            </svg>
        </motion.div>
    );
};

// 爪牙标记组件
const MinionMark: React.FC<{ 
    x: number; 
    y: number;
    index: number;
}> = ({ x, y, index }) => {
    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{ 
                left: x - 30, 
                top: y - 30,
                width: 60,
                height: 60,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                delay: 0.5 + index * 0.3,
                duration: 0.5,
                type: 'spring',
            }}
        >
            {/* 火焰粒子环绕 */}
            {Array.from({ length: 6 }).map((_, i) => {
                const angle = (i * 60) * Math.PI / 180;
                const radius = 25;
                const px = 30 + Math.cos(angle) * radius;
                const py = 30 + Math.sin(angle) * radius;
                return (
                    <FlameParticle 
                        key={i}
                        x={px}
                        y={py}
                        delay={i * 0.15}
                        size={12}
                    />
                );
            })}
            
            {/* 红色光晕 */}
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 60%)',
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2,
                }}
            />
            
            {/* 爪牙符号 */}
            <div 
                className="absolute inset-0 flex items-center justify-center text-2xl"
                style={{
                    filter: 'drop-shadow(0 0 5px rgba(255, 100, 100, 0.8))',
                }}
            >
                🔥
            </div>
        </motion.div>
    );
};

export const BloodPact: React.FC<BloodPactProps> = ({
    isActive,
    minionSeatIds,
    demonSeatId,
    seatPositions,
    onComplete,

    containerSize: _containerSize = { width: 800, height: 600 },
}) => {
    const { t } = useTranslation();
    const { playSound } = useSoundEffect();
    const [phase, setPhase] = useState<'idle' | 'reveal' | 'complete'>('idle');

    // 获取座位位置
    const minionPositions = useMemo(() => {
        return minionSeatIds
            .map(id => seatPositions.find(s => s.id === id))
            .filter(Boolean) as { id: number; x: number; y: number }[];
    }, [minionSeatIds, seatPositions]);

    const demonPosition = useMemo(() => {
        if (demonSeatId === undefined || demonSeatId === null) return null;
        return seatPositions.find(s => s.id === demonSeatId) ?? null;
    }, [demonSeatId, seatPositions]);

    useEffect(() => {
        if (isActive && phase === 'idle') {
            setPhase('reveal');
            
            // 播放神秘音效
            playSound('ghost_whisper');
            
            // 3秒后完成
            const timer = setTimeout(() => {
                setPhase('complete');
                onComplete?.();
            }, 4000);

            return () => clearTimeout(timer);
        }
        
        if (!isActive && phase !== 'idle') {
            setPhase('idle');
        }
        return undefined;
    }, [isActive, phase, playSound, onComplete]);

    if (!isActive || phase === 'idle') return null;

    return (
        <AnimatePresence>
            <motion.div
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{ zIndex: 50 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* 背景暗红色渐变 */}
                <motion.div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(80, 0, 0, 0.4) 0%, rgba(20, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.8) 100%)',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                />

                {/* 血雾效果 */}
                <div className="absolute inset-0 blood-mist" />

                {/* 恶魔图腾 */}
                {demonPosition && (
                    <DemonTotem x={demonPosition.x} y={demonPosition.y} />
                )}

                {/* 爪牙标记 */}
                {minionPositions.map((pos, index) => (
                    <MinionMark 
                        key={pos.id}
                        x={pos.x}
                        y={pos.y}
                        index={index}
                    />
                ))}

                {/* 标题文字 */}
                <motion.div
                    className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    <h2
                        className="text-3xl font-cinzel text-red-500 tracking-widest"
                        style={{
                            textShadow: '0 0 20px rgba(220, 38, 38, 0.8), 0 0 40px rgba(180, 30, 30, 0.5)',
                        }}
                    >
                        {t('game.bloodPact.title')}
                    </h2>
                    <p className="text-sm text-red-300/70 mt-2 font-serif">
                        {t('game.bloodPact.subtitle')}
                    </p>
                </motion.div>

                {/* CSS 动画 */}
                <style>{`
                    @keyframes flame-flicker {
                        0% { transform: scaleX(1) scaleY(1); }
                        50% { transform: scaleX(0.95) scaleY(1.05); }
                        100% { transform: scaleX(1.05) scaleY(0.95); }
                    }
                    
                    .blood-mist {
                        background: 
                            radial-gradient(ellipse at 20% 80%, rgba(139, 0, 0, 0.15) 0%, transparent 50%),
                            radial-gradient(ellipse at 80% 20%, rgba(139, 0, 0, 0.1) 0%, transparent 50%),
                            radial-gradient(ellipse at 50% 50%, rgba(100, 0, 0, 0.08) 0%, transparent 60%);
                        animation: mist-drift 8s ease-in-out infinite alternate;
                    }
                    
                    @keyframes mist-drift {
                        0% { transform: translateX(-10px) translateY(5px); }
                        100% { transform: translateX(10px) translateY(-5px); }
                    }
                `}</style>
            </motion.div>
        </AnimatePresence>
    );
};

export default BloodPact;
