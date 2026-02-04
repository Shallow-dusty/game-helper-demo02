/**
 * Game Notes Slice Tests
 *
 * 笔记功能状态测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameNotesSlice } from '../../../../src/store/slices/game/notes';
import type { GameState, StorytellerNote } from '../../../../src/types';

// Define a minimal mock state type that matches what createGameNotesSlice expects
interface MockState {
  gameState: Partial<GameState> | null;
  sync: () => void;
  user?: { id: string; name: string; isStoryteller: boolean };
}

// Mock store state
const createMockStore = () => {
  const state: MockState = {
    gameState: {
      storytellerNotes: [] as StorytellerNote[]
    },
    sync: vi.fn(),
    user: { id: 'storyteller', name: 'Storyteller', isStoryteller: true }
  };

  const set = vi.fn((fn: (state: MockState) => void) => {
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
    // Cast to expected types for the slice creator
     
    notesSlice = createGameNotesSlice(
      mockStore.set as any,
      mockStore.get as any,
      {} as any
    );
  });

  describe('addStorytellerNote', () => {
    it('should add a manual note', () => {
      notesSlice.addStorytellerNote('This is a test note');

      const notes = mockStore.state.gameState?.storytellerNotes;
      expect(notes).toBeDefined();
      expect(notes!.length).toBe(1);
      const note = notes![0];
      expect(note).toBeDefined();
      expect(note!.content).toBe('This is a test note');
      expect(note!.type).toBe('manual');
      expect(note!.id).toBeDefined();
      expect(note!.timestamp).toBeDefined();
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

      const notes = mockStore.state.gameState?.storytellerNotes;
      expect(notes).toBeDefined();
      expect(notes!.length).toBe(1);
      const note = notes![0];
      expect(note).toBeDefined();
      expect(note!.content).toBe('Auto generated note');
      expect(note!.type).toBe('auto');
      expect(note!.color).toBe('blue');
    });

    it('should add auto note without color', () => {
      notesSlice.addAutoNote('Auto note');

      const notes = mockStore.state.gameState?.storytellerNotes;
      expect(notes).toBeDefined();
      const note = notes![0];
      expect(note).toBeDefined();
      expect(note!.type).toBe('auto');
      expect(note!.color).toBeUndefined();
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

      const notes = mockStore.state.gameState?.storytellerNotes;
      expect(notes).toBeDefined();
      const note = notes![0];
      expect(note).toBeDefined();
      expect(note!.content).toBe('Updated content');
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

      const notes = mockStore.state.gameState?.storytellerNotes;
      expect(notes).toBeDefined();
      expect(notes!.length).toBe(1);
      const remainingNote = notes![0];
      expect(remainingNote).toBeDefined();
      expect(remainingNote!.id).toBe('note2');
    });

    it('should not crash if note not found', () => {
      mockStore.state.gameState!.storytellerNotes = [];

      notesSlice.deleteStorytellerNote('nonexistent');

      const notes = mockStore.state.gameState?.storytellerNotes;
      expect(notes).toBeDefined();
      expect(notes!.length).toBe(0);
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

      const notes = mockStore.state.gameState?.storytellerNotes;
      expect(notes).toBeDefined();
      const note = notes![0];
      expect(note).toBeDefined();
      expect(note!.isFloating).toBe(true);
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

      const notes = mockStore.state.gameState?.storytellerNotes;
      expect(notes).toBeDefined();
      const note = notes![0];
      expect(note).toBeDefined();
      expect(note!.isFloating).toBe(false);
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

      const notes = mockStore.state.gameState?.storytellerNotes;
      expect(notes).toBeDefined();
      const note = notes![0];
      expect(note).toBeDefined();
      expect(note!.position).toEqual({ x: 100, y: 200 });
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

      const notes = mockStore.state.gameState?.storytellerNotes;
      expect(notes).toBeDefined();
      const note = notes![0];
      expect(note).toBeDefined();
      expect(note!.color).toBe('red');
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

      const notes = mockStore.state.gameState?.storytellerNotes;
      expect(notes).toBeDefined();
      const note = notes![0];
      expect(note).toBeDefined();
      expect(note!.isCollapsed).toBe(true);
    });
  });

  describe('sendInfoCard', () => {
    it('should be a placeholder function', () => {
      // sendInfoCard is a placeholder, should not throw
      expect(() => notesSlice.sendInfoCard({} as never, 'user1')).not.toThrow();
    });
  });
});
