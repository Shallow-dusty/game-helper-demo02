
import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { AUDIO_TRACKS } from '../constants';

export const AudioManager = () => {
  const audioState = useStore(state => state.gameState?.audio);
  const setAudioBlocked = useStore(state => state.setAudioBlocked);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousTrackRef = useRef<string | null>(null);

  // Create audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
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
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setAudioBlocked(false);
            }).catch(error => {
                console.warn("Audio autoplay blocked by browser:", error);
                setAudioBlocked(true);
            });
        }
    };

    // Handle Track Change
    if (audioState.trackId && audioState.trackId !== previousTrackRef.current) {
        const track = AUDIO_TRACKS[audioState.trackId];
        if (track) {
            audio.src = track.url;
            if (audioState.isPlaying) {
                safePlay();
            }
        }
        previousTrackRef.current = audioState.trackId;
    }

    // Handle Play/Pause state toggles
    if (audioState.isPlaying && audio.paused && audio.src) {
        safePlay();
    } else if (!audioState.isPlaying && !audio.paused) {
        audio.pause();
    }

  }, [audioState?.trackId, audioState?.isPlaying, audioState?.volume, setAudioBlocked]);

  return null; // Invisible component
};
