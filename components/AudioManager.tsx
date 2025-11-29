
import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { AUDIO_TRACKS } from '../constants';

export const AudioManager = () => {
    // 使用更精细的选择器，避免不必要的重渲染
    const audioTrackId = useStore(state => state.gameState?.audio?.trackId);
    const audioIsPlaying = useStore(state => state.gameState?.audio?.isPlaying);
    const audioVolume = useStore(state => state.gameState?.audio?.volume);
    const setAudioBlocked = useStore(state => state.setAudioBlocked);
    const isAudioBlocked = useStore(state => state.isAudioBlocked);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previousTrackRef = useRef<string | null>(null);
    const playPromiseRef = useRef<Promise<void> | null>(null);
    const isPlayingRef = useRef(false); // 跟踪实际播放状态
    const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 用于清理 setTimeout
    const isMountedRef = useRef(true); // 跟踪组件是否已卸载

    // Create audio element on mount
    useEffect(() => {
        isMountedRef.current = true;
        const audio = new Audio();
        audio.loop = true;
        audio.preload = 'auto';
        audioRef.current = audio;

        // 添加错误处理
        const handleError = (e: Event) => {
            if (!isMountedRef.current) return;

            const audioElement = e.target as HTMLAudioElement;
            // 如果没有设置 src 或 src 为空，不报错
            if (!audioElement.src || audioElement.src === '' || audioElement.src === window.location.href) {
                return;
            }

            const error = audioElement.error;
            if (error) {
                console.warn('Audio error:', error.code, error.message);
            }
        };

        const handlePlay = () => {
            if (isMountedRef.current) {
                isPlayingRef.current = true;
            }
        };

        const handlePause = () => {
            if (isMountedRef.current) {
                isPlayingRef.current = false;
            }
        };

        audio.addEventListener('error', handleError);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            isMountedRef.current = false;

            audio.removeEventListener('error', handleError);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);

            // 清理任何挂起的 timeout
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
                cleanupTimeoutRef.current = null;
            }

            // 安全清理：等待任何挂起的 play promise 完成
            if (playPromiseRef.current) {
                playPromiseRef.current
                    .then(() => {
                        audio.pause();
                        audio.src = '';
                    })
                    .catch(() => {
                        // 忽略错误，组件已卸载
                        try { audio.pause(); } catch (e) { /* ignore */ }
                    });
            } else {
                try {
                    audio.pause();
                    audio.src = '';
                } catch (e) { /* ignore */ }
            }
            audioRef.current = null;
        };
    }, []);

    // 单独处理音量变化 - 直接设置，无需重新触发播放逻辑
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || audioVolume === undefined) return;

        // 直接设置音量，不触发其他逻辑
        audio.volume = audioVolume;
    }, [audioVolume]);

    // 安全播放函数 - 使用 ref 避免不必要的依赖
    const attemptPlay = useCallback(() => {
        if (!isMountedRef.current) return;

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
                    if (isMountedRef.current) {
                        setAudioBlocked(false);
                    }
                })
                .catch(error => {
                    playPromiseRef.current = null;
                    if (!isMountedRef.current) return;

                    if (error.name === 'AbortError') {
                        // 播放被中断（如切换音轨），这是正常的
                        console.log("Audio play aborted (track changed)");
                    } else if (error.name === 'NotSupportedError') {
                        // 音频格式不支持或URL无效，静默处理
                        console.warn("Audio format not supported or URL invalid:", audio.src);
                    } else {
                        console.warn("Audio autoplay blocked by browser:", error);
                        setAudioBlocked(true);
                    }
                });
        }
    }, [setAudioBlocked]);

    // 安全播放（处理挂起的 Promise）
    const safePlay = useCallback(() => {
        if (!isMountedRef.current) return;

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
                .then(() => { try { audio.pause(); } catch (e) { /* ignore */ } })
                .catch(() => { try { audio.pause(); } catch (e) { /* ignore */ } });
        } else {
            try { audio.pause(); } catch (e) { /* ignore */ }
        }
    }, []);

    // 处理音轨切换 - 简化依赖
    useEffect(() => {
        if (!isMountedRef.current) return;

        const audio = audioRef.current;
        if (!audio || !audioTrackId) return;

        // 只有当音轨真正变化时才处理
        if (audioTrackId === previousTrackRef.current) return;

        const track = AUDIO_TRACKS[audioTrackId];

        // 只有当音轨有有效 URL 时才加载
        if (track?.url && track.url !== '') {
            // URL 校验：支持 http/https、data: base64、以及本地路径 /
            const isValidUrl = track.url.startsWith('http') ||
                track.url.startsWith('data:') ||
                track.url.startsWith('/');

            if (!isValidUrl) {
                console.warn("Invalid audio URL:", track.url);
                previousTrackRef.current = audioTrackId;
                return;
            }

            // 先暂停当前音频再切换
            const loadAndPlay = () => {
                if (!isMountedRef.current || !audioRef.current) return;
                audioRef.current.src = track.url;
                if (audioIsPlaying) {
                    attemptPlay();
                }
            };

            if (playPromiseRef.current) {
                playPromiseRef.current
                    .then(() => {
                        if (!isMountedRef.current) return;
                        try { audio.pause(); } catch (e) { /* ignore */ }
                        loadAndPlay();
                    })
                    .catch(() => {
                        if (!isMountedRef.current) return;
                        loadAndPlay();
                    });
            } else {
                try { audio.pause(); } catch (e) { /* ignore */ }
                loadAndPlay();
            }
        } else {
            // 音轨没有有效URL，停止播放并清空src
            safePause();
            // 延迟清空 src 避免潜在问题，并确保清理旧的 timeout
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
            }
            cleanupTimeoutRef.current = setTimeout(() => {
                if (audioRef.current && isMountedRef.current) {
                    audioRef.current.src = '';
                }
                cleanupTimeoutRef.current = null;
            }, 100);
        }

        previousTrackRef.current = audioTrackId;
    }, [audioTrackId, audioIsPlaying, attemptPlay, safePause]);

    // 处理播放/暂停状态切换（不依赖音量）
    useEffect(() => {
        if (!isMountedRef.current) return;

        const audio = audioRef.current;
        if (!audio || audioIsPlaying === undefined) return;

        const hasValidSrc = audio.src && audio.src !== '' && audio.src !== window.location.href;

        if (audioIsPlaying && audio.paused && hasValidSrc) {
            if (!isAudioBlocked) {
                safePlay();
            }
        } else if (!audioIsPlaying && !audio.paused) {
            safePause();
        }
    }, [audioIsPlaying, isAudioBlocked, safePlay, safePause]);

    // 处理解除阻塞后重试播放
    useEffect(() => {
        if (!isMountedRef.current) return;

        const audio = audioRef.current;
        if (!audio || audioIsPlaying === undefined) return;

        const hasValidSrc = audio.src && audio.src !== '' && audio.src !== window.location.href;

        if (!isAudioBlocked && audioIsPlaying && audio.paused && hasValidSrc) {
            safePlay();
        }
    }, [isAudioBlocked, audioIsPlaying, safePlay]);

    return null; // Invisible component
};
