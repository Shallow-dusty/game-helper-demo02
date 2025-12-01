import { StoreSlice, GameSlice } from '../../types';

export const createGameAudioSlice: StoreSlice<Pick<GameSlice, 'setAudioTrack' | 'toggleAudioPlay' | 'setAudioVolume' | 'setAudioBlocked' | 'toggleVibration'>> = (set, get) => ({
    setAudioTrack: (trackId) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.audio.trackId = trackId;
                state.gameState.audio.isPlaying = true;
            }
        });
        get().sync();
    },

    toggleAudioPlay: () => {
        set((state) => {
            if (state.gameState) {
                state.gameState.audio.isPlaying = !state.gameState.audio.isPlaying;
            }
        });
        get().sync();
    },

    setAudioVolume: (vol) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.audio.volume = vol;
            }
        });
        get().sync();
    },

    setAudioBlocked: (blocked) => {
        set({ isAudioBlocked: blocked });
    },

    toggleVibration: () => {
        set((state) => {
            if (state.gameState) {
                state.gameState.vibrationEnabled = !state.gameState.vibrationEnabled;
            }
        });
        get().sync();
    }
});
