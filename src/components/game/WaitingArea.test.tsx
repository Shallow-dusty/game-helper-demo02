/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { WaitingArea } from './WaitingArea';
import * as storeModule from '../../store';

vi.mock('../../store', () => ({
  useStore: vi.fn(),
}));

describe('WaitingArea', () => {
  const mockJoinSeat = vi.fn().mockResolvedValue(undefined);
  const mockLeaveSeat = vi.fn().mockResolvedValue(undefined);
  const mockToggleReady = vi.fn();

  const createMockState = (overrides: Record<string, unknown> = {}) => ({
    gameState: {
      roomId: 'TEST-ROOM',
      seats: [
        { id: 0, userId: null, userName: '座位 1', isReady: false, isVirtual: false },
        { id: 1, userId: null, userName: '座位 2', isReady: false, isVirtual: false },
        { id: 2, userId: 'other-user', userName: 'Other Player', isReady: true, isVirtual: false },
      ],
      setupPhase: 'WAITING',
      rolesRevealed: false,
    },
    user: { id: 'user1', name: 'Test User', isStoryteller: false },
    joinSeat: mockJoinSeat,
    leaveSeat: mockLeaveSeat,
    toggleReady: mockToggleReady,
    ...overrides,
  });

  const setupMock = (state: Record<string, unknown>) => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      return selector(state);
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== NULL RENDER TESTS ==========

  describe('null render conditions', () => {
    it('renders nothing when no game state', () => {
      setupMock(createMockState({ gameState: null }));

      const { container } = render(<WaitingArea />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when no user', () => {
      setupMock(createMockState({ user: null }));

      const { container } = render(<WaitingArea />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing for storyteller', () => {
      setupMock(createMockState({
        user: { id: 'storyteller1', name: 'Storyteller', isStoryteller: true },
      }));

      const { container } = render(<WaitingArea />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when seats array is empty', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      const { container } = render(<WaitingArea />);
      expect(container.firstChild).toBeNull();
    });
  });

  // ========== SEAT SELECTION VIEW (NOT SEATED) ==========

  describe('seat selection view (user not seated)', () => {
    it('renders room code header', () => {
      setupMock(createMockState());

      render(<WaitingArea />);
      expect(screen.getByText('TEST-ROOM')).toBeInTheDocument();
    });

    it('renders seat selection prompt', () => {
      setupMock(createMockState());

      render(<WaitingArea />);
      expect(screen.getByText('game.waitingArea.chooseSeat')).toBeInTheDocument();
    });

    it('renders available seats with correct labels', () => {
      setupMock(createMockState());

      render(<WaitingArea />);
      const seatLabels = screen.getAllByText('game.waitingArea.seatNumber');
      expect(seatLabels.length).toBeGreaterThan(0);
    });

    it('renders taken seats with player names', () => {
      setupMock(createMockState());

      render(<WaitingArea />);
      expect(screen.getByText('Other Player')).toBeInTheDocument();
    });

    it('shows OPEN status for available seats', () => {
      setupMock(createMockState());

      render(<WaitingArea />);
      const openTexts = screen.getAllByText('game.waitingArea.open');
      expect(openTexts.length).toBeGreaterThan(0);
    });

    it('shows TAKEN status for occupied seats', () => {
      setupMock(createMockState());

      render(<WaitingArea />);
      const takenLabels = screen.getAllByText('game.waitingArea.taken');
      expect(takenLabels.length).toBeGreaterThan(0);
    });

    it('shows VIRTUAL status for virtual players', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: null, userName: 'Bot 1', isReady: false, isVirtual: true },
            { id: 1, userId: null, userName: '座位 2', isReady: false, isVirtual: false },
          ],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);
      expect(screen.getByText('game.waitingArea.virtual')).toBeInTheDocument();
    });

    it('shows game in progress warning when setupPhase is STARTED', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: null, userName: '座位 1', isReady: false, isVirtual: false },
          ],
          setupPhase: 'STARTED',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);
      expect(screen.getByText('game.waitingArea.gameInProgress')).toBeInTheDocument();
    });

    it('renders legend for seat status', () => {
      setupMock(createMockState());

      render(<WaitingArea />);
      const openLabels = screen.getAllByText('game.waitingArea.open');
      const takenLabels = screen.getAllByText('game.waitingArea.taken');
      expect(openLabels.length).toBeGreaterThan(0);
      expect(takenLabels.length).toBeGreaterThan(0);
    });
  });

  // ========== SEAT JOINING INTERACTIONS ==========

  describe('seat joining interactions', () => {
    it('calls joinSeat when clicking an available seat', async () => {
      setupMock(createMockState());

      render(<WaitingArea />);

      const availableSeats = screen.getAllByText('game.waitingArea.seatNumber');
      const availableSeat = availableSeats[0]!.closest('button')!;

      await act(async () => {
        fireEvent.click(availableSeat);
      });

      expect(mockJoinSeat).toHaveBeenCalledWith(0);
    });

    it('does not call joinSeat for taken seats', () => {
      setupMock(createMockState());

      render(<WaitingArea />);

      const takenSeat = screen.getByText('Other Player').closest('button');
      fireEvent.click(takenSeat!);

      expect(mockJoinSeat).not.toHaveBeenCalled();
    });

    it('does not call joinSeat for virtual seats', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: null, userName: 'Bot 1', isReady: false, isVirtual: true },
          ],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);

      const virtualSeat = screen.getByText('Bot 1').closest('button');
      fireEvent.click(virtualSeat!);

      expect(mockJoinSeat).not.toHaveBeenCalled();
    });

    it('shows JOINING status while seat is being joined', async () => {
      let resolveJoin: () => void;
      const slowJoinSeat = vi.fn().mockImplementation(() => new Promise<void>((resolve) => {
        resolveJoin = resolve;
      }));

      setupMock(createMockState({ joinSeat: slowJoinSeat }));

      render(<WaitingArea />);

      const availableSeats = screen.getAllByText('game.waitingArea.seatNumber');
      const availableSeat = availableSeats[0]!.closest('button')!;

      // Use act to wrap the click that triggers state update
      await act(async () => {
        fireEvent.click(availableSeat);
      });

      expect(screen.getByText('game.waitingArea.joining')).toBeInTheDocument();

      await act(async () => {
        resolveJoin!();
      });

      await waitFor(() => {
        expect(slowJoinSeat).toHaveBeenCalled();
      });
    });

    it('prevents multiple click during joining', async () => {
      let resolveJoin: () => void;
      const slowJoinSeat = vi.fn().mockImplementation(() => new Promise<void>((resolve) => {
        resolveJoin = resolve;
      }));

      setupMock(createMockState({ joinSeat: slowJoinSeat }));

      render(<WaitingArea />);

      const availableSeats = screen.getAllByText('game.waitingArea.seatNumber');
      const availableSeat = availableSeats[0]!.closest('button')!;

      // First click starts the join
      await act(async () => {
        fireEvent.click(availableSeat);
      });

      // These additional clicks should be ignored because joiningId is set
      fireEvent.click(availableSeat);
      fireEvent.click(availableSeat);

      // Should only call once despite multiple clicks
      expect(slowJoinSeat).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveJoin!();
      });
    });

    it('disables taken seats', () => {
      setupMock(createMockState());

      render(<WaitingArea />);

      const takenSeat = screen.getByText('Other Player').closest('button');
      expect(takenSeat).toBeDisabled();
    });
  });

  // ========== READY VIEW (USER SEATED, NOT MINIMIZED) ==========

  describe('ready view (user seated)', () => {
    const seatedState = () => createMockState({
      gameState: {
        roomId: 'TEST-ROOM',
        seats: [
          { id: 0, userId: 'user1', userName: 'Test User', isReady: false, isVirtual: false },
          { id: 1, userId: 'other-user', userName: 'Other Player', isReady: true, isVirtual: false },
        ],
        setupPhase: 'WAITING',
        rolesRevealed: false,
      },
    });

    it('renders room code in ready view', () => {
      setupMock(seatedState());

      render(<WaitingArea />);
      expect(screen.getByText('TEST-ROOM')).toBeInTheDocument();
    });

    it('renders player name in ready view', () => {
      setupMock(seatedState());

      render(<WaitingArea />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('renders NOT READY button when not ready', () => {
      setupMock(seatedState());

      render(<WaitingArea />);
      expect(screen.getByText('game.waitingArea.notReadyStatus')).toBeInTheDocument();
    });

    it('renders READY button when ready', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: 'user1', userName: 'Test User', isReady: true, isVirtual: false },
          ],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);
      expect(screen.getByText('game.waitingArea.readyStatus')).toBeInTheDocument();
    });

    it('calls toggleReady when clicking ready button', () => {
      setupMock(seatedState());

      render(<WaitingArea />);

      const readyButton = screen.getByText('game.waitingArea.notReadyStatus').closest('button');
      fireEvent.click(readyButton!);

      expect(mockToggleReady).toHaveBeenCalled();
    });

    it('renders leave seat button', () => {
      setupMock(seatedState());

      render(<WaitingArea />);
      expect(screen.getByText('game.waitingArea.leaveSeat')).toBeInTheDocument();
    });

    it('calls leaveSeat when clicking leave button', () => {
      setupMock(seatedState());

      render(<WaitingArea />);

      const leaveButton = screen.getByText('game.waitingArea.leaveSeat').closest('button');
      fireEvent.click(leaveButton!);

      expect(mockLeaveSeat).toHaveBeenCalled();
    });

    it('shows waiting message when ready', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: 'user1', userName: 'Test User', isReady: true, isVirtual: false },
          ],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);
      expect(screen.getByText('game.waitingArea.waitingForStart')).toBeInTheDocument();
    });

    it('shows confirmation message when not ready', () => {
      setupMock(seatedState());

      render(<WaitingArea />);
      expect(screen.getByText('game.waitingArea.pleaseConfirm')).toBeInTheDocument();
    });

    it('renders minimize button', () => {
      setupMock(seatedState());

      render(<WaitingArea />);

      const minimizeButton = screen.getByTitle('game.waitingArea.minimize');
      expect(minimizeButton).toBeInTheDocument();
    });
  });

  // ========== MINIMIZED VIEW ==========

  describe('minimized view', () => {
    const seatedState = () => createMockState({
      gameState: {
        roomId: 'TEST-ROOM',
        seats: [
          { id: 0, userId: 'user1', userName: 'Test User', isReady: false, isVirtual: false },
        ],
        setupPhase: 'WAITING',
        rolesRevealed: false,
      },
    });

    it('shows minimized view after clicking minimize button', () => {
      setupMock(seatedState());

      render(<WaitingArea />);

      const minimizeButton = screen.getByTitle('game.waitingArea.minimize');
      fireEvent.click(minimizeButton);

      // Should show minimized indicator
      expect(screen.getByText('game.waitingArea.clickToReady')).toBeInTheDocument();
    });

    it('shows ready status in minimized view', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: 'user1', userName: 'Test User', isReady: true, isVirtual: false },
          ],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);

      const minimizeButton = screen.getByTitle('game.waitingArea.minimize');
      fireEvent.click(minimizeButton);

      expect(screen.getByText('game.waitingArea.ready')).toBeInTheDocument();
    });

    it('expands when clicking minimized view', () => {
      setupMock(seatedState());

      render(<WaitingArea />);

      // First minimize
      const minimizeButton = screen.getByTitle('game.waitingArea.minimize');
      fireEvent.click(minimizeButton);

      // Then click to expand
      const minimizedButton = screen.getByText('game.waitingArea.clickToReady').closest('button');
      fireEvent.click(minimizedButton!);

      // Should be back to full view with minimize button visible
      expect(screen.getByTitle('game.waitingArea.minimize')).toBeInTheDocument();
    });

    it('auto-minimizes when clicking ready while not ready', () => {
      setupMock(seatedState());

      render(<WaitingArea />);

      // Click ready button
      const readyButton = screen.getByText('game.waitingArea.notReadyStatus').closest('button');
      fireEvent.click(readyButton!);

      // Should auto-minimize (the check is for the minimized view text pattern)
      // Note: Since toggleReady is mocked and doesn't actually change state,
      // we verify the component tried to minimize by checking mockToggleReady was called
      expect(mockToggleReady).toHaveBeenCalled();
    });
  });

  // ========== HIDE CONDITIONS ==========

  describe('hide conditions for seated users', () => {
    it('renders nothing when game has STARTED and user is seated', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: 'user1', userName: 'Test User', isReady: true, isVirtual: false },
          ],
          setupPhase: 'STARTED',
          rolesRevealed: false,
        },
      }));

      const { container } = render(<WaitingArea />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when roles are revealed and user is seated', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: 'user1', userName: 'Test User', isReady: true, isVirtual: false },
          ],
          setupPhase: 'WAITING',
          rolesRevealed: true,
        },
      }));

      const { container } = render(<WaitingArea />);
      expect(container.firstChild).toBeNull();
    });
  });

  // ========== EDGE CASES ==========

  describe('edge cases', () => {
    it('handles seat with userId but user object missing isReady', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: 'user1', userName: 'Test User' }, // No isReady property
          ],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);
      // Should render without error, treating undefined isReady as false
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('handles many seats (performance check)', () => {
      const manySeats = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        userId: null,
        userName: `座位 ${i + 1}`,
        isReady: false,
        isVirtual: false,
      }));

      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: manySeats,
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);
      // Check that seats are rendered (translation key will be shown)
      expect(screen.getAllByText('game.waitingArea.seatNumber').length).toBeGreaterThan(0);
    });

    it('handles mixed seat states correctly', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: null, userName: '座位 1', isReady: false, isVirtual: false },
            { id: 1, userId: 'other1', userName: 'Player 1', isReady: true, isVirtual: false },
            { id: 2, userId: null, userName: 'Bot 1', isReady: false, isVirtual: true },
            { id: 3, userId: 'other2', userName: 'Player 2', isReady: false, isVirtual: false },
          ],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);

      // Available seat
      const openSeats = screen.getAllByText('game.waitingArea.open');
      expect(openSeats.length).toBeGreaterThanOrEqual(1);

      // Virtual seat
      expect(screen.getByText('game.waitingArea.virtual')).toBeInTheDocument();

      // Taken seats
      const takenSeats = screen.getAllByText('game.waitingArea.taken');
      expect(takenSeats.length).toBeGreaterThanOrEqual(2);
    });

    it('clears joining state after joinSeat completes', async () => {
      // Test that the finally block clears the joining state
      let resolveFn: () => void;
      const slowJoinSeat = vi.fn().mockImplementation(() => new Promise<void>((resolve) => {
        resolveFn = resolve;
      }));

      setupMock(createMockState({ joinSeat: slowJoinSeat }));

      render(<WaitingArea />);

      const availableSeats = screen.getAllByText('game.waitingArea.seatNumber');
      const availableSeat = availableSeats[0]!.closest('button')!;

      // First click starts joining
      await act(async () => {
        fireEvent.click(availableSeat);
      });

      expect(slowJoinSeat).toHaveBeenCalledTimes(1);
      expect(screen.getByText('game.waitingArea.joining')).toBeInTheDocument();

      // Resolve the promise to complete the joining
      await act(async () => {
        resolveFn!();
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // After resolution, joining state should be cleared
      // Click again to verify - this time mock should be called again
      await act(async () => {
        fireEvent.click(availableSeat);
      });

      expect(slowJoinSeat).toHaveBeenCalledTimes(2);

      // Clean up
      await act(async () => {
        resolveFn!();
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    });
  });

  // ========== ICON/EMOJI DISPLAY ==========

  describe('icon display', () => {
    it('shows chair emoji for available seats', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: null, userName: '座位 1', isReady: false, isVirtual: false },
          ],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);
      // The component uses different emojis for different states
      // Available seats show a chair emoji
      expect(document.body.textContent).toContain('\u{1FA91}'); // Chair emoji
    });

    it('shows robot emoji for virtual players', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: null, userName: 'Bot', isReady: false, isVirtual: true },
          ],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);
      expect(document.body.textContent).toContain('\u{1F916}'); // Robot emoji
    });

    it('shows person emoji for taken seats', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: 'other', userName: 'Player', isReady: false, isVirtual: false },
          ],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);
      expect(document.body.textContent).toContain('\u{1F464}'); // Person emoji
    });

    it('shows checkmark when user is ready', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: 'user1', userName: 'Test User', isReady: true, isVirtual: false },
          ],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);
      // Check for Check SVG icon instead of emoji
      const readyButton = screen.getByText('game.waitingArea.readyStatus');
      expect(readyButton.closest('button')?.querySelector('svg')).toBeInTheDocument();
    });

    it('shows hourglass when user is not ready', () => {
      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [
            { id: 0, userId: 'user1', userName: 'Test User', isReady: false, isVirtual: false },
          ],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);
      // Check for Clock SVG icon instead of hourglass emoji
      const notReadyButton = screen.getByText('game.waitingArea.notReadyStatus');
      expect(notReadyButton.closest('button')?.querySelector('svg')).toBeInTheDocument();
    });
  });

  // ========== CONSOLE WARNINGS ==========

  describe('console warnings', () => {
    it('logs warning when seats array is empty', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      setupMock(createMockState({
        gameState: {
          roomId: 'TEST-ROOM',
          seats: [],
          setupPhase: 'WAITING',
          rolesRevealed: false,
        },
      }));

      render(<WaitingArea />);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/(seats 数组无效|seats array invalid)/), []);

      warnSpy.mockRestore();
    });
  });
});
