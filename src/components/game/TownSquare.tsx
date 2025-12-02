import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Grimoire } from './Grimoire';
import { Confetti } from './Confetti';

export const TownSquare = () => {
    const spectateGame = useStore(state => state.spectateGame);
    const gameState = useStore(state => state.gameState);
    const connectionStatus = useStore(state => state.connectionStatus);

    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [inputCode, setInputCode] = useState('');

    useEffect(() => {
        // Parse room code from URL query params
        const params = new URLSearchParams(window.location.search);
        const code = params.get('room');
        if (code) {
            setRoomCode(code);
            void spectateGame(code);
        }
    }, [spectateGame]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputCode.trim()) {
            const code = inputCode.trim();
            // Update URL without reloading
            const newUrl = `${window.location.pathname}?room=${code}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
            setRoomCode(code);
            void spectateGame(code);
        }
    };

    if (!roomCode) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4 font-serif text-stone-200">
                <div className="max-w-md w-full bg-stone-900 border border-stone-700 p-8 rounded-lg shadow-2xl text-center">
                    <h1 className="text-3xl font-cinzel text-amber-500 mb-2">Town Square</h1>
                    <p className="text-stone-500 mb-8">Public Game View</p>

                    <form onSubmit={handleJoin} className="flex flex-col gap-4">
                        <input
                            type="text"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            placeholder="Enter Room Code"
                            className="bg-stone-950 border border-stone-700 p-4 rounded text-center text-xl tracking-widest uppercase focus:border-amber-600 focus:outline-none transition-colors"
                            maxLength={4}
                        />
                        <button
                            type="submit"
                            className="bg-amber-700 hover:bg-amber-600 text-white p-4 rounded font-bold tracking-wider transition-colors"
                        >
                            VIEW TOWN SQUARE
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (connectionStatus === 'connecting') {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-stone-700 border-t-amber-500 rounded-full animate-spin"></div>
                    <p>Connecting to Town Square...</p>
                </div>
            </div>
        );
    }

    if (!gameState) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">
                <div className="text-center">
                    <p className="mb-4">Unable to load game data.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-amber-500 hover:text-amber-400 underline"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-stone-950 overflow-hidden relative">
            {/* Victory Confetti */}
            <Confetti
                active={!!gameState?.gameOver?.winner}
                colors={gameState?.gameOver?.winner === 'GOOD'
                    ? ['#3b82f6', '#fbbf24', '#60a5fa', '#f59e0b', '#ffffff']
                    : ['#ef4444', '#a855f7', '#dc2626', '#7c3aed', '#000000']
                }
            />

            <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]"></div>

            {/* Header / Info Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 pointer-events-none">
                <div className="bg-stone-900/80 backdrop-blur border border-stone-700 px-4 py-2 rounded shadow-lg">
                    <h1 className="text-amber-500 font-cinzel font-bold text-lg">Town Square</h1>
                    <div className="text-xs text-stone-400">Room: <span className="text-stone-200 font-mono">{roomCode}</span></div>
                </div>
            </div>

            <Grimoire
                width={window.innerWidth}
                height={window.innerHeight}
                readOnly={true}
                publicOnly={true}
            />
        </div>
    );
};




