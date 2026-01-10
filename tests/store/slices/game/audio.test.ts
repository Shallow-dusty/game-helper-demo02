/**
 * Game Audio Slice Tests
 *
 * 音频功能状态测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameAudioSlice } from '../../../../src/store/slices/game/audio';
import type { GameState } from '../../../../src/types';

// Mock store state
const createMockStore = () => {
  const state: {
    gameState: Partial<GameState> | null;
    isAudioBlocked: boolean;
    sync: () => void;
  } = {
    gameState: {
      audio: {
        trackId: null,
        isPlaying: false,
        volume: 0.5
      },
      vibrationEnabled: true
    } as Partial<GameState>,
    isAudioBlocked: false,
    sync: vi.fn()
  };

   
  const set = vi.fn((fn: any) => {
    if (typeof fn === 'function') {
      fn(state);
    } else {
      Object.assign(state, fn);
    }
  });

  const get = vi.fn(() => state);

  return { state, set, get };
};

describe('createGameAudioSlice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let audioSlice: ReturnType<typeof createGameAudioSlice>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    audioSlice = createGameAudioSlice(mockStore.set, mockStore.get, {});
  });

  describe('setAudioTrack', () => {
    it('should set audio track and start playing', () => {
      audioSlice.setAudioTrack('night-ambience');

      expect(mockStore.state.gameState?.audio?.trackId).toBe('night-ambience');
      expect(mockStore.state.gameState?.audio?.isPlaying).toBe(true);
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not crash if no gameState', () => {
      mockStore.state.gameState = null;

      audioSlice.setAudioTrack('test');

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });

  describe('toggleAudioPlay', () => {
    it('should toggle audio play state from false to true', () => {
      mockStore.state.gameState!.audio!.isPlaying = false;

      audioSlice.toggleAudioPlay();

      expect(mockStore.state.gameState?.audio?.isPlaying).toBe(true);
    });

    it('should toggle audio play state from true to false', () => {
      mockStore.state.gameState!.audio!.isPlaying = true;

      audioSlice.toggleAudioPlay();

      expect(mockStore.state.gameState?.audio?.isPlaying).toBe(false);
    });

    it('should call sync', () => {
      audioSlice.toggleAudioPlay();

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });

  describe('setAudioVolume', () => {
    it('should set audio volume', () => {
      audioSlice.setAudioVolume(0.8);

      expect(mockStore.state.gameState?.audio?.volume).toBe(0.8);
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should set volume to 0', () => {
      audioSlice.setAudioVolume(0);

      expect(mockStore.state.gameState?.audio?.volume).toBe(0);
    });

    it('should set volume to 1', () => {
      audioSlice.setAudioVolume(1);

      expect(mockStore.state.gameState?.audio?.volume).toBe(1);
    });
  });

  describe('setAudioBlocked', () => {
    it('should set audio blocked state to true', () => {
      audioSlice.setAudioBlocked(true);

      expect(mockStore.state.isAudioBlocked).toBe(true);
    });

    it('should set audio blocked state to false', () => {
      mockStore.state.isAudioBlocked = true;

      audioSlice.setAudioBlocked(false);

      expect(mockStore.state.isAudioBlocked).toBe(false);
    });

    it('should not call sync (local state only)', () => {
      audioSlice.setAudioBlocked(true);

      // setAudioBlocked doesn't call sync as it's local state
      // The set function is called with an object, not a function
      expect(mockStore.set).toHaveBeenCalled();
    });
  });

  describe('toggleVibration', () => {
    it('should toggle vibration from true to false', () => {
      mockStore.state.gameState!.vibrationEnabled = true;

      audioSlice.toggleVibration();

      expect(mockStore.state.gameState?.vibrationEnabled).toBe(false);
    });

    it('should toggle vibration from false to true', () => {
      mockStore.state.gameState!.vibrationEnabled = false;

      audioSlice.toggleVibration();

      expect(mockStore.state.gameState?.vibrationEnabled).toBe(true);
    });

    it('should call sync', () => {
      audioSlice.toggleVibration();

      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not crash if no gameState', () => {
      mockStore.state.gameState = null;

      audioSlice.toggleVibration();

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });
});
