import React from 'react';
import { useStore } from '../store';
import { Z_INDEX } from '../constants';

export const SwapRequestModal: React.FC = () => {
    const user = useStore(state => state.user);
    const gameState = useStore(state => state.gameState);
    const respondToSwapRequest = useStore(state => state.respondToSwapRequest);

    if (!user || !gameState) return null;

    // Find swap requests targeting this user
    const currentSeat = gameState.seats.find(s => s.userId === user.id);
    if (!currentSeat) return null;

    const incomingRequests = gameState.swapRequests.filter(
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
                    <span>🔄</span> 换座申请
                </h2>

                <div className="mb-6 p-4 bg-stone-950 rounded border border-stone-700">
                    <p className="text-stone-300 text-lg leading-relaxed">
                        <span className="text-amber-400 font-bold">{request?.fromName}</span>
                        {' '}想要与你交换座位
                    </p>
                    <p className="text-stone-500 text-sm mt-2">
                        座位 {(request?.fromSeatId ?? 0) + 1} ↔️ 座位 {(request?.toSeatId ?? 0) + 1}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => request && respondToSwapRequest(request.id, false)}
                        className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-600 transition-colors font-bold"
                    >
                        ❌ 拒绝
                    </button>
                    <button
                        onClick={() => request && respondToSwapRequest(request.id, true)}
                        className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded border border-amber-600 transition-colors font-bold shadow-lg"
                    >
                        ✅ 同意换座
                    </button>
                </div>

                {incomingRequests.length > 1 && (
                    <p className="text-xs text-stone-500 mt-3 text-center">
                        还有 {incomingRequests.length - 1} 个换座请求
                    </p>
                )}
            </div>
        </div>
    );
};
