import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingVoteButton } from './FloatingVoteButton';
import * as storeModule from '../../store';

vi.mock('../../store', () => ({
  useStore: vi.fn(),
}));

describe('FloatingVoteButton', () => {
  const mockToggleHand = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not in voting phase', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: { seats: [], voting: null },
        user: { id: 'user1', isStoryteller: false },
        toggleHand: mockToggleHand,
        isModalOpen: false,
      };
      return selector(state);
    });

    const { container } = render(<FloatingVoteButton />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for storyteller', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: { 
          seats: [{ seatId: 1, userId: 'user1', isDead: false, hasGhostVote: true }], 
          voting: { isOpen: true } 
        },
        user: { id: 'user1', isStoryteller: true },
        toggleHand: mockToggleHand,
        isModalOpen: false,
      };
      return selector(state);
    });

    const { container } = render(<FloatingVoteButton />);
    expect(container.firstChild).toBeNull();
  });

  it('renders vote button when voting is open for seated player', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: { 
          seats: [{ seatId: 1, userId: 'user1', isDead: false, hasGhostVote: true, voteLocked: false, isHandRaised: false }], 
          voting: { isOpen: true } 
        },
        user: { id: 'user1', isStoryteller: false },
        toggleHand: mockToggleHand,
        isModalOpen: false,
      };
      return selector(state);
    });

    render(<FloatingVoteButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls toggleHand when button clicked', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        gameState: { 
          seats: [{ seatId: 1, userId: 'user1', isDead: false, hasGhostVote: true, voteLocked: false, isHandRaised: false }], 
          voting: { isOpen: true } 
        },
        user: { id: 'user1', isStoryteller: false },
        toggleHand: mockToggleHand,
        isModalOpen: false,
      };
      return selector(state);
    });

    render(<FloatingVoteButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockToggleHand).toHaveBeenCalledTimes(1);
  });
});
