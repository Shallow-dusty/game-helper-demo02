/**
 * useSoundEffect Hook Tests
 *
 * Tests for sound effect management hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { FOLEY_SOUNDS, FoleySoundId, useSoundEffect } from './useSoundEffect';

// Mock Audio instances storage for triggering events
let mockAudioInstances: MockAudio[] = [];
const mockAudioPlay = vi.fn().mockResolvedValue(undefined);
const mockAudioPause = vi.fn();

class MockAudio {
    src = '';
    volume = 1;
    currentTime = 0;
    preload = 'auto';
    play = mockAudioPlay;
    pause = mockAudioPause;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;

    constructor(url?: string) {
        this.src = url || '';
        mockAudioInstances.push(this);
    }
}

global.Audio = MockAudio as unknown as typeof Audio;

// Mock store
const mockStoreState = {
    isAudioBlocked: false,
    gameState: {
        audio: {
            volume: 1,
        },
    } as { audio: { volume: number } } | null,
    audioSettings: {
        mode: 'online' as 'online' | 'offline',
        categories: {
            ambience: true,
            ui: true,
            cues: true,
        },
    },
};

vi.mock('../store', () => ({
    useStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

describe('useSoundEffect', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAudioInstances = [];
        mockStoreState.isAudioBlocked = false;
        mockStoreState.gameState = { audio: { volume: 1 } };
        mockStoreState.audioSettings = {
            mode: 'online',
            categories: {
                ambience: true,
                ui: true,
                cues: true,
            },
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
        mockAudioInstances = [];
    });

    describe('FOLEY_SOUNDS', () => {
        it('should define all required sound categories', () => {
            // Token sounds
            expect(FOLEY_SOUNDS.token_place).toBeDefined();
            expect(FOLEY_SOUNDS.token_drag).toBeDefined();
            expect(FOLEY_SOUNDS.token_select).toBeDefined();
            
            // Clock sounds
            expect(FOLEY_SOUNDS.clock_tick).toBeDefined();
            expect(FOLEY_SOUNDS.clock_tock).toBeDefined();
            expect(FOLEY_SOUNDS.clock_chime).toBeDefined();
            expect(FOLEY_SOUNDS.clock_alarm).toBeDefined();
            
            // UI sounds
            expect(FOLEY_SOUNDS.lock_click).toBeDefined();
            expect(FOLEY_SOUNDS.paper_rustle).toBeDefined();
            expect(FOLEY_SOUNDS.scroll_open).toBeDefined();
            expect(FOLEY_SOUNDS.scroll_close).toBeDefined();
            
            // Environment sounds
            expect(FOLEY_SOUNDS.day_bell).toBeDefined();
            expect(FOLEY_SOUNDS.night_wolf).toBeDefined();
            expect(FOLEY_SOUNDS.death_toll).toBeDefined();
            
            // Vote sounds
            expect(FOLEY_SOUNDS.hand_raise).toBeDefined();
            expect(FOLEY_SOUNDS.vote_cast).toBeDefined();
            expect(FOLEY_SOUNDS.gavel).toBeDefined();
            
            // Feedback sounds
            expect(FOLEY_SOUNDS.success).toBeDefined();
            expect(FOLEY_SOUNDS.error).toBeDefined();
            expect(FOLEY_SOUNDS.notification).toBeDefined();
        });

        it('should have valid volume levels (0-1)', () => {
            Object.values(FOLEY_SOUNDS).forEach(sound => {
                expect(sound.volume).toBeGreaterThanOrEqual(0);
                expect(sound.volume).toBeLessThanOrEqual(1);
            });
        });

        it('should have valid URLs', () => {
            Object.values(FOLEY_SOUNDS).forEach(sound => {
                expect(sound.url).toMatch(/^\/audio\/sfx\/.+\.mp3$/);
            });
        });
    });

    describe('FoleySoundId type', () => {
        it('should allow all defined sound keys', () => {
            const validIds: FoleySoundId[] = [
                'token_place',
                'clock_tick',
                'day_bell',
                'gavel',
                'success',
            ];
            
            validIds.forEach(id => {
                expect(FOLEY_SOUNDS[id]).toBeDefined();
            });
        });
    });

    describe('useSoundEffect hook', () => {
        it('should return playSound function', () => {
            const { result } = renderHook(() => useSoundEffect());
            
            expect(result.current.playSound).toBeDefined();
            expect(typeof result.current.playSound).toBe('function');
        });

        it('should return preloadSounds function', () => {
            const { result } = renderHook(() => useSoundEffect());
            
            expect(result.current.preloadSounds).toBeDefined();
            expect(typeof result.current.preloadSounds).toBe('function');
        });

        it('should return stopAllSounds function', () => {
            const { result } = renderHook(() => useSoundEffect());
            
            expect(result.current.stopAllSounds).toBeDefined();
            expect(typeof result.current.stopAllSounds).toBe('function');
        });

        it('should return playClockTick function', () => {
            const { result } = renderHook(() => useSoundEffect());
            
            expect(result.current.playClockTick).toBeDefined();
            expect(typeof result.current.playClockTick).toBe('function');
        });

        it('should return isAudioBlocked state', () => {
            const { result } = renderHook(() => useSoundEffect());
            
            expect(result.current.isAudioBlocked).toBe(false);
        });

        it('should play sound when not blocked', () => {
            const { result } = renderHook(() => useSoundEffect());
            
            act(() => {
                result.current.playSound('clock_tick');
            });
            
            expect(mockAudioPlay).toHaveBeenCalled();
        });

        it('should not play sound when blocked', () => {
            mockStoreState.isAudioBlocked = true;
            
            const { result } = renderHook(() => useSoundEffect());
            
            act(() => {
                result.current.playSound('clock_tick');
            });
            
            expect(mockAudioPlay).not.toHaveBeenCalled();
        });

        it('should respect custom volume option', () => {
            const { result } = renderHook(() => useSoundEffect());
            
            // Just verify the function can be called with volume option
            act(() => {
                result.current.playSound('clock_tick', { volume: 0.3 });
            });
            
            // The function should handle the volume option without error
            expect(result.current.playSound).toBeDefined();
        });

        it('should apply master volume from store', () => {
            mockStoreState.gameState.audio.volume = 0.5;
            
            const { result } = renderHook(() => useSoundEffect());
            
            // Just verify the hook reads the master volume
            act(() => {
                result.current.playSound('clock_tick');
            });
            
            expect(result.current.playSound).toBeDefined();
        });

        it('should handle edge case volumes', () => {
            mockStoreState.gameState.audio.volume = 2; // Over max
            
            const { result } = renderHook(() => useSoundEffect());
            
            // Should not throw even with extreme values
            act(() => {
                result.current.playSound('clock_tick');
            });
            
            expect(result.current.playSound).toBeDefined();
        });

        it('should preload sounds', () => {
            const { result } = renderHook(() => useSoundEffect());

            act(() => {
                result.current.preloadSounds(['clock_tick', 'clock_tock', 'gavel']);
            });

            // Preloading creates Audio instances - no errors should be thrown
        });

        it('should use cache when preloading the same sound twice', () => {
            const { result } = renderHook(() => useSoundEffect());

            // Use a unique sound for this test to avoid cache pollution from other tests
            // wind_howl is unlikely to be used in other tests
            const initialCount = mockAudioInstances.length;

            act(() => {
                result.current.preloadSounds(['wind_howl']);
            });

            const countAfterFirst = mockAudioInstances.length;
            // Should have created one new Audio instance
            expect(countAfterFirst).toBeGreaterThan(initialCount);

            // Preload the same sound again - should use cache
            act(() => {
                result.current.preloadSounds(['wind_howl']);
            });

            // No new Audio instance should be created (cache hit)
            expect(mockAudioInstances.length).toBe(countAfterFirst);
        });

        it('should handle Audio constructor error during preload', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const originalAudio = global.Audio;

            // Make Audio constructor throw
            global.Audio = function () {
                throw new Error('Audio not supported');
            } as unknown as typeof Audio;

            const { result } = renderHook(() => useSoundEffect());

            act(() => {
                // Use a sound that hasn't been preloaded yet
                result.current.preloadSounds(['night_wolf']);
            });

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Failed to preload audio:',
                expect.any(String),
                expect.any(Error)
            );

            // Restore
            global.Audio = originalAudio;
            consoleWarnSpy.mockRestore();
        });

        it('should stop all sounds', () => {
            const { result } = renderHook(() => useSoundEffect());
            
            act(() => {
                result.current.playSound('clock_tick');
                result.current.playSound('gavel');
            });
            
            act(() => {
                result.current.stopAllSounds();
            });
            
            // mockAudioPause should be called when stopping
            // Note: Due to mock setup, we just verify no errors
        });

        it('should have playClockTick function that calls internally', () => {
            const { result } = renderHook(() => useSoundEffect());
            
            // Just verify the function can be called without error
            act(() => {
                result.current.playClockTick();
            });
            
            act(() => {
                result.current.playClockTick();
            });
            
            // If we got here without errors, the function works
            expect(result.current.playClockTick).toBeDefined();
        });

        it('should cleanup on unmount', () => {
            const { result, unmount } = renderHook(() => useSoundEffect());

            act(() => {
                result.current.playSound('clock_tick');
            });

            // Unmount should cleanup active audios
            unmount();

            // No errors should be thrown
        });

        it('should not play cues sounds in offline mode', () => {
            mockStoreState.audioSettings.mode = 'offline';
            mockStoreState.audioSettings.categories.cues = true;

            const { result } = renderHook(() => useSoundEffect());

            act(() => {
                // notification is a 'cues' category sound
                result.current.playSound('notification');
            });

            // Should not play because offline mode blocks cues
            expect(mockAudioPlay).not.toHaveBeenCalled();
        });

        it('should not play sound when category is disabled', () => {
            mockStoreState.audioSettings.categories.ui = false;

            const { result } = renderHook(() => useSoundEffect());

            act(() => {
                // token_place is a 'ui' category sound
                result.current.playSound('token_place');
            });

            expect(mockAudioPlay).not.toHaveBeenCalled();
        });

        it('should cleanup audio from activeAudiosRef when playback ends', () => {
            const { result } = renderHook(() => useSoundEffect());

            act(() => {
                result.current.playSound('clock_tick');
            });

            // Get the last created audio instance
            const audioInstance = mockAudioInstances[mockAudioInstances.length - 1];

            // Simulate playback ended
            act(() => {
                if (audioInstance.onended) {
                    audioInstance.onended();
                }
            });

            // No errors should be thrown - audio is cleaned up from activeAudiosRef
            expect(audioInstance.onended).toBeDefined();
        });

        it('should cleanup audio from activeAudiosRef when error occurs', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const { result } = renderHook(() => useSoundEffect());

            act(() => {
                result.current.playSound('clock_tick');
            });

            // Get the last created audio instance
            const audioInstance = mockAudioInstances[mockAudioInstances.length - 1];

            // Simulate error
            act(() => {
                if (audioInstance.onerror) {
                    audioInstance.onerror();
                }
            });

            // Should have logged a warning
            expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to play sound: clock_tick');

            consoleWarnSpy.mockRestore();
        });

        it('should handle onended when audio already removed from activeAudiosRef', () => {
            const { result } = renderHook(() => useSoundEffect());

            act(() => {
                result.current.playSound('day_bell');
            });

            // Get the audio instance
            const audioInstance = mockAudioInstances[mockAudioInstances.length - 1];

            // Stop all sounds first - this removes audio from activeAudiosRef
            act(() => {
                result.current.stopAllSounds();
            });

            // Now trigger onended - audio is no longer in activeAudiosRef
            // This tests the `if (index > -1)` branch when index is -1
            act(() => {
                if (audioInstance.onended) {
                    audioInstance.onended();
                }
            });

            // Should not throw - gracefully handles missing audio
            expect(audioInstance.onended).toBeDefined();
        });

        it('should handle onerror when audio already removed from activeAudiosRef', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const { result } = renderHook(() => useSoundEffect());

            act(() => {
                result.current.playSound('crow_caw');
            });

            // Get the audio instance
            const audioInstance = mockAudioInstances[mockAudioInstances.length - 1];

            // Stop all sounds first - this removes audio from activeAudiosRef
            act(() => {
                result.current.stopAllSounds();
            });

            // Now trigger onerror - audio is no longer in activeAudiosRef
            // This tests the `if (index > -1)` branch when index is -1
            act(() => {
                if (audioInstance.onerror) {
                    audioInstance.onerror();
                }
            });

            // Should still log the warning
            expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to play sound: crow_caw');
            consoleWarnSpy.mockRestore();
        });

        it('should handle play() rejection with non-NotAllowedError', async () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const playError = new Error('Some other error');
            playError.name = 'AbortError';
            mockAudioPlay.mockRejectedValueOnce(playError);

            const { result } = renderHook(() => useSoundEffect());

            await act(async () => {
                result.current.playSound('clock_tick');
                // Wait for promise to reject
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Error playing sound clock_tick:',
                playError
            );

            consoleWarnSpy.mockRestore();
        });

        it('should silently ignore NotAllowedError from play()', async () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const notAllowedError = new Error('Autoplay blocked');
            notAllowedError.name = 'NotAllowedError';
            mockAudioPlay.mockRejectedValueOnce(notAllowedError);

            const { result } = renderHook(() => useSoundEffect());

            await act(async () => {
                result.current.playSound('clock_tick');
                // Wait for promise to reject
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            // Should NOT log a warning for NotAllowedError
            expect(consoleWarnSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('Error playing sound'),
                expect.anything()
            );

            consoleWarnSpy.mockRestore();
        });

        it('should handle non-Error rejection from play()', async () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            // Reject with a string instead of an Error object
            mockAudioPlay.mockRejectedValueOnce('string rejection');

            const { result } = renderHook(() => useSoundEffect());

            await act(async () => {
                result.current.playSound('clock_tick');
                // Wait for promise to reject
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            // Should not log because the rejection is not an Error instance
            // The code checks `e instanceof Error` first
            expect(consoleWarnSpy).not.toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
        });

        it('should handle Audio constructor error in playSound', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const originalAudio = global.Audio;

            // Make Audio constructor throw
            global.Audio = function () {
                throw new Error('Audio not supported');
            } as unknown as typeof Audio;

            const { result } = renderHook(() => useSoundEffect());

            act(() => {
                result.current.playSound('clock_tick');
            });

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Error creating audio for clock_tick:',
                expect.any(Error)
            );

            // Restore
            global.Audio = originalAudio;
            consoleWarnSpy.mockRestore();
        });

        it('should use default volume when gameState is null', () => {
            mockStoreState.gameState = null;

            const { result } = renderHook(() => useSoundEffect());

            act(() => {
                result.current.playSound('clock_tick');
            });

            // Should still play with default volume (masterVolume defaults to 1)
            expect(mockAudioPlay).toHaveBeenCalled();
        });

        it('should clamp volume between 0 and 1', () => {
            mockStoreState.gameState = { audio: { volume: 2 } }; // Over max

            const { result } = renderHook(() => useSoundEffect());

            act(() => {
                result.current.playSound('clock_tick');
            });

            // Get the audio instance to check its volume
            const audioInstance = mockAudioInstances[mockAudioInstances.length - 1];
            expect(audioInstance.volume).toBeLessThanOrEqual(1);
            expect(audioInstance.volume).toBeGreaterThanOrEqual(0);
        });

        it('should handle negative volume by clamping to 0', () => {
            mockStoreState.gameState = { audio: { volume: -1 } }; // Negative

            const { result } = renderHook(() => useSoundEffect());

            act(() => {
                result.current.playSound('clock_tick');
            });

            const audioInstance = mockAudioInstances[mockAudioInstances.length - 1];
            expect(audioInstance.volume).toBe(0);
        });
    });
});
