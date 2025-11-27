
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { AUDIO_TRACKS } from '../constants';

export const Lobby = () => {
    const login = useStore(state => state.login);
    const [name, setName] = useState('');
    const [isST, setIsST] = useState(false);

    // Local Audio for Lobby
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        // 检查是否有有效的音频URL
        const lobbyTrack = AUDIO_TRACKS['lobby'];
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
            onClick={handleInteraction} // Capture first click for audio
        >
            {/* Background Image with Overlay */}
            <div
                className="fixed inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center filter brightness-50 sepia-[.3] pointer-events-none"
            ></div>
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-black via-transparent to-black opacity-80 pointer-events-none"></div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8 md:py-12 flex flex-col justify-center min-h-[100dvh] md:min-h-0">
                {/* Title Section */}
                <div className="text-center mb-8 md:mb-10 relative">
                    <h1 className="text-5xl md:text-7xl font-black text-red-800 tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] font-cinzel" style={{ textShadow: "0 0 20px #500" }}>
                        血染钟楼
                    </h1>
                    <p className="text-lg md:text-xl text-stone-400 mt-2 font-cinzel tracking-widest uppercase opacity-80">Grimoire Online</p>
                    <div className="w-24 md:w-32 h-1 bg-red-900 mx-auto mt-4 rounded-full shadow-[0_0_10px_#f00]"></div>
                </div>

                {/* Card Container */}
                <div className="bg-stone-950/80 backdrop-blur-md p-6 md:p-8 rounded-sm border border-stone-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    {/* Decorative Corners */}
                    <div className="absolute top-0 left-0 w-12 md:w-16 h-12 md:h-16 border-t-2 border-l-2 border-stone-500 opacity-30"></div>
                    <div className="absolute bottom-0 right-0 w-12 md:w-16 h-12 md:h-16 border-b-2 border-r-2 border-stone-500 opacity-30"></div>

                    {!hasInteracted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 cursor-pointer">
                            <p className="animate-pulse text-stone-300 font-cinzel text-lg">点击任意处开启音效</p>
                        </div>
                    )}

                    <form onSubmit={handleJoin} className="space-y-6 md:space-y-8">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-red-700 uppercase tracking-wider font-cinzel">你的名讳</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-stone-900/50 border-b-2 border-stone-700 px-4 py-4 text-xl text-stone-100 focus:border-red-700 focus:bg-stone-900 outline-none transition-all placeholder-stone-700 font-serif rounded-t"
                                placeholder="请输入您的名字..."
                                required
                                autoComplete="off"
                            />
                        </div>

                        <div
                            className="flex items-center gap-4 p-4 bg-black/30 border border-stone-800 rounded hover:border-stone-600 cursor-pointer transition-colors group/checkbox active:bg-black/50"
                            onClick={() => setIsST(!isST)}
                        >
                            <div className={`w-8 h-8 md:w-6 md:h-6 border-2 flex items-center justify-center transition-all flex-shrink-0 ${isST ? 'bg-red-900 border-red-700 rotate-180' : 'border-stone-600'}`}>
                                {isST && <span className="text-white text-sm">✦</span>}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-stone-300 font-cinzel font-bold group-hover/checkbox:text-red-400 transition-colors text-lg md:text-base">我是说书人 (Storyteller)</span>
                                <span className="text-xs text-stone-600">上帝视角 / 操控全局 / 只有一名</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-red-950 to-red-900 hover:from-red-900 hover:to-red-800 text-stone-200 font-bold py-5 md:py-4 rounded border border-red-950 shadow-lg transition-all hover:shadow-[0_0_20px_rgba(120,0,0,0.3)] active:scale-[0.98] font-cinzel text-xl md:text-lg tracking-widest"
                        >
                            进入小镇
                        </button>
                    </form>
                </div>

                <p className="text-center text-stone-600 text-xs mt-8 font-serif italic pb-8 md:pb-16">
                    "恶魔就在我们中间..."
                </p>
            </div>
        </div>
    );
};
