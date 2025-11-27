
import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { AUDIO_TRACKS } from '../constants';

export const AudioManager = () => {
    const audioState = useStore(state => state.gameState?.audio);
    const setAudioBlocked = useStore(state => state.setAudioBlocked);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previousTrackRef = useRef<string | null>(null);
    const playPromiseRef = useRef<Promise<void> | null>(null);

    const isAudioBlocked = useStore(state => state.isAudioBlocked);

    // Create audio element on mount
    useEffect(() => {
        const audio = new Audio();
        audio.loop = true;
        audioRef.current = audio;

        return () => {
            // 安全清理：等待任何挂起的 play promise 完成
            if (playPromiseRef.current) {
                playPromiseRef.current
                    .then(() => {
                        audio.pause();
                        audio.src = '';
                    })
                    .catch(() => {
                        // 忽略错误，组件已卸载
                    });
            } else {
                audio.pause();
                audio.src = '';
            }
            audioRef.current = null;
        };
    }, []);

    // Sync with Store
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioState) return;

        // Handle Volume
        audio.volume = audioState.volume;

        // Helper function to safely play
        const safePlay = () => {
            // 如果有挂起的 play promise，先等待它
            if (playPromiseRef.current) {
                playPromiseRef.current
                    .then(() => attemptPlay())
                    .catch(() => attemptPlay());
                return;
            }
            attemptPlay();
        };

        const attemptPlay = () => {
            if (!audio.src || audio.src === '') return;
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromiseRef.current = playPromise;
                playPromise
                    .then(() => {
                        playPromiseRef.current = null;
                        setAudioBlocked(false);
                    })
                    .catch(error => {
                        playPromiseRef.current = null;
                        if (error.name === 'AbortError') {
                            // 播放被中断（如切换音轨），这是正常的
                            console.log("Audio play aborted (track changed)");
                        } else {
                            console.warn("Audio autoplay blocked by browser:", error);
                            setAudioBlocked(true);
                        }
                    });
            }
        };

        // Handle Track Change
        if (audioState.trackId && audioState.trackId !== previousTrackRef.current) {
            const track = AUDIO_TRACKS[audioState.trackId];
            if (track) {
                // 先暂停当前音频再切换
                if (playPromiseRef.current) {
                    playPromiseRef.current
                        .then(() => {
                            audio.pause();
                            audio.src = track.url;
                            if (audioState.isPlaying) {
                                attemptPlay();
                            }
                        })
                        .catch(() => {
                            audio.src = track.url;
                            if (audioState.isPlaying) {
                                attemptPlay();
                            }
                        });
                } else {
                    audio.src = track.url;
                    if (audioState.isPlaying) {
                        safePlay();
                    }
                }
            }
            previousTrackRef.current = audioState.trackId;
        }

        // Handle Play/Pause state toggles
        if (audioState.isPlaying && audio.paused && audio.src) {
            // If blocked, don't spam try, wait for unblock
            if (!isAudioBlocked) {
                safePlay();
            }
        } else if (!audioState.isPlaying && !audio.paused) {
            // 安全暂停
            if (playPromiseRef.current) {
                playPromiseRef.current
                    .then(() => audio.pause())
                    .catch(() => audio.pause());
            } else {
                audio.pause();
            }
        }

        // Retry play if unblocked
        if (!isAudioBlocked && audioState.isPlaying && audio.paused && audio.src) {
            safePlay();
        }

    }, [audioState?.trackId, audioState?.isPlaying, audioState?.volume, setAudioBlocked, isAudioBlocked]);

    return null; // Invisible component
};
