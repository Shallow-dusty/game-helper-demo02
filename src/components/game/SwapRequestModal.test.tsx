/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SwapRequestModal } from './SwapRequestModal';
import * as storeModule from '../../store';

vi.mock('../../store', () => ({
  useStore: vi.fn(),
}));

describe('SwapRequestModal', () => {
  const mockRespondToSwapRequest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no user', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        user: null,
        gameState: null,
        respondToSwapRequest: mockRespondToSwapRequest,
      };
      return selector(state);
    });

    const { container } = render(<SwapRequestModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no swap requests for user', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        user: { id: 'user1' },
        gameState: { 
          seats: [{ seatId: 1, userId: 'user1' }],
          swapRequests: []
        },
        respondToSwapRequest: mockRespondToSwapRequest,
      };
      return selector(state);
    });

    const { container } = render(<SwapRequestModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders swap request when one exists for user', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        user: { id: 'user1' },
        gameState: { 
          seats: [{ seatId: 1, userId: 'user1' }],
          swapRequests: [{
            id: 'req1',
            fromUserId: 'user2',
            fromName: 'Alice',
            toUserId: 'user1',
            fromSeatId: 0,
            toSeatId: 1,
          }]
        },
        respondToSwapRequest: mockRespondToSwapRequest,
      };
      return selector(state);
    });

    render(<SwapRequestModal />);
    expect(screen.getByText('换座申请')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('calls respondToSwapRequest with false when reject clicked', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        user: { id: 'user1' },
        gameState: { 
          seats: [{ seatId: 1, userId: 'user1' }],
          swapRequests: [{
            id: 'req1',
            fromUserId: 'user2',
            fromName: 'Alice',
            toUserId: 'user1',
            fromSeatId: 0,
            toSeatId: 1,
          }]
        },
        respondToSwapRequest: mockRespondToSwapRequest,
      };
      return selector(state);
    });

    render(<SwapRequestModal />);
    fireEvent.click(screen.getByText(/拒绝/));
    expect(mockRespondToSwapRequest).toHaveBeenCalledWith('req1', false);
  });

  it('calls respondToSwapRequest with true when accept clicked', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        user: { id: 'user1' },
        gameState: { 
          seats: [{ seatId: 1, userId: 'user1' }],
          swapRequests: [{
            id: 'req1',
            fromUserId: 'user2',
            fromName: 'Alice',
            toUserId: 'user1',
            fromSeatId: 0,
            toSeatId: 1,
          }]
        },
        respondToSwapRequest: mockRespondToSwapRequest,
      };
      return selector(state);
    });

    render(<SwapRequestModal />);
    fireEvent.click(screen.getByText(/同意换座/));
    expect(mockRespondToSwapRequest).toHaveBeenCalledWith('req1', true);
  });
});
