/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TownSquare } from './TownSquare';
import * as storeModule from '../../store';

vi.mock('../../store', () => ({
  useStore: vi.fn(),
}));

// Mock Grimoire and Confetti to simplify tests
vi.mock('./Grimoire', () => ({
  Grimoire: () => <div data-testid="grimoire">Grimoire Mock</div>,
}));

vi.mock('./Confetti', () => ({
  Confetti: () => null,
}));

describe('TownSquare', () => {
  const mockSpectateGame = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset URL
    Object.defineProperty(window, 'location', {
      value: { 
        search: '', 
        pathname: '/',
        href: 'http://localhost/',
      },
      writable: true,
    });
    window.history.pushState = vi.fn();
  });

  it('renders room code input when no room in URL', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        spectateGame: mockSpectateGame,
        gameState: null,
        connectionStatus: 'disconnected',
      };
      return selector(state);
    });

    render(<TownSquare />);
    expect(screen.getByText('game.townSquare.title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('game.townSquare.enterRoomCode')).toBeInTheDocument();
  });

  it('renders join button', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        spectateGame: mockSpectateGame,
        gameState: null,
        connectionStatus: 'disconnected',
      };
      return selector(state);
    });

    render(<TownSquare />);
    expect(screen.getByText('game.townSquare.viewButton')).toBeInTheDocument();
  });

  it('calls spectateGame when form submitted with code', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        spectateGame: mockSpectateGame,
        gameState: null,
        connectionStatus: 'disconnected',
      };
      return selector(state);
    });

    render(<TownSquare />);

    const input = screen.getByPlaceholderText('game.townSquare.enterRoomCode');
    fireEvent.change(input, { target: { value: '1234' } });
    
    const form = input.closest('form')!;
    fireEvent.submit(form);
    
    expect(mockSpectateGame).toHaveBeenCalledWith('1234');
  });
});
