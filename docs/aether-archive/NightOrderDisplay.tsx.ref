/**
 * NightOrderDisplay - 夜晚顺序显示组件
 *
 * 显示首夜/其他夜晚的角色行动顺序
 * 可作为参考面板使用
 */

import { motion } from 'framer-motion';
import { Moon, Sun, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { getFirstNightOrder, getOtherNightOrder } from '../../../data/characters/trouble-brewing';
import { TROUBLE_BREWING_CHARACTERS } from '../../../data/characters/trouble-brewing';
import { Team } from '../../../types/game';

interface NightOrderDisplayProps {
    isFirstNight: boolean;
    compact?: boolean;
}

export function NightOrderDisplay({ isFirstNight, compact = false }: NightOrderDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(!compact);

    // 获取夜晚顺序
    const nightOrder = isFirstNight ? getFirstNightOrder() : getOtherNightOrder();

    // 获取角色详情
    const charactersInOrder = nightOrder
        .map(charId => TROUBLE_BREWING_CHARACTERS.find(c => c.id === charId))
        .filter(Boolean);

    // 阵营颜色
    const getTeamColor = (team: Team) => {
        switch (team) {
            case Team.TOWNSFOLK:
                return { bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-400/30' };
            case Team.OUTSIDER:
                return { bg: 'bg-cyan-500/10', text: 'text-cyan-300', border: 'border-cyan-400/30' };
            case Team.MINION:
                return { bg: 'bg-red-500/10', text: 'text-red-300', border: 'border-red-400/30' };
            case Team.DEMON:
                return { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-400/30' };
            default:
                return { bg: 'bg-stone-500/10', text: 'text-stone-300', border: 'border-stone-400/30' };
        }
    };

    if (compact) {
        return (
            <motion.div
                className="bg-gradient-to-br from-indigo-950/90 to-black/90 backdrop-blur-md border border-blue-400/30 rounded-xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                {/* 标题（可折叠） */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-500/10 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        {isFirstNight ? (
                            <Moon className="w-4 h-4 text-blue-300" />
                        ) : (
                            <Sun className="w-4 h-4 text-indigo-300" />
                        )}
                        <span className="text-sm font-medium text-blue-200">
                            {isFirstNight ? '首夜顺序' : '其他夜晚顺序'}
                        </span>
                        <span className="text-xs text-blue-400">({charactersInOrder.length})</span>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-4 h-4 text-blue-400" />
                    </motion.div>
                </button>

                {/* 角色列表 */}
                <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? 'auto' : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                >
                    <div className="p-3 space-y-1 max-h-96 overflow-y-auto">
                        {charactersInOrder.map((char, index) => {
                            if (!char) return null;
                            const colors = getTeamColor(char.team);

                            return (
                                <motion.div
                                    key={char.id}
                                    className={`flex items-center gap-2 p-2 ${colors.bg} border ${colors.border} rounded-lg`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                >
                                    <span className="text-xs text-blue-400 font-mono w-6 text-center">
                                        {index + 1}
                                    </span>
                                    <span className={`text-sm font-medium ${colors.text} flex-1`}>
                                        {char.name}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </motion.div>
        );
    }

    // 完整模式
    return (
        <motion.div
            className="bg-gradient-to-br from-indigo-950/95 to-black/95 backdrop-blur-xl border border-blue-400/30 rounded-2xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* 标题栏 */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-400/20 bg-gradient-to-r from-blue-900/50 to-indigo-900/50">
                {isFirstNight ? (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    >
                        <Moon className="w-6 h-6 text-blue-300" />
                    </motion.div>
                ) : (
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Sun className="w-6 h-6 text-indigo-300" />
                    </motion.div>
                )}
                <div>
                    <h3 className="text-xl font-bold text-blue-200">
                        {isFirstNight ? '首夜行动顺序' : '其他夜晚行动顺序'}
                    </h3>
                    <p className="text-xs text-blue-400/70">
                        共 {charactersInOrder.length} 个角色
                    </p>
                </div>
            </div>

            {/* 角色列表 */}
            <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
                {charactersInOrder.map((char, index) => {
                    if (!char) return null;
                    const colors = getTeamColor(char.team);

                    return (
                        <motion.div
                            key={char.id}
                            className={`flex items-start gap-4 p-4 ${colors.bg} border ${colors.border} rounded-xl hover:scale-102 transition-transform`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                        >
                            {/* 顺序号 */}
                            <div className="flex flex-col items-center justify-center px-3 py-2 bg-black/30 rounded-lg border border-white/10">
                                <span className="text-xs text-blue-400">顺序</span>
                                <span className="text-2xl font-bold text-blue-200">
                                    {index + 1}
                                </span>
                            </div>

                            {/* 角色信息 */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className={`text-lg font-bold ${colors.text}`}>
                                        {char.name}
                                    </h4>
                                    <span className="text-xs text-stone-500">
                                        {char.nameEn}
                                    </span>
                                </div>
                                <p className="text-sm text-stone-400 leading-relaxed">
                                    {char.abilityText}
                                </p>
                                {char.setupReminder && (
                                    <p className="text-xs text-blue-400/70 mt-2 italic">
                                        💡 {char.setupReminder}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
