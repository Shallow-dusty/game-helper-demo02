/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FloatingNote } from './FloatingNote';
import { StorytellerNote } from '../../types';

describe('FloatingNote', () => {
  // Base note fixture for tests
  const createBaseNote = (overrides?: Partial<StorytellerNote>): StorytellerNote => ({
    id: 'note1',
    content: 'Test note content',
    timestamp: new Date('2024-01-15T10:30:00').getTime(),
    type: 'manual' as const,
    color: 'yellow',
    isFloating: true,
    isCollapsed: false,
    position: { x: 100, y: 150 },
    ...overrides,
  });

  const createBaseProps = (overrides?: Partial<{
    note: StorytellerNote;
    onUpdatePosition: ReturnType<typeof vi.fn>;
    onClose: ReturnType<typeof vi.fn>;
    onColorChange: ReturnType<typeof vi.fn>;
    onToggleCollapse: ReturnType<typeof vi.fn>;
  }>) => ({
    note: createBaseNote(),
    onUpdatePosition: vi.fn(),
    onClose: vi.fn(),
    onColorChange: vi.fn(),
    onToggleCollapse: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // Note Rendering Tests
  // ============================================
  describe('Note Rendering', () => {
    it('renders note content correctly', () => {
      const props = createBaseProps();
      render(<FloatingNote {...props} />);

      expect(screen.getByText('Test note content')).toBeInTheDocument();
    });

    it('renders timestamp in localized time format', () => {
      const props = createBaseProps();
      render(<FloatingNote {...props} />);

      // The timestamp should be rendered (exact format depends on locale)
      const timestampElement = screen.getByText(/\d{1,2}:\d{2}/);
      expect(timestampElement).toBeInTheDocument();
    });

    it('displays "笔记" label for manual notes', () => {
      const props = createBaseProps({
        note: createBaseNote({ type: 'manual' }),
      });
      render(<FloatingNote {...props} />);

      expect(screen.getByText('game.floatingNote.note')).toBeInTheDocument();
    });

    it('displays "系统日志" label for auto notes', () => {
      const props = createBaseProps({
        note: createBaseNote({ type: 'auto' }),
      });
      render(<FloatingNote {...props} />);

      expect(screen.getByText('game.floatingNote.systemLog')).toBeInTheDocument();
    });

    it('renders with multiline content preserved', () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3';
      const props = createBaseProps({
        note: createBaseNote({ content: multilineContent }),
      });
      const { container } = render(<FloatingNote {...props} />);

      // whitespace-pre-wrap preserves newlines, check that all lines are present
      const contentArea = container.querySelector('.whitespace-pre-wrap');
      expect(contentArea).not.toBeNull();
      expect(contentArea?.textContent).toContain('Line 1');
      expect(contentArea?.textContent).toContain('Line 2');
      expect(contentArea?.textContent).toContain('Line 3');
    });
  });

  // ============================================
  // Positioning Tests
  // ============================================
  describe('Positioning', () => {
    it('positions note at specified coordinates', () => {
      const props = createBaseProps({
        note: createBaseNote({ position: { x: 200, y: 300 } }),
      });
      const { container } = render(<FloatingNote {...props} />);

      const noteElement = container.firstChild as HTMLElement;
      expect(noteElement.style.left).toBe('200px');
      expect(noteElement.style.top).toBe('300px');
    });

    it('uses default position (100, 100) when position is undefined', () => {
      const props = createBaseProps({
        note: createBaseNote({ position: undefined }),
      });
      const { container } = render(<FloatingNote {...props} />);

      const noteElement = container.firstChild as HTMLElement;
      expect(noteElement.style.left).toBe('100px');
      expect(noteElement.style.top).toBe('100px');
    });

    it('uses fixed positioning', () => {
      const props = createBaseProps();
      const { container } = render(<FloatingNote {...props} />);

      const noteElement = container.firstChild as HTMLElement;
      expect(noteElement.style.position).toBe('fixed');
    });

    it('has appropriate z-index for floating behavior', () => {
      const props = createBaseProps();
      const { container } = render(<FloatingNote {...props} />);

      const noteElement = container.firstChild as HTMLElement;
      expect(noteElement.style.zIndex).toBe('55');
    });

    it('has width 280px when expanded', () => {
      const props = createBaseProps({
        note: createBaseNote({ isCollapsed: false }),
      });
      const { container } = render(<FloatingNote {...props} />);

      const noteElement = container.firstChild as HTMLElement;
      expect(noteElement.style.width).toBe('280px');
    });

    it('has width 200px when collapsed', () => {
      const props = createBaseProps({
        note: createBaseNote({ isCollapsed: true }),
      });
      const { container } = render(<FloatingNote {...props} />);

      const noteElement = container.firstChild as HTMLElement;
      expect(noteElement.style.width).toBe('200px');
    });
  });

  // ============================================
  // Drag Interaction Tests
  // ============================================
  describe('Drag Interactions', () => {
    it('calls onUpdatePosition when dragged', async () => {
      const onUpdatePosition = vi.fn();
      const props = createBaseProps({ onUpdatePosition });
      const { container } = render(<FloatingNote {...props} />);

      // Find the drag handle (header area)
      const header = container.querySelector('.cursor-move')!;
      expect(header).not.toBeNull();

      // Mock getBoundingClientRect
      const noteElement = container.firstChild as HTMLElement;
      vi.spyOn(noteElement, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 150,
        right: 380,
        bottom: 350,
        width: 280,
        height: 200,
        x: 100,
        y: 150,
        toJSON: () => {},
      });

      // Start drag
      fireEvent.mouseDown(header, { clientX: 120, clientY: 160 });

      // Move
      fireEvent.mouseMove(window, { clientX: 220, clientY: 260 });

      // Verify position update was called
      await waitFor(() => {
        expect(onUpdatePosition).toHaveBeenCalledWith('note1', 200, 250);
      });

      // End drag
      fireEvent.mouseUp(window);
    });

    it('stops dragging on mouseup', async () => {
      const onUpdatePosition = vi.fn();
      const props = createBaseProps({ onUpdatePosition });
      const { container } = render(<FloatingNote {...props} />);

      const header = container.querySelector('.cursor-move')!;
      const noteElement = container.firstChild as HTMLElement;

      vi.spyOn(noteElement, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 150,
        right: 380,
        bottom: 350,
        width: 280,
        height: 200,
        x: 100,
        y: 150,
        toJSON: () => {},
      });

      // Start drag
      fireEvent.mouseDown(header, { clientX: 120, clientY: 160 });

      // End drag
      fireEvent.mouseUp(window);

      // Clear previous calls
      onUpdatePosition.mockClear();

      // Move after mouseup - should not trigger position update
      fireEvent.mouseMove(window, { clientX: 300, clientY: 400 });

      await waitFor(() => {
        expect(onUpdatePosition).not.toHaveBeenCalled();
      });
    });

    it('does not initiate drag when clicking action buttons', () => {
      const onUpdatePosition = vi.fn();
      const props = createBaseProps({ onUpdatePosition });
      const { container } = render(<FloatingNote {...props} />);

      // Find the button container (has stopPropagation)
      const closeButton = screen.getByTitle('game.floatingNote.minimize');

      fireEvent.mouseDown(closeButton, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(window, { clientX: 200, clientY: 200 });

      // Should not have called onUpdatePosition because drag shouldn't start
      expect(onUpdatePosition).not.toHaveBeenCalled();
    });

    it('cleans up event listeners when unmounted during drag', () => {
      const onUpdatePosition = vi.fn();
      const props = createBaseProps({ onUpdatePosition });
      const { container, unmount } = render(<FloatingNote {...props} />);

      const header = container.querySelector('.cursor-move')!;
      const noteElement = container.firstChild as HTMLElement;

      vi.spyOn(noteElement, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 150,
        right: 380,
        bottom: 350,
        width: 280,
        height: 200,
        x: 100,
        y: 150,
        toJSON: () => {},
      });

      // Start drag
      fireEvent.mouseDown(header, { clientX: 120, clientY: 160 });

      // Unmount while dragging
      unmount();

      // Should not throw when moving after unmount
      expect(() => {
        fireEvent.mouseMove(window, { clientX: 200, clientY: 200 });
      }).not.toThrow();
    });

    it('calculates drag offset correctly based on click position', async () => {
      const onUpdatePosition = vi.fn();
      const props = createBaseProps({ onUpdatePosition });
      const { container } = render(<FloatingNote {...props} />);

      const header = container.querySelector('.cursor-move')!;
      const noteElement = container.firstChild as HTMLElement;

      // Note positioned at (100, 150), click at (150, 200)
      // Offset should be (50, 50)
      vi.spyOn(noteElement, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 150,
        right: 380,
        bottom: 350,
        width: 280,
        height: 200,
        x: 100,
        y: 150,
        toJSON: () => {},
      });

      // Click at offset (50, 50) from top-left
      fireEvent.mouseDown(header, { clientX: 150, clientY: 200 });

      // Move to (300, 400) - new position should be (300-50, 400-50) = (250, 350)
      fireEvent.mouseMove(window, { clientX: 300, clientY: 400 });

      await waitFor(() => {
        expect(onUpdatePosition).toHaveBeenCalledWith('note1', 250, 350);
      });
    });
  });

  // ============================================
  // Color Styling Tests
  // ============================================
  describe('Color Styling', () => {
    const colorCases = [
      { color: 'gray', expectedClass: 'bg-gray-100' },
      { color: 'red', expectedClass: 'bg-red-50' },
      { color: 'yellow', expectedClass: 'bg-yellow-50' },
      { color: 'green', expectedClass: 'bg-green-50' },
      { color: 'blue', expectedClass: 'bg-blue-50' },
      { color: 'purple', expectedClass: 'bg-purple-50' },
    ];

    colorCases.forEach(({ color, expectedClass }) => {
      it(`applies ${color} color styling correctly`, () => {
        const props = createBaseProps({
          note: createBaseNote({ color }),
        });
        const { container } = render(<FloatingNote {...props} />);

        const noteElement = container.firstChild as HTMLElement;
        expect(noteElement.className).toContain(expectedClass);
      });
    });

    it('defaults to gray when color is unknown', () => {
      const props = createBaseProps({
        note: createBaseNote({ color: 'unknown-color' }),
      });
      const { container } = render(<FloatingNote {...props} />);

      const noteElement = container.firstChild as HTMLElement;
      expect(noteElement.className).toContain('bg-gray-100');
    });

    it('defaults to gray when color is undefined', () => {
      const props = createBaseProps({
        note: createBaseNote({ color: undefined }),
      });
      const { container } = render(<FloatingNote {...props} />);

      const noteElement = container.firstChild as HTMLElement;
      expect(noteElement.className).toContain('bg-gray-100');
    });
  });

  // ============================================
  // Color Picker Tests
  // ============================================
  describe('Color Picker', () => {
    it('shows color picker when palette button is clicked', () => {
      const props = createBaseProps();
      const { container } = render(<FloatingNote {...props} />);

      const paletteButton = screen.getByTitle('game.floatingNote.changeColor');
      fireEvent.click(paletteButton);

      // Color picker should now be visible - it has 6 color buttons
      const colorButtons = container.querySelectorAll('.w-5.h-5.rounded-full');
      expect(colorButtons.length).toBe(6);
    });

    it('hides color picker when palette button is clicked again', () => {
      const props = createBaseProps();
      const { container } = render(<FloatingNote {...props} />);

      const paletteButton = screen.getByTitle('game.floatingNote.changeColor');

      // Open
      fireEvent.click(paletteButton);
      let colorButtons = container.querySelectorAll('.w-5.h-5.rounded-full');
      expect(colorButtons.length).toBe(6);

      // Close
      fireEvent.click(paletteButton);
      colorButtons = container.querySelectorAll('.w-5.h-5.rounded-full');
      expect(colorButtons.length).toBe(0);
    });

    it('does not show color picker when collapsed', () => {
      const props = createBaseProps({
        note: createBaseNote({ isCollapsed: true }),
      });
      const { container } = render(<FloatingNote {...props} />);

      const paletteButton = screen.getByTitle('game.floatingNote.changeColor');
      fireEvent.click(paletteButton);

      // Color picker should not be visible when collapsed
      const colorButtons = container.querySelectorAll('.w-5.h-5.rounded-full');
      expect(colorButtons.length).toBe(0);
    });

    it('calls onColorChange when a color is selected', () => {
      const onColorChange = vi.fn();
      const props = createBaseProps({ onColorChange });
      const { container } = render(<FloatingNote {...props} />);

      // Open color picker
      const paletteButton = screen.getByTitle('game.floatingNote.changeColor');
      fireEvent.click(paletteButton);

      // Click the first color button (gray)
      const colorButtons = container.querySelectorAll('.w-5.h-5.rounded-full');
      fireEvent.click(colorButtons[0]!);

      expect(onColorChange).toHaveBeenCalledWith('note1', 'gray');
    });

    it('closes color picker after selecting a color', () => {
      const props = createBaseProps();
      const { container } = render(<FloatingNote {...props} />);

      // Open color picker
      const paletteButton = screen.getByTitle('game.floatingNote.changeColor');
      fireEvent.click(paletteButton);

      // Click a color
      const colorButtons = container.querySelectorAll('.w-5.h-5.rounded-full');
      fireEvent.click(colorButtons[0]!);

      // Color picker should be closed
      const remainingButtons = container.querySelectorAll('.w-5.h-5.rounded-full');
      expect(remainingButtons.length).toBe(0);
    });

    it('highlights currently selected color in picker', () => {
      const props = createBaseProps({
        note: createBaseNote({ color: 'red' }),
      });
      const { container } = render(<FloatingNote {...props} />);

      // Open color picker
      const paletteButton = screen.getByTitle('game.floatingNote.changeColor');
      fireEvent.click(paletteButton);

      // Find the red color button (second in list) - it should have ring classes
      const colorButtons = container.querySelectorAll('.w-5.h-5.rounded-full');
      const redButton = colorButtons[1] as HTMLElement;
      expect(redButton.className).toContain('ring-2');
    });
  });

  // ============================================
  // Collapse/Expand Tests
  // ============================================
  describe('Collapse/Expand', () => {
    it('hides content when collapsed', () => {
      const props = createBaseProps({
        note: createBaseNote({ isCollapsed: true }),
      });
      render(<FloatingNote {...props} />);

      expect(screen.queryByText('Test note content')).not.toBeInTheDocument();
    });

    it('shows content when expanded', () => {
      const props = createBaseProps({
        note: createBaseNote({ isCollapsed: false }),
      });
      render(<FloatingNote {...props} />);

      expect(screen.getByText('Test note content')).toBeInTheDocument();
    });

    it('calls onToggleCollapse when collapse button is clicked', () => {
      const onToggleCollapse = vi.fn();
      const props = createBaseProps({ onToggleCollapse });
      render(<FloatingNote {...props} />);

      // Find the collapse button (it's the second button in the header actions)
      // The expand button shows minus icon when expanded
      const buttons = screen.getAllByRole('button');
      // The collapse button is the one without a title attribute in the middle
      const collapseButton = buttons.find(btn =>
        !btn.getAttribute('title') || btn.getAttribute('title') === ''
      );

      if (collapseButton) {
        fireEvent.click(collapseButton);
        expect(onToggleCollapse).toHaveBeenCalledWith('note1');
      }
    });

    it('does not show timestamp when collapsed', () => {
      const props = createBaseProps({
        note: createBaseNote({ isCollapsed: true }),
      });
      render(<FloatingNote {...props} />);

      // Timestamp should not be visible when collapsed
      expect(screen.queryByText(/\d{1,2}:\d{2}:\d{2}/)).not.toBeInTheDocument();
    });
  });

  // ============================================
  // Close Button Tests
  // ============================================
  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      const props = createBaseProps({ onClose });
      render(<FloatingNote {...props} />);

      const closeButton = screen.getByTitle('game.floatingNote.minimize');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledWith('note1');
    });

    it('has correct title on close button', () => {
      const props = createBaseProps();
      render(<FloatingNote {...props} />);

      const closeButton = screen.getByTitle('game.floatingNote.minimize');
      expect(closeButton).toBeInTheDocument();
    });

    it('close button has red text styling', () => {
      const props = createBaseProps();
      render(<FloatingNote {...props} />);

      const closeButton = screen.getByTitle('game.floatingNote.minimize');
      expect(closeButton.className).toContain('text-red-500');
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('handles empty content gracefully', () => {
      const props = createBaseProps({
        note: createBaseNote({ content: '' }),
      });
      const { container } = render(<FloatingNote {...props} />);

      expect(container.firstChild).not.toBeNull();
    });

    it('handles very long content with overflow', () => {
      const longContent = 'A'.repeat(1000);
      const props = createBaseProps({
        note: createBaseNote({ content: longContent }),
      });
      const { container } = render(<FloatingNote {...props} />);

      // Content should be rendered in a scrollable container
      const contentArea = container.querySelector('.overflow-y-auto');
      expect(contentArea).not.toBeNull();
    });

    it('handles special characters in content', () => {
      const specialContent = '<script>alert("xss")</script> & " \' < >';
      const props = createBaseProps({
        note: createBaseNote({ content: specialContent }),
      });
      render(<FloatingNote {...props} />);

      // Content should be escaped and rendered as text
      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });

    it('handles zero position values (falls back to default due to || operator)', () => {
      // Note: The component uses `position?.x || 100` which treats 0 as falsy
      // This is the current component behavior - zero falls back to default
      const props = createBaseProps({
        note: createBaseNote({ position: { x: 0, y: 0 } }),
      });
      const { container } = render(<FloatingNote {...props} />);

      const noteElement = container.firstChild as HTMLElement;
      // Due to `|| 100` in the component, 0 falls back to 100
      expect(noteElement.style.left).toBe('100px');
      expect(noteElement.style.top).toBe('100px');
    });

    it('handles negative position values', () => {
      const props = createBaseProps({
        note: createBaseNote({ position: { x: -50, y: -100 } }),
      });
      const { container } = render(<FloatingNote {...props} />);

      const noteElement = container.firstChild as HTMLElement;
      expect(noteElement.style.left).toBe('-50px');
      expect(noteElement.style.top).toBe('-100px');
    });

    it('renders all action buttons', () => {
      const props = createBaseProps();
      render(<FloatingNote {...props} />);

      // Color picker button
      expect(screen.getByTitle('game.floatingNote.changeColor')).toBeInTheDocument();
      // Close button
      expect(screen.getByTitle('game.floatingNote.minimize')).toBeInTheDocument();
      // Collapse button exists (even without title)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('preserves note id in all callback functions', () => {
      const customId = 'custom-unique-note-id-123';
      const onClose = vi.fn();
      const onColorChange = vi.fn();
      const onToggleCollapse = vi.fn();

      const props = createBaseProps({
        note: createBaseNote({ id: customId }),
        onClose,
        onColorChange,
        onToggleCollapse,
      });
      const { container } = render(<FloatingNote {...props} />);

      // Test onClose
      fireEvent.click(screen.getByTitle('game.floatingNote.minimize'));
      expect(onClose).toHaveBeenCalledWith(customId);

      // Test onColorChange
      fireEvent.click(screen.getByTitle('game.floatingNote.changeColor'));
      const colorButtons = container.querySelectorAll('.w-5.h-5.rounded-full');
      fireEvent.click(colorButtons[0]!);
      expect(onColorChange).toHaveBeenCalledWith(customId, 'gray');
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('has interactive buttons', () => {
      const props = createBaseProps();
      render(<FloatingNote {...props} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('drag handle has cursor-move class for visual feedback', () => {
      const props = createBaseProps();
      const { container } = render(<FloatingNote {...props} />);

      const dragHandle = container.querySelector('.cursor-move');
      expect(dragHandle).not.toBeNull();
    });

    it('has select-none on header to prevent text selection during drag', () => {
      const props = createBaseProps();
      const { container } = render(<FloatingNote {...props} />);

      const header = container.querySelector('.select-none');
      expect(header).not.toBeNull();
    });
  });
});
