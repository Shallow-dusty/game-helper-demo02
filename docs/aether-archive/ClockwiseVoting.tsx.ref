/**
 * ClockwiseVoting - 时针投票组件
 *
 * 模拟实体游戏的顺时针投票流程，提供更真实的投票体验
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
    ThumbsUp,
    ThumbsDown,
    ChevronRight,
    ChevronLeft,
    Check,
    Users,
    Clock,
    Ghost,
    Target
} from 'lucide-react';
import type { PlayerId } from '../../../types/game';
import { VoteCounter } from './VoteCounter';

// ============================================================
// Types
// ============================================================

export interface ClockwiseVotingProps {
    /** 所有玩家 */
    players: Array<{
        id: PlayerId;
        name: string;
        isDead: boolean;
        isGhost: boolean;
        hasUsedGhostVote: boolean;
    }>;

    /** 提名者 ID */
    nominatorId: PlayerId;

    /** 被提名者 ID */
    nomineeId: PlayerId;

    /** 投票顺序（顺时针玩家列表） */
    voteOrder: PlayerId[];

    /** 当前投票索引 */
    currentVoteIndex: number;

    /** 投票记录（null 表示未投票） */
    votes: Record<PlayerId, boolean | null>;

    /** 投票回调 */
    onVote: (voterId: PlayerId, voteFor: boolean) => void;

    /** 前进到下一位 */
    onNext: () => void;

    /** 后退到上一位 */
    onPrevious: () => void;

    /** 结束投票 */
    onEndVoting: () => void;

    /** 是否为说书人 */
    isStoryteller: boolean;

    /** 当前玩家 ID（玩家视角） */
    currentPlayerId?: PlayerId;
}

interface VoteRecord {
    playerId: PlayerId;
    playerName: string;
    vote: boolean;
    order: number;
}

// ============================================================
// Component
// ============================================================

export function ClockwiseVoting({
    players,
    nominatorId,
    nomineeId,
    voteOrder,
    currentVoteIndex,
    votes,
    onVote,
    onNext,
    onPrevious,
    onEndVoting,
    isStoryteller,
    currentPlayerId
}: ClockwiseVotingProps) {
    // 获取当前投票玩家
    const currentVoterId = voteOrder[currentVoteIndex];
    const currentVoter = players.find(p => p.id === currentVoterId);

    // 获取提名者和被提名者
    const nominator = players.find(p => p.id === nominatorId);
    const nominee = players.find(p => p.id === nomineeId);

    // 构建投票历史记录
    const voteHistory: VoteRecord[] = [];
    let orderIndex = 1;
    for (let i = 0; i < currentVoteIndex; i++) {
        const playerId = voteOrder[i];
        const vote = votes[playerId];
        if (vote !== null) {
            const player = players.find(p => p.id === playerId);
            if (player) {
                voteHistory.push({
                    playerId,
                    playerName: player.name,
                    vote,
                    order: orderIndex++
                });
            }
        }
    }

    // 统计投票结果
    const votesFor = Object.entries(votes)
        .filter(([_, vote]) => vote === true)
        .map(([id]) => id);
    const votesAgainst = Object.entries(votes)
        .filter(([_, vote]) => vote === false)
        .map(([id]) => id);

    // 存活玩家数
    const alivePlayers = players.filter(p => !p.isDead).length;

    // 当前玩家是否已投票
    const currentVoterHasVoted = votes[currentVoterId] !== null;

    // 是否所有玩家都已投票
    const allVoted = currentVoteIndex >= voteOrder.length;

    // 是否可以后退
    const canGoBack = currentVoteIndex > 0;

    // 是否可以前进
    const canGoNext = currentVoterHasVoted && !allVoted;

    // ============================================================
    // 座位图位置计算
    // ============================================================

    function getPlayerPosition(index: number, total: number) {
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // 从顶部开始
        const radius = 180; // 半径
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return { x, y, angle };
    }

    return (
        <div className="space-y-6">
            {/* 提名信息 */}
            <div className="p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/50 rounded-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-amber-500/30 rounded-full">
                            <Users className="w-7 h-7 text-amber-300" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-amber-200">
                                {nominator?.name} 提名 {nominee?.name}
                            </h3>
                            <p className="text-sm text-amber-300/70 mt-1">
                                时针投票进行中 - {nominee?.name} 是否应该被处决？
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 投票计数器 */}
            <VoteCounter
                totalPlayers={players.length}
                alivePlayers={alivePlayers}
                votesFor={votesFor}
                votesAgainst={votesAgainst}
                pendingVotes={voteOrder.slice(currentVoteIndex)}
                showDetails={isStoryteller}
            />

            {/* 座位图可视化 */}
            <div className="relative h-96 bg-gradient-to-br from-indigo-950/30 to-black/30 border border-blue-400/20 rounded-2xl overflow-hidden">
                {/* SVG 座位图 */}
                <svg
                    viewBox="-250 -250 500 500"
                    className="absolute inset-0 w-full h-full"
                >
                    {/* 中心圆圈 */}
                    <circle
                        cx="0"
                        cy="0"
                        r="180"
                        fill="none"
                        stroke="rgba(96, 165, 250, 0.2)"
                        strokeWidth="2"
                        strokeDasharray="10 5"
                    />

                    {/* 玩家令牌 */}
                    {voteOrder.map((playerId, index) => {
                        const player = players.find(p => p.id === playerId);
                        if (!player) return null;

                        const { x, y } = getPlayerPosition(index, voteOrder.length);
                        const isCurrent = index === currentVoteIndex;
                        const vote = votes[playerId];
                        const hasVoted = vote !== null;

                        // 令牌颜色
                        let strokeColor = 'rgba(255, 255, 255, 0.2)';
                        let fillColor = 'rgba(0, 0, 0, 0.5)';

                        if (isCurrent) {
                            strokeColor = '#fbbf24'; // amber-400
                            fillColor = 'rgba(251, 191, 36, 0.2)';
                        } else if (hasVoted) {
                            if (vote) {
                                strokeColor = '#10b981'; // emerald-500
                                fillColor = 'rgba(16, 185, 129, 0.1)';
                            } else {
                                strokeColor = '#ef4444'; // red-500
                                fillColor = 'rgba(239, 68, 68, 0.1)';
                            }
                        }

                        return (
                            <g key={playerId}>
                                {/* 令牌圆圈 */}
                                <motion.circle
                                    cx={x}
                                    cy={y}
                                    r={isCurrent ? 40 : 30}
                                    fill={fillColor}
                                    stroke={strokeColor}
                                    strokeWidth={isCurrent ? 4 : 2}
                                    initial={{ scale: 0 }}
                                    animate={{
                                        scale: 1,
                                        boxShadow: isCurrent
                                            ? '0 0 20px 10px rgba(251, 191, 36, 0.5)'
                                            : '0 0 0 0 rgba(0, 0, 0, 0)'
                                    }}
                                    transition={{ duration: 0.3 }}
                                />

                                {/* 玩家名称 */}
                                <text
                                    x={x}
                                    y={y + 5}
                                    textAnchor="middle"
                                    fill={isCurrent ? '#fbbf24' : '#e5e7eb'}
                                    fontSize={isCurrent ? 14 : 12}
                                    fontWeight={isCurrent ? 'bold' : 'normal'}
                                >
                                    {player.name}
                                </text>

                                {/* 投票图标 */}
                                {hasVoted && !isCurrent && (
                                    <text
                                        x={x + 20}
                                        y={y - 15}
                                        textAnchor="middle"
                                        fill={vote ? '#10b981' : '#ef4444'}
                                        fontSize={20}
                                    >
                                        {vote ? '✓' : '✗'}
                                    </text>
                                )}

                                {/* 当前玩家指示箭头 */}
                                {isCurrent && (
                                    <motion.polygon
                                        points={`${x},${y - 60} ${x - 10},${y - 45} ${x + 10},${y - 45}`}
                                        fill="#fbbf24"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            transition: {
                                                repeat: Infinity,
                                                repeatType: 'reverse',
                                                duration: 0.8
                                            }
                                        }}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* 中心文字提示 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {!allVoted && currentVoter && (
                        <div className="text-center">
                            <div className="flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-full mb-3">
                                <Target className="w-8 h-8 text-amber-300" />
                            </div>
                            <p className="text-xl font-bold text-amber-200">
                                当前投票: {currentVoter.name}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 投票历史时间线 */}
            {voteHistory.length > 0 && (
                <div className="p-4 bg-stone-900/50 border border-white/10 rounded-xl">
                    <h4 className="text-sm font-medium text-stone-300 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        投票历史
                    </h4>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {voteHistory.map((record) => (
                            <motion.div
                                key={record.playerId}
                                className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-lg border-2 ${
                                    record.vote
                                        ? 'bg-emerald-500/10 border-emerald-400/50'
                                        : 'bg-red-500/10 border-red-400/50'
                                }`}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                {/* 顺序编号 */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    record.vote
                                        ? 'bg-emerald-500/30 text-emerald-300'
                                        : 'bg-red-500/30 text-red-300'
                                }`}>
                                    {record.order}
                                </div>

                                {/* 玩家名称 */}
                                <span className={`text-sm font-medium ${
                                    record.vote ? 'text-emerald-300' : 'text-red-300'
                                }`}>
                                    {record.playerName}
                                </span>

                                {/* 投票图标 */}
                                {record.vote ? (
                                    <ThumbsUp className="w-5 h-5 text-emerald-400" />
                                ) : (
                                    <ThumbsDown className="w-5 h-5 text-red-400" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* 说书人控制界面 */}
            {isStoryteller ? (
                <AnimatePresence mode="wait">
                    {!allVoted ? (
                        <motion.div
                            key="voting-controls"
                            className="p-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-blue-400/30 rounded-xl"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-blue-200 flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        当前投票：{currentVoter?.name}
                                    </h4>
                                    {currentVoter?.isGhost && (
                                        <p className="text-sm text-amber-400 flex items-center gap-1 mt-1">
                                            <Ghost className="w-4 h-4" />
                                            幽灵投票
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* 投票按钮 */}
                            {!currentVoterHasVoted && (
                                <div className="flex gap-3 mb-4">
                                    <button
                                        onClick={() => onVote(currentVoterId, true)}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 rounded-xl text-emerald-300 font-bold text-lg transition-all hover:scale-105"
                                    >
                                        <ThumbsUp className="w-6 h-6" />
                                        赞成
                                    </button>
                                    <button
                                        onClick={() => onVote(currentVoterId, false)}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 rounded-xl text-red-300 font-bold text-lg transition-all hover:scale-105"
                                    >
                                        <ThumbsDown className="w-6 h-6" />
                                        反对
                                    </button>
                                </div>
                            )}

                            {/* 导航按钮 */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onPrevious}
                                    disabled={!canGoBack}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                                        canGoBack
                                            ? 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 text-blue-300'
                                            : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                                    }`}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    上一位
                                </button>
                                <button
                                    onClick={onNext}
                                    disabled={!canGoNext}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                                        canGoNext
                                            ? 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 text-blue-300'
                                            : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                                    }`}
                                >
                                    下一位
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="end-voting"
                            className="p-6 bg-gradient-to-r from-emerald-900/30 to-green-900/30 border border-emerald-400/50 rounded-xl text-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mx-auto mb-4">
                                <Check className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-emerald-300 mb-2">
                                所有玩家已投票完毕
                            </h3>
                            <p className="text-sm text-emerald-400/70 mb-4">
                                赞成 {votesFor.length} 票，反对 {votesAgainst.length} 票
                            </p>
                            <button
                                onClick={onEndVoting}
                                className="px-8 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 rounded-xl text-emerald-300 font-bold transition-all hover:scale-105"
                            >
                                结束投票
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            ) : (
                /* 玩家视角 */
                <div className="p-6 bg-stone-900/50 border border-white/10 rounded-xl text-center">
                    {currentPlayerId && votes[currentPlayerId] !== null ? (
                        <div>
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                                votes[currentPlayerId]
                                    ? 'bg-emerald-500/20'
                                    : 'bg-red-500/20'
                            }`}>
                                {votes[currentPlayerId] ? (
                                    <ThumbsUp className="w-8 h-8 text-emerald-400" />
                                ) : (
                                    <ThumbsDown className="w-8 h-8 text-red-400" />
                                )}
                            </div>
                            <h3 className={`text-xl font-bold ${
                                votes[currentPlayerId]
                                    ? 'text-emerald-300'
                                    : 'text-red-300'
                            }`}>
                                你已投票：{votes[currentPlayerId] ? '赞成' : '反对'}
                            </h3>
                            <p className="text-sm text-stone-400 mt-2">
                                等待其他玩家投票... ({voteHistory.length} / {voteOrder.length})
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-full mb-4">
                                <Clock className="w-8 h-8 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold text-amber-300">
                                等待说书人询问你的投票
                            </h3>
                            <p className="text-sm text-stone-400 mt-2">
                                投票进度：{voteHistory.length} / {voteOrder.length}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
