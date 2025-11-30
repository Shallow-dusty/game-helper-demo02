import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { AUDIO_TRACKS } from '../constants';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { BackgroundEffects } from './ui/BackgroundEffects';
import { motion } from 'framer-motion';
import { User, BookOpen, Skull, Volume2, Eye } from 'lucide-react';

export const Lobby: React.FC = () => {
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
        const lobbyTrack = AUDIO_TRACKS.lobby;
        if (!lobbyTrack?.url || lobbyTrack.url === '') {
            setHasInteracted(true);
            return;
        }

        const audio = new Audio(lobbyTrack.url);
        audio.loop = true;
        audio.volume = 0.4;
        audioRef.current = audio;

        const handleError = () => {
            console.log('Lobby audio failed to load, skipping');
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

    const fadeOutAudio = () => {
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
                } else if (audioRef.current) {
                    audioRef.current.volume = Math.max(0, vol);
                }
            }, 100);
        }
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSpectating) {
            if (roomCode.length === 4) {
                fadeOutAudio();
                spectateGame(roomCode);
            }
            return;
        }

        if (name.trim()) {
            fadeOutAudio();
            login(name, isST);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden" onClick={handleInteraction}>
            <BackgroundEffects />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                className="w-full max-w-md z-10"
            >
                <Card className="border-stone-800 bg-stone-950/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    {/* Audio Hint Overlay */}
                    {!hasInteracted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 cursor-pointer backdrop-blur-[2px] transition-opacity duration-500">
                            <div className="text-center animate-pulse flex flex-col items-center gap-2">
                                <Volume2 className="w-8 h-8 text-amber-500" />
                                <p className="text-amber-500 font-cinzel text-lg">Click to Enable Audio</p>
                            </div>
                        </div>
                    )}

                    <CardHeader className="text-center space-y-4 pb-6">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mx-auto w-20 h-20 bg-gradient-to-br from-red-900 to-stone-900 rounded-full flex items-center justify-center border-2 border-stone-700 shadow-[0_0_30px_rgba(220,38,38,0.3)]"
                        >
                            <Skull className="w-10 h-10 text-stone-200" />
                        </motion.div>
                        <div className="space-y-2">
                            <CardTitle className="text-4xl text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 drop-shadow-sm">
                                Grimoire Web
                            </CardTitle>
                            <CardDescription className="text-stone-400 text-lg">
                                Blood on the Clocktower
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleJoin} className="space-y-6">
                            {!isSpectating ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-stone-400 uppercase tracking-wider font-cinzel ml-1">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your name..."
                                            className="w-full bg-stone-900/50 border border-stone-700 rounded-md px-4 py-3 text-lg text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-900/50 focus:border-amber-700 transition-all font-serif"
                                            autoFocus
                                        />
                                    </div>

                                    <div
                                        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${isST ? 'bg-red-950/30 border-red-900/50' : 'bg-stone-900/30 border-stone-800 hover:bg-stone-900/50'}`}
                                        onClick={() => setIsST(!isST)}
                                    >
                                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${isST ? 'bg-red-900 border-red-700' : 'border-stone-600'}`}>
                                            {isST && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-cinzel font-bold text-sm ${isST ? 'text-red-400' : 'text-stone-300'}`}>Storyteller Mode</span>
                                            <span className="text-xs text-stone-500">Host and manage the game</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-stone-400 uppercase tracking-wider font-cinzel ml-1">
                                        Room Code
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value)}
                                        placeholder="8888"
                                        className="w-full bg-stone-900/50 border border-stone-700 rounded-md px-4 py-3 text-4xl text-center font-cinzel tracking-[0.5em] text-stone-100 placeholder:text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-900/50 focus:border-blue-700 transition-all"
                                    />
                                </div>
                            )}

                            <div className="space-y-3 pt-2">
                                <Button
                                    size="lg"
                                    type="submit"
                                    disabled={isSpectating ? roomCode.length !== 4 : !name.trim()}
                                    className={`w-full h-14 text-lg font-cinzel relative overflow-hidden group ${isSpectating ? 'bg-blue-950 border-blue-900 hover:bg-blue-900' : ''}`}
                                    variant={isSpectating ? 'default' : (isST ? 'destructive' : 'default')}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <span className="relative flex items-center gap-2">
                                        {isSpectating ? <Eye className="w-5 h-5" /> : (isST ? <BookOpen className="w-5 h-5" /> : <User className="w-5 h-5" />)}
                                        {isSpectating ? 'Enter as Spectator' : (isST ? 'Enter as Storyteller' : 'Enter as Player')}
                                    </span>
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsSpectating(!isSpectating)}
                                    className="w-full text-stone-500 hover:text-stone-300 font-cinzel text-xs tracking-widest"
                                >
                                    {isSpectating ? 'Back to Login' : 'Switch to Spectator Mode'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>

                    <CardFooter className="justify-center pb-6 pt-0">
                        <p className="text-xs text-stone-600 font-serif italic">
                            "There is a demon among us..."
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
};
