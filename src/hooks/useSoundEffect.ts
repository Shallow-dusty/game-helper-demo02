import { useCallback, useRef, useEffect } from 'react';
import { useStore } from '../store';

/**
 * 操作音效定义
 * 用于拟音交互 (Diegetic Foley)
 */
export const FOLEY_SOUNDS = {
  // --- Ambience (Public) ---
  day_bell: { url: '/audio/sfx/bell.mp3', volume: 0.8, category: 'ambience' },
  clock_chime: { url: '/audio/sfx/clock_chime.mp3', volume: 0.8, category: 'ambience' },
  night_owl: { url: '/audio/sfx/owl.mp3', volume: 0.5, category: 'ambience' },
  bird_chirp: { url: '/audio/sfx/bird_chirp.mp3', volume: 0.5, category: 'ambience' },
  wind_howl: { url: '/audio/sfx/wind_howl.mp3', volume: 0.35, category: 'ambience' },
  crow_caw: { url: '/audio/sfx/crow_caw.mp3', volume: 0.4, category: 'ambience' },
  drone_low: { url: '/audio/sfx/drone_low.mp3', volume: 0.25, category: 'ambience' },
  gavel: { url: '/audio/sfx/gavel.mp3', volume: 0.8, category: 'ambience' },
  clock_tick: { url: '/audio/sfx/clock_tick.mp3', volume: 0.7, category: 'ambience' },
  clock_tock: { url: '/audio/sfx/clock_tock.mp3', volume: 0.7, category: 'ambience' },
  clock_alarm: { url: '/audio/sfx/clock_alarm.mp3', volume: 0.9, category: 'ambience' },
  chip_drop: { url: '/audio/sfx/chip_drop.mp3', volume: 0.5, category: 'ambience' },

  // --- UI (Private) ---
  token_place: { url: '/audio/sfx/token_place.mp3', volume: 0.6, category: 'ui' },
  token_drag: { url: '/audio/sfx/cloth_drag.mp3', volume: 0.4, category: 'ui' },
  token_select: { url: '/audio/sfx/click_soft.mp3', volume: 0.5, category: 'ui' },
  lock_click: { url: '/audio/sfx/lock_click.mp3', volume: 0.6, category: 'ui' },
  paper_rustle: { url: '/audio/sfx/paper_rustle.mp3', volume: 0.5, category: 'ui' },
  scroll_open: { url: '/audio/sfx/scroll_open.mp3', volume: 0.5, category: 'ui' },
  scroll_close: { url: '/audio/sfx/scroll_close.mp3', volume: 0.5, category: 'ui' },
  hand_raise: { url: '/audio/sfx/hand_raise.mp3', volume: 0.5, category: 'ui' },
  vote_cast: { url: '/audio/sfx/vote_cast.mp3', volume: 0.6, category: 'ui' },
  wax_seal: { url: '/audio/sfx/wax_seal.mp3', volume: 0.6, category: 'ui' },
  success: { url: '/audio/sfx/success.mp3', volume: 0.6, category: 'ui' },
  error: { url: '/audio/sfx/error.mp3', volume: 0.5, category: 'ui' },

  // --- Cues (Secret) ---
  night_wolf: { url: '/audio/sfx/wolf.mp3', volume: 0.6, category: 'cues' },
  death_toll: { url: '/audio/sfx/death_toll.mp3', volume: 0.7, category: 'cues' },
  ghost_whisper: { url: '/audio/sfx/ghost_whisper.mp3', volume: 0.4, category: 'cues' },
  notification: { url: '/audio/sfx/notification.mp3', volume: 0.5, category: 'cues' },
} as const;

export type FoleySoundId = keyof typeof FOLEY_SOUNDS;

// 音频缓存
const audioCache = new Map<string, HTMLAudioElement>();

// 预加载音频
function preloadAudio(url: string): HTMLAudioElement | null {
  if (!url) return null;
  
  if (audioCache.has(url)) {
    return audioCache.get(url) ?? null;
  }
  
  try {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audioCache.set(url, audio);
    return audio;
  } catch (e) {
    console.warn('Failed to preload audio:', url, e);
    return null;
  }
}

/**
 * 音效播放 Hook
 * 
 * 用于播放短音效（拟音交互）
 * 自动处理音频上下文限制和音量控制
 * 
 * @example
 * const { playSound, preloadSounds } = useSoundEffect();
 * 
 * // 预加载常用音效
 * useEffect(() => {
 *   preloadSounds(['clock_tick', 'token_place']);
 * }, []);
 * 
 * // 播放音效
 * playSound('clock_tick');
 */
export function useSoundEffect() {
  const isAudioBlocked = useStore(state => state.isAudioBlocked);
  const masterVolume = useStore(state => state.gameState?.audio.volume ?? 1);
  const audioSettings = useStore(state => state.audioSettings);
  const activeAudiosRef = useRef<HTMLAudioElement[]>([]);

  // 清理函数
  useEffect(() => {
    return () => {
      activeAudiosRef.current.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      activeAudiosRef.current = [];
    };
  }, []);

  /**
   * 播放指定音效
   */
  const playSound = useCallback((soundId: FoleySoundId, options?: { volume?: number }) => {
    if (isAudioBlocked) return;

    const soundDef = FOLEY_SOUNDS[soundId];

    // --- Audio Privacy Check ---
    const category = soundDef.category;
    
    // 1. Check if category is enabled
    if (!audioSettings.categories[category]) return;

    // 2. Check Offline Mode restrictions
    // In Offline Mode, 'cues' are ALWAYS muted to prevent info leaks
    if (audioSettings.mode === 'offline' && category === 'cues') {
        return;
    }
    
    try {
      // 创建新的音频实例（允许同时播放多个）
      const audio = new Audio(soundDef.url);
      const finalVolume = (options?.volume ?? soundDef.volume) * masterVolume;
      audio.volume = Math.max(0, Math.min(1, finalVolume));
      
      // 跟踪活跃音频
      activeAudiosRef.current.push(audio);
      
      // 播放完成后清理
      audio.onended = () => {
        const index = activeAudiosRef.current.indexOf(audio);
        if (index > -1) {
          activeAudiosRef.current.splice(index, 1);
        }
      };
      
      audio.onerror = () => {
        console.warn(`Failed to play sound: ${soundId}`);
        const index = activeAudiosRef.current.indexOf(audio);
        if (index > -1) {
          activeAudiosRef.current.splice(index, 1);
        }
      };
      
      audio.play().catch((e: unknown) => {
        // 忽略自动播放限制错误
        if (e instanceof Error && e.name !== 'NotAllowedError') {
          console.warn(`Error playing sound ${soundId}:`, e);
        }
      });
    } catch (e) {
      console.warn(`Error creating audio for ${soundId}:`, e);
    }
  }, [isAudioBlocked, masterVolume, audioSettings]);

  /**
   * 预加载音效列表
   */
  const preloadSounds = useCallback((soundIds: FoleySoundId[]) => {
    soundIds.forEach(id => {
      const soundDef = FOLEY_SOUNDS[id];
      preloadAudio(soundDef.url);
    });
  }, []);

  /**
   * 停止所有正在播放的音效
   */
  const stopAllSounds = useCallback(() => {
    activeAudiosRef.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    activeAudiosRef.current = [];
  }, []);

  /**
   * 播放时钟滴答声（交替 tick/tock）
   */
  const tickTockRef = useRef(false);
  const playClockTick = useCallback(() => {
    playSound(tickTockRef.current ? 'clock_tock' : 'clock_tick');
    tickTockRef.current = !tickTockRef.current;
  }, [playSound]);

  return {
    playSound,
    preloadSounds,
    stopAllSounds,
    playClockTick,
    isAudioBlocked,
  };
}

export default useSoundEffect;
