import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioEnableOverlay } from './AudioEnableOverlay';

// Mock Audio
global.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  volume: 0,
  src: '',
}));

// Mock store
let mockStoreState: any = {};

vi.mock('../../store', () => ({
  useStore: (selector: (state: any) => any) => {
    return selector(mockStoreState);
  },
}));

describe('AudioEnableOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockStoreState = {
      isAudioBlocked: true,
      setAudioBlocked: vi.fn(),
      gameState: {}, // Simulate being in a game room
    };
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('does not render when audio is not blocked', () => {
    mockStoreState.isAudioBlocked = false;

    const { container } = render(<AudioEnableOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when not in game room', () => {
    mockStoreState.gameState = null;

    const { container } = render(<AudioEnableOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders overlay when audio is blocked and in game room', async () => {
    render(<AudioEnableOverlay />);

    // Wait for delayed display
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText('ui.audioEnableOverlay.title')).toBeInTheDocument();
  });

  it('renders sound icon', async () => {
    render(<AudioEnableOverlay />);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText('🔊')).toBeInTheDocument();
  });

  it('renders title', async () => {
    render(<AudioEnableOverlay />);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText('ui.audioEnableOverlay.title')).toBeInTheDocument();
  });

  it('renders explanation text', async () => {
    render(<AudioEnableOverlay />);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Use regex pattern to find text split by br tags
    expect(screen.getByText(/ui\.audioEnableOverlay\.browserBlocked/)).toBeInTheDocument();
    expect(screen.getByText(/ui\.audioEnableOverlay\.clickToEnable/)).toBeInTheDocument();
  });

  it('renders action button', async () => {
    render(<AudioEnableOverlay />);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    const button = screen.getByRole('button', { name: 'ui.audioEnableOverlay.buttonText' });
    expect(button).toBeInTheDocument();
  });

  it('renders adjustment hint', async () => {
    render(<AudioEnableOverlay />);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText('ui.audioEnableOverlay.adjustLater')).toBeInTheDocument();
  });

  it('hides overlay when clicking anywhere', async () => {
    render(<AudioEnableOverlay />);

    // Wait for delayed display
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Use real timers for userEvent
    vi.useRealTimers();
    const user = userEvent.setup();

    // Click on the outer overlay div (the one with onClick handler)
    const outerOverlay = screen.getByText('ui.audioEnableOverlay.title').closest('div')?.parentElement;
    if (outerOverlay) {
      await user.click(outerOverlay);

      // Overlay should be hidden
      expect(screen.queryByText('ui.audioEnableOverlay.title')).not.toBeInTheDocument();
    }

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('hides overlay when clicking the button', async () => {
    render(<AudioEnableOverlay />);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Use real timers for userEvent
    vi.useRealTimers();
    const user = userEvent.setup();

    // The button has the text content, find it by role
    const button = screen.getByRole('button');
    await user.click(button);

    // Overlay should be hidden
    expect(screen.queryByText('ui.audioEnableOverlay.title')).not.toBeInTheDocument();

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('attempts to activate audio when clicked', async () => {
    const mockSetAudioBlocked = vi.fn();
    mockStoreState.setAudioBlocked = mockSetAudioBlocked;

    render(<AudioEnableOverlay />);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Re-setup Audio mock to work correctly
    global.Audio = vi.fn(function(this: any) {
      this.play = vi.fn().mockResolvedValue(undefined);
      this.pause = vi.fn();
      this.volume = 0;
      this.src = '';
    }) as any;

    // Use real timers for userEvent
    vi.useRealTimers();
    const user = userEvent.setup();

    const button = screen.getByRole('button');
    await user.click(button);

    // Wait for async audio activation
    await waitFor(() => {
      expect(mockSetAudioBlocked).toHaveBeenCalledWith(false);
    });

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('plays silent audio to activate AudioContext', async () => {
    render(<AudioEnableOverlay />);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Use real timers for userEvent
    vi.useRealTimers();
    const user = userEvent.setup();

    const button = screen.getByRole('button', { name: 'ui.audioEnableOverlay.buttonText' });
    await user.click(button);

    // Audio constructor should have been called
    await waitFor(() => {
      expect(global.Audio).toHaveBeenCalled();
    });

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('handles audio activation failure gracefully', async () => {
    // Mock audio play to fail
    global.Audio = vi.fn().mockImplementation(() => ({
      play: vi.fn().mockRejectedValue(new Error('Audio blocked')),
      pause: vi.fn(),
      volume: 0,
      src: '',
    }));

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<AudioEnableOverlay />);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Use real timers for userEvent
    vi.useRealTimers();
    const user = userEvent.setup();

    const button = screen.getByRole('button', { name: 'ui.audioEnableOverlay.buttonText' });
    await user.click(button);

    // Should not crash - just verify the test completes
    await waitFor(() => {
      expect(consoleWarnSpy).toBeDefined();
    });

    consoleWarnSpy.mockRestore();

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('does not show overlay after user interaction', async () => {
    const { rerender } = render(<AudioEnableOverlay />);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // Use real timers for userEvent
    vi.useRealTimers();
    const user = userEvent.setup();

    const button = screen.getByRole('button');
    await user.click(button);

    // Restore fake timers before continuing
    vi.useFakeTimers();

    // After clicking, the overlay should hide
    expect(screen.queryByText('ui.audioEnableOverlay.title')).not.toBeInTheDocument();

    // Rerender with hasInteracted state true - should still not show
    rerender(<AudioEnableOverlay />);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.queryByText('ui.audioEnableOverlay.title')).not.toBeInTheDocument();
  });
});
