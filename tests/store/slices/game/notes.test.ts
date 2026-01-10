/**
 * Game Notes Slice Tests
 *
 * 笔记功能状态测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameNotesSlice } from '../../../../src/store/slices/game/notes';
import type { GameState, StorytellerNote } from '../../../../src/types';

// Mock store state
const createMockStore = () => {
  const state: {
    gameState: Partial<GameState> | null;
    sync: () => void;
  } = {
    gameState: {
      storytellerNotes: [] as StorytellerNote[]
    } as Partial<GameState>,
    sync: vi.fn()
  };

  const set = vi.fn((fn: (state: typeof state) => void) => {
    fn(state);
  });

  const get = vi.fn(() => state);

  return { state, set, get };
};

describe('createGameNotesSlice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let notesSlice: ReturnType<typeof createGameNotesSlice>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    notesSlice = createGameNotesSlice(mockStore.set, mockStore.get, {});
  });

  describe('addStorytellerNote', () => {
    it('should add a manual note', () => {
      notesSlice.addStorytellerNote('This is a test note');

      expect(mockStore.state.gameState?.storytellerNotes?.length).toBe(1);
      const note = mockStore.state.gameState?.storytellerNotes?.[0];
      expect(note?.content).toBe('This is a test note');
      expect(note?.type).toBe('manual');
      expect(note?.id).toBeDefined();
      expect(note?.timestamp).toBeDefined();
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not add note if no gameState', () => {
      mockStore.state.gameState = null;

      notesSlice.addStorytellerNote('Test');

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });

  describe('addAutoNote', () => {
    it('should add an auto note with color', () => {
      notesSlice.addAutoNote('Auto generated note', 'blue');

      expect(mockStore.state.gameState?.storytellerNotes?.length).toBe(1);
      const note = mockStore.state.gameState?.storytellerNotes?.[0];
      expect(note?.content).toBe('Auto generated note');
      expect(note?.type).toBe('auto');
      expect(note?.color).toBe('blue');
    });

    it('should add auto note without color', () => {
      notesSlice.addAutoNote('Auto note');

      const note = mockStore.state.gameState?.storytellerNotes?.[0];
      expect(note?.type).toBe('auto');
      expect(note?.color).toBeUndefined();
    });
  });

  describe('updateStorytellerNote', () => {
    it('should update existing note content', () => {
      mockStore.state.gameState!.storytellerNotes = [{
        id: 'note1',
        content: 'Original content',
        timestamp: Date.now(),
        type: 'manual'
      }];

      notesSlice.updateStorytellerNote('note1', 'Updated content');

      expect(mockStore.state.gameState?.storytellerNotes?.[0]?.content).toBe('Updated content');
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not crash if note not found', () => {
      mockStore.state.gameState!.storytellerNotes = [];

      notesSlice.updateStorytellerNote('nonexistent', 'Test');

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });

  describe('deleteStorytellerNote', () => {
    it('should delete note by id', () => {
      mockStore.state.gameState!.storytellerNotes = [
        { id: 'note1', content: 'Note 1', timestamp: Date.now(), type: 'manual' },
        { id: 'note2', content: 'Note 2', timestamp: Date.now(), type: 'manual' }
      ];

      notesSlice.deleteStorytellerNote('note1');

      expect(mockStore.state.gameState?.storytellerNotes?.length).toBe(1);
      expect(mockStore.state.gameState?.storytellerNotes?.[0]?.id).toBe('note2');
    });

    it('should not crash if note not found', () => {
      mockStore.state.gameState!.storytellerNotes = [];

      notesSlice.deleteStorytellerNote('nonexistent');

      expect(mockStore.state.gameState?.storytellerNotes?.length).toBe(0);
    });
  });

  describe('toggleNoteFloating', () => {
    it('should toggle note floating state', () => {
      mockStore.state.gameState!.storytellerNotes = [{
        id: 'note1',
        content: 'Test',
        timestamp: Date.now(),
        type: 'manual',
        isFloating: false
      }];

      notesSlice.toggleNoteFloating('note1');

      expect(mockStore.state.gameState?.storytellerNotes?.[0]?.isFloating).toBe(true);
    });

    it('should toggle back to false', () => {
      mockStore.state.gameState!.storytellerNotes = [{
        id: 'note1',
        content: 'Test',
        timestamp: Date.now(),
        type: 'manual',
        isFloating: true
      }];

      notesSlice.toggleNoteFloating('note1');

      expect(mockStore.state.gameState?.storytellerNotes?.[0]?.isFloating).toBe(false);
    });
  });

  describe('updateNotePosition', () => {
    it('should update note position', () => {
      mockStore.state.gameState!.storytellerNotes = [{
        id: 'note1',
        content: 'Test',
        timestamp: Date.now(),
        type: 'manual'
      }];

      notesSlice.updateNotePosition('note1', 100, 200);

      expect(mockStore.state.gameState?.storytellerNotes?.[0]?.position).toEqual({ x: 100, y: 200 });
    });

    it('should not crash if note not found', () => {
      mockStore.state.gameState!.storytellerNotes = [];

      notesSlice.updateNotePosition('nonexistent', 0, 0);

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });

  describe('setNoteColor', () => {
    it('should set note color', () => {
      mockStore.state.gameState!.storytellerNotes = [{
        id: 'note1',
        content: 'Test',
        timestamp: Date.now(),
        type: 'manual'
      }];

      notesSlice.setNoteColor('note1', 'red');

      expect(mockStore.state.gameState?.storytellerNotes?.[0]?.color).toBe('red');
    });
  });

  describe('toggleNoteCollapse', () => {
    it('should toggle note collapse state', () => {
      mockStore.state.gameState!.storytellerNotes = [{
        id: 'note1',
        content: 'Test',
        timestamp: Date.now(),
        type: 'manual',
        isCollapsed: false
      }];

      notesSlice.toggleNoteCollapse('note1');

      expect(mockStore.state.gameState?.storytellerNotes?.[0]?.isCollapsed).toBe(true);
    });
  });

  describe('sendInfoCard', () => {
    it('should be a placeholder function', () => {
      // sendInfoCard is a placeholder, should not throw
      expect(() => notesSlice.sendInfoCard({} as never, 'user1')).not.toThrow();
    });
  });
});
