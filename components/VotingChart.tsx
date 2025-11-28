import React from 'react';
import { useStore } from '../store';
import { VoteRecord, Seat } from '../types';

interface VotingChartProps {
    voteHistory?: VoteRecord[];
    seats?: Seat[];
}

export const VotingChart: React.FC<VotingChartProps> = ({ voteHistory: propVoteHistory, seats: propSeats }) => {
    const { gameState } = useStore();

    // 使用 props 或从 store 获取数据
    const voteHistory = propVoteHistory ?? gameState?.voteHistory ?? [];
    const seats = propSeats ?? gameState?.seats ?? [];

    if (voteHistory.length === 0) {
        return (
            <div className="p-4 text-center text-stone-500 text-xs italic">
                暂无投票记录
            </div>
        );
    }

    // Get the latest vote
    const latestVote = voteHistory[voteHistory.length - 1];
    if (!latestVote) return null;
    const nominee = seats.find(s => s.id === latestVote.nomineeSeatId);
    const nominator = seats.find(s => s.id === latestVote.nominatorSeatId);

    // Calculate stats
    // votes 是投票者座位ID的数组 (number[])
    const aliveSeats = seats.filter(s => (s.userId || s.isVirtual) && !s.isDead);
    const activeSeatCount = aliveSeats.length;
    const totalVotes = latestVote.votes.length;
    const requiredVotes = activeSeatCount > 0 ? Math.floor(activeSeatCount / 2) + 1 : 0;
    const isPassed = requiredVotes > 0 && totalVotes >= requiredVotes;
    const progressBase = Math.max(activeSeatCount, 1);

    return (
        <div className="bg-stone-900/50 rounded border border-stone-800 p-3 mb-4">
            <h3 className="text-xs font-bold text-stone-400 mb-2 uppercase tracking-wider flex justify-between items-center">
                <span>最新投票 (Latest Vote)</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${isPassed ? 'bg-red-900/30 text-red-400 border border-red-900' : 'bg-stone-800 text-stone-500'}`}>
                    {isPassed ? '票数足够' : '票数不足'}
                </span>
            </h3>

            <div className="flex items-center gap-2 mb-3 text-sm">
                <span className="text-stone-500">提名者:</span>
                <span className="font-bold text-stone-300">{nominator?.userName || '未知'}</span>
                <span className="text-stone-600">→</span>
                <span className="text-stone-500">被提名者:</span>
                <span className="font-bold text-amber-500">{nominee?.userName || '未知'}</span>
            </div>

            <div className="flex items-center gap-4 mb-2">
                <div className="flex-1 bg-stone-950 h-2 rounded-full overflow-hidden relative">
                    <div
                        className={`h-full transition-all duration-500 ${isPassed ? 'bg-red-600' : 'bg-stone-600'}`}
                        style={{ width: `${Math.min((totalVotes / progressBase) * 100, 100)}%` }}
                    />
                    {/* Marker for required votes */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                        style={{ left: `${(requiredVotes / progressBase) * 100}%` }}
                        title={`所需票数: ${requiredVotes}`}
                    />
                </div>
                <div className="text-xs font-mono">
                    <span className={`font-bold ${isPassed ? 'text-red-400' : 'text-stone-400'}`}>{totalVotes}</span>
                    <span className="text-stone-600"> / </span>
                    <span className="text-stone-500">{requiredVotes}</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
                {latestVote.votes.map((voterId) => {
                    const voter = seats.find(s => s.id === voterId);
                    return (
                        <span key={voterId} className="px-1.5 py-0.5 bg-stone-800 rounded text-[10px] text-stone-400 border border-stone-700">
                            {voter?.userName || `座位${voterId + 1}`}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};
