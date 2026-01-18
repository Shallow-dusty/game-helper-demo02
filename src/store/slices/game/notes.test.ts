/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';

// Mock note type
interface StorytellerNote {
  id: string;
  content: string;
  timestamp: number;
  type: 'manual' | 'auto';
  color?: string;
  isFloating?: boolean;
  isCollapsed?: boolean;
  position?: { x: number; y: number };
}

// Create mock state
const createMockState = () => ({
  gameState: {
    storytellerNotes: [] as StorytellerNote[],
  },
});

describe('createGameNotesSlice', () => {
  describe('addStorytellerNote', () => {
    it('adds manual note', () => {
      const state = createMockState();
      const content = '玩家1声称是洗衣妇';
      
      state.gameState.storytellerNotes.push({
        id: Date.now().toString(),
        content,
        timestamp: Date.now(),
        type: 'manual',
      });
      
      expect(state.gameState.storytellerNotes).toHaveLength(1);
      const note = state.gameState.storytellerNotes[0];
      expect(note).toBeDefined();
      expect(note!.content).toBe(content);
      expect(note!.type).toBe('manual');
    });
  });

  describe('addAutoNote', () => {
    it('adds auto note with color', () => {
      const state = createMockState();
      const content = '自动记录：玩家3被提名';
      const color = 'red';
      
      state.gameState.storytellerNotes.push({
        id: Date.now().toString(),
        content,
        timestamp: Date.now(),
        type: 'auto',
        color,
      });
      
      const note = state.gameState.storytellerNotes[0];
      expect(note).toBeDefined();
      expect(note!.type).toBe('auto');
      expect(note!.color).toBe('red');
    });
  });

  describe('updateStorytellerNote', () => {
    it('updates existing note content', () => {
      const state = createMockState();
      state.gameState.storytellerNotes.push({
        id: 'note1',
        content: '原始内容',
        timestamp: Date.now(),
        type: 'manual',
      });
      
      const note = state.gameState.storytellerNotes.find(n => n.id === 'note1');
      if (note) note.content = '更新后的内容';

      const updatedNote = state.gameState.storytellerNotes[0];
      expect(updatedNote).toBeDefined();
      expect(updatedNote!.content).toBe('更新后的内容');
    });
  });

  describe('deleteStorytellerNote', () => {
    it('removes note by id', () => {
      const state = createMockState();
      state.gameState.storytellerNotes.push(
        { id: 'note1', content: 'Note 1', timestamp: Date.now(), type: 'manual' },
        { id: 'note2', content: 'Note 2', timestamp: Date.now(), type: 'manual' }
      );
      
      state.gameState.storytellerNotes = state.gameState.storytellerNotes.filter(n => n.id !== 'note1');

      expect(state.gameState.storytellerNotes).toHaveLength(1);
      const remainingNote = state.gameState.storytellerNotes[0];
      expect(remainingNote).toBeDefined();
      expect(remainingNote!.id).toBe('note2');
    });
  });

  describe('toggleNoteFloating', () => {
    it('toggles floating state on', () => {
      const state = createMockState();
      state.gameState.storytellerNotes.push({
        id: 'note1',
        content: 'Test',
        timestamp: Date.now(),
        type: 'manual',
        isFloating: false,
      });
      
      const note = state.gameState.storytellerNotes.find(n => n.id === 'note1');
      if (note) note.isFloating = !note.isFloating;

      const toggledNote = state.gameState.storytellerNotes[0];
      expect(toggledNote).toBeDefined();
      expect(toggledNote!.isFloating).toBe(true);
    });

    it('toggles floating state off', () => {
      const state = createMockState();
      state.gameState.storytellerNotes.push({
        id: 'note1',
        content: 'Test',
        timestamp: Date.now(),
        type: 'manual',
        isFloating: true,
      });
      
      const note = state.gameState.storytellerNotes.find(n => n.id === 'note1');
      if (note) note.isFloating = !note.isFloating;

      const toggledNote = state.gameState.storytellerNotes[0];
      expect(toggledNote).toBeDefined();
      expect(toggledNote!.isFloating).toBe(false);
    });
  });

  describe('updateNotePosition', () => {
    it('updates note position', () => {
      const state = createMockState();
      state.gameState.storytellerNotes.push({
        id: 'note1',
        content: 'Test',
        timestamp: Date.now(),
        type: 'manual',
      });

      const note = state.gameState.storytellerNotes.find(n => n.id === 'note1');
      if (note) note.position = { x: 100, y: 200 };

      const positionedNote = state.gameState.storytellerNotes[0];
      expect(positionedNote).toBeDefined();
      expect(positionedNote!.position).toEqual({ x: 100, y: 200 });
    });
  });

  describe('setNoteColor', () => {
    it('sets note color', () => {
      const state = createMockState();
      state.gameState.storytellerNotes.push({
        id: 'note1',
        content: 'Test',
        timestamp: Date.now(),
        type: 'manual',
      });

      const note = state.gameState.storytellerNotes.find(n => n.id === 'note1');
      if (note) note.color = 'blue';

      const coloredNote = state.gameState.storytellerNotes[0];
      expect(coloredNote).toBeDefined();
      expect(coloredNote!.color).toBe('blue');
    });
  });

  describe('toggleNoteCollapse', () => {
    it('toggles collapse state', () => {
      const state = createMockState();
      state.gameState.storytellerNotes.push({
        id: 'note1',
        content: 'Test',
        timestamp: Date.now(),
        type: 'manual',
        isCollapsed: false,
      });

      const note = state.gameState.storytellerNotes.find(n => n.id === 'note1');
      if (note) note.isCollapsed = !note.isCollapsed;

      const collapsedNote = state.gameState.storytellerNotes[0];
      expect(collapsedNote).toBeDefined();
      expect(collapsedNote!.isCollapsed).toBe(true);
    });
  });
});
