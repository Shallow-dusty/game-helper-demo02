import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { ROLES, TEAM_COLORS } from '../constants';
import { RoleDef } from '../types';

export const RoleRevealModal: React.FC = () => {
    const user = useStore(state => state.user);
    const gameState = useStore(state => state.gameState);
    
    const [isVisible, setIsVisible] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    // 获取当前玩家的角色
    const currentSeat = gameState?.seats.find(s => s.userId === user?.id);
    // 使用 seenRoleId 以支持酒鬼/疯子等机制
    const roleId = currentSeat?.seenRoleId || currentSeat?.roleId;
    const role = roleId ? ROLES[roleId] : null;

    useEffect(() => {
        if (!gameState || !user || !currentSeat || !role) return;

        // 检查是否应该显示
        // 1. 游戏状态必须是 rolesRevealed = true
        // 2. 玩家必须有角色
        // 3. 本地存储中没有标记为"已查看"
        
        const storageKey = `grimoire_role_seen_${gameState.roomId}_${user.id}_${role.id}`;
        const hasSeen = localStorage.getItem(storageKey);

        if (gameState.rolesRevealed && !hasSeen && !isVisible && !isExiting && countdown === null) {
            // 开始倒计时
            setCountdown(3);
        }
    }, [gameState?.rolesRevealed, gameState?.roomId, user?.id, role?.id]);

    // 倒计时逻辑
    useEffect(() => {
        if (countdown === null) return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c! - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // 倒计时结束 (0)，显示"GAME START"，然后显示卡片
            const timer = setTimeout(() => {
                setCountdown(null);
                setIsVisible(true);
            }, 800); 
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleConfirm = () => {
        if (!gameState || !user || !role) return;
        
        // 标记为已查看
        const storageKey = `grimoire_role_seen_${gameState.roomId}_${user.id}_${role.id}`;
        localStorage.setItem(storageKey, 'true');

        // 开始退出动画
        setIsExiting(true);
        
        // 动画结束后销毁组件
        setTimeout(() => {
            setIsVisible(false);
            setIsExiting(false);
            setIsFlipped(false);
        }, 1000);
    };

    // 渲染倒计时
    if (countdown !== null) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={countdown}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 1 }}
                        exit={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-8xl md:text-9xl font-cinzel font-bold text-amber-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.8)]"
                    >
                        {countdown > 0 ? countdown : "GAME START"}
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    if (!isVisible || !role) return null;

    const teamColor = TEAM_COLORS[role.team as keyof typeof TEAM_COLORS] || '#9ca3af';

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    {/* 背景遮罩 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isExiting ? 0 : 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* 卡片容器 */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={isExiting ? {
                            scale: 0.1,
                            x: -window.innerWidth / 2 + 50, // 飞向左下角 (大致位置)
                            y: window.innerHeight / 2 - 50,
                            opacity: 0
                        } : {
                            scale: 1,
                            x: 0,
                            y: 0,
                            opacity: 1
                        }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 260, 
                            damping: 20,
                            duration: isExiting ? 0.8 : 0.5
                        }}
                        className="relative w-80 h-[480px] perspective-[1000px] pointer-events-auto cursor-pointer"
                        onClick={() => !isFlipped && setIsFlipped(true)}
                    >
                        <motion.div
                            className="w-full h-full relative transform-style-3d transition-all duration-700"
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                        >
                            {/* 正面 (封面) */}
                            <div className="absolute inset-0 backface-hidden rounded-xl border-2 border-stone-600 bg-stone-900 shadow-2xl flex flex-col items-center justify-center overflow-hidden group">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-50"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-stone-800/50 to-stone-950/90"></div>
                                
                                <motion.div 
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-32 h-32 rounded-full border-4 border-stone-500 flex items-center justify-center mb-8 bg-stone-950/50 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10"
                                >
                                    <span className="text-6xl filter drop-shadow-lg">👁️</span>
                                </motion.div>
                                
                                <h2 className="text-3xl font-cinzel font-bold text-stone-300 tracking-[0.2em] z-10 text-center px-4">
                                    你的身份
                                </h2>
                                <p className="text-stone-500 mt-4 font-serif italic z-10">点击翻开命运之书</p>
                            </div>

                            {/* 背面 (角色详情) */}
                            <div 
                                className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border-2 overflow-hidden flex flex-col bg-stone-900"
                                style={{ borderColor: teamColor }}
                            >
                                {/* 顶部背景图 */}
                                <div className="h-32 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-stone-800"></div>
                                    <div 
                                        className="absolute inset-0 opacity-30 bg-cover bg-center"
                                        style={{ backgroundImage: `url('/img/roles/${role.id}.png')`, backgroundColor: teamColor }}
                                    ></div>
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-900"></div>
                                    
                                    <div className="absolute bottom-2 left-0 right-0 text-center">
                                        <div 
                                            className="w-20 h-20 mx-auto rounded-full border-4 shadow-lg flex items-center justify-center text-4xl bg-stone-900 mb-[-40px] relative z-10"
                                            style={{ borderColor: teamColor }}
                                        >
                                            {role.icon || '❓'}
                                        </div>
                                    </div>
                                </div>

                                {/* 内容区域 */}
                                <div className="flex-1 pt-12 px-6 pb-6 flex flex-col items-center text-center">
                                    <h3 className="text-2xl font-bold font-cinzel mb-1" style={{ color: teamColor }}>
                                        {role.name}
                                    </h3>
                                    <span className="text-xs px-2 py-0.5 rounded border border-stone-700 text-stone-400 mb-6 uppercase tracking-wider">
                                        {role.team}
                                    </span>

                                    <div className="flex-1 flex items-center justify-center">
                                        <p className="text-stone-300 font-serif leading-relaxed text-lg">
                                            {role.ability}
                                        </p>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleConfirm();
                                        }}
                                        className="mt-6 w-full py-3 rounded bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 font-cinzel transition-colors flex items-center justify-center gap-2 group"
                                    >
                                        <span>我已知晓</span>
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
