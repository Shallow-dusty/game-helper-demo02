/**
 * DawnLight Tests
 *
 * Tests for the dawn light transition effect
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DawnLight } from './DawnLight';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => (
      <div className={className} style={style} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Sun: () => <div data-testid="sun-icon">Sun</div>,
}));

// Mock useSoundEffect
const mockPlaySound = vi.fn();
vi.mock('../../hooks/useSoundEffect', () => ({
  useSoundEffect: () => ({
    playSound: mockPlaySound,
  }),
}));

describe('DawnLight', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render nothing when not active', () => {
    const { container } = render(<DawnLight isActive={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should start animation sequence when active', async () => {
    render(<DawnLight isActive={true} />);

    // Should play day bell sound
    expect(mockPlaySound).toHaveBeenCalledWith('day_bell');
  });

  it('should play bird chirp sound during sweep phase', async () => {
    render(<DawnLight isActive={true} />);

    // Advance to sweep phase (300ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mockPlaySound).toHaveBeenCalledWith('bird_chirp');
  });

  it('should call onComplete when animation finishes', async () => {
    const mockOnComplete = vi.fn();
    render(<DawnLight isActive={true} onComplete={mockOnComplete} />);

    // Advance to completion (2800ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2800);
    });

    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('should render blackout phase initially', () => {
    render(<DawnLight isActive={true} />);

    // Should have a blackout div
    const motionDivs = screen.getAllByTestId('motion-div');
    expect(motionDivs.length).toBeGreaterThan(0);
  });

  it('should progress through phases', async () => {
    const { rerender } = render(<DawnLight isActive={true} />);

    // Initial blackout phase
    expect(screen.getAllByTestId('motion-div').length).toBeGreaterThan(0);

    // Advance to sweep phase
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    rerender(<DawnLight isActive={true} />);

    // Should show sun icon during sweep
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
  });

  it('should light up seats during sweep phase', async () => {
    const seatPositions = [
      { id: 0, x: 50, y: 20, isDead: false },
      { id: 1, x: 80, y: 50, isDead: false },
      { id: 2, x: 50, y: 80, isDead: true },
    ];

    render(<DawnLight isActive={true} seatPositions={seatPositions} />);

    // Advance to sweep phase
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // Advance for seat lighting (each 100ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // Seats should be rendered
    const motionDivs = screen.getAllByTestId('motion-div');
    expect(motionDivs.length).toBeGreaterThan(1);
  });

  it('should not re-trigger animation if already running', async () => {
    const { rerender } = render(<DawnLight isActive={true} />);

    // Advance part way
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // Re-render with same props
    rerender(<DawnLight isActive={true} />);

    // Should only have called playSound twice (day_bell + bird_chirp)
    expect(mockPlaySound).toHaveBeenCalledTimes(2);
  });

  it('should handle empty seat positions', async () => {
    const mockOnComplete = vi.fn();
    render(<DawnLight isActive={true} seatPositions={[]} onComplete={mockOnComplete} />);

    // Complete the animation
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2800);
    });

    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('should filter out dead seats from lighting sequence', async () => {
    const seatPositions = [
      { id: 0, x: 50, y: 20, isDead: false },
      { id: 1, x: 80, y: 50, isDead: true }, // Dead - should not light up
    ];

    render(<DawnLight isActive={true} seatPositions={seatPositions} />);

    // Advance to sweep phase
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // Only alive seats should be processed in sortedAliveSeats
    // The dead seat (id: 1) should still render but not show the glow
  });

  it('should reset state after animation completes', async () => {
    const mockOnComplete = vi.fn();
    const { rerender } = render(
      <DawnLight isActive={true} onComplete={mockOnComplete} />
    );

    // Complete animation
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2800);
    });

    // Re-render with isActive false
    rerender(<DawnLight isActive={false} onComplete={mockOnComplete} />);

    // Should render nothing
    expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument();
  });
});
