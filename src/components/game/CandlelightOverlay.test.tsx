/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { CandlelightOverlay, CandlelightToggle } from './CandlelightOverlay';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<any>) => <div {...props}>{children}</div>,
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

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Flame: () => <span>Flame</span>,
  FlameKindling: () => <span>FlameKindling</span>,
}));

describe('CandlelightOverlay', () => {
  let rafCallbacks: ((time: number) => void)[];
  let rafId: number;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup requestAnimationFrame mock
    rafCallbacks = [];
    rafId = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallbacks.push(callback);
      return ++rafId;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      rafCallbacks = rafCallbacks.filter((_, i) => i + 1 !== id);
    });

    // Setup Canvas mock
    mockContext = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      set fillStyle(_value: any) {},
      set globalCompositeOperation(_value: any) {},
    };

    // Mock getContext to return our mock context
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);

    // Mock getBoundingClientRect
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基础渲染', () => {
    it('renders canvas element when active', () => {
      const { container } = render(
        <CandlelightOverlay width={800} height={600} isActive />
      );
      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('does not render when not active', () => {
      const { container } = render(
        <CandlelightOverlay width={800} height={600} isActive={false} />
      );
      expect(container.querySelector('canvas')).toBeNull();
    });

    it('sets correct canvas dimensions', () => {
      const { container } = render(
        <CandlelightOverlay width={800} height={600} isActive />
      );
      const canvas = container.querySelector('canvas');
      expect(canvas?.width).toBe(800);
      expect(canvas?.height).toBe(600);
    });

    it('renders flame icon indicator', () => {
      const { container } = render(
        <CandlelightOverlay width={800} height={600} isActive />
      );
      expect(container.textContent).toContain('Flame');
    });
  });

  describe('Canvas 渲染循环', () => {
    it('starts requestAnimationFrame loop on mount', () => {
      render(<CandlelightOverlay width={800} height={600} isActive />);

      expect(window.requestAnimationFrame).toHaveBeenCalled();
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });

    it('calls getContext with 2d parameter', () => {
      render(<CandlelightOverlay width={800} height={600} isActive />);

      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
    });

    it('renders frame and calls Canvas APIs', () => {
      render(<CandlelightOverlay width={800} height={600} isActive />);

      // Trigger first animation frame
      act(() => {
        rafCallbacks[0]?.(1000);
      });

      // Verify canvas API calls
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('creates radial gradients for candlelight effect', () => {
      render(<CandlelightOverlay width={800} height={600} isActive />);

      act(() => {
        rafCallbacks[0]?.(1000);
      });

      // Should create at least 2 radial gradients (dark mask and warm glow)
      expect(mockContext.createRadialGradient).toHaveBeenCalledTimes(2);
    });

    it('draws arc for candlelight circle', () => {
      render(<CandlelightOverlay width={800} height={600} isActive />);

      act(() => {
        rafCallbacks[0]?.(1000);
      });

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('applies destination-out composite operation for hole effect', () => {
      const compositeSpy = vi.spyOn(mockContext, 'globalCompositeOperation', 'set');

      render(<CandlelightOverlay width={800} height={600} isActive />);

      act(() => {
        rafCallbacks[0]?.(1000);
      });

      expect(compositeSpy).toHaveBeenCalledWith('destination-out');
    });

    it('schedules next frame recursively', () => {
      render(<CandlelightOverlay width={800} height={600} isActive />);

      const initialCallCount = (window.requestAnimationFrame as any).mock.calls.length;

      act(() => {
        rafCallbacks[0]?.(1000);
      });

      // Should have called requestAnimationFrame again for next frame
      expect((window.requestAnimationFrame as any).mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('cancels animation frame on unmount', () => {
      const { unmount } = render(<CandlelightOverlay width={800} height={600} isActive />);

      unmount();

      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('指针移动和平滑跟随', () => {
    it('updates target position on pointer move', () => {
      const { container } = render(<CandlelightOverlay width={800} height={600} isActive />);

      // Simulate pointer move event
      const pointerEvent = new PointerEvent('pointermove', {
        clientX: 200,
        clientY: 150,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(pointerEvent);
      });

      // Render a frame to process the movement
      act(() => {
        rafCallbacks[rafCallbacks.length - 1]?.(2000);
      });

      // Canvas should have been rendered with updated position
      expect(mockContext.clearRect).toHaveBeenCalled();
    });

    it('applies smoothing to mouse position', () => {
      render(<CandlelightOverlay width={800} height={600} isActive />);

      // Initial frame
      act(() => {
        rafCallbacks[0]?.(1000);
      });

      const firstArcCall = (mockContext.arc).mock.calls[0];
      const firstX = firstArcCall[0];
      const firstY = firstArcCall[1];

      // Move pointer
      const pointerEvent = new PointerEvent('pointermove', {
        clientX: 600,
        clientY: 400,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(pointerEvent);
      });

      // Render next frame
      act(() => {
        rafCallbacks[rafCallbacks.length - 1]?.(2000);
      });

      const secondArcCall = (mockContext.arc).mock.calls[(mockContext.arc).mock.calls.length - 1];
      const secondX = secondArcCall[0];
      const secondY = secondArcCall[1];

      // Position should have changed due to smoothing (but not jumped instantly)
      expect(secondX).not.toBe(firstX);
      expect(secondY).not.toBe(firstY);
    });

    it('removes pointer event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<CandlelightOverlay width={800} height={600} isActive />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    });
  });

  describe('烛光效果', () => {
    it('applies flicker effect using sine/cosine', () => {
      render(<CandlelightOverlay width={800} height={600} isActive />);

      // Render multiple frames to see flicker variation
      act(() => {
        rafCallbacks[0]?.(1000);
      });
      const firstCall = (mockContext.arc).mock.calls[0];

      act(() => {
        rafCallbacks[rafCallbacks.length - 1]?.(5000); // Different time
      });
      const secondCall = (mockContext.arc).mock.calls[(mockContext.arc).mock.calls.length - 1];

      // Flicker should cause slight position variation
      // (Due to sin/cos with time, positions should differ slightly)
      const xDiff = Math.abs(firstCall[0] - secondCall[0]);
      const yDiff = Math.abs(firstCall[1] - secondCall[1]);

      // At least one coordinate should have changed due to flicker
      expect(xDiff > 0 || yDiff > 0).toBe(true);
    });

    it('applies breathing effect to radius', () => {
      render(<CandlelightOverlay width={800} height={600} isActive />);

      act(() => {
        rafCallbacks[0]?.(1000);
      });
      const firstRadius = (mockContext.arc).mock.calls[0][2];

      act(() => {
        rafCallbacks[rafCallbacks.length - 1]?.(10000);
      });
      const secondRadius = (mockContext.arc).mock.calls[(mockContext.arc).mock.calls.length - 1][2];

      // Breathing effect should vary radius over time
      expect(firstRadius).not.toBe(secondRadius);
    });
  });

  describe('死亡座位音效触发', () => {
    it('triggers sound when candlelight passes over dead seat', () => {
      // Mock Math.random to ensure sound triggers (need < 0.3)
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.2);

      const deadSeats = [
        { id: 1, x: 400, y: 300 },
      ];

      render(
        <CandlelightOverlay
          width={800}
          height={600}
          isActive
          deadSeatPositions={deadSeats}
        />
      );

      // Move pointer near dead seat position
      const pointerEvent = new PointerEvent('pointermove', {
        clientX: 400,
        clientY: 300,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(pointerEvent);
      });

      // Render frames to trigger proximity check
      act(() => {
        rafCallbacks[rafCallbacks.length - 1]?.(3000);
      });

      // Should have triggered a sound from AMBIENT_SOUNDS array
      expect(mockPlaySound).toHaveBeenCalled();
      const soundArg = mockPlaySound.mock.calls[0][0];
      expect(['ghost_whisper', 'wind_howl', 'crow_caw']).toContain(soundArg);

      randomSpy.mockRestore();
    });

    it('does not trigger sound if random check fails', () => {
      // Mock Math.random to fail trigger check (need >= 0.3)
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.8);

      const deadSeats = [
        { id: 1, x: 400, y: 300 },
      ];

      render(
        <CandlelightOverlay
          width={800}
          height={600}
          isActive
          deadSeatPositions={deadSeats}
        />
      );

      // Move pointer near dead seat
      const pointerEvent = new PointerEvent('pointermove', {
        clientX: 400,
        clientY: 300,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(pointerEvent);
        rafCallbacks[rafCallbacks.length - 1]?.(3000);
      });

      // Should NOT trigger sound
      expect(mockPlaySound).not.toHaveBeenCalled();

      randomSpy.mockRestore();
    });

    it('only triggers once per dead seat until reset', () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.2);

      const deadSeats = [
        { id: 1, x: 400, y: 300 },
      ];

      render(
        <CandlelightOverlay
          width={800}
          height={600}
          isActive
          deadSeatPositions={deadSeats}
        />
      );

      // First pass over dead seat
      act(() => {
        const pointerEvent = new PointerEvent('pointermove', {
          clientX: 400,
          clientY: 300,
          bubbles: true,
        });
        window.dispatchEvent(pointerEvent);
        rafCallbacks[rafCallbacks.length - 1]?.(3000);
      });

      expect(mockPlaySound).toHaveBeenCalledTimes(1);

      // Second pass (should not trigger again)
      act(() => {
        rafCallbacks[rafCallbacks.length - 1]?.(4000);
      });

      expect(mockPlaySound).toHaveBeenCalledTimes(1); // Still 1

      randomSpy.mockRestore();
    });

    it('resets trigger when candlelight moves far away', () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.2);

      const deadSeats = [
        { id: 1, x: 400, y: 300 },
      ];

      render(
        <CandlelightOverlay
          width={800}
          height={600}
          isActive
          deadSeatPositions={deadSeats}
        />
      );

      // First pass
      act(() => {
        const pointerEvent = new PointerEvent('pointermove', {
          clientX: 400,
          clientY: 300,
          bubbles: true,
        });
        window.dispatchEvent(pointerEvent);
        rafCallbacks[rafCallbacks.length - 1]?.(3000);
      });

      expect(mockPlaySound).toHaveBeenCalledTimes(1);

      // Move far away (> 1.5 * DEAD_SEAT_TRIGGER_RADIUS = 120)
      act(() => {
        const pointerEvent = new PointerEvent('pointermove', {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        });
        window.dispatchEvent(pointerEvent);
        // Advance multiple frames to let smoothing move past reset distance.
        for (let i = 0; i < 12; i += 1) {
          rafCallbacks[rafCallbacks.length - 1]?.(4000 + i * 16);
        }
      });

      // Move back near dead seat
      act(() => {
        const pointerEvent = new PointerEvent('pointermove', {
          clientX: 400,
          clientY: 300,
          bubbles: true,
        });
        window.dispatchEvent(pointerEvent);
        // Advance multiple frames to let smoothing re-enter trigger radius.
        for (let i = 0; i < 12; i += 1) {
          rafCallbacks[rafCallbacks.length - 1]?.(5000 + i * 16);
        }
      });

      // Should trigger again
      expect(mockPlaySound).toHaveBeenCalledTimes(2);

      randomSpy.mockRestore();
    });

    it('handles multiple dead seats independently', () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.2);

      const deadSeats = [
        { id: 1, x: 200, y: 200 },
        { id: 2, x: 600, y: 400 },
      ];

      render(
        <CandlelightOverlay
          width={800}
          height={600}
          isActive
          deadSeatPositions={deadSeats}
        />
      );

      // Pass over first dead seat
      act(() => {
        const pointerEvent = new PointerEvent('pointermove', {
          clientX: 200,
          clientY: 200,
          bubbles: true,
        });
        window.dispatchEvent(pointerEvent);
        // Advance multiple frames to allow smoothing to reach trigger radius.
        for (let i = 0; i < 12; i += 1) {
          rafCallbacks[rafCallbacks.length - 1]?.(3000 + i * 16);
        }
      });

      expect(mockPlaySound).toHaveBeenCalledTimes(1);

      // Pass over second dead seat
      act(() => {
        const pointerEvent = new PointerEvent('pointermove', {
          clientX: 600,
          clientY: 400,
          bubbles: true,
        });
        window.dispatchEvent(pointerEvent);
        // Advance multiple frames to allow smoothing to reach trigger radius.
        for (let i = 0; i < 12; i += 1) {
          rafCallbacks[rafCallbacks.length - 1]?.(4000 + i * 16);
        }
      });

      expect(mockPlaySound).toHaveBeenCalledTimes(2);

      randomSpy.mockRestore();
    });
  });

  describe('边界情况', () => {
    it('handles missing canvas context gracefully', () => {
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

      expect(() => {
        render(<CandlelightOverlay width={800} height={600} isActive />);
      }).not.toThrow();

      // Should not start animation loop if context is null
      expect(rafCallbacks.length).toBe(0);
    });

    it('handles empty dead seat positions array', () => {
      expect(() => {
        render(
          <CandlelightOverlay
            width={800}
            height={600}
            isActive
            deadSeatPositions={[]}
          />
        );
      }).not.toThrow();
    });

    it('handles getBoundingClientRect returning null rect', () => {
      HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => null as any);

      const { container } = render(<CandlelightOverlay width={800} height={600} isActive />);

      // Should not crash when dispatching pointer event
      expect(() => {
        const pointerEvent = new PointerEvent('pointermove', {
          clientX: 400,
          clientY: 300,
          bubbles: true,
        });
        window.dispatchEvent(pointerEvent);
      }).not.toThrow();
    });
  });
});

describe('CandlelightToggle', () => {
  it('renders with enabled state', () => {
    const { container } = render(
      <CandlelightToggle enabled={true} onToggle={vi.fn()} />
    );

    expect(container.textContent).toContain('Flame');
    expect(container.textContent).toContain('game.candlelight.enabled');
  });

  it('renders with disabled state', () => {
    const { container } = render(
      <CandlelightToggle enabled={false} onToggle={vi.fn()} />
    );

    expect(container.textContent).toContain('FlameKindling');
    expect(container.textContent).toContain('game.candlelight.disabled');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <CandlelightToggle enabled={false} onToggle={onToggle} />
    );

    const button = container.querySelector('button');
    button?.click();

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('applies correct CSS classes when enabled', () => {
    const { container } = render(
      <CandlelightToggle enabled={true} onToggle={vi.fn()} />
    );

    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-amber-900/50');
    expect(button?.className).toContain('text-amber-400');
  });

  it('applies correct CSS classes when disabled', () => {
    const { container } = render(
      <CandlelightToggle enabled={false} onToggle={vi.fn()} />
    );

    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-stone-900/50');
    expect(button?.className).toContain('text-stone-500');
  });

  it('has correct title attribute', () => {
    const { container } = render(
      <CandlelightToggle enabled={true} onToggle={vi.fn()} />
    );

    const button = container.querySelector('button');
    expect(button?.title).toBe('game.candlelight.disable');
  });
});
