
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../store';
import { AUDIO_TRACKS } from '../constants';

export const AudioManager = () => {
    const audioState = useStore(state => state.gameState?.audio);
    const setAudioBlocked = useStore(state => state.setAudioBlocked);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previousTrackRef = useRef<string | null>(null);
    const playPromiseRef = useRef<Promise<void> | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const isPlayingRef = useRef(false); // 跟踪实际播放状态

    const isAudioBlocked = useStore(state => state.isAudioBlocked);

    // Create audio element on mount
    useEffect(() => {
        const audio = new Audio();
        audio.loop = true;
        audio.preload = 'auto';
        audioRef.current = audio;

        // 添加错误处理
        const handleError = (e: Event) => {
            const audioElement = e.target as HTMLAudioElement;
            // 如果没有设置 src 或 src 为空，不报错
            if (!audioElement.src || audioElement.src === '' || audioElement.src === window.location.href) {
                return;
            }
            
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

        const handlePlay = () => {
            isPlayingRef.current = true;
        };

        const handlePause = () => {
            isPlayingRef.current = false;
        };

        audio.addEventListener('error', handleError);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            
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

    // 单独处理音量变化 - 直接设置，无需重新触发播放逻辑
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || audioState?.volume === undefined) return;
        
        // 直接设置音量，不触发其他逻辑
        audio.volume = audioState.volume;
    }, [audioState?.volume]);

    // 安全播放函数
    const attemptPlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        
        // 检查是否有有效的音频源
        if (!audio.src || audio.src === '' || audio.src === window.location.href) {
            return;
        }

        // 如果已经在播放，不重复调用
        if (isPlayingRef.current && !audio.paused) {
            return;
        }
        
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
                    } else if (error.name === 'NotSupportedError') {
                        // 音频格式不支持或URL无效，静默处理
                        console.warn("Audio format not supported or URL invalid:", audio.src);
                        setLoadError("不支持的音频格式");
                    } else {
                        console.warn("Audio autoplay blocked by browser:", error);
                        setAudioBlocked(true);
                    }
                });
        }
    }, [setAudioBlocked]);

    // 安全播放（处理挂起的 Promise）
    const safePlay = useCallback(() => {
        if (playPromiseRef.current) {
            playPromiseRef.current
                .then(() => attemptPlay())
                .catch(() => attemptPlay());
            return;
        }
        attemptPlay();
    }, [attemptPlay]);

    // 安全暂停
    const safePause = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (playPromiseRef.current) {
            playPromiseRef.current
                .then(() => audio.pause())
                .catch(() => audio.pause());
        } else {
            audio.pause();
        }
    }, []);

    // 处理音轨切换
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioState?.trackId) return;
        
        // 只有当音轨真正变化时才处理
        if (audioState.trackId === previousTrackRef.current) return;

        const track = AUDIO_TRACKS[audioState.trackId];
        
        // 只有当音轨有有效 URL 时才加载
        if (track?.url && track.url !== '') {
            // 简单的 URL 校验
            if (!track.url.startsWith('http') && !track.url.startsWith('data:')) {
                console.warn("Invalid audio URL:", track.url);
                previousTrackRef.current = audioState.trackId;
                return;
            }

            // 先暂停当前音频再切换
            const loadAndPlay = () => {
                audio.src = track.url;
                if (audioState.isPlaying) {
                    attemptPlay();
                }
            };

            if (playPromiseRef.current) {
                playPromiseRef.current
                    .then(() => {
                        audio.pause();
                        loadAndPlay();
                    })
                    .catch(() => loadAndPlay());
            } else {
                audio.pause();
                loadAndPlay();
            }
        } else {
            // 音轨没有有效URL，停止播放并清空src
            safePause();
            // 延迟清空 src 避免潜在问题
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.src = '';
                }
            }, 100);
        }
        
        previousTrackRef.current = audioState.trackId;
    }, [audioState?.trackId, audioState?.isPlaying, attemptPlay, safePause]);

    // 处理播放/暂停状态切换（不依赖音量）
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioState) return;

        const hasValidSrc = audio.src && audio.src !== '' && audio.src !== window.location.href;
        
        if (audioState.isPlaying && audio.paused && hasValidSrc) {
            if (!isAudioBlocked) {
                safePlay();
            }
        } else if (!audioState.isPlaying && !audio.paused) {
            safePause();
        }
    }, [audioState?.isPlaying, isAudioBlocked, safePlay, safePause]);

    // 处理解除阻塞后重试播放
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioState) return;

        const hasValidSrc = audio.src && audio.src !== '' && audio.src !== window.location.href;
        
        if (!isAudioBlocked && audioState.isPlaying && audio.paused && hasValidSrc) {
            safePlay();
        }
    }, [isAudioBlocked, audioState?.isPlaying, safePlay]);

    return null; // Invisible component
};
