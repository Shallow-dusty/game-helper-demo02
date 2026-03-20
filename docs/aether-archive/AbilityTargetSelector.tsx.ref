/**
 * AbilityTargetSelector - 夜晚能力目标选择组件
 *
 * 根据角色能力类型动态渲染目标选择 UI
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Target, AlertCircle } from 'lucide-react';
import { type PlayerId, type CharacterId } from '../../../types/game';

// ============================================================
// 能力元数据定义
// ============================================================

/**
 * 目标类型
 * - none: 无需选择目标（如共情者自动查看邻居）
 * - single: 选择1名玩家
 * - double: 选择2名玩家
 * - choice: 二选一决策（非玩家选择）
 */
export type TargetType = 'none' | 'single' | 'double' | 'choice';

/**
 * 能力元数据
 */
export interface AbilityMetadata {
    /** 目标类型 */
    targetType: TargetType;
    /** 目标数量（可选，覆盖默认值） */
    targetCount?: number;
    /** 目标过滤器（返回 true 表示可选） */
    targetFilter?: (player: { id: PlayerId; name: string; isDead: boolean }) => boolean;
    /** 提示文本 */
    hint?: string;
}

/**
 * 角色能力元数据映射
 */
const ABILITY_METADATA: Record<CharacterId, AbilityMetadata> = {
    // 恶魔
    imp: {
        targetType: 'single',
        hint: '选择一名玩家进行击杀',
        targetFilter: (player) => !player.isDead
    },

    // 镇民
    empath: {
        targetType: 'none',
        hint: '自动查看邻居中的邪恶玩家数量'
    },
    fortune_teller: {
        targetType: 'double',
        hint: '选择两名玩家，查看其中是否有恶魔'
    },
    investigator: {
        targetType: 'none',
        hint: '首夜自动获取信息（说书人提供）'
    },
    librarian: {
        targetType: 'none',
        hint: '首夜自动获取信息（说书人提供）'
    },
    washerwoman: {
        targetType: 'none',
        hint: '首夜自动获取信息（说书人提供）'
    },
    monk: {
        targetType: 'single',
        hint: '选择一名玩家进行保护（不能选择自己）',
        targetFilter: (player) => !player.isDead
    },
    ravenkeeper: {
        targetType: 'single',
        hint: '选择一名玩家，查看其角色',
        targetFilter: (player) => !player.isDead
    },
    undertaker: {
        targetType: 'none',
        hint: '自动获知当天处决玩家的角色'
    },
    chef: {
        targetType: 'none',
        hint: '自动获知邪恶玩家邻座数量'
    },
    virgin: {
        targetType: 'none',
        hint: '被动触发能力'
    },
    slayer: {
        targetType: 'single',
        hint: '白天使用：选择一名玩家尝试屠魔'
    },
    soldier: {
        targetType: 'none',
        hint: '被动能力：免疫恶魔击杀'
    },
    mayor: {
        targetType: 'none',
        hint: '被动能力：无存活镇民时不会失败'
    },

    // 外来者
    butler: {
        targetType: 'single',
        hint: '选择一名存活玩家作为主人',
        targetFilter: (player) => !player.isDead
    },
    drunk: {
        targetType: 'none',
        hint: '醉鬼没有能力'
    },
    recluse: {
        targetType: 'none',
        hint: '被动能力：可能被视为邪恶/爪牙/恶魔'
    },
    saint: {
        targetType: 'none',
        hint: '被动能力：被处决则邪恶获胜'
    },

    // 爪牙
    poisoner: {
        targetType: 'single',
        hint: '选择一名玩家进行中毒',
        targetFilter: (player) => !player.isDead
    },
    spy: {
        targetType: 'none',
        hint: '查看魔典中的所有信息'
    },
    scarlet_woman: {
        targetType: 'none',
        hint: '被动能力：恶魔死亡时可能变成恶魔'
    },
    baron: {
        targetType: 'none',
        hint: '设置阶段生效：增加外来者数量'
    }
};

/**
 * 获取角色能力元数据
 */
export function getAbilityMetadata(characterId: CharacterId): AbilityMetadata {
    return ABILITY_METADATA[characterId] || {
        targetType: 'none',
        hint: '该角色能力尚未配置'
    };
}

// ============================================================
// 组件定义
// ============================================================

interface AbilityTargetSelectorProps {
    /** 当前角色 ID */
    characterId: CharacterId;
    /** 角色名称 */
    characterName: string;
    /** 可选择的玩家列表 */
    players: Array<{ id: PlayerId; name: string; isDead: boolean }>;
    /** 当前行动者 ID（用于过滤"不能选择自己"） */
    actorId: PlayerId;
    /** 是否显示 */
    visible: boolean;
    /** 确认选择回调 */
    onConfirm: (targets: PlayerId[]) => void;
    /** 取消回调 */
    onCancel: () => void;
}

export function AbilityTargetSelector({
    characterId,
    characterName,
    players,
    actorId,
    visible,
    onConfirm,
    onCancel
}: AbilityTargetSelectorProps) {
    const [selectedTargets, setSelectedTargets] = useState<PlayerId[]>([]);
    const metadata = getAbilityMetadata(characterId);

    // 重置选择状态
    useEffect(() => {
        if (visible) {
            setSelectedTargets([]);
        }
    }, [visible]);

    // 处理目标类型为 none 的情况（自动确认）
    useEffect(() => {
        if (visible && metadata.targetType === 'none') {
            // 无需选择目标，直接确认
            setTimeout(() => {
                onConfirm([]);
            }, 100);
        }
    }, [visible, metadata.targetType, onConfirm]);

    // 处理玩家选择
    const handlePlayerClick = (playerId: PlayerId) => {
        if (metadata.targetType === 'none') return;

        const maxTargets = metadata.targetCount || (metadata.targetType === 'double' ? 2 : 1);

        setSelectedTargets(prev => {
            // 如果已选择，取消选择
            if (prev.includes(playerId)) {
                return prev.filter(id => id !== playerId);
            }

            // 如果达到最大数量，替换最早的选择
            if (prev.length >= maxTargets) {
                return [...prev.slice(1), playerId];
            }

            // 添加选择
            return [...prev, playerId];
        });
    };

    // 处理确认
    const handleConfirm = () => {
        const requiredCount = metadata.targetCount || (metadata.targetType === 'double' ? 2 : 1);

        if (selectedTargets.length < requiredCount) {
            return; // 未达到要求数量，不允许确认
        }

        onConfirm(selectedTargets);
    };

    // 过滤可选玩家
    const availablePlayers = players.filter(player => {
        // 排除行动者自己（某些能力如僧侣不能选择自己）
        if (player.id === actorId && characterId === 'monk') {
            return false;
        }

        // 应用自定义过滤器
        if (metadata.targetFilter) {
            return metadata.targetFilter(player);
        }

        return true;
    });

    const requiredCount = metadata.targetCount || (metadata.targetType === 'double' ? 2 : 1);
    const canConfirm = selectedTargets.length === requiredCount;

    // 对于 none 类型，不显示选择器（会自动确认）
    if (metadata.targetType === 'none') {
        return null;
    }

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* 背景遮罩 */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                    />

                    {/* 选择面板 */}
                    <motion.div
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        <div className="bg-gradient-to-br from-indigo-950/95 to-black/95 backdrop-blur-xl border border-blue-400/30 rounded-2xl shadow-2xl overflow-hidden">
                            {/* 标题栏 */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-blue-400/20 bg-gradient-to-r from-blue-900/50 to-indigo-900/50">
                                <div className="flex items-center gap-3">
                                    <Target className="w-6 h-6 text-blue-300" />
                                    <div>
                                        <h3 className="text-lg font-bold text-blue-200">
                                            {characterName} - 选择目标
                                        </h3>
                                        <p className="text-xs text-blue-400/70">
                                            {metadata.hint || `请选择 ${requiredCount} 名玩家`}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onCancel}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-blue-300" />
                                </button>
                            </div>

                            {/* 玩家列表 */}
                            <div className="p-6 max-h-96 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-3">
                                    {availablePlayers.map(player => {
                                        const isSelected = selectedTargets.includes(player.id);
                                        const selectionIndex = selectedTargets.indexOf(player.id);

                                        return (
                                            <motion.button
                                                key={player.id}
                                                onClick={() => handlePlayerClick(player.id)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                                    isSelected
                                                        ? 'bg-blue-500/20 border-blue-400/80 shadow-lg shadow-blue-500/20'
                                                        : 'bg-black/20 border-white/10 hover:border-blue-400/40 hover:bg-blue-500/10'
                                                }`}
                                            >
                                                {/* 选择指示器 */}
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                                                    isSelected
                                                        ? 'bg-blue-500 border-blue-400'
                                                        : 'border-white/20'
                                                }`}>
                                                    {isSelected && (
                                                        <span className="text-xs font-bold text-white">
                                                            {selectionIndex + 1}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* 玩家信息 */}
                                                <div className="flex-1 text-left">
                                                    <div className="text-base font-medium text-blue-100">
                                                        {player.name}
                                                    </div>
                                                    {player.isDead && (
                                                        <div className="text-xs text-red-400">
                                                            已死亡
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {availablePlayers.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
                                        <p className="text-amber-300">
                                            没有可选择的目标
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* 底部操作栏 */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-blue-400/20 bg-black/20">
                                <div className="text-sm text-blue-300">
                                    已选择: {selectedTargets.length} / {requiredCount}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={onCancel}
                                        className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={!canConfirm}
                                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                                            canConfirm
                                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 hover:scale-105'
                                                : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                                        }`}
                                    >
                                        <Check className="inline w-4 h-4 mr-1" />
                                        确认
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
