/**
 * useSoundEffect Hook Tests
 * 
 * Tests for sound effect management hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FOLEY_SOUNDS, FoleySoundId } from './useSoundEffect';

// Mock Audio
const mockAudioPlay = vi.fn().mockResolvedValue(undefined);
const mockAudioPause = vi.fn();

class MockAudio {
    src = '';
    volume = 1;
    currentTime = 0;
    preload = 'auto';
    play = mockAudioPlay;
    pause = mockAudioPause;
    
    constructor(url?: string) {
        this.src = url || '';
    }
}

global.Audio = MockAudio as any;

describe('useSoundEffect', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
});
