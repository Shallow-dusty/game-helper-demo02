import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';

export const NotificationSystem = () => {
    const gameState = useStore(state => state.gameState);
    const user = useStore(state => state.user);
    const [toast, setToast] = useState<{ message: string, type: 'info' | 'dead' | 'ability' } | null>(null);
    const lastMsgIdRef = useRef<string | null>(null);

    // Listen for system messages
    useEffect(() => {
        if (!gameState?.messages.length) return;
        const lastMsg = gameState.messages[gameState.messages.length - 1];

        // Only show if it's a new message and it's a system message
        if (lastMsg.senderId === 'system' && lastMsg.id !== lastMsgIdRef.current) {
            lastMsgIdRef.current = lastMsg.id;
            // Don't show if message is too old (e.g. on page load)
            if (Date.now() - lastMsg.timestamp < 2000) {
                setToast({ message: lastMsg.content, type: 'info' });
                const timer = setTimeout(() => setToast(null), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [gameState?.messages]);

    // Listen for death status
    const currentSeat = gameState?.seats.find(s => s.userId === user?.id);
    const [wasDead, setWasDead] = useState(currentSeat?.isDead || false);

    useEffect(() => {
        if (!currentSeat) return;
        if (currentSeat.isDead && !wasDead) {
            setToast({ message: "你已出局", type: 'dead' });
            setTimeout(() => setToast(null), 5000);
        }
        setWasDead(currentSeat.isDead);
    }, [currentSeat?.isDead]);

    // Listen for ability usage
    const [hasUsedAbility, setHasUsedAbility] = useState(currentSeat?.hasUsedAbility || false);

    useEffect(() => {
        if (!currentSeat) return;
        if (currentSeat.hasUsedAbility && !hasUsedAbility) {
            setToast({ message: "技能已使用", type: 'ability' });
            setTimeout(() => setToast(null), 3000);
        }
        setHasUsedAbility(currentSeat.hasUsedAbility);
    }, [currentSeat?.hasUsedAbility]);

    if (!toast) return null;

    return (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[60] px-8 py-4 rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none backdrop-blur-md
            ${toast.type === 'dead' ? 'bg-red-950/90 text-red-100 border-2 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.5)]' :
                toast.type === 'ability' ? 'bg-amber-950/90 text-amber-100 border-2 border-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.3)]' :
                    'bg-stone-900/90 text-stone-200 border border-stone-600 shadow-xl'}
        `}>
            <div className="flex items-center gap-4">
                <span className="text-3xl filter drop-shadow-md">
                    {toast.type === 'dead' ? '☠️' : toast.type === 'ability' ? '🚫' : '📢'}
                </span>
                <span className={`font-bold font-cinzel tracking-wider filter drop-shadow-md ${toast.type === 'dead' ? 'text-3xl' : 'text-lg'}`}>
                    {toast.message}
                </span>
            </div>
        </div>
    );
};
