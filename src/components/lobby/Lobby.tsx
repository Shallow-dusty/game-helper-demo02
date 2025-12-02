import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { AUDIO_TRACKS, SOUND_EFFECTS } from '../../constants';
import { motion } from 'framer-motion';
import { Skull, Volume2 } from 'lucide-react';

export const Lobby: React.FC = () => {
    const login = useStore(state => state.login);
    const spectateGame = useStore(state => state.spectateGame);
    const [name, setName] = useState('');
    const [isST, setIsST] = useState(false);
    const [isSpectating, setIsSpectating] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [isRoomCodeValid, setIsRoomCodeValid] = useState(false);

    // Local Audio for Lobby
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        if (roomCode.length === 4 && !isRoomCodeValid) {
            setIsRoomCodeValid(true);
            // Play unlock sound
            const swordSfx = SOUND_EFFECTS.find(s => s.id === 'sword');
            if (swordSfx) {
                const audio = new Audio(swordSfx.url);
                audio.volume = 0.4;
                audio.play().catch(e => console.warn("SFX play failed", e));
            }
        } else if (roomCode.length !== 4 && isRoomCodeValid) {
            setIsRoomCodeValid(false);
        }
    }, [roomCode, isRoomCodeValid]);

    useEffect(() => {
        const lobbyTrack = AUDIO_TRACKS.lobby;
        if (!lobbyTrack?.url || lobbyTrack.url === '') {
            setHasInteracted(true);
            return;
        }

        const audio = new Audio(lobbyTrack.url);
        audio.loop = true;
        audio.volume = 0.2; // Lower initial volume
        audioRef.current = audio;

        const handleError = () => {
            console.warn('Lobby audio failed to load, skipping');
            setHasInteracted(true);
        };
        audio.addEventListener('error', handleError);

        return () => {
            if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current);
                fadeIntervalRef.current = null;
            }
            if (audioRef.current) {
                audioRef.current.removeEventListener('error', handleError);
                audioRef.current.volume = 0; // Immediate silence
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        };
    }, []);

    const handleInteraction = () => {
        if (!hasInteracted && audioRef.current) {
            setHasInteracted(true);
            audioRef.current.play().catch(e => console.warn("Audio play failed", e));
        }
    };

    const fadeOutAudio = () => {
        return new Promise<void>((resolve) => {
            if (audioRef.current) {
                let vol = 0.4;
                fadeIntervalRef.current = setInterval(() => {
                    vol -= 0.05;
                    if (vol <= 0) {
                        if (fadeIntervalRef.current) {
                            clearInterval(fadeIntervalRef.current);
                            fadeIntervalRef.current = null;
                        }
                        if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.src = '';
                        }
                        resolve();
                    } else if (audioRef.current) {
                        audioRef.current.volume = Math.max(0, vol);
                    }
                }, 100);
            } else {
                resolve();
            }
        });
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSpectating) {
            if (roomCode.length === 4) {
                void fadeOutAudio().then(() => {
                    void spectateGame(roomCode);
                });
            }
            return;
        }

        if (name.trim()) {
            void fadeOutAudio().then(() => {
                login(name, isST);
            });
        }
    };

    return (

        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
            {/* Main Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="w-full max-w-[480px] z-10 relative"
            >
                {/* Gothic Card Container */}
                <div className="glass-panel rounded-lg p-8 md:p-12 text-center relative overflow-hidden">
                    
                    {/* Audio Hint (Simplified) */}
                    {!hasInteracted && (
                        <div 
                            className="absolute top-4 right-4 z-50 cursor-pointer animate-pulse"
                            onClick={handleInteraction}
                            title="点击开启音效"
                        >
                            <Volume2 className="w-6 h-6 text-amber-500/80" />
                        </div>
                    )}

                    {/* Header Section */}
                    <div className="mb-12 space-y-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="flex justify-center mb-6"
                        >
                            <div className="w-20 h-20 rounded-full bg-black/50 border border-stone-800 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                                <Skull className="w-10 h-10 text-stone-400" />
                            </div>
                        </motion.div>

                        <h1 className="text-4xl md:text-5xl font-cinzel font-bold text-gold tracking-wider drop-shadow-lg">
                            魔典 GRIMOIRE
                        </h1>
                        <div className="flex items-center justify-center gap-4 opacity-80">
                            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-stone-500 to-transparent"></div>
                            <p className="text-stone-400 font-serif italic tracking-widest text-sm">血染钟楼线上助手</p>
                            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-stone-500 to-transparent"></div>
                        </div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleJoin} className="space-y-6 text-left">
                        {!isSpectating ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-cinzel text-stone-500 uppercase tracking-widest ml-1">
                                        你的昵称
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="请输入昵称..."
                                        className="w-full input-gothic rounded px-4 py-3 text-lg"
                                        autoFocus
                                    />
                                </div>

                                <div
                                    className={`group flex items-center gap-4 p-4 rounded border cursor-pointer transition-all duration-300 ${isST ? 'bg-red-950/30 border-red-900/50' : 'bg-black/20 border-stone-800 hover:border-stone-600'}`}
                                    onClick={() => setIsST(!isST)}
                                >
                                    <div className={`w-5 h-5 border rounded-sm flex items-center justify-center transition-colors ${isST ? 'border-red-500 bg-red-900/20' : 'border-stone-600'}`}>
                                        {isST && <div className="w-3 h-3 bg-red-500 rounded-[1px]" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`font-cinzel text-sm ${isST ? 'text-red-400' : 'text-stone-300'}`}>说书人模式</span>
                                        <span className="text-xs text-stone-600">主持并管理游戏</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-xs font-cinzel text-stone-500 uppercase tracking-widest ml-1">
                                    房间号
                                </label>
                                <input
                                    type="text"
                                    maxLength={4}
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    placeholder="8888"
                                    className={`w-full input-gothic rounded px-4 py-3 text-center text-3xl font-cinzel tracking-[0.5em] transition-all duration-500 ${isRoomCodeValid ? 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)] text-green-400' : ''}`}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSpectating ? roomCode.length !== 4 : !name.trim()}
                            className={`w-full btn-gothic py-4 rounded text-lg font-bold shadow-lg mt-8 disabled:opacity-50 disabled:cursor-not-allowed ${isRoomCodeValid ? 'animate-shimmer border-green-500/50 text-green-100' : ''}`}
                        >
                            {isSpectating ? '以观众身份进入' : (isST ? '进入魔典' : '以玩家身份进入')}
                        </button>

                        <div className="text-center pt-4">
                            <button
                                type="button"
                                onClick={() => setIsSpectating(!isSpectating)}
                                className="text-stone-600 hover:text-stone-400 text-xs font-cinzel tracking-widest transition-colors"
                            >
                                {isSpectating ? '返回登录' : '切换到观众模式'}
                            </button>
                        </div>
                    </form>

                    {/* Footer Quote */}
                    <div className="mt-12 opacity-40">
                        <p className="text-xs font-serif italic text-stone-500">"恶魔就在我们中间..."</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};




