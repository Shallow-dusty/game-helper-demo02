/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhaseIndicator } from './PhaseIndicator';
import * as storeModule from '../../store';

vi.mock('../../store', () => ({
  useStore: vi.fn(),
  ConnectionStatus: {
    connecting: 'connecting',
    connected: 'connected',
    reconnecting: 'reconnecting',
    disconnected: 'disconnected',
  },
}));

describe('PhaseIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no game state', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: null,
        user: { id: 'user1', isStoryteller: false },
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    const { container } = render(<PhaseIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no user', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: { phase: 'day', seats: [] },
        user: null,
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    const { container } = render(<PhaseIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('renders game over message when game is over with good winning', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: {
          phase: 'day',
          seats: [],
          currentScriptId: 'trouble_brewing',
          gameOver: { isOver: true, winner: 'GOOD', reason: '恶魔死亡' },
        },
        user: { id: 'user1', isStoryteller: false },
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/好人胜利/)).toBeInTheDocument();
  });

  it('renders game over message when game is over with evil winning', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: {
          phase: 'day',
          seats: [],
          currentScriptId: 'trouble_brewing',
          gameOver: { isOver: true, winner: 'EVIL', reason: '只剩2人存活' },
        },
        user: { id: 'user1', isStoryteller: false },
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/邪恶胜利/)).toBeInTheDocument();
  });

  it('renders assigning phase for storyteller', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: {
          phase: 'day',
          seats: [{ userId: 'u1' }, { userId: 'u2' }],
          currentScriptId: 'trouble_brewing',
          setupPhase: 'ASSIGNING',
        },
        user: { id: 'user1', isStoryteller: true },
        isOffline: false,
        connectionStatus: 'connected',
      };
      return selector(state);
    });

    render(<PhaseIndicator />);
    expect(screen.getByText(/正在分配角色/)).toBeInTheDocument();
  });
});
