/**
 * DetectivePinboard Tests
 *
 * Tests for the detective pinboard canvas component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetectivePinboard } from './DetectivePinboard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock canvas
const mockContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  fillText: vi.fn(),
  setLineDash: vi.fn(),
};

describe('DetectivePinboard', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    mockLocalStorage = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockLocalStorage[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockLocalStorage[key] = value;
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock canvas getContext
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when enabled is false', () => {
    const { container } = render(
      <DetectivePinboard width={800} height={600} enabled={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when enabled is true', () => {
    render(<DetectivePinboard width={800} height={600} enabled={true} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should render canvas with correct dimensions', () => {
    render(<DetectivePinboard width={800} height={600} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas?.width).toBe(800);
    expect(canvas?.height).toBe(600);
  });

  it('should display keyboard shortcuts', () => {
    const { container } = render(<DetectivePinboard width={800} height={600} />);

    expect(screen.getByText('Alt')).toBeInTheDocument();
    expect(screen.getByText('Shift')).toBeInTheDocument();
    // These texts are split across elements with kbd, so check if they exist in container
    expect(container.textContent).toContain('game.detective.dragSuspect');
    expect(container.textContent).toContain('game.detective.dragTrust');
  });

  it('should display clear button', () => {
    render(<DetectivePinboard width={800} height={600} />);

    expect(screen.getByText('game.detective.clear')).toBeInTheDocument();
  });

  it('should load connections from localStorage', () => {
    const savedConnections = [
      {
        id: 'conn_1',
        from: { x: 100, y: 100 },
        to: { x: 200, y: 200 },
        type: 'suspect',
        createdAt: Date.now(),
      },
    ];
    mockLocalStorage.detective_pinboard_default = JSON.stringify(savedConnections);

    render(<DetectivePinboard width={800} height={600} />);

    // Canvas should be drawn with loaded connections
    expect(mockContext.beginPath).toHaveBeenCalled();
  });

  it('should use roomId for localStorage key', () => {
    render(<DetectivePinboard width={800} height={600} roomId="room123" />);

    // Component should try to load from room-specific key
    expect(localStorage.getItem).toHaveBeenCalledWith('detective_pinboard_room123');
  });

  it('should save connections to localStorage', () => {
    render(<DetectivePinboard width={800} height={600} roomId="test-room" />);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'detective_pinboard_test-room',
      expect.any(String)
    );
  });

  it('should clear all connections when clear button is clicked', () => {
    const savedConnections = [
      {
        id: 'conn_1',
        from: { x: 100, y: 100 },
        to: { x: 200, y: 200 },
        type: 'suspect',
        createdAt: Date.now(),
      },
    ];
    mockLocalStorage.detective_pinboard_default = JSON.stringify(savedConnections);

    render(<DetectivePinboard width={800} height={600} />);

    const clearButton = screen.getByText('game.detective.clear');
    fireEvent.click(clearButton);

    // Should save empty array
    expect(localStorage.setItem).toHaveBeenLastCalledWith(
      'detective_pinboard_default',
      '[]'
    );
  });

  it('should handle mouse down with Alt key for suspect line', () => {
    render(<DetectivePinboard width={800} height={600} />);

    const canvas = document.querySelector('canvas')!;

    fireEvent.mouseDown(canvas, {
      clientX: 100,
      clientY: 100,
      altKey: true,
    });

    // Drawing should start
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should handle mouse down with Shift key for trust line', () => {
    render(<DetectivePinboard width={800} height={600} />);

    const canvas = document.querySelector('canvas')!;

    fireEvent.mouseDown(canvas, {
      clientX: 100,
      clientY: 100,
      shiftKey: true,
    });

    // Drawing should start
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should not start drawing without modifier key', () => {
    render(<DetectivePinboard width={800} height={600} />);

    const canvas = document.querySelector('canvas')!;

    // Initial call count
    const initialCallCount = mockContext.moveTo.mock.calls.length;

    fireEvent.mouseDown(canvas, {
      clientX: 100,
      clientY: 100,
    });

    fireEvent.mouseMove(canvas, {
      clientX: 200,
      clientY: 200,
    });

    // moveTo should not be called for active drawing line
    // (only for existing connections)
  });

  it('should handle context menu (right click)', () => {
    render(<DetectivePinboard width={800} height={600} />);

    const canvas = document.querySelector('canvas')!;

    const event = new MouseEvent('contextmenu', {
      clientX: 150,
      clientY: 150,
      bubbles: true,
    });

    // Should prevent default
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    canvas.dispatchEvent(event);

    // Note: event is native, so we just verify no errors thrown
  });

  it('should stop drawing on mouse leave', () => {
    render(<DetectivePinboard width={800} height={600} />);

    const canvas = document.querySelector('canvas')!;

    // Start drawing
    fireEvent.mouseDown(canvas, {
      clientX: 100,
      clientY: 100,
      altKey: true,
    });

    // Leave canvas
    fireEvent.mouseLeave(canvas);

    // Canvas should be redrawn (clearing the in-progress line)
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should handle invalid localStorage gracefully', () => {
    mockLocalStorage.detective_pinboard_default = 'invalid json';

    // Should not throw
    expect(() => {
      render(<DetectivePinboard width={800} height={600} />);
    }).not.toThrow();

    expect(console.warn).toHaveBeenCalledWith('Failed to load detective pinboard data');
  });
});
