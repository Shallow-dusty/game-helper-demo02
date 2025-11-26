import React from 'react';
import { useStore } from '../store';

export const VotingChart: React.FC = () => {
    const { gameState } = useStore();
    const { voteHistory, seats } = gameState;

    if (voteHistory.length === 0) {
        return (
            <div className="p-4 text-center text-stone-500 text-xs italic">
                暂无投票记录
            </div>
        );
    }

    // Get the latest vote
    const latestVote = voteHistory[voteHistory.length - 1];
    const nominee = seats.find(s => s.id === latestVote.nomineeSeatId);
    const nominator = seats.find(s => s.id === latestVote.nominatorSeatId);

    // Calculate stats
    const totalVotes = Object.keys(latestVote.votes).length;
    const requiredVotes = Math.ceil(seats.filter(s => !s.isDead).length / 2);
    const isPassed = totalVotes >= requiredVotes;

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
                        style={{ width: `${Math.min((totalVotes / seats.length) * 100, 100)}%` }}
                    />
                    {/* Marker for required votes */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                        style={{ left: `${(requiredVotes / seats.length) * 100}%` }}
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
                {Object.entries(latestVote.votes).map(([voterId, isVote]) => {
                    if (!isVote) return null;
                    const voter = seats.find(s => s.id === parseInt(voterId));
                    return (
                        <span key={voterId} className="px-1.5 py-0.5 bg-stone-800 rounded text-[10px] text-stone-400 border border-stone-700">
                            {voter?.userName || voterId}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};
