import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { VoteRecord, Seat } from '../../types';
import { JudgmentZone } from './JudgmentZone';

interface DoomsdayClockProps {
    voteHistory?: VoteRecord[];
    seats?: Seat[];
}

export const DoomsdayClock: React.FC<DoomsdayClockProps> = ({ voteHistory: propVoteHistory, seats: propSeats }) => {
    const { gameState } = useStore();
    const voteHistory = propVoteHistory ?? gameState?.voteHistory ?? [];
    const seats = propSeats ?? gameState?.seats ?? [];

    if (voteHistory.length === 0) {
        return (
            <div className="p-4 text-center text-stone-500 text-xs italic font-cinzel">
                The clock is silent...
            </div>
        );
    }

    const latestVote = voteHistory[voteHistory.length - 1];
    if (!latestVote) return null;

    const nominee = seats.find(s => s.id === latestVote.nomineeSeatId);
    const nominator = seats.find(s => s.id === latestVote.nominatorSeatId);

    const aliveSeats = seats.filter(s => (s.userId || s.isVirtual) && !s.isDead);
    const activeSeatCount = aliveSeats.length;
    const totalVotes = latestVote.votes.length;
    const requiredVotes = activeSeatCount > 0 ? Math.floor(activeSeatCount / 2) + 1 : 0;
    const isPassed = requiredVotes > 0 && totalVotes >= requiredVotes;

    // Animation state
    const [displayVotes, setDisplayVotes] = useState(0);
    
    useEffect(() => {
        setDisplayVotes(totalVotes);
        // Play click-clack sound here
    }, [totalVotes]);

    // Calculate angles
    // 12 o'clock = required votes (threshold)
    // We map 0 -> 0 votes
    // We want the hand to hit 12 o'clock when votes == requiredVotes
    // So angle per vote = 360 / (requiredVotes * 2) ? Or just map requiredVotes to 0deg (12 o'clock)?
    // Let's say 12 o'clock is the target.
    // 6 o'clock is 0 votes? Or 0 votes is 0 degrees?
    // Let's make it intuitive:
    // 0 votes = -150 deg (7 o'clock)
    // Required votes = 0 deg (12 o'clock)
    // Max votes = +150 deg (5 o'clock)
    
    // Scale factor
    const maxVotes = Math.max(activeSeatCount, requiredVotes * 2);
    const anglePerVote = 300 / maxVotes; // 300 degrees spread
    const startAngle = -150;
    
    // If we want 12 o'clock to be EXACTLY required votes:
    // 0 deg = requiredVotes
    // So rotation = (currentVotes - requiredVotes) * (some_scale)
    // But we also want 0 votes to be visible.
    
    // Alternative: Standard Clock
    // 12 o'clock = 0/Max
    // Current votes = Hour Hand
    // Required votes = Red Marker
    
    const rotation = (totalVotes / maxVotes) * 360;
    const targetRotation = (requiredVotes / maxVotes) * 360;

    return (
        <div className="relative w-full aspect-square max-w-[300px] mx-auto my-4 flex items-center justify-center">
            {/* Clock Face (Background) */}
            <div className="absolute inset-0 rounded-full border-4 border-amber-900/50 bg-stone-950 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,#000_100%)]" />
                
                {/* Ticks */}
                {Array.from({ length: 12 }).map((_, i) => (
                    <div 
                        key={i}
                        className={`absolute top-0 left-1/2 w-1 h-3 bg-amber-800/50 -translate-x-1/2 origin-bottom`}
                        style={{ transform: `rotate(${i * 30}deg) translateY(10px)` }}
                    />
                ))}

                {/* Threshold Marker (Red Line) */}
                <div 
                    className="absolute top-1/2 left-1/2 w-1 h-[45%] bg-red-600/50 origin-bottom -translate-x-1/2 -translate-y-full z-10 blur-[1px]"
                    style={{ transform: `rotate(${targetRotation}deg)` }}
                />
                <div 
                    className="absolute top-1/2 left-1/2 w-0.5 h-[45%] bg-red-500 origin-bottom -translate-x-1/2 -translate-y-full z-10"
                    style={{ transform: `rotate(${targetRotation}deg)` }}
                />
            </div>

            {/* Info Panel (Middle) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20">
                <div className={`text-4xl font-cinzel font-bold ${isPassed ? 'text-red-500 animate-pulse' : 'text-stone-400'}`}>
                    {totalVotes}
                </div>
                <div className="text-xs text-stone-600 font-serif">
                    / {requiredVotes}
                </div>
            </div>

            {/* Clock Hand */}
            <div 
                className="absolute top-1/2 left-1/2 w-2 h-[40%] bg-gradient-to-t from-amber-900 to-amber-500 origin-bottom -translate-x-1/2 -translate-y-full z-30 shadow-lg transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-500 rotate-45" />
            </div>

            {/* Center Cap */}
            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-amber-700 rounded-full -translate-x-1/2 -translate-y-1/2 z-40 border border-amber-500 shadow-md" />

            {/* Nominator/Nominee Info (Bottom Overlay) */}
            <div className="absolute -bottom-12 left-0 right-0 text-center">
                <div className="text-xs text-stone-500 mb-1">NOMINATION</div>
                <div className="flex items-center justify-center gap-2 text-sm font-cinzel">
                    <span className="text-stone-400">{nominator?.userName}</span>
                    <span className="text-red-800">⚔️</span>
                    <span className="text-amber-500">{nominee?.userName}</span>
                </div>
            </div>
            
            {/* Physics Judgment Zone (Overlay or Below) */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-8">
                <JudgmentZone width={300} height={200} />
            </div>
        </div>
    );
};
