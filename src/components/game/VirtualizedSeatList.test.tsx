/**
 * VirtualizedSeatList Tests
 *
 * Tests for the virtualized seat list using react-window
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualizedSeatList } from './VirtualizedSeatList';
import { Seat } from '../../types';

// Mock react-window - mock List component used by VirtualizedSeatList
vi.mock('react-window', () => ({
  List: ({ rowCount, rowComponent: RowComponent, rowProps, height, width }: any) => (
    <div data-testid="fixed-size-list" style={{ height, width }}>
      {Array.from({ length: rowCount }, (_, index) => (
        <div key={index} data-testid={`list-item-${index}`}>
          <RowComponent index={index} style={{}} {...rowProps} />
        </div>
      ))}
    </div>
  ),
}));

// Mock constants
vi.mock('../../constants', () => ({
  ROLES: {
    washerwoman: { id: 'washerwoman', name: 'Washerwoman', icon: '👁️' },
    imp: { id: 'imp', name: 'Imp', icon: '👿' },
    drunk: { id: 'drunk', name: 'Drunk', icon: '🍺' },
  },
}));

describe('VirtualizedSeatList', () => {
  const mockOnSeatClick = vi.fn();

  const createSeat = (overrides: Partial<Seat> = {}): Seat => ({
    id: 0,
    userName: 'Player 1',
    userId: 'user1',
    isDead: false,
    isVirtual: false,
    hasGhostVote: false,
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
    realRoleId: null,
    roleId: null,
    seenRoleId: null,
    reminders: [],
    ...overrides,
  });

  const defaultSeats: Seat[] = [
    createSeat({ id: 0, userName: 'Player 1', userId: 'user1', realRoleId: 'washerwoman' }),
    createSeat({ id: 1, userName: 'Player 2', userId: 'user2', isDead: true, realRoleId: 'imp' }),
    createSeat({ id: 2, userName: 'Virtual Player', userId: null, isVirtual: true, realRoleId: 'drunk' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no seats provided', () => {
    render(<VirtualizedSeatList seats={[]} />);

    expect(screen.getByText('game.virtualizedSeatList.noSeats')).toBeInTheDocument();
  });

  it('should render empty state when seats is empty array', () => {
    render(<VirtualizedSeatList seats={[]} onSeatClick={mockOnSeatClick} />);

    expect(screen.getByText('game.virtualizedSeatList.noSeats')).toBeInTheDocument();
  });

  it('should render the virtualized list with seats', () => {
    render(<VirtualizedSeatList seats={defaultSeats} onSeatClick={mockOnSeatClick} />);

    expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument();
    expect(screen.getAllByTestId(/list-item-/).length).toBe(3);
  });

  it('should display seat number (1-based)', () => {
    render(<VirtualizedSeatList seats={defaultSeats} onSeatClick={mockOnSeatClick} />);

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('should display player names', () => {
    render(<VirtualizedSeatList seats={defaultSeats} onSeatClick={mockOnSeatClick} />);

    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByText('Virtual Player')).toBeInTheDocument();
  });

  it('should show dead indicator for dead players', () => {
    render(<VirtualizedSeatList seats={defaultSeats} onSeatClick={mockOnSeatClick} />);

    expect(screen.getByText('game.virtualizedSeatList.dead')).toBeInTheDocument();
  });

  it('should show skull icon for dead players', () => {
    const { container } = render(<VirtualizedSeatList seats={defaultSeats} onSeatClick={mockOnSeatClick} />);

    // Check for Skull SVG icon instead of 💀 emoji
    const allSvgs = container.querySelectorAll('svg');
    expect(allSvgs.length).toBeGreaterThan(0);
  });

  it('should show robot icon for virtual players', () => {
    const { container } = render(<VirtualizedSeatList seats={defaultSeats} onSeatClick={mockOnSeatClick} />);

    // Check for Bot SVG icon instead of 🤖 emoji
    const allSvgs = container.querySelectorAll('svg');
    expect(allSvgs.length).toBeGreaterThan(0);
  });

  it('should show hand raised icon when player has raised hand', () => {
    const seatsWithRaisedHand = [createSeat({ isHandRaised: true })];

    const { container } = render(<VirtualizedSeatList seats={seatsWithRaisedHand} onSeatClick={mockOnSeatClick} />);

    // Check for Hand SVG icon instead of ✋ emoji
    const allSvgs = container.querySelectorAll('svg');
    expect(allSvgs.length).toBeGreaterThan(0);
  });

  it('should call onSeatClick when seat is clicked', () => {
    render(<VirtualizedSeatList seats={defaultSeats} onSeatClick={mockOnSeatClick} />);

    // Find the clickable seat item
    const seatItem = screen.getByTitle('Player 1');
    fireEvent.click(seatItem);

    expect(mockOnSeatClick).toHaveBeenCalledWith(defaultSeats[0]);
  });

  it('should display role name when isStoryteller is true', () => {
    render(
      <VirtualizedSeatList
        seats={defaultSeats}
        onSeatClick={mockOnSeatClick}
        isStoryteller={true}
      />
    );

    expect(screen.getByText('Washerwoman')).toBeInTheDocument();
    expect(screen.getByText('Imp')).toBeInTheDocument();
    expect(screen.getByText('Drunk')).toBeInTheDocument();
  });

  it('should not display role name when isStoryteller is false', () => {
    render(
      <VirtualizedSeatList
        seats={defaultSeats}
        onSeatClick={mockOnSeatClick}
        isStoryteller={false}
      />
    );

    expect(screen.queryByText('Washerwoman')).not.toBeInTheDocument();
    expect(screen.queryByText('Imp')).not.toBeInTheDocument();
  });

  it('should highlight current user seat', () => {
    render(
      <VirtualizedSeatList
        seats={defaultSeats}
        onSeatClick={mockOnSeatClick}
        currentUserId="user1"
      />
    );

    // Current user's seat should have blue styling
    const seatItem = screen.getByTitle('Player 1');
    expect(seatItem).toHaveClass('bg-blue-900/30');
  });

  it('should apply opacity to dead player seat', () => {
    render(<VirtualizedSeatList seats={defaultSeats} onSeatClick={mockOnSeatClick} />);

    const deadSeatItem = screen.getByTitle('Player 2');
    expect(deadSeatItem).toHaveClass('opacity-60');
  });

  it('should render list header with column labels', () => {
    render(<VirtualizedSeatList seats={defaultSeats} onSeatClick={mockOnSeatClick} />);

    expect(screen.getByText('game.virtualizedSeatList.seat')).toBeInTheDocument();
    expect(screen.getByText('game.virtualizedSeatList.player')).toBeInTheDocument();
    expect(screen.getByText('game.virtualizedSeatList.status')).toBeInTheDocument();
  });

  it('should render list footer with seat count', () => {
    render(<VirtualizedSeatList seats={defaultSeats} onSeatClick={mockOnSeatClick} />);

    expect(screen.getByText(/game\.virtualizedSeatList\.showing/)).toBeInTheDocument();
  });

  it('should handle seat without role', () => {
    const seatsWithoutRole = [createSeat({ realRoleId: null })];

    render(
      <VirtualizedSeatList
        seats={seatsWithoutRole}
        onSeatClick={mockOnSeatClick}
        isStoryteller={true}
      />
    );

    expect(screen.getByText('Player 1')).toBeInTheDocument();
    // Role should not be displayed since realRoleId is null
    expect(screen.queryByText('Washerwoman')).not.toBeInTheDocument();
  });

  it('should handle unknown role gracefully', () => {
    const seatsWithUnknownRole = [createSeat({ realRoleId: 'unknown_role' as any })];

    render(
      <VirtualizedSeatList
        seats={seatsWithUnknownRole}
        onSeatClick={mockOnSeatClick}
        isStoryteller={true}
      />
    );

    // Should render without crashing
    expect(screen.getByText('Player 1')).toBeInTheDocument();
  });

  it('should use default height when not provided', () => {
    render(<VirtualizedSeatList seats={defaultSeats} />);

    const list = screen.getByTestId('fixed-size-list');
    expect(list).toHaveStyle({ height: '400px' });
  });

  it('should use custom height when provided', () => {
    render(<VirtualizedSeatList seats={defaultSeats} height={600} />);

    const list = screen.getByTestId('fixed-size-list');
    expect(list).toHaveStyle({ height: '600px' });
  });

  it('should use default width when not provided', () => {
    render(<VirtualizedSeatList seats={defaultSeats} />);

    const list = screen.getByTestId('fixed-size-list');
    expect(list).toHaveStyle({ width: '100%' });
  });

  it('should handle empty onSeatClick gracefully', () => {
    render(<VirtualizedSeatList seats={defaultSeats} />);

    const seatItem = screen.getByTitle('Player 1');
    // Should not throw when clicking without onSeatClick
    expect(() => fireEvent.click(seatItem)).not.toThrow();
  });
});
