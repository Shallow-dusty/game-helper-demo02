/**
 * PlayerNotebook Tests
 *
 * Tests for the player notebook component with localStorage persistence
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerNotebook } from './PlayerNotebook';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'player.notebook.title': 'Player Notebook',
        'player.notebook.placeholder': 'Record your deductions...',
        'player.notebook.addPlaceholder': 'Add new note... (Enter)',
        'player.notebook.addButton': 'Add',
        'player.notebook.deleteNote': 'Delete Note',
        'player.notebook.emptyState': 'No notes... (Stored locally only)',
      };
      return translations[key] || key;
    },
  }),
}));

describe('PlayerNotebook', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    mockLocalStorage = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockLocalStorage[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockLocalStorage[key] = value;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render empty state initially', () => {
    render(<PlayerNotebook />);

    expect(screen.getByText('📓')).toBeInTheDocument();
    expect(screen.getByText('Player Notebook')).toBeInTheDocument();
    expect(screen.getByText('No notes... (Stored locally only)')).toBeInTheDocument();
  });

  it('should load notes from localStorage on mount', () => {
    const savedNotes = [
      { id: 'note1', content: 'Test note 1', timestamp: Date.now() },
      { id: 'note2', content: 'Test note 2', timestamp: Date.now() },
    ];
    mockLocalStorage.player_notes = JSON.stringify(savedNotes);

    render(<PlayerNotebook />);

    expect(screen.getByDisplayValue('Test note 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test note 2')).toBeInTheDocument();
  });

  it('should handle invalid JSON in localStorage gracefully', () => {
    mockLocalStorage.player_notes = 'invalid json';

    render(<PlayerNotebook />);

    expect(console.error).toHaveBeenCalled();
    expect(screen.getByText('No notes... (Stored locally only)')).toBeInTheDocument();
  });

  it('should add a new note', () => {
    render(<PlayerNotebook />);

    const input = screen.getByPlaceholderText('Add new note... (Enter)');
    const addButton = screen.getByText('Add');

    fireEvent.change(input, { target: { value: 'New test note' } });
    fireEvent.click(addButton);

    expect(screen.getByDisplayValue('New test note')).toBeInTheDocument();
    expect(screen.queryByText('No notes... (Stored locally only)')).not.toBeInTheDocument();
  });

  it('should add note on Enter key press', () => {
    render(<PlayerNotebook />);

    const input = screen.getByPlaceholderText('Add new note... (Enter)');

    fireEvent.change(input, { target: { value: 'Enter key note' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByDisplayValue('Enter key note')).toBeInTheDocument();
  });

  it('should not add empty note', () => {
    render(<PlayerNotebook />);

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    expect(screen.getByText('No notes... (Stored locally only)')).toBeInTheDocument();
  });

  it('should not add whitespace-only note', () => {
    render(<PlayerNotebook />);

    const input = screen.getByPlaceholderText('Add new note... (Enter)');
    const addButton = screen.getByText('Add');

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(addButton);

    expect(screen.getByText('No notes... (Stored locally only)')).toBeInTheDocument();
  });

  it('should delete a note', () => {
    const savedNotes = [
      { id: 'note1', content: 'Note to delete', timestamp: Date.now() },
    ];
    mockLocalStorage.player_notes = JSON.stringify(savedNotes);

    render(<PlayerNotebook />);

    expect(screen.getByDisplayValue('Note to delete')).toBeInTheDocument();

    const deleteButton = screen.getByTitle('Delete Note');
    fireEvent.click(deleteButton);

    expect(screen.queryByDisplayValue('Note to delete')).not.toBeInTheDocument();
    expect(screen.getByText('No notes... (Stored locally only)')).toBeInTheDocument();
  });

  it('should update a note', () => {
    const savedNotes = [
      { id: 'note1', content: 'Original content', timestamp: Date.now() },
    ];
    mockLocalStorage.player_notes = JSON.stringify(savedNotes);

    render(<PlayerNotebook />);

    const textarea = screen.getByDisplayValue('Original content');
    fireEvent.change(textarea, { target: { value: 'Updated content' } });

    expect(screen.getByDisplayValue('Updated content')).toBeInTheDocument();
  });

  it('should save notes to localStorage when notes change', () => {
    render(<PlayerNotebook />);

    const input = screen.getByPlaceholderText('Add new note... (Enter)');
    const addButton = screen.getByText('Add');

    fireEvent.change(input, { target: { value: 'Saved note' } });
    fireEvent.click(addButton);

    expect(mockLocalStorage.player_notes).toBeDefined();
    const savedNotes = JSON.parse(mockLocalStorage.player_notes);
    expect(savedNotes).toHaveLength(1);
    expect(savedNotes[0].content).toBe('Saved note');
  });

  it('should clear input after adding note', () => {
    render(<PlayerNotebook />);

    const input = screen.getByPlaceholderText('Add new note... (Enter)');
    const addButton = screen.getByText('Add');

    fireEvent.change(input, { target: { value: 'Test note' } });
    fireEvent.click(addButton);

    expect(input.value).toBe('');
  });

  it('should disable add button when input is empty', () => {
    render(<PlayerNotebook />);

    const addButton = screen.getByText('Add');
    expect(addButton).toBeDisabled();
  });

  it('should enable add button when input has content', () => {
    render(<PlayerNotebook />);

    const input = screen.getByPlaceholderText('Add new note... (Enter)');
    const addButton = screen.getByText('Add');

    fireEvent.change(input, { target: { value: 'Test' } });
    expect(addButton).not.toBeDisabled();
  });

  it('should display timestamp for notes', () => {
    const timestamp = Date.now();
    const savedNotes = [
      { id: 'note1', content: 'Note with time', timestamp },
    ];
    mockLocalStorage.player_notes = JSON.stringify(savedNotes);

    render(<PlayerNotebook />);

    const timeString = new Date(timestamp).toLocaleTimeString();
    expect(screen.getByText(timeString)).toBeInTheDocument();
  });

  it('should handle non-Enter key press without adding note', () => {
    render(<PlayerNotebook />);

    const input = screen.getByPlaceholderText('Add new note... (Enter)');

    fireEvent.change(input, { target: { value: 'Test note' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    // Note should not be added, input should still have the value
    expect(screen.queryByDisplayValue('Test note')).toBe(input);
    expect(screen.getByText('No notes... (Stored locally only)')).toBeInTheDocument();
  });

  it('should render multiple notes in correct order (newest first)', () => {
    render(<PlayerNotebook />);

    const input = screen.getByPlaceholderText('Add new note... (Enter)');
    const addButton = screen.getByText('Add');

    // Add first note
    fireEvent.change(input, { target: { value: 'First note' } });
    fireEvent.click(addButton);

    // Add second note
    fireEvent.change(input, { target: { value: 'Second note' } });
    fireEvent.click(addButton);

    const textareas = screen.getAllByRole('textbox').filter(
      (el) => el.tagName === 'TEXTAREA'
    );

    // Second note should appear first (newest first)
    expect((textareas[0] as HTMLTextAreaElement).value).toBe('Second note');
    expect((textareas[1] as HTMLTextAreaElement).value).toBe('First note');
  });
});
