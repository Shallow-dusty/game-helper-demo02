import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { Z_INDEX } from '../../constants';
import { useShallow } from 'zustand/react/shallow';

export const SwapRequestModal: React.FC = () => {
    const { t } = useTranslation();
    const user = useStore(state => state.user);
    const { seats, swapRequests } = useStore(
        useShallow(state => ({
            seats: state.gameState?.seats ?? [],
            swapRequests: state.gameState?.swapRequests ?? [],
        }))
    );
    const respondToSwapRequest = useStore(state => state.respondToSwapRequest);

    if (!user) return null;

    // Find swap requests targeting this user
    const currentSeat = seats.find(s => s.userId === user.id);
    if (!currentSeat) return null;

    const incomingRequests = swapRequests.filter(
        req => req.toUserId === user.id
    );

    if (incomingRequests.length === 0) return null;

    const request = incomingRequests[0]; // Show first request

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md z-50"
            style={{ zIndex: Z_INDEX.modal }}
        >
            <div className="bg-stone-900 border border-amber-600 rounded-lg p-6 max-w-md w-full shadow-2xl">
                <h2 className="text-2xl font-bold text-amber-500 mb-4 flex items-center gap-2 font-cinzel">
                    <span>🔄</span> {t('game.swapRequestModal.title')}
                </h2>

                <div className="mb-6 p-4 bg-stone-950 rounded border border-stone-700">
                    <p className="text-stone-300 text-lg leading-relaxed">
                        <span className="text-amber-400 font-bold">{request?.fromName}</span>
                        {' '}{t('game.swapRequestModal.message')}
                    </p>
                    <p className="text-stone-500 text-sm mt-2">
                        {t('game.swapRequestModal.seatSwap', { from: (request?.fromSeatId ?? 0) + 1, to: (request?.toSeatId ?? 0) + 1 })}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => request && respondToSwapRequest(request.id, false)}
                        className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-600 transition-colors font-bold"
                    >
                        ❌ {t('game.swapRequestModal.reject')}
                    </button>
                    <button
                        onClick={() => request && respondToSwapRequest(request.id, true)}
                        className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded border border-amber-600 transition-colors font-bold shadow-lg"
                    >
                        ✅ {t('game.swapRequestModal.accept')}
                    </button>
                </div>

                {incomingRequests.length > 1 && (
                    <p className="text-xs text-stone-500 mt-3 text-center">
                        {t('game.swapRequestModal.moreRequests', { count: incomingRequests.length - 1 })}
                    </p>
                )}
            </div>
        </div>
    );
};




