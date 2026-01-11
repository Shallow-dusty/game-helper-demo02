/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Seat } from '../../types';

// Create mock Konva node object
const createMockKonvaNode = () => ({
  scaleX: vi.fn(),
  scaleY: vi.fn(),
  offsetX: vi.fn(),
  offsetY: vi.fn(),
  getLayer: vi.fn(() => ({
    add: vi.fn(),
  })),
  angle: vi.fn(),
  opacity: vi.fn(),
});

// Mock react-konva components - must be before imports
vi.mock('react-konva', async () => {
  const ReactModule = await vi.importActual<typeof React>('react');
  return {
    Group: ReactModule.forwardRef(function MockGroup(
      { children, onClick, onContextMenu, onMouseEnter, onMouseLeave }: { children?: React.ReactNode; onClick?: () => void; onContextMenu?: () => void; onMouseEnter?: () => void; onMouseLeave?: () => void },
      ref: React.ForwardedRef<unknown>
    ) {
      ReactModule.useImperativeHandle(ref, () => createMockKonvaNode());
      return ReactModule.createElement('div', {
        'data-testid': 'konva-group',
        onClick,
        onContextMenu,
        onMouseEnter,
        onMouseLeave,
      }, children);
    }),
    Circle: function MockCircle() {
      return React.createElement('div', { 'data-testid': 'konva-circle' });
    },
    Text: function MockText({ text }: { text?: string }) {
      return React.createElement('span', { 'data-testid': 'konva-text' }, text);
    },
    Rect: function MockRect() {
      return React.createElement('div', { 'data-testid': 'konva-rect' });
    },
    Ring: function MockRing() {
      return React.createElement('div', { 'data-testid': 'konva-ring' });
    },
    Arc: ReactModule.forwardRef(function MockArc(
      _props: Record<string, unknown>,
      ref: React.ForwardedRef<unknown>
    ) {
      ReactModule.useImperativeHandle(ref, () => createMockKonvaNode());
      return ReactModule.createElement('div', { 'data-testid': 'konva-arc' });
    }),
    RegularPolygon: function MockPolygon() {
      return React.createElement('div', { 'data-testid': 'konva-polygon' });
    },
  };
});

// Mock Konva
vi.mock('konva', () => ({
  default: {
    Tween: class MockTween {
      play = vi.fn();
      pause = vi.fn();
      destroy = vi.fn();
    },
    Animation: class MockAnimation {
      start = vi.fn();
      stop = vi.fn();
    },
    Easings: {
      Linear: {},
      EaseInOut: {},
    },
    Circle: class MockCircle {
      destroy = vi.fn();
    },
  },
}));

// Mock useLongPress hook
vi.mock('../../hooks/useLongPress', () => ({
  useLongPress: () => ({
    isPressing: false,
    onTouchStart: vi.fn(),
    onTouchEnd: vi.fn(),
    onTouchMove: vi.fn(),
  }),
}));

// Import after mocks are set up
import SeatNode from './SeatNode';

describe('SeatNode', () => {
  const defaultSeat: Seat = {
    id: 0,
    userId: 'user-1',
    userName: 'TestPlayer',
    seenRoleId: null,
    realRoleId: null,
    isDead: false,
    hasGhostVote: true,
    hasUsedAbility: false,
    isNominated: false,
    isHandRaised: false,
    statuses: [],
    reminders: [],
    isReady: false,
    isVirtual: false,
  };

  const defaultProps = {
    seat: defaultSeat,
    cx: 400,
    cy: 400,
    radius: 200,
    angle: 0,
    isST: false,
    isCurrentUser: false,
    scale: 1,
    onClick: vi.fn(),
    onLongPress: vi.fn(),
    onContextMenu: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<SeatNode {...defaultProps} />);
    expect(container).toBeDefined();
  });

  it('renders player name', () => {
    const { getByText } = render(<SeatNode {...defaultProps} />);
    expect(getByText('TestPlayer')).toBeInTheDocument();
  });

  it('renders seat ID as Roman numeral', () => {
    const { getByText } = render(<SeatNode {...defaultProps} />);
    // Seat 0 + 1 = 1, Roman numeral = I
    expect(getByText('I')).toBeInTheDocument();
  });

  it('renders dead indicator when seat.isDead is true', () => {
    const deadSeat = { ...defaultSeat, isDead: true };
    const { getAllByTestId } = render(<SeatNode {...defaultProps} seat={deadSeat} />);

    // Should have multiple Rect elements for the X indicator
    const rects = getAllByTestId('konva-rect');
    expect(rects.length).toBeGreaterThanOrEqual(2);
  });

  it('renders hand raised indicator when isHandRaised is true', () => {
    const handRaisedSeat = { ...defaultSeat, isHandRaised: true };
    const { getByText } = render(<SeatNode {...defaultProps} seat={handRaisedSeat} />);

    // Should render the hand emoji
    expect(getByText('✋')).toBeInTheDocument();
  });

  it('renders virtual player indicator when isVirtual is true', () => {
    const virtualSeat = { ...defaultSeat, isVirtual: true };
    const { getByText } = render(<SeatNode {...defaultProps} seat={virtualSeat} />);

    // Should render the robot emoji
    expect(getByText('🤖')).toBeInTheDocument();
  });

  it('renders ready indicator when isReady is true', () => {
    const readySeat = { ...defaultSeat, isReady: true };
    const { getByText } = render(<SeatNode {...defaultProps} seat={readySeat} />);

    // Should render the checkmark
    expect(getByText('✓')).toBeInTheDocument();
  });

  it('does not render ready indicator when setupPhase is STARTED', () => {
    const readySeat = { ...defaultSeat, isReady: true };
    const { queryByText } = render(
      <SeatNode {...defaultProps} seat={readySeat} setupPhase="STARTED" />
    );

    // Checkmark should not be rendered
    expect(queryByText('✓')).not.toBeInTheDocument();
  });

  it('renders swap source indicator when isSwapSource is true', () => {
    const { getAllByTestId } = render(
      <SeatNode {...defaultProps} isSwapSource={true} />
    );

    // Should have a Ring element for swap indicator
    const rings = getAllByTestId('konva-ring');
    expect(rings.length).toBeGreaterThan(0);
  });

  it('renders clock hand indicator when votingClockHandSeatId matches', () => {
    const { getAllByTestId } = render(
      <SeatNode {...defaultProps} votingClockHandSeatId={0} />
    );

    // Should have a Ring element for clock hand
    const rings = getAllByTestId('konva-ring');
    expect(rings.length).toBeGreaterThan(0);
  });

  it('renders ghost vote indicator when dead', () => {
    const deadSeat = { ...defaultSeat, isDead: true, hasGhostVote: true };
    const { getAllByTestId } = render(<SeatNode {...defaultProps} seat={deadSeat} />);

    // Should have Circle elements for ghost vote
    const circles = getAllByTestId('konva-circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('renders status icons for storyteller', () => {
    const seatWithStatus = { ...defaultSeat, statuses: ['DRUNK' as const, 'POISONED' as const] };
    const { getAllByTestId } = render(
      <SeatNode {...defaultProps} seat={seatWithStatus} isST={true} />
    );

    // Should have Circle elements for status icons
    const circles = getAllByTestId('konva-circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it('renders role info for storyteller', () => {
    const seatWithRole = { ...defaultSeat, seenRoleId: 'WASHERWOMAN', realRoleId: 'WASHERWOMAN' };
    const { getAllByTestId } = render(
      <SeatNode {...defaultProps} seat={seatWithRole} isST={true} />
    );

    // Should render role info group (has multiple text elements)
    const texts = getAllByTestId('konva-text');
    expect(texts.length).toBeGreaterThanOrEqual(2); // Seat ID + role name
  });

  it('renders role for current user when roles revealed', () => {
    const seatWithRole = { ...defaultSeat, seenRoleId: 'WASHERWOMAN' };
    const { getAllByTestId } = render(
      <SeatNode
        {...defaultProps}
        seat={seatWithRole}
        isCurrentUser={true}
        rolesRevealed={true}
      />
    );

    // Should render role info
    const texts = getAllByTestId('konva-text');
    expect(texts.length).toBeGreaterThanOrEqual(2);
  });

  it('does not render role for current user when roles not revealed', () => {
    const seatWithRole = { ...defaultSeat, seenRoleId: 'WASHERWOMAN' };
    const { container } = render(
      <SeatNode
        {...defaultProps}
        seat={seatWithRole}
        isCurrentUser={true}
        rolesRevealed={false}
      />
    );

    // Should not render role
    expect(container.textContent).not.toContain('洗');
  });

  it('renders reminders for storyteller', () => {
    const seatWithReminders = {
      ...defaultSeat,
      reminders: [
        { id: 'rem-1', icon: '🔮', text: 'Reminder 1' },
        { id: 'rem-2', icon: '⚡', text: 'Reminder 2' },
      ],
    };
    const { getByText } = render(
      <SeatNode {...defaultProps} seat={seatWithReminders} isST={true} />
    );

    // Should render reminder icons
    expect(getByText('🔮')).toBeInTheDocument();
    expect(getByText('⚡')).toBeInTheDocument();
  });

  it('does not render reminders for non-storyteller', () => {
    const seatWithReminders = {
      ...defaultSeat,
      reminders: [{ id: 'rem-1', icon: '🔮', text: 'Reminder' }],
    };
    const { queryByText } = render(
      <SeatNode {...defaultProps} seat={seatWithReminders} isST={false} />
    );

    // Should not render reminder
    expect(queryByText('🔮')).not.toBeInTheDocument();
  });

  it('handles disabled interactions', () => {
    const { container } = render(
      <SeatNode {...defaultProps} disableInteractions={true} />
    );

    expect(container).toBeDefined();
  });

  it('renders with used ability state', () => {
    const seatWithUsedAbility = {
      ...defaultSeat,
      seenRoleId: 'WASHERWOMAN',
      realRoleId: 'WASHERWOMAN',
      hasUsedAbility: true,
    };
    const { container } = render(
      <SeatNode {...defaultProps} seat={seatWithUsedAbility} isST={true} />
    );

    // Component renders without error
    expect(container).toBeDefined();
    expect(container.querySelector('[data-testid="konva-group"]')).toBeInTheDocument();
  });

  it('renders with misled role state', () => {
    const misledSeat = {
      ...defaultSeat,
      seenRoleId: 'WASHERWOMAN',
      realRoleId: 'IMP',
    };
    const { container } = render(
      <SeatNode {...defaultProps} seat={misledSeat} isST={true} />
    );

    // Component renders without error
    expect(container).toBeDefined();
    expect(container.querySelector('[data-testid="konva-group"]')).toBeInTheDocument();
  });

  describe('Roman numeral conversion', () => {
    it('converts seat IDs correctly', () => {
      // Test various seat IDs by checking the rendered text
      const seats = [
        { id: 0, expected: 'I' },
        { id: 3, expected: 'IV' },
        { id: 4, expected: 'V' },
        { id: 8, expected: 'IX' },
        { id: 9, expected: 'X' },
      ];

      seats.forEach(({ id, expected }) => {
        const seat = { ...defaultSeat, id };
        const { getByText, unmount } = render(<SeatNode {...defaultProps} seat={seat} />);
        expect(getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
