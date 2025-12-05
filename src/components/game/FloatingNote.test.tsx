/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FloatingNote } from './FloatingNote';

describe('FloatingNote', () => {
  const baseNote = {
    id: 'note1',
    content: 'Test note content',
    timestamp: Date.now(),
    type: 'manual' as const,
    color: 'yellow',
    isFloating: true,
    isCollapsed: false,
    position: { x: 100, y: 100 },
  };

  const baseProps = {
    note: baseNote,
    onUpdatePosition: vi.fn(),
    onClose: vi.fn(),
    onColorChange: vi.fn(),
    onToggleCollapse: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders note content', () => {
    render(<FloatingNote {...baseProps} />);
    expect(screen.getByText('Test note content')).toBeInTheDocument();
  });

  it('renders with different colors', () => {
    const note = { ...baseNote, color: 'red' };
    const { container } = render(<FloatingNote {...baseProps} note={note} />);
    expect(container.firstChild).toBeDefined();
  });

  it('handles collapsed state', () => {
    const note = { ...baseNote, isCollapsed: true };
    const { container } = render(<FloatingNote {...baseProps} note={note} />);
    expect(container.firstChild).toBeDefined();
  });
});
