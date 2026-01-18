import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    mockStoreState = {
      isAudioBlocked: true,
      setAudioBlocked: vi.fn(),
      gameState: {}, // Simulate being in a game room
    };
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
    await new Promise(resolve => setTimeout(resolve, 600));

    expect(screen.getByText('ui.audioEnableOverlay.title')).toBeInTheDocument();
  });

  it('renders sound icon', async () => {
    render(<AudioEnableOverlay />);

    await new Promise(resolve => setTimeout(resolve, 600));

    expect(screen.getByText('🔊')).toBeInTheDocument();
  });

  it('renders title', async () => {
    render(<AudioEnableOverlay />);

    await new Promise(resolve => setTimeout(resolve, 600));

    expect(screen.getByText('ui.audioEnableOverlay.title')).toBeInTheDocument();
  });

  it('renders explanation text', async () => {
    render(<AudioEnableOverlay />);

    await new Promise(resolve => setTimeout(resolve, 600));

    // Use regex pattern to find text split by br tags
    expect(screen.getByText(/ui\.audioEnableOverlay\.browserBlocked/)).toBeInTheDocument();
    expect(screen.getByText(/ui\.audioEnableOverlay\.clickToEnable/)).toBeInTheDocument();
  });

  it('renders action button', async () => {
    render(<AudioEnableOverlay />);

    await new Promise(resolve => setTimeout(resolve, 600));

    const button = screen.getByRole('button', { name: 'ui.audioEnableOverlay.buttonText' });
    expect(button).toBeInTheDocument();
  });

  it('renders adjustment hint', async () => {
    render(<AudioEnableOverlay />);

    await new Promise(resolve => setTimeout(resolve, 600));

    expect(screen.getByText('ui.audioEnableOverlay.adjustLater')).toBeInTheDocument();
  });

  it('hides overlay when clicking anywhere', async () => {
    render(<AudioEnableOverlay />);

    // Wait for delayed display
    await new Promise(resolve => setTimeout(resolve, 600));

    // Click on the outer overlay div (the one with onClick handler)
    const outerOverlay = screen.getByText('ui.audioEnableOverlay.title').closest('div')?.parentElement;
    if (outerOverlay) {
      fireEvent.click(outerOverlay);

      // Overlay should be hidden
      expect(screen.queryByText('ui.audioEnableOverlay.title')).not.toBeInTheDocument();
    }
  });

  it('hides overlay when clicking the button', async () => {
    render(<AudioEnableOverlay />);

    await new Promise(resolve => setTimeout(resolve, 600));

    // The button has the text content, find it by role
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Overlay should be hidden
    expect(screen.queryByText('ui.audioEnableOverlay.title')).not.toBeInTheDocument();
  });

  it('attempts to activate audio when clicked', async () => {
    const mockSetAudioBlocked = vi.fn();
    mockStoreState.setAudioBlocked = mockSetAudioBlocked;

    render(<AudioEnableOverlay />);

    await new Promise(resolve => setTimeout(resolve, 600));

    // Re-setup Audio mock to work correctly
    global.Audio = vi.fn(function(this: any) {
      this.play = vi.fn().mockResolvedValue(undefined);
      this.pause = vi.fn();
      this.volume = 0;
      this.src = '';
    }) as any;

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Wait for async audio activation
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should call setAudioBlocked
    expect(mockSetAudioBlocked).toHaveBeenCalledWith(false);
  });

  it('plays silent audio to activate AudioContext', async () => {
    render(<AudioEnableOverlay />);

    await new Promise(resolve => setTimeout(resolve, 600));

    const button = screen.getByRole('button', { name: 'ui.audioEnableOverlay.buttonText' });
    fireEvent.click(button);

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));

    // Audio constructor should have been called
    expect(global.Audio).toHaveBeenCalled();
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

    await new Promise(resolve => setTimeout(resolve, 600));

    const button = screen.getByRole('button', { name: 'ui.audioEnableOverlay.buttonText' });
    fireEvent.click(button);

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));

    // Should not crash
    consoleWarnSpy.mockRestore();
  });

  it('does not show overlay after user interaction', async () => {
    const { rerender } = render(<AudioEnableOverlay />);

    await new Promise(resolve => setTimeout(resolve, 600));

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // After clicking, the overlay should hide
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.queryByText('ui.audioEnableOverlay.title')).not.toBeInTheDocument();

    // Rerender with hasInteracted state true - should still not show
    rerender(<AudioEnableOverlay />);
    await new Promise(resolve => setTimeout(resolve, 600));

    expect(screen.queryByText('ui.audioEnableOverlay.title')).not.toBeInTheDocument();
  });
});
