/**
 * StorytellerNotebook Tests
 *
 * Tests for the storyteller notebook component with floating notes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StorytellerNotebook } from './StorytellerNotebook';

// Mock store
const mockAddNote = vi.fn();
const mockUpdateNote = vi.fn();
const mockDeleteNote = vi.fn();
const mockToggleNoteFloating = vi.fn();
const mockUpdateNotePosition = vi.fn();
const mockSetNoteColor = vi.fn();
const mockToggleNoteCollapse = vi.fn();

const mockNotes = [
  {
    id: 'note1',
    content: 'Test note 1',
    type: 'manual',
    timestamp: Date.now(),
    isFloating: false,
    color: 'gray',
    isCollapsed: false,
    x: 100,
    y: 100,
  },
  {
    id: 'note2',
    content: 'Auto note',
    type: 'auto',
    timestamp: Date.now(),
    isFloating: false,
    color: 'blue',
    isCollapsed: false,
    x: 200,
    y: 200,
  },
];

vi.mock('../../store', () => ({
  useStore: vi.fn((selector) => {
    const state = {
      gameState: {
        storytellerNotes: mockNotes,
      },
      addStorytellerNote: mockAddNote,
      updateStorytellerNote: mockUpdateNote,
      deleteStorytellerNote: mockDeleteNote,
      toggleNoteFloating: mockToggleNoteFloating,
      updateNotePosition: mockUpdateNotePosition,
      setNoteColor: mockSetNoteColor,
      toggleNoteCollapse: mockToggleNoteCollapse,
    };
    return selector(state);
  }),
}));

// Mock FloatingNote component
vi.mock('./FloatingNote', () => ({
  FloatingNote: ({ note, onClose }: any) => (
    <div data-testid={`floating-note-${note.id}`}>
      Floating: {note.content}
      <button onClick={() => onClose(note.id)}>Close</button>
    </div>
  ),
}));

// Mock createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (children: any) => children,
  };
});

describe('StorytellerNotebook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the notebook title', () => {
    render(<StorytellerNotebook />);

    expect(screen.getByText(/说书人笔记/)).toBeInTheDocument();
    expect(screen.getByText('📓')).toBeInTheDocument();
  });

  it('should render notes from store', () => {
    render(<StorytellerNotebook />);

    expect(screen.getByDisplayValue('Test note 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Auto note')).toBeInTheDocument();
  });

  it('should display NOTE label for manual notes', () => {
    render(<StorytellerNotebook />);

    expect(screen.getByText('NOTE')).toBeInTheDocument();
  });

  it('should display SYSTEM LOG label for auto notes', () => {
    render(<StorytellerNotebook />);

    expect(screen.getByText('SYSTEM LOG')).toBeInTheDocument();
  });

  it('should render input field for new note', () => {
    render(<StorytellerNotebook />);

    expect(screen.getByPlaceholderText(/添加新笔记/)).toBeInTheDocument();
  });

  it('should add a new note when add button is clicked', () => {
    render(<StorytellerNotebook />);

    const input = screen.getByPlaceholderText(/添加新笔记/);
    const addButton = screen.getByText('添加');

    fireEvent.change(input, { target: { value: 'New test note' } });
    fireEvent.click(addButton);

    expect(mockAddNote).toHaveBeenCalledWith('New test note');
  });

  it('should add note on Enter key press', () => {
    render(<StorytellerNotebook />);

    const input = screen.getByPlaceholderText(/添加新笔记/);

    fireEvent.change(input, { target: { value: 'Enter key note' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockAddNote).toHaveBeenCalledWith('Enter key note');
  });

  it('should not add empty note', () => {
    render(<StorytellerNotebook />);

    const addButton = screen.getByText('添加');
    fireEvent.click(addButton);

    expect(mockAddNote).not.toHaveBeenCalled();
  });

  it('should not add whitespace-only note', () => {
    render(<StorytellerNotebook />);

    const input = screen.getByPlaceholderText(/添加新笔记/);
    const addButton = screen.getByText('添加');

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(addButton);

    expect(mockAddNote).not.toHaveBeenCalled();
  });

  it('should clear input after adding note', () => {
    render(<StorytellerNotebook />);

    const input = screen.getByPlaceholderText(/添加新笔记/);
    const addButton = screen.getByText('添加');

    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(addButton);

    expect(input.value).toBe('');
  });

  it('should update note content on textarea change', () => {
    render(<StorytellerNotebook />);

    const textarea = screen.getByDisplayValue('Test note 1');
    fireEvent.change(textarea, { target: { value: 'Updated content' } });

    expect(mockUpdateNote).toHaveBeenCalledWith('note1', 'Updated content');
  });

  it('should delete note when delete button is clicked', () => {
    render(<StorytellerNotebook />);

    const deleteButtons = screen.getAllByTitle('删除');
    fireEvent.click(deleteButtons[0]);

    expect(mockDeleteNote).toHaveBeenCalledWith('note1');
  });

  it('should toggle floating when pin button is clicked', () => {
    render(<StorytellerNotebook />);

    const pinButtons = screen.getAllByTitle(/悬浮笔记|收回笔记/);
    fireEvent.click(pinButtons[0]);

    expect(mockToggleNoteFloating).toHaveBeenCalledWith('note1');
  });

  it('should display timestamp for notes', () => {
    render(<StorytellerNotebook />);

    // Check that some time string is present
    const timeElements = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('should render color picker buttons', () => {
    render(<StorytellerNotebook />);

    // Each note should have color picker buttons
    // gray, red, yellow, green, blue, purple - 6 colors × 2 notes = 12 buttons
    const colorButtons = document.querySelectorAll('[class*="rounded-full"]');
    expect(colorButtons.length).toBeGreaterThanOrEqual(12);
  });

  it('should set note color when color button is clicked', () => {
    render(<StorytellerNotebook />);

    // Find color buttons and click one
    const colorButtons = document.querySelectorAll('[class*="rounded-full"]');
    fireEvent.click(colorButtons[0]);

    expect(mockSetNoteColor).toHaveBeenCalled();
  });

  it('should disable add button when input is empty', () => {
    render(<StorytellerNotebook />);

    const addButton = screen.getByText('添加');
    expect(addButton).toBeDisabled();
  });

  it('should enable add button when input has content', () => {
    render(<StorytellerNotebook />);

    const input = screen.getByPlaceholderText(/添加新笔记/);
    const addButton = screen.getByText('添加');

    fireEvent.change(input, { target: { value: 'Test' } });
    expect(addButton).not.toBeDisabled();
  });
});

// Note: Empty state and floating notes are difficult to test with the current mock setup
// as we cannot easily re-mock useStore after initial setup. These tests would need
// a different approach (e.g., using a mock store provider).
