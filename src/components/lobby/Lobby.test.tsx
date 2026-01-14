import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Lobby } from './Lobby';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => React.createElement('div', props, props.children),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Skull: () => <span>Skull</span>,
  Volume2: () => <span>Volume2</span>,
}));

// Mock Audio
global.Audio = vi.fn(function(this: any) {
  this.play = vi.fn().mockResolvedValue(undefined);
  this.pause = vi.fn();
  this.addEventListener = vi.fn();
  this.removeEventListener = vi.fn();
  this.volume = 0;
  this.loop = false;
  this.src = '';
}) as any;

// Mock store
let mockStoreState: any = {};

vi.mock('../../store', () => ({
  useStore: (selector: (state: any) => any) => {
    return selector(mockStoreState);
  },
}));

describe('Lobby', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = {
      login: vi.fn(),
      spectateGame: vi.fn(),
    };
  });

  it('renders lobby title', () => {
    render(<Lobby />);

    expect(screen.getByText('lobby.title')).toBeInTheDocument();
  });

  it('renders lobby subtitle', () => {
    render(<Lobby />);

    expect(screen.getByText('lobby.subtitle')).toBeInTheDocument();
  });

  it('renders nickname input', () => {
    render(<Lobby />);

    const input = screen.getByPlaceholderText('lobby.enterNickname');
    expect(input).toBeInTheDocument();
  });

  it('renders storyteller mode checkbox', () => {
    render(<Lobby />);

    expect(screen.getByText('lobby.storytellerMode')).toBeInTheDocument();
    expect(screen.getByText('lobby.storytellerDesc')).toBeInTheDocument();
  });

  it('renders enter button', () => {
    render(<Lobby />);

    const button = screen.getByRole('button', { name: 'lobby.enterAsPlayer' });
    expect(button).toBeInTheDocument();
  });

  it('disables enter button when nickname is empty', () => {
    render(<Lobby />);

    const button = screen.getByRole('button', { name: 'lobby.enterAsPlayer' });
    expect(button).toBeDisabled();
  });

  it('enables enter button when nickname is provided', () => {
    render(<Lobby />);

    const input = screen.getByPlaceholderText('lobby.enterNickname');
    fireEvent.change(input, { target: { value: 'TestPlayer' } });

    const button = screen.getByRole('button', { name: 'lobby.enterAsPlayer' });
    expect(button).not.toBeDisabled();
  });

  it('toggles storyteller mode when checkbox is clicked', () => {
    render(<Lobby />);

    const stCheckbox = screen.getByText('lobby.storytellerMode').closest('div');
    if (stCheckbox) {
      fireEvent.click(stCheckbox);

      // Button text should change
      expect(screen.getByRole('button', { name: 'lobby.enterGrimoire' })).toBeInTheDocument();
    }
  });

  it('calls login when form is submitted with player mode', async () => {
    render(<Lobby />);

    const input = screen.getByPlaceholderText('lobby.enterNickname');
    fireEvent.change(input, { target: { value: 'TestPlayer' } });

    const form = input.closest('form');
    if (form) {
      fireEvent.submit(form);
      // Wait for async fadeOutAudio (takes ~800ms with 0.05 decrement) and login
      await new Promise(resolve => setTimeout(resolve, 1000));
      expect(mockStoreState.login).toHaveBeenCalledWith('TestPlayer', false);
    }
  });

  it('calls login when form is submitted with storyteller mode', async () => {
    render(<Lobby />);

    const input = screen.getByPlaceholderText('lobby.enterNickname');
    fireEvent.change(input, { target: { value: 'Storyteller' } });

    const stCheckbox = screen.getByText('lobby.storytellerMode').closest('div');
    if (stCheckbox) {
      fireEvent.click(stCheckbox);
    }

    const form = input.closest('form');
    if (form) {
      fireEvent.submit(form);
      // Wait for async fadeOutAudio (takes ~800ms with 0.05 decrement) and login
      await new Promise(resolve => setTimeout(resolve, 1000));
      expect(mockStoreState.login).toHaveBeenCalledWith('Storyteller', true);
    }
  });

  it('renders switch to spectator button', () => {
    render(<Lobby />);

    expect(screen.getByText('lobby.switchToSpectator')).toBeInTheDocument();
  });

  it('switches to spectator mode', () => {
    render(<Lobby />);

    const switchButton = screen.getByText('lobby.switchToSpectator');
    fireEvent.click(switchButton);

    // Should show room code input
    expect(screen.getByPlaceholderText('lobby.enterRoomCode')).toBeInTheDocument();
  });

  it('switches back to login mode from spectator', () => {
    render(<Lobby />);

    // Switch to spectator
    const switchButton = screen.getByText('lobby.switchToSpectator');
    fireEvent.click(switchButton);

    // Switch back
    const backButton = screen.getByText('lobby.backToLogin');
    fireEvent.click(backButton);

    // Should show nickname input again
    expect(screen.getByPlaceholderText('lobby.enterNickname')).toBeInTheDocument();
  });

  it('validates room code length', () => {
    render(<Lobby />);

    // Switch to spectator mode
    const switchButton = screen.getByText('lobby.switchToSpectator');
    fireEvent.click(switchButton);

    const roomCodeInput = screen.getByPlaceholderText('lobby.enterRoomCode');
    const enterButton = screen.getByRole('button', { name: 'lobby.enterAsSpectator' });

    // Should be disabled initially
    expect(enterButton).toBeDisabled();

    // Enter partial room code
    fireEvent.change(roomCodeInput, { target: { value: '123' } });
    expect(enterButton).toBeDisabled();

    // Enter complete room code
    fireEvent.change(roomCodeInput, { target: { value: '1234' } });
    expect(enterButton).not.toBeDisabled();
  });

  it('calls spectateGame when submitting with valid room code', () => {
    const mockSpectateGame = vi.fn();
    mockStoreState.spectateGame = mockSpectateGame;

    render(<Lobby />);

    // Switch to spectator mode
    const switchButton = screen.getByText('lobby.switchToSpectator');
    fireEvent.click(switchButton);

    const roomCodeInput = screen.getByPlaceholderText('lobby.enterRoomCode');
    fireEvent.change(roomCodeInput, { target: { value: '1234' } });

    const form = roomCodeInput.closest('form');
    if (form) {
      fireEvent.submit(form);
      // Should call spectateGame asynchronously
      waitFor(() => {
        expect(mockSpectateGame).toHaveBeenCalledWith('1234');
      });
    }
  });

  it('renders footer quote', () => {
    render(<Lobby />);

    expect(screen.getByText('lobby.demonAmongUs')).toBeInTheDocument();
  });

  it('shows audio enable hint initially', () => {
    render(<Lobby />);

    expect(screen.getByTitle('lobby.clickToEnableAudio')).toBeInTheDocument();
  });

  it('plays visual effect when room code is complete', () => {
    render(<Lobby />);

    // Switch to spectator mode
    const switchButton = screen.getByText('lobby.switchToSpectator');
    fireEvent.click(switchButton);

    const roomCodeInput = screen.getByPlaceholderText('lobby.enterRoomCode');

    // Enter complete room code
    fireEvent.change(roomCodeInput, { target: { value: '1234' } });

    // The button should have visual feedback (shimmer effect)
    const enterButton = screen.getByRole('button', { name: 'lobby.enterAsSpectator' });
    expect(enterButton.className).toContain('animate-shimmer');
  });
});
