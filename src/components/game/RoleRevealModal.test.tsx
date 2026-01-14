/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RoleRevealModal } from './RoleRevealModal';
import * as storeModule from '../../store';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, ...props }: React.PropsWithChildren<{ onClick?: () => void; className?: string }>) => (
      <div {...props} onClick={onClick} className={className}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}));

// Mock the store
vi.mock('../../store', () => ({
  useStore: vi.fn(),
}));

// Mock ROLES and TEAM_COLORS from constants
vi.mock('../../constants', () => ({
  ROLES: {
    washerwoman: {
      id: 'washerwoman',
      name: '洗衣妇',
      team: 'TOWNSFOLK',
      ability: '开局时，你能得知一名镇民和一位玩家。',
      icon: '👁️',
    },
    imp: {
      id: 'imp',
      name: '小恶魔',
      team: 'DEMON',
      ability: '每晚击杀一名玩家。',
      icon: '😈',
    },
  },
  TEAM_COLORS: {
    TOWNSFOLK: '#3b82f6',
    OUTSIDER: '#0ea5e9',
    MINION: '#f97316',
    DEMON: '#ef4444',
    TRAVELER: '#a855f7',
    FABLED: '#fbbf24',
  },
}));

describe('RoleRevealModal', () => {
  const mockCloseRoleReveal = vi.fn();
  const mockUser = { id: 'user1', name: 'TestPlayer' };

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; }),
    };
  })();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    localStorageMock.clear();

    // Mock window.innerWidth and window.innerHeight for animation calculations
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMockState = (overrides: Record<string, unknown> = {}) => ({
    user: mockUser,
    gameState: {
      roomId: 'room1',
      rolesRevealed: false,
      seats: [
        { seatId: 1, userId: 'user1', roleId: 'washerwoman', seenRoleId: null },
      ],
    },
    isRoleRevealOpen: false,
    closeRoleReveal: mockCloseRoleReveal,
    ...overrides,
  });

  const setupMockStore = (state: ReturnType<typeof createMockState>) => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      return selector(state);
    });
  };

  // Helper function to advance through the full countdown and show the card
  const advanceThroughCountdown = () => {
    // 3 -> 2 (1s) -> 1 (1s) -> 0/"GAME START" (1s) -> card visible (800ms)
    // Total: 3800ms
    act(() => {
      vi.advanceTimersByTime(1000); // 3 -> 2
    });
    act(() => {
      vi.advanceTimersByTime(1000); // 2 -> 1
    });
    act(() => {
      vi.advanceTimersByTime(1000); // 1 -> 0 (GAME START)
    });
    act(() => {
      vi.advanceTimersByTime(800); // GAME START -> card visible
    });
  };

  it('renders nothing when user is null', () => {
    const state = createMockState({ user: null });
    setupMockStore(state);

    const { container } = render(<RoleRevealModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when gameState is null', () => {
    const state = createMockState({ gameState: null });
    setupMockStore(state);

    const { container } = render(<RoleRevealModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when role is not found', () => {
    const state = createMockState({
      gameState: {
        roomId: 'room1',
        rolesRevealed: false,
        seats: [
          { seatId: 1, userId: 'user1', roleId: null, seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    const { container } = render(<RoleRevealModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders countdown when manually triggered via isRoleRevealOpen', () => {
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'washerwoman', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    render(<RoleRevealModal />);

    // Should show countdown starting at 3 - use getAllByText since there's a shadow element
    expect(screen.getAllByText('3')[0]).toBeInTheDocument();
  });

  it('countdown decreases from 3 to 0 then shows GAME START', () => {
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'washerwoman', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    render(<RoleRevealModal />);

    // Initial countdown: 3 - use getAllByText since there's a shadow element
    expect(screen.getAllByText('3')[0]).toBeInTheDocument();

    // After 1 second: 2
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getAllByText('2')[0]).toBeInTheDocument();

    // After another second: 1
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getAllByText('1')[0]).toBeInTheDocument();

    // After another second: GAME START (countdown = 0)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getAllByText('game.roleReveal.gameStart')[0]).toBeInTheDocument();
  });

  it('shows role card after countdown completes', () => {
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'washerwoman', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    render(<RoleRevealModal />);

    // Advance through full countdown
    advanceThroughCountdown();

    // Should show the card cover
    expect(screen.getByText('game.roleReveal.yourIdentity')).toBeInTheDocument();
    expect(screen.getByText('game.roleReveal.clickToOpen')).toBeInTheDocument();
  });

  it('flips card when clicked', () => {
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'washerwoman', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    render(<RoleRevealModal />);

    // Advance through full countdown
    advanceThroughCountdown();

    // Find and click the card container (it has cursor-pointer class)
    const cardContainer = screen.getByText('game.roleReveal.yourIdentity').closest('.cursor-pointer');
    expect(cardContainer).toBeInTheDocument();

    if (cardContainer) {
      fireEvent.click(cardContainer);
    }

    // After flip, should show role details
    expect(screen.getByText('洗衣妇')).toBeInTheDocument();
    expect(screen.getByText('TOWNSFOLK')).toBeInTheDocument();
    expect(screen.getByText('开局时，你能得知一名镇民和一位玩家。')).toBeInTheDocument();
    expect(screen.getByText('game.roleReveal.acknowledged')).toBeInTheDocument();
  });

  it('uses seenRoleId when available (for drunk/lunatic)', () => {
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'drunk', seenRoleId: 'washerwoman' },
        ],
      },
    });
    setupMockStore(state);

    render(<RoleRevealModal />);

    // Advance through full countdown
    advanceThroughCountdown();

    const cardContainer = screen.getByText('game.roleReveal.yourIdentity').closest('.cursor-pointer');
    if (cardContainer) {
      fireEvent.click(cardContainer);
    }

    // Should show seenRoleId (washerwoman), not actual roleId (drunk)
    expect(screen.getByText('洗衣妇')).toBeInTheDocument();
  });

  it('calls closeRoleReveal and saves to localStorage when confirm button clicked', () => {
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'washerwoman', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    render(<RoleRevealModal />);

    // Advance through full countdown
    advanceThroughCountdown();

    // Flip the card
    const cardContainer = screen.getByText('game.roleReveal.yourIdentity').closest('.cursor-pointer');
    if (cardContainer) {
      fireEvent.click(cardContainer);
    }

    // Click confirm button
    fireEvent.click(screen.getByText('game.roleReveal.acknowledged'));

    // Should save to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'grimoire_last_seen_role_room1_user1',
      'washerwoman'
    );

    // Wait for exit animation (1000ms)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should call closeRoleReveal
    expect(mockCloseRoleReveal).toHaveBeenCalled();
  });

  it('countdown still shows when role is unknown but isRoleRevealOpen is true', () => {
    // This tests that the countdown triggers even if role is null
    // because the isRoleRevealOpen effect doesn't check for role
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'unknownRole', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    render(<RoleRevealModal />);

    // Countdown still shows because isRoleRevealOpen triggers it
    expect(screen.getAllByText('3')[0]).toBeInTheDocument();

    // Advance through countdown
    advanceThroughCountdown();

    // After countdown, component returns null because role is not found
    // The isVisible check fails at line 156 (!isVisible || !role) return null
    const { container } = render(<RoleRevealModal />);
    // Re-render shows nothing because now isVisible is true but role is null
  });

  it('clears localStorage when rolesRevealed becomes false and lastSeenRoleId exists', () => {
    // Create a mock state where we simulate there's an existing localStorage entry
    const state = createMockState({
      gameState: {
        roomId: 'room1',
        rolesRevealed: false,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'washerwoman', seenRoleId: null },
        ],
      },
    });

    // Set up the localStorage to return the stored value
    localStorageMock.getItem.mockReturnValueOnce('washerwoman');

    setupMockStore(state);

    render(<RoleRevealModal />);

    // Should remove the stored role when rolesRevealed is false
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('grimoire_last_seen_role_room1_user1');
  });

  it('renders with DEMON team color for demon role', () => {
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'imp', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    render(<RoleRevealModal />);

    // Advance through full countdown
    advanceThroughCountdown();

    // Flip the card
    const cardContainer = screen.getByText('game.roleReveal.yourIdentity').closest('.cursor-pointer');
    if (cardContainer) {
      fireEvent.click(cardContainer);
    }

    // Should show demon role
    expect(screen.getByText('小恶魔')).toBeInTheDocument();
    expect(screen.getByText('DEMON')).toBeInTheDocument();
  });

  it('handles user not having a seat', () => {
    const state = createMockState({
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'other_user', roleId: 'washerwoman', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    const { container } = render(<RoleRevealModal />);

    // Should render nothing because user has no seat/role
    expect(container.firstChild).toBeNull();
  });

  it('does not restart countdown on rerender', () => {
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'washerwoman', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    const { rerender } = render(<RoleRevealModal />);

    // Start countdown - use getAllByText since there's a shadow element
    expect(screen.getAllByText('3')[0]).toBeInTheDocument();

    // Advance time partially
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getAllByText('2')[0]).toBeInTheDocument();

    // Rerender with same props - should continue countdown, not restart
    rerender(<RoleRevealModal />);
    expect(screen.getAllByText('2')[0]).toBeInTheDocument();
  });

  it('confirm button saves to localStorage and triggers close', () => {
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'washerwoman', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    render(<RoleRevealModal />);

    // Advance through full countdown
    advanceThroughCountdown();

    // Flip the card
    const cardContainer = screen.getByText('game.roleReveal.yourIdentity').closest('.cursor-pointer');
    if (cardContainer) {
      fireEvent.click(cardContainer);
    }

    // The confirm button should exist
    const confirmButton = screen.getByText('game.roleReveal.acknowledged').closest('button');
    expect(confirmButton).toBeInTheDocument();

    if (confirmButton) {
      fireEvent.click(confirmButton);

      // Verify localStorage was called (confirms button handler ran)
      expect(localStorageMock.setItem).toHaveBeenCalled();
    }
  });

  it('renders eye icon on card cover', () => {
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'washerwoman', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    render(<RoleRevealModal />);

    // Advance through full countdown
    advanceThroughCountdown();

    // Should show the eye emoji on the cover (the card cover has a static eye emoji)
    // Using getAllByText because both cover and flipped card may have the icon
    const icons = screen.getAllByText('👁️');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('displays role icon when card is flipped', () => {
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'washerwoman', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    render(<RoleRevealModal />);

    // Advance through full countdown
    advanceThroughCountdown();

    // Flip the card
    const cardContainer = screen.getByText('game.roleReveal.yourIdentity').closest('.cursor-pointer');
    if (cardContainer) {
      fireEvent.click(cardContainer);
    }

    // The role icon should be displayed
    // Both card cover eye icon and role icon are '👁️' for washerwoman in our mock
    const icons = screen.getAllByText('👁️');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('shows ability text when card is flipped', () => {
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'imp', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    render(<RoleRevealModal />);

    // Advance through full countdown
    advanceThroughCountdown();

    // Flip the card
    const cardContainer = screen.getByText('game.roleReveal.yourIdentity').closest('.cursor-pointer');
    if (cardContainer) {
      fireEvent.click(cardContainer);
    }

    // Should show the ability text
    expect(screen.getByText('每晚击杀一名玩家。')).toBeInTheDocument();
  });

  it('does not flip card when already flipped', () => {
    const state = createMockState({
      isRoleRevealOpen: true,
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [
          { seatId: 1, userId: 'user1', roleId: 'washerwoman', seenRoleId: null },
        ],
      },
    });
    setupMockStore(state);

    render(<RoleRevealModal />);

    // Advance through full countdown
    advanceThroughCountdown();

    // Get card container and flip
    const cardContainer = screen.getByText('game.roleReveal.yourIdentity').closest('.cursor-pointer');
    expect(cardContainer).toBeInTheDocument();

    if (cardContainer) {
      // First click - flips the card
      fireEvent.click(cardContainer);
      expect(screen.getByText('洗衣妇')).toBeInTheDocument();

      // Second click - should NOT unflip (the component prevents re-flipping)
      fireEvent.click(cardContainer);
      // The role name should still be visible
      expect(screen.getByText('洗衣妇')).toBeInTheDocument();
    }
  });

  it('handles empty seats array', () => {
    const state = createMockState({
      gameState: {
        roomId: 'room1',
        rolesRevealed: true,
        seats: [],
      },
    });
    setupMockStore(state);

    const { container } = render(<RoleRevealModal />);

    // Should render nothing because user has no seat
    expect(container.firstChild).toBeNull();
  });
});
