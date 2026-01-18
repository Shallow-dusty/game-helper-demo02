import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Seat, VotingState } from '@/types';

interface STVotingControlsProps {
    voting: VotingState | undefined;
    seats: Seat[];
    onNextClockHand: () => void;
    onCloseVote: () => void;
}

export const STVotingControls = React.memo<STVotingControlsProps>(({
    voting,
    seats,
    onNextClockHand,
    onCloseVote,
}) => {
    const { t } = useTranslation();

    if (!voting?.isOpen) return null;

    return (
        <div className="bg-amber-950/20 border border-amber-800/50 p-4 rounded shadow-[0_0_20px_rgba(180,83,9,0.1)] animate-fade-in">
            <div className="text-xs text-amber-600 mb-3 font-bold uppercase tracking-widest text-center">
                {t('controls.st.votingInProgress')}
            </div>
            <div className="text-sm mb-4 flex justify-between items-center border-b border-amber-900/30 pb-2">
                <span className="text-stone-400">{t('controls.st.nominee')}</span>
                <span className="font-bold text-amber-100 text-lg font-cinzel">
                    {seats.find(s => s.id === voting?.nomineeSeatId)?.userName}
                </span>
            </div>
            <button
                onClick={onNextClockHand}
                className="w-full py-3 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-black font-bold rounded-sm mb-2 shadow border border-amber-500 font-cinzel"
            >
                {t('controls.st.moveClockHand')} ➜
            </button>
            <button
                onClick={onCloseVote}
                className="w-full py-1 bg-transparent hover:bg-red-900/20 text-xs rounded text-red-400 border border-transparent hover:border-red-900/50 transition-colors"
            >
                {t('controls.st.cancelVote')}
            </button>
        </div>
    );
});
