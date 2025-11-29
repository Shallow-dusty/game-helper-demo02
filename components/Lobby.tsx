
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { AUDIO_TRACKS } from '../constants';

export const Lobby = () => {
    const login = useStore(state => state.login);
    const spectateGame = useStore(state => state.spectateGame);
    const [name, setName] = useState('');
    const [isST, setIsST] = useState(false);
    const [isSpectating, setIsSpectating] = useState(false);
    const [roomCode, setRoomCode] = useState('');

    // Local Audio for Lobby
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        // 检查是否有有效的音频URL
        const lobbyTrack = AUDIO_TRACKS.lobby;
        if (!lobbyTrack?.url || lobbyTrack.url === '') {
            // 没有有效音频，跳过音频初始化
            setHasInteracted(true); // 直接标记为已交互，跳过音频提示
            return;
        }

        // Preload Lobby Music
        const audio = new Audio(lobbyTrack.url);
        audio.loop = true;
        audio.volume = 0.4;
        audioRef.current = audio;

        // 添加错误处理
        const handleError = () => {
            console.log('Lobby audio failed to load, skipping');
            setHasInteracted(true);
        };
        audio.addEventListener('error', handleError);

        return () => {
            // 彻底清理音频资源
            if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current);
                fadeIntervalRef.current = null;
            }
            if (audioRef.current) {
                audioRef.current.removeEventListener('error', handleError);
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        };
    }, []);

    const handleInteraction = () => {
        if (!hasInteracted && audioRef.current) {
            setHasInteracted(true);
            audioRef.current.play().catch(e => console.log("Audio play failed", e));
        }
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSpectating) {
            if (roomCode.length === 4) {
                if (audioRef.current) {
                    // Fade out lobby music
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
                        } else if (audioRef.current) {
                            audioRef.current.volume = Math.max(0, vol);
                        }
                    }, 100);
                }
                spectateGame(roomCode);
            }
            return;
        }

        if (name.trim()) {
            if (audioRef.current) {
                // Fade out lobby music
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
                    } else if (audioRef.current) {
                        audioRef.current.volume = Math.max(0, vol);
                    }
                }, 100);
            }
            login(name, isST);
        }
    };

    return (
        <div
            className="absolute inset-0 font-serif text-stone-200 overflow-y-scroll overflow-x-hidden -webkit-overflow-scrolling-touch"
            onClick={handleInteraction}
        >
            {/* Background Image with Overlay */}
            <div
                className="fixed inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center filter brightness-[0.4] sepia-[.2] pointer-events-none transition-all duration-1000"
            ></div>
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-stone-900/60 opacity-90 pointer-events-none"></div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8 md:py-12 flex flex-col justify-center min-h-[100dvh] md:min-h-0 animate-fade-in">
                {/* Title Section */}
                <div className="text-center mb-10 md:mb-12 relative">
                    <h1 className="text-6xl md:text-8xl font-black text-red-900 tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] font-cinzel text-shadow-glow" style={{ textShadow: "0 0 30px rgba(127, 29, 29, 0.6)" }}>
                        血染钟楼
                    </h1>
                    <p className="text-xl md:text-2xl text-stone-400 mt-4 font-cinzel tracking-[0.2em] uppercase opacity-80 border-t border-b border-stone-800 py-2 inline-block px-8">Grimoire Online</p>
                </div>

                {/* Card Container */}
                <div className="glass-panel p-8 md:p-10 rounded-lg relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_50px_rgba(180,83,9,0.1)]">
                    {/* Decorative Corners */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-stone-600/50 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-stone-600/50 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-stone-600/50 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-stone-600/50 rounded-br-lg"></div>

                    {!hasInteracted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 cursor-pointer backdrop-blur-sm transition-opacity duration-500">
                            <div className="text-center animate-pulse">
                                <p className="text-amber-500 font-cinzel text-xl mb-2">点击开启音效</p>
                                <p className="text-stone-500 text-sm">Click to Enable Audio</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleJoin} className="space-y-8 relative z-10">
                        {!isSpectating ? (
                            <>
                                <div className="space-y-3 group/input">
                                    <label className="block text-xs font-bold text-red-800 uppercase tracking-[0.2em] font-cinzel transition-colors group-focus-within/input:text-red-600">你的名讳 (Your Name)</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-stone-950/50 border border-stone-800 px-6 py-4 text-xl text-stone-200 focus:border-red-800 focus:bg-stone-900/80 outline-none transition-all placeholder-stone-700 font-serif rounded shadow-inner focus:shadow-[0_0_15px_rgba(127,29,29,0.2)]"
                                        placeholder="请输入您的名字..."
                                        required
                                        autoComplete="off"
                                    />
                                </div>

                                <div
                                    className="flex items-center gap-5 p-5 bg-stone-950/30 border border-stone-800 rounded hover:border-stone-600 cursor-pointer transition-all hover:bg-stone-900/50 group/checkbox"
                                    onClick={() => setIsST(!isST)}
                                >
                                    <div className={`w-6 h-6 border-2 flex items-center justify-center transition-all duration-300 rounded-sm flex-shrink-0 ${isST ? 'bg-red-900 border-red-700 rotate-0 scale-110' : 'border-stone-600 rotate-45'}`}>
                                        {isST && <span className="text-white text-xs">✦</span>}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-stone-300 font-cinzel font-bold group-hover/checkbox:text-red-400 transition-colors text-lg">我是说书人 (Storyteller)</span>
                                        <span className="text-xs text-stone-500 mt-1">上帝视角 / 操控全局 / 只有一名</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3 group/input">
                                <label className="block text-xs font-bold text-blue-800 uppercase tracking-[0.2em] font-cinzel transition-colors group-focus-within/input:text-blue-600">房间号码 (Room Code)</label>
                                <input
                                    type="text"
                                    maxLength={4}
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    className="w-full bg-stone-950/50 border border-stone-800 px-6 py-4 text-4xl text-center text-stone-200 focus:border-blue-800 focus:bg-stone-900/80 outline-none transition-all placeholder-stone-800 font-cinzel tracking-[0.5em] rounded shadow-inner focus:shadow-[0_0_15px_rgba(30,58,138,0.2)]"
                                    placeholder="8888"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`w-full font-bold py-5 rounded border shadow-lg transition-all active:scale-[0.98] font-cinzel text-xl tracking-[0.2em] relative overflow-hidden group/btn ${isSpectating
                                ? 'bg-gradient-to-r from-blue-950 to-blue-900 border-blue-900 text-blue-100 hover:shadow-[0_0_30px_rgba(30,58,138,0.4)]'
                                : 'bg-gradient-to-r from-red-950 to-red-900 border-red-900 text-stone-200 hover:shadow-[0_0_30px_rgba(127,29,29,0.4)]'
                                }`}
                        >
                            <span className="relative z-10">{isSpectating ? '进入旁观 (SPECTATE)' : '进入小镇 (ENTER)'}</span>
                            <div className={`absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 ${isSpectating ? 'bg-blue-800/20' : 'bg-red-800/20'}`}></div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsSpectating(!isSpectating)}
                            className="w-full bg-transparent hover:bg-stone-900/50 text-stone-500 hover:text-stone-300 font-bold py-3 rounded border border-transparent hover:border-stone-800 transition-all font-cinzel text-sm tracking-widest uppercase"
                        >
                            {isSpectating ? '返回登录 (Back to Login)' : '切换至旁观模式 (Switch to Spectator)'}
                        </button>
                    </form>

                    {/* QR Code Share */}
                    <div className="mt-8 pt-8 border-t border-stone-800/50 flex flex-col items-center gap-4 opacity-60 hover:opacity-100 transition-opacity">
                        <div className="bg-white p-2 rounded shadow-lg transform hover:scale-105 transition-transform duration-300">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff`}
                                alt="Room QR Code"
                                className="w-24 h-24"
                            />
                        </div>
                        <p className="text-[10px] text-stone-600 font-cinzel tracking-widest">SCAN TO JOIN</p>
                    </div>
                </div>

                <p className="text-center text-stone-700 text-xs mt-8 font-serif italic pb-8">
                    "There is a demon among us..."
                </p>
            </div>
        </div>
    );
};
