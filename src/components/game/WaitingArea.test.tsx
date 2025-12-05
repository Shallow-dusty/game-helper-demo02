/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WaitingArea } from './WaitingArea';
import * as storeModule from '../../store';

vi.mock('../../store', () => ({
  useStore: vi.fn(),
}));

describe('WaitingArea', () => {
  const mockJoinSeat = vi.fn().mockResolvedValue(undefined);
  const mockLeaveSeat = vi.fn();
  const mockToggleReady = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no game state', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: null,
        user: { id: 'user1', isStoryteller: false },
        joinSeat: mockJoinSeat,
        leaveSeat: mockLeaveSeat,
        toggleReady: mockToggleReady,
      };
      return selector(state);
    });

    const { container } = render(<WaitingArea />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no user', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: { seats: [] },
        user: null,
        joinSeat: mockJoinSeat,
        leaveSeat: mockLeaveSeat,
        toggleReady: mockToggleReady,
      };
      return selector(state);
    });

    const { container } = render(<WaitingArea />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for storyteller', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: { seats: [{ id: 0, userId: null }] },
        user: { id: 'user1', isStoryteller: true },
        joinSeat: mockJoinSeat,
        leaveSeat: mockLeaveSeat,
        toggleReady: mockToggleReady,
      };
      return selector(state);
    });

    const { container } = render(<WaitingArea />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when seats array is empty', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: { seats: [] },
        user: { id: 'user1', isStoryteller: false },
        joinSeat: mockJoinSeat,
        leaveSeat: mockLeaveSeat,
        toggleReady: mockToggleReady,
      };
      return selector(state);
    });

    const { container } = render(<WaitingArea />);
    expect(container.firstChild).toBeNull();
  });

  it('renders seat selection when user not seated', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: { 
          seats: [
            { id: 0, userId: null, userName: '座位 1' },
            { id: 1, userId: 'other', userName: 'Other' },
          ],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
        user: { id: 'user1', isStoryteller: false },
        joinSeat: mockJoinSeat,
        leaveSeat: mockLeaveSeat,
        toggleReady: mockToggleReady,
      };
      return selector(state);
    });

    render(<WaitingArea />);
    // Should show some seat selection UI
    expect(document.body.textContent).not.toBe('');
  });
});
