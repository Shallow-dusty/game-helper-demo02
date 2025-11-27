
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { AUDIO_TRACKS } from '../constants';

export const AudioManager = () => {
    const audioState = useStore(state => state.gameState?.audio);
    const setAudioBlocked = useStore(state => state.setAudioBlocked);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previousTrackRef = useRef<string | null>(null);
    const playPromiseRef = useRef<Promise<void> | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const isAudioBlocked = useStore(state => state.isAudioBlocked);

    // Create audio element on mount
    useEffect(() => {
        const audio = new Audio();
        audio.loop = true;
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        audioRef.current = audio;

        // 添加错误处理
        const handleError = (e: Event) => {
            const audioElement = e.target as HTMLAudioElement;
            const error = audioElement.error;
            let errorMessage = '音频加载失败';
            
            if (error) {
                switch (error.code) {
                    case MediaError.MEDIA_ERR_ABORTED:
                        errorMessage = '音频加载被中断';
                        break;
                    case MediaError.MEDIA_ERR_NETWORK:
                        errorMessage = '网络错误，无法加载音频';
                        break;
                    case MediaError.MEDIA_ERR_DECODE:
                        errorMessage = '音频解码失败';
                        break;
                    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage = '不支持的音频格式';
                        break;
                }
            }
            console.warn('Audio error:', errorMessage, error);
            setLoadError(errorMessage);
        };

        const handleLoadStart = () => {
            setLoadError(null);
        };

        const handleCanPlay = () => {
            setLoadError(null);
        };

        audio.addEventListener('error', handleError);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplay', handleCanPlay);
            
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
