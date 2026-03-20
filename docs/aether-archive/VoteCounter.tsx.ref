/**
 * VoteCounter - 投票计数器组件
 *
 * 显示提名投票的实时计数和结果
 */

import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Users } from 'lucide-react';
import type { PlayerId } from '../../../types/game';

export interface VoteCounterProps {
    /** 总玩家数（包括死亡玩家） */
    totalPlayers: number;
    /** 存活玩家数 */
    alivePlayers: number;
    /** 已投赞成票的玩家 ID 列表 */
    votesFor: PlayerId[];
    /** 已投反对票的玩家 ID 列表 */
    votesAgainst: PlayerId[];
    /** 未投票的玩家 ID 列表 */
    pendingVotes: PlayerId[];
    /** 是否显示详细信息 */
    showDetails?: boolean;
    /** 执行所需的最小票数（通常是存活玩家数的一半向上取整） */
    executionThreshold?: number;
}

export function VoteCounter({
    totalPlayers,
    alivePlayers,
    votesFor,
    votesAgainst,
    pendingVotes,
    showDetails = true,
    executionThreshold
}: VoteCounterProps) {
    const voteCount = votesFor.length;
    const totalVoted = votesFor.length + votesAgainst.length;
    const threshold = executionThreshold ?? Math.ceil(alivePlayers / 2);
    const willExecute = voteCount >= threshold;
    const canStillPass = voteCount + pendingVotes.length >= threshold;

    return (
        <div className="w-full space-y-4">
            {/* 主计数显示 */}
            <div className="relative">
                <div className="flex items-center justify-center gap-8 p-6 bg-gradient-to-r from-stone-900/80 to-black/80 backdrop-blur-md rounded-xl border border-white/10">
                    {/* 赞成票 */}
                    <motion.div
                        className="flex flex-col items-center gap-2"
                        animate={willExecute ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        <div className={`flex items-center justify-center w-20 h-20 rounded-full border-4 transition-all ${
                            willExecute
                                ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                                : 'bg-emerald-500/10 border-emerald-500/30'
                        }`}>
                            <ThumbsUp className={`w-10 h-10 ${
                                willExecute ? 'text-emerald-300' : 'text-emerald-400/70'
                            }`} />
                        </div>
                        <motion.div
                            className={`text-4xl font-bold ${
                                willExecute ? 'text-emerald-300' : 'text-emerald-400/70'
                            }`}
                            key={voteCount}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                        >
                            {voteCount}
                        </motion.div>
                        <span className="text-xs text-emerald-400/70 uppercase tracking-wider">
                            赞成
                        </span>
                    </motion.div>

                    {/* 分隔线 */}
                    <div className="h-20 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                    {/* 阈值显示 */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border-4 border-amber-500/30">
                            <Users className="w-10 h-10 text-amber-400/70" />
                        </div>
                        <div className="text-4xl font-bold text-amber-400/70">
                            {threshold}
                        </div>
                        <span className="text-xs text-amber-400/70 uppercase tracking-wider">
                            所需
                        </span>
                    </div>

                    {/* 分隔线 */}
                    <div className="h-20 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                    {/* 反对票 */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border-4 border-red-500/30">
                            <ThumbsDown className="w-10 h-10 text-red-400/70" />
                        </div>
                        <motion.div
                            className="text-4xl font-bold text-red-400/70"
                            key={votesAgainst.length}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                        >
                            {votesAgainst.length}
                        </motion.div>
                        <span className="text-xs text-red-400/70 uppercase tracking-wider">
                            反对
                        </span>
                    </div>
                </div>

                {/* 结果指示器 */}
                {willExecute && (
                    <motion.div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 rounded-full text-white text-sm font-bold shadow-lg"
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        ✓ 达到处决票数
                    </motion.div>
                )}

                {!willExecute && !canStillPass && totalVoted > 0 && (
                    <motion.div
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-500/80 rounded-full text-white text-xs font-medium"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        已无法达到处决票数
                    </motion.div>
                )}
            </div>

            {/* 详细信息 */}
            {showDetails && (
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="p-3 bg-stone-800/50 rounded-lg border border-white/5">
                        <div className="text-2xl font-bold text-blue-300">
                            {totalVoted}
                        </div>
                        <div className="text-xs text-stone-400 mt-1">
                            已投票
                        </div>
                    </div>

                    <div className="p-3 bg-stone-800/50 rounded-lg border border-white/5">
                        <div className="text-2xl font-bold text-amber-300">
                            {pendingVotes.length}
                        </div>
                        <div className="text-xs text-stone-400 mt-1">
                            待投票
                        </div>
                    </div>

                    <div className="p-3 bg-stone-800/50 rounded-lg border border-white/5">
                        <div className="text-2xl font-bold text-stone-300">
                            {alivePlayers}
                        </div>
                        <div className="text-xs text-stone-400 mt-1">
                            可投票
                        </div>
                    </div>
                </div>
            )}

            {/* 进度条 */}
            <div className="relative h-3 bg-black/30 rounded-full overflow-hidden">
                {/* 赞成票进度 */}
                <motion.div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${(voteCount / alivePlayers) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 100 }}
                />

                {/* 阈值标记 */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                    style={{ left: `${(threshold / alivePlayers) * 100}%` }}
                />

                {/* 已投票总进度（半透明） */}
                <motion.div
                    className="absolute left-0 top-0 h-full bg-white/10"
                    initial={{ width: 0 }}
                    animate={{ width: `${(totalVoted / alivePlayers) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 100 }}
                />
            </div>
        </div>
    );
}
