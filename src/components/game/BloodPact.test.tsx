/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BloodPact } from './BloodPact';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => <div {...props}>{children}</div>,
    circle: (props: object) => <circle {...props} />,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}));

// Mock useSoundEffect
const mockPlaySound = vi.fn();
vi.mock('../../hooks/useSoundEffect', () => ({
  useSoundEffect: () => ({
    playSound: mockPlaySound,
  }),
}));

describe('BloodPact', () => {
  const defaultSeatPositions = [
    { id: 0, x: 100, y: 100 },
    { id: 1, x: 200, y: 100 },
    { id: 2, x: 300, y: 100 },
    { id: 3, x: 400, y: 100 },
  ];

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockPlaySound.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when isActive is false', () => {
    const { container } = render(
      <BloodPact
        isActive={false}
        minionSeatIds={[1, 2]}
        seatPositions={defaultSeatPositions}
      />
    );

    // Should render nothing when not active
    expect(container.firstChild).toBeNull();
  });

  it('renders the blood pact ceremony when isActive is true', () => {
    render(
      <BloodPact
        isActive={true}
        minionSeatIds={[1, 2]}
        seatPositions={defaultSeatPositions}
      />
    );

    // State transition happens synchronously in the effect
    // Allow timers to advance for the state change
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should render the title
    expect(screen.getByText('血契已立')).toBeInTheDocument();
    expect(screen.getByText('The Blood Pact is Sealed')).toBeInTheDocument();
  });

  it('plays ghost_whisper sound when activated', () => {
    render(
      <BloodPact
        isActive={true}
        minionSeatIds={[1]}
        seatPositions={defaultSeatPositions}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockPlaySound).toHaveBeenCalledWith('ghost_whisper');
  });

  it('sets up onComplete callback timer when activated', () => {
    const onCompleteMock = vi.fn();

    render(
      <BloodPact
        isActive={true}
        minionSeatIds={[1]}
        seatPositions={defaultSeatPositions}
        onComplete={onCompleteMock}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // At this point, the component should be in reveal phase and timer set
    // We verify component rendered without error
    expect(screen.getByText('血契已立')).toBeInTheDocument();

    // Callback not called yet (timer is 4 seconds)
    expect(onCompleteMock).not.toHaveBeenCalled();
  });

  it('renders demon totem when demonSeatId is provided', () => {
    const { container } = render(
      <BloodPact
        isActive={true}
        minionSeatIds={[]}
        demonSeatId={3}
        seatPositions={defaultSeatPositions}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should have SVG elements for the rune circle in demon totem
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('renders demon totem when demonSeatId is 0 (edge case)', () => {
    // Regression test: demonSeatId=0 should render demon totem
    // Previously `!demonSeatId` would return true for 0
    const { container } = render(
      <BloodPact
        isActive={true}
        minionSeatIds={[]}
        demonSeatId={0}
        seatPositions={defaultSeatPositions}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should have SVG elements for the rune circle in demon totem
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('renders minion marks with fire emoji', () => {
    const { container } = render(
      <BloodPact
        isActive={true}
        minionSeatIds={[1, 2]}
        seatPositions={defaultSeatPositions}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should render fire emojis for minions
    const fireEmojis = container.textContent?.match(/🔥/g);
    expect(fireEmojis?.length).toBe(2); // 2 minions
  });

  it('handles empty minionSeatIds gracefully', () => {
    const { container } = render(
      <BloodPact
        isActive={true}
        minionSeatIds={[]}
        seatPositions={defaultSeatPositions}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should still render without crashing
    expect(screen.getByText('血契已立')).toBeInTheDocument();
    // No fire emojis for minions
    expect(container.textContent).not.toContain('🔥');
  });

  it('handles seatPositions not matching minionSeatIds', () => {
    render(
      <BloodPact
        isActive={true}
        minionSeatIds={[99, 100]} // IDs not in seatPositions
        seatPositions={defaultSeatPositions}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should still render the ceremony without crashing
    expect(screen.getByText('血契已立')).toBeInTheDocument();
  });

  it('resets phase when isActive becomes false', () => {
    const { rerender } = render(
      <BloodPact
        isActive={true}
        minionSeatIds={[1]}
        seatPositions={defaultSeatPositions}
      />
    );

    // Wait for reveal phase
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText('血契已立')).toBeInTheDocument();

    // Deactivate
    rerender(
      <BloodPact
        isActive={false}
        minionSeatIds={[1]}
        seatPositions={defaultSeatPositions}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should no longer show content
    expect(screen.queryByText('血契已立')).not.toBeInTheDocument();
  });

  it('uses default containerSize when not provided', () => {
    const { container } = render(
      <BloodPact
        isActive={true}
        minionSeatIds={[1]}
        seatPositions={defaultSeatPositions}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Component should render without errors
    expect(container).toBeDefined();
  });

  it('accepts custom containerSize', () => {
    const { container } = render(
      <BloodPact
        isActive={true}
        minionSeatIds={[1]}
        seatPositions={defaultSeatPositions}
        containerSize={{ width: 1000, height: 800 }}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Component should render without errors
    expect(container).toBeDefined();
  });

  it('clears timeout on unmount', () => {
    const onCompleteMock = vi.fn();

    const { unmount } = render(
      <BloodPact
        isActive={true}
        minionSeatIds={[1]}
        seatPositions={defaultSeatPositions}
        onComplete={onCompleteMock}
      />
    );

    // Allow initial state transition
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Unmount before timer completes
    unmount();

    // Advance remaining time
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // onComplete should not be called after unmount
    expect(onCompleteMock).not.toHaveBeenCalled();
  });

  it('does not trigger sound or timer if already in reveal phase', () => {
    const onCompleteMock = vi.fn();

    const { rerender } = render(
      <BloodPact
        isActive={true}
        minionSeatIds={[1]}
        seatPositions={defaultSeatPositions}
        onComplete={onCompleteMock}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockPlaySound).toHaveBeenCalledTimes(1);

    // Rerender with same props (still active)
    rerender(
      <BloodPact
        isActive={true}
        minionSeatIds={[1]}
        seatPositions={defaultSeatPositions}
        onComplete={onCompleteMock}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should not play sound again
    expect(mockPlaySound).toHaveBeenCalledTimes(1);
  });
});

describe('FlameParticle sub-component', () => {
  const defaultSeatPositions = [{ id: 1, x: 100, y: 100 }];

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockPlaySound.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders flame particles within MinionMark', () => {
    const { container } = render(
      <BloodPact
        isActive={true}
        minionSeatIds={[1]}
        seatPositions={defaultSeatPositions}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Each MinionMark has multiple nested elements with pointer-events-none
    const elements = container.querySelectorAll('.pointer-events-none');
    expect(elements.length).toBeGreaterThan(0);
  });
});

describe('DemonTotem sub-component', () => {
  const defaultSeatPositions = [{ id: 1, x: 100, y: 100 }];

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockPlaySound.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders demon totem with SVG elements', () => {
    const { container } = render(
      <BloodPact
        isActive={true}
        minionSeatIds={[]}
        demonSeatId={1}
        seatPositions={defaultSeatPositions}
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should have SVG elements for the rune circle
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });
});
