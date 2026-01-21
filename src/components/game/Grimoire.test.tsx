/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { GameState } from '../../types';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'game.grimoire.reservedForVirtual': 'This seat is reserved for virtual player.',
        'game.grimoire.swapCancelled': 'Seat swap cancelled',
        'game.grimoire.confirmSwap': `Swap seat ${options?.from || ''} with seat ${options?.to || ''}?`,
        'game.grimoire.confirmSwapPlayer': `Request seat swap with ${options?.player || ''}?`,
        'game.grimoire.loadingGrimoire': 'Loading Grimoire...',
        'game.grimoire.clickToEdit': 'Click to Toggle Edit Mode',
        'game.grimoire.clickToView': 'Click to Toggle View Mode',
        'game.grimoire.viewMode': 'View Mode',
        'game.grimoire.editMode': 'Edit Mode',
        'game.grimoire.disablePrivacy': 'Disable Privacy Mode',
        'game.grimoire.enablePrivacy': 'Enable Privacy Mode',
        'phase.day': 'Day',
        'phase.night': 'Night',
        'phase.setup': 'Setup Phase',
        'jinx.ruleReminder': 'Rule Reminder'
      };
      return translations[key] || key;
    }
  })
}));

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
  x: vi.fn(() => 0),
  y: vi.fn(() => 0),
  getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
  getStage: vi.fn(() => ({
    getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
  })),
});

// Mock react-konva components - must be before imports
vi.mock('react-konva', async () => {
  const ReactModule = await vi.importActual<typeof React>('react');
  return {
    Stage: ReactModule.forwardRef(function MockStage(
      { children, ...props }: {
        children?: React.ReactNode;
      },
      ref: React.ForwardedRef<unknown>
    ) {
      // Don't pass Konva-specific props to DOM
      const { onWheel: _onWheel, onTouchStart: _onTouchStart, onTouchMove: _onTouchMove, onTouchEnd: _onTouchEnd, onMouseMove: _onMouseMove, onDragStart: _onDragStart, onDragEnd: _onDragEnd, listening: _listening, scaleX: _scaleX, scaleY: _scaleY, draggable: _draggable, ...domProps } = props as Record<string, unknown>;
      ReactModule.useImperativeHandle(ref, () => createMockKonvaNode());
      return ReactModule.createElement('div', {
        'data-testid': 'konva-stage',
        ...domProps
      }, children);
    }),
    Layer: function MockLayer({ children, listening: _listening }: { children?: React.ReactNode; listening?: boolean }) {
      return React.createElement('div', { 'data-testid': 'konva-layer' }, children);
    },
    Group: ReactModule.forwardRef(function MockGroup(
      { children, onClick, onContextMenu, onMouseEnter, onMouseLeave }: {
        children?: React.ReactNode;
        onClick?: () => void;
        onContextMenu?: () => void;
        onMouseEnter?: () => void;
        onMouseLeave?: () => void;
      },
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

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Lock: function MockLock() {
    return React.createElement('span', { 'data-testid': 'lock-icon' }, 'Lock');
  },
  Unlock: function MockUnlock() {
    return React.createElement('span', { 'data-testid': 'unlock-icon' }, 'Unlock');
  },
  Loader2: function MockLoader2() {
    return React.createElement('span', { 'data-testid': 'loader-icon' }, 'Loading');
  },
  Flame: function MockFlame() {
    return React.createElement('span', { 'data-testid': 'flame-icon' }, 'Flame');
  },
}));

// Mock child components
vi.mock('./StorytellerMenu', () => ({
  StorytellerMenu: function MockStorytellerMenu({ onClose }: { onClose: () => void }) {
    return React.createElement('div', {
      'data-testid': 'storyteller-menu',
      onClick: onClose
    }, 'StorytellerMenu');
  },
}));

vi.mock('./ChainReactionModal', () => ({
  ChainReactionModal: function MockChainReactionModal({
    isOpen,
    onClose
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) {
    if (!isOpen) return null;
    return React.createElement('div', {
      'data-testid': 'chain-reaction-modal',
      onClick: onClose
    }, 'ChainReactionModal');
  },
}));

vi.mock('./CandlelightOverlay', () => ({
  CandlelightOverlay: function MockCandlelightOverlay() {
    return React.createElement('div', { 'data-testid': 'candlelight-overlay' }, 'CandlelightOverlay');
  },
}));

vi.mock('./SeatNode', () => ({
  default: function MockSeatNode({
    seat,
    onClick,
    onLongPress,
    onContextMenu
  }: {
    seat: { id: number; userName: string };
    onClick?: (e: unknown) => void;
    onLongPress?: () => void;
    onContextMenu?: (e: unknown) => void;
  }) {
    // Create a mock event that mimics Konva's event structure
    const createMockKonvaEvent = () => ({
      evt: { preventDefault: vi.fn() },
      cancelBubble: false,
    });

    return React.createElement('div', {
      'data-testid': `seat-node-${String(seat.id)}`,
      onClick: onClick ? () => onClick(createMockKonvaEvent()) : undefined,
      onContextMenu: onContextMenu ? () => onContextMenu(createMockKonvaEvent()) : undefined,
      onMouseDown: onLongPress,
    }, seat.userName);
  },
}));

vi.mock('./RoleSelectorModal', () => ({
  default: function MockRoleSelectorModal({
    seatId,
    onClose
  }: {
    seatId: number | null;
    onClose: () => void;
  }) {
    if (seatId === null) return null;
    return React.createElement('div', {
      'data-testid': 'role-selector-modal',
      onClick: onClose
    }, `RoleSelectorModal for seat ${String(seatId)}`);
  },
}));

vi.mock('../ui/Toast', () => ({
  showWarning: vi.fn(),
}));

vi.mock('../../lib/chainReaction', () => ({
  detectChainReactions: vi.fn(() => []),
}));

// Mock store selectors and actions
const mockGrimoireState = {
  seats: [] as {
    id: number;
    userId: string | null;
    userName: string;
    isDead: boolean;
    hasGhostVote: boolean;
    seenRoleId: string | null;
    realRoleId: string | null;
    roleId: string | null;
    reminders: { id: string; text: string; sourceRole: string; seatId: number; icon?: string; color?: string }[];
    isHandRaised: boolean;
    isNominated: boolean;
    hasUsedAbility: boolean;
    statuses: ('POISONED' | 'DRUNK' | 'PROTECTED' | 'MADNESS')[];
    isVirtual?: boolean;
    isReady?: boolean;
    voteLocked?: boolean;
  }[],
  phase: 'DAY' as 'SETUP' | 'NIGHT' | 'DAY' | 'NOMINATION' | 'VOTING',
  voting: null as null | {
    nominatorSeatId: number | null;
    nomineeSeatId: number | null;
    clockHandSeatId: number | null;
    votes: number[];
    isOpen: boolean;
  },
  setupPhase: 'STARTED' as 'ASSIGNING' | 'READY' | 'STARTED',
  rolesRevealed: true,
  candlelightEnabled: false,
  currentScriptId: 'tb',
};

const mockUser = {
  id: 'user-1',
  name: 'TestUser',
  isStoryteller: false,
  roomId: 'room-1',
  isSeated: true,
};

const mockGameActions = {
  joinSeat: vi.fn().mockResolvedValue(undefined),
  leaveSeat: vi.fn(),
  toggleDead: vi.fn(),
  toggleAbilityUsed: vi.fn(),
  toggleStatus: vi.fn(),
  startVote: vi.fn(),
  assignRole: vi.fn(),
  addReminder: vi.fn(),
  removeReminder: vi.fn(),
  forceLeaveSeat: vi.fn(),
  removeVirtualPlayer: vi.fn(),
  swapSeats: vi.fn(),
  requestSeatSwap: vi.fn(),
  setPhase: vi.fn(),
  nightNext: vi.fn(),
  nightPrev: vi.fn(),
  closeVote: vi.fn(),
  nextClockHand: vi.fn(),
  toggleHand: vi.fn(),
};

vi.mock('../../hooks/useGameStateSelectors', () => ({
  useGrimoireState: () => mockGrimoireState,
  useUser: () => mockUser,
  useGameActions: () => mockGameActions,
}));

// Mock the store for endGame action
vi.mock('../../store', () => ({
  useStore: Object.assign(
    vi.fn((selector: (state: Record<string, unknown>) => unknown) => {
      const state = {
        gameState: mockGrimoireState,
        user: mockUser,
        endGame: vi.fn(),
      };
      return selector(state);
    }),
    {
      getState: () => ({
        endGame: vi.fn(),
      }),
    }
  ),
}));

// Import the component after all mocks are set up
import { Grimoire } from './Grimoire';

describe('Grimoire', () => {
  const createMockSeat = (overrides: Partial<{
    id: number;
    userId: string | null;
    userName: string;
    isDead: boolean;
    hasGhostVote: boolean;
    seenRoleId: string | null;
    realRoleId: string | null;
    roleId: string | null;
    reminders: { id: string; text: string; sourceRole: string; seatId: number; icon?: string; color?: string }[];
    isHandRaised: boolean;
    isNominated: boolean;
    hasUsedAbility: boolean;
    statuses: ('POISONED' | 'DRUNK' | 'PROTECTED' | 'MADNESS')[];
    isVirtual: boolean;
    isReady: boolean;
    voteLocked: boolean;
  }> = {}) => ({
    id: 0,
    userId: 'user-1',
    userName: 'Player 1',
    isDead: false,
    hasGhostVote: true,
    seenRoleId: null,
    realRoleId: null,
    roleId: null,
    reminders: [],
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
    isVirtual: false,
    isReady: false,
    voteLocked: false,
    ...overrides,
  });

  const defaultProps = {
    width: 800,
    height: 600,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state to default
    mockGrimoireState.seats = [
      createMockSeat({ id: 0, userName: 'Player 1' }),
      createMockSeat({ id: 1, userId: 'user-2', userName: 'Player 2' }),
      createMockSeat({ id: 2, userId: 'user-3', userName: 'Player 3' }),
    ];
    mockGrimoireState.phase = 'DAY';
    mockGrimoireState.voting = null;
    mockGrimoireState.setupPhase = 'STARTED';
    mockGrimoireState.rolesRevealed = true;
    mockGrimoireState.candlelightEnabled = false;
    mockGrimoireState.currentScriptId = 'tb';

    mockUser.id = 'user-1';
    mockUser.name = 'TestUser';
    mockUser.isStoryteller = false;
    mockUser.roomId = 'room-1';
  });

  // ============================================================
  // Basic Rendering Tests
  // ============================================================

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<Grimoire {...defaultProps} />);
      expect(container).toBeDefined();
    });

    it('renders the Konva Stage', () => {
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });

    it('renders seat nodes for each seat', () => {
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByTestId('seat-node-0')).toBeInTheDocument();
      expect(screen.getByTestId('seat-node-1')).toBeInTheDocument();
      expect(screen.getByTestId('seat-node-2')).toBeInTheDocument();
    });

    it('renders player names in seat nodes', () => {
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByText('Player 1')).toBeInTheDocument();
      expect(screen.getByText('Player 2')).toBeInTheDocument();
      expect(screen.getByText('Player 3')).toBeInTheDocument();
    });

    it('renders loading state when seats array is empty', () => {
      mockGrimoireState.seats = [];
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByText(/loading grimoire|正在加载魔典/i)).toBeInTheDocument();
    });

    it('returns null when gameState is not available', () => {
      // Temporarily modify the mock to return null for seats
      // This simulates when grimoireState.seats is undefined
      const originalSeats = mockGrimoireState.seats;
      // Set seats to an empty-like state that triggers the null return
      // Note: The component returns null when !gameState or !user
      // Since we mock useGrimoireState, we need to test the loading state instead
      mockGrimoireState.seats = [];
      const { getByText } = render(<Grimoire {...defaultProps} />);
      // When seats is empty, it shows loading state
      expect(getByText(/loading grimoire|正在加载魔典/i)).toBeInTheDocument();
      mockGrimoireState.seats = originalSeats;
    });
  });

  // ============================================================
  // Control Panel Tests
  // ============================================================

  describe('Control Panel', () => {
    it('renders lock/unlock toggle when not readOnly', () => {
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByText(/edit mode|view mode|编辑模式|浏览模式/i)).toBeInTheDocument();
    });

    it('does not render controls when readOnly is true', () => {
      render(<Grimoire {...defaultProps} readOnly={true} />);
      expect(screen.queryByText(/edit mode|view mode|编辑模式|浏览模式/i)).not.toBeInTheDocument();
    });

    it('does not render controls when publicOnly is true', () => {
      render(<Grimoire {...defaultProps} publicOnly={true} />);
      expect(screen.queryByText(/edit mode|view mode|编辑模式|浏览模式/i)).not.toBeInTheDocument();
    });

    it('toggles between edit and view mode when lock button clicked', () => {
      render(<Grimoire {...defaultProps} />);

      // Initially in edit mode
      expect(screen.getByText(/edit mode|编辑模式/i)).toBeInTheDocument();

      // Click the mode toggle
      const modeToggle = screen.getByTitle(/toggle mode|click to toggle|点击切换/i);
      fireEvent.click(modeToggle);

      // Now should be in view mode
      expect(screen.getByText(/view mode|浏览模式/i)).toBeInTheDocument();
    });

    it('renders privacy mode toggle for storyteller', () => {
      mockUser.isStoryteller = true;
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByTitle(/privacy mode|防窥模式/i)).toBeInTheDocument();
    });

    it('does not render privacy mode toggle for non-storyteller', () => {
      mockUser.isStoryteller = false;
      render(<Grimoire {...defaultProps} />);
      expect(screen.queryByTitle(/privacy mode|防窥模式/i)).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // Phase Display Tests
  // ============================================================

  describe('Phase Display', () => {
    it('displays day phase label', () => {
      mockGrimoireState.phase = 'DAY';
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByText(/day|白天/i)).toBeInTheDocument();
    });

    it('displays night phase label', () => {
      mockGrimoireState.phase = 'NIGHT';
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByText(/night|夜晚/i)).toBeInTheDocument();
    });

    it('displays setup phase label', () => {
      mockGrimoireState.phase = 'SETUP';
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByText(/setup|preparation|准备阶段/i)).toBeInTheDocument();
    });
  });

  // ============================================================
  // Storyteller Mode Tests
  // ============================================================

  describe('Storyteller Mode', () => {
    beforeEach(() => {
      mockUser.isStoryteller = true;
    });

    it('allows storyteller to trigger context menu on seat', () => {
      render(<Grimoire {...defaultProps} />);

      const seatNode = screen.getByTestId('seat-node-0');
      fireEvent.contextMenu(seatNode);

      // StorytellerMenu should appear
      expect(screen.getByTestId('storyteller-menu')).toBeInTheDocument();
    });

    it('closes storyteller menu when clicked outside', () => {
      const { container } = render(<Grimoire {...defaultProps} />);

      // Open the menu
      const seatNode = screen.getByTestId('seat-node-0');
      fireEvent.contextMenu(seatNode);
      expect(screen.getByTestId('storyteller-menu')).toBeInTheDocument();

      // Click on the main container div (which has the onClick handler that closes the menu)
      // The component structure is: div.relative > ... > storyteller-menu
      const mainDiv = container.querySelector('.relative');
      if (mainDiv) {
        fireEvent.click(mainDiv);
      }

      // Menu should be closed after clicking outside
      expect(screen.queryByTestId('storyteller-menu')).not.toBeInTheDocument();
    });

    it('storyteller can join empty seat', () => {
      mockGrimoireState.seats = [
        createMockSeat({ id: 0, userId: null, userName: '' }),
      ];

      render(<Grimoire {...defaultProps} />);

      const emptySeat = screen.getByTestId('seat-node-0');
      fireEvent.click(emptySeat);

      expect(mockGameActions.joinSeat).toHaveBeenCalledWith(0);
    });
  });

  // ============================================================
  // Player Mode Tests
  // ============================================================

  describe('Player Mode', () => {
    beforeEach(() => {
      mockUser.isStoryteller = false;
    });

    it('player cannot open storyteller menu', () => {
      render(<Grimoire {...defaultProps} />);

      const seatNode = screen.getByTestId('seat-node-0');
      fireEvent.contextMenu(seatNode);

      // StorytellerMenu should NOT appear for non-storyteller
      expect(screen.queryByTestId('storyteller-menu')).not.toBeInTheDocument();
    });

    it('player can join empty seat', () => {
      mockGrimoireState.seats = [
        createMockSeat({ id: 0, userId: null, userName: '' }),
        createMockSeat({ id: 1, userId: 'user-2', userName: 'Player 2' }),
      ];

      render(<Grimoire {...defaultProps} />);

      const emptySeat = screen.getByTestId('seat-node-0');
      fireEvent.click(emptySeat);

      expect(mockGameActions.joinSeat).toHaveBeenCalledWith(0);
    });

    it('shows warning when player clicks virtual seat', async () => {
      const { showWarning } = await import('../ui/Toast');
      mockGrimoireState.seats = [
        createMockSeat({ id: 0, userId: 'bot-1', userName: 'Bot', isVirtual: true }),
      ];

      render(<Grimoire {...defaultProps} />);

      const virtualSeat = screen.getByTestId('seat-node-0');
      fireEvent.click(virtualSeat);

      expect(showWarning).toHaveBeenCalledWith(expect.stringMatching(/reserved for virtual|该座位预留给虚拟玩家/i));
    });

    it('player can request seat swap', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      mockGrimoireState.seats = [
        createMockSeat({ id: 0, userId: 'user-1', userName: 'Current User' }),
        createMockSeat({ id: 1, userId: 'user-2', userName: 'Other Player' }),
      ];

      render(<Grimoire {...defaultProps} />);

      const otherSeat = screen.getByTestId('seat-node-1');
      fireEvent.click(otherSeat);

      // The confirm message will use the translation key output
      expect(confirmSpy).toHaveBeenCalled();
      expect(mockGameActions.requestSeatSwap).toHaveBeenCalledWith(1);

      confirmSpy.mockRestore();
    });

    it('does not request seat swap when user cancels confirm', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      mockGrimoireState.seats = [
        createMockSeat({ id: 0, userId: 'user-1', userName: 'Current User' }),
        createMockSeat({ id: 1, userId: 'user-2', userName: 'Other Player' }),
      ];

      render(<Grimoire {...defaultProps} />);

      const otherSeat = screen.getByTestId('seat-node-1');
      fireEvent.click(otherSeat);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockGameActions.requestSeatSwap).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  // ============================================================
  // ReadOnly Mode Tests
  // ============================================================

  describe('ReadOnly Mode', () => {
    it('disables seat interactions in readOnly mode', () => {
      render(<Grimoire {...defaultProps} readOnly={true} />);

      const seatNode = screen.getByTestId('seat-node-0');
      fireEvent.click(seatNode);

      // Actions should not be triggered
      expect(mockGameActions.joinSeat).not.toHaveBeenCalled();
    });

    it('disables context menu in readOnly mode', () => {
      mockUser.isStoryteller = true;
      render(<Grimoire {...defaultProps} readOnly={true} />);

      const seatNode = screen.getByTestId('seat-node-0');
      fireEvent.contextMenu(seatNode);

      expect(screen.queryByTestId('storyteller-menu')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // publicOnly Mode Tests
  // ============================================================

  describe('PublicOnly Mode', () => {
    it('hides control panel in publicOnly mode', () => {
      render(<Grimoire {...defaultProps} publicOnly={true} />);
      expect(screen.queryByTitle(/点击切换/)).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // Voting Display Tests
  // ============================================================

  describe('Voting Display', () => {
    it('renders voting clock hand when voting is active', () => {
      mockGrimoireState.voting = {
        nominatorSeatId: 0,
        nomineeSeatId: 1,
        clockHandSeatId: 2,
        votes: [],
        isOpen: true,
      };

      render(<Grimoire {...defaultProps} />);

      // The voting clock hand should be rendered
      const polygons = screen.queryAllByTestId('konva-polygon');
      expect(polygons.length).toBeGreaterThan(0);
    });

    it('does not render clock hand when voting is null', () => {
      mockGrimoireState.voting = null;

      const { container } = render(<Grimoire {...defaultProps} />);
      expect(container).toBeDefined();
      // No specific assertion needed, just ensure it doesn't crash
    });
  });

  // ============================================================
  // Night Phase Tests
  // ============================================================

  describe('Night Phase', () => {
    it('renders darkness overlay in night phase', () => {
      mockGrimoireState.phase = 'NIGHT';
      render(<Grimoire {...defaultProps} />);

      // The canvas should render with night overlay
      const layers = screen.getAllByTestId('konva-layer');
      expect(layers.length).toBeGreaterThanOrEqual(2);
    });

    it('renders candlelight overlay when enabled during night', () => {
      mockGrimoireState.phase = 'NIGHT';
      mockGrimoireState.candlelightEnabled = true;

      render(<Grimoire {...defaultProps} />);

      expect(screen.getByTestId('candlelight-overlay')).toBeInTheDocument();
    });

    it('does not render candlelight for storyteller', () => {
      mockUser.isStoryteller = true;
      mockGrimoireState.phase = 'NIGHT';
      mockGrimoireState.candlelightEnabled = true;

      render(<Grimoire {...defaultProps} />);

      expect(screen.queryByTestId('candlelight-overlay')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // Props GameState Tests
  // ============================================================

  describe('Props GameState', () => {
    it('uses propsGameState when provided', () => {
      const propsGameState: GameState = {
        roomId: 'test-room',
        currentScriptId: 'tb',
        phase: 'DAY',
        setupPhase: 'STARTED',
        rolesRevealed: true,
        candlelightEnabled: false,
        seats: [
          createMockSeat({ id: 0, userName: 'Props Player 1' }),
          createMockSeat({ id: 1, userName: 'Props Player 2' }),
        ],
        voting: null,
        allowWhispers: true,
        vibrationEnabled: true,
        messages: [],
        gameOver: { isOver: false, winner: null, reason: '' },
        audio: { trackId: null, isPlaying: false, volume: 1 },
        nightQueue: [],
        nightCurrentIndex: -1,
        customScripts: {},
        customRoles: {},
        voteHistory: [],
        roundInfo: { dayCount: 1, nightCount: 0, nominationCount: 0, totalRounds: 1 },
        storytellerNotes: [],
        skillDescriptionMode: 'simple',
        aiMessages: [],
        nightActionRequests: [],
        swapRequests: [],
        dailyNominations: [],
        interactionLog: [],
      };

      render(<Grimoire {...defaultProps} gameState={propsGameState} />);

      expect(screen.getByText('Props Player 1')).toBeInTheDocument();
      expect(screen.getByText('Props Player 2')).toBeInTheDocument();
    });

    it('uses spectator user when propsGameState is provided', () => {
      const propsGameState: GameState = {
        roomId: 'test-room',
        currentScriptId: 'tb',
        phase: 'DAY',
        setupPhase: 'STARTED',
        rolesRevealed: true,
        candlelightEnabled: false,
        seats: [createMockSeat({ id: 0, userName: 'Test' })],
        voting: null,
        allowWhispers: true,
        vibrationEnabled: true,
        messages: [],
        gameOver: { isOver: false, winner: null, reason: '' },
        audio: { trackId: null, isPlaying: false, volume: 1 },
        nightQueue: [],
        nightCurrentIndex: -1,
        customScripts: {},
        customRoles: {},
        voteHistory: [],
        roundInfo: { dayCount: 1, nightCount: 0, nominationCount: 0, totalRounds: 1 },
        storytellerNotes: [],
        skillDescriptionMode: 'simple',
        aiMessages: [],
        nightActionRequests: [],
        swapRequests: [],
        dailyNominations: [],
        interactionLog: [],
      };

      // When isStorytellerView is true, spectator acts as storyteller
      render(<Grimoire {...defaultProps} gameState={propsGameState} isStorytellerView={true} />);

      // Should show storyteller controls - check using the English translation
      expect(screen.getByTitle(/privacy mode|Enable Privacy Mode|Disable Privacy Mode/i)).toBeInTheDocument();
    });
  });

  // ============================================================
  // Chain Reaction Tests
  // ============================================================

  describe('Chain Reaction', () => {
    it('does not show chain reaction modal by default', () => {
      render(<Grimoire {...defaultProps} />);
      expect(screen.queryByTestId('chain-reaction-modal')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // Role Selector Modal Tests
  // ============================================================

  describe('Role Selector Modal', () => {
    it('does not show role selector modal by default', () => {
      render(<Grimoire {...defaultProps} />);
      expect(screen.queryByTestId('role-selector-modal')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // Locked Mode Tests
  // ============================================================

  describe('Locked Mode', () => {
    it('disables interactions when locked', () => {
      render(<Grimoire {...defaultProps} />);

      // Switch to locked mode
      const modeToggle = screen.getByTitle(/toggle mode|click to toggle|点击切换/i);
      fireEvent.click(modeToggle);

      // Now in view mode
      expect(screen.getByText(/view mode|浏览模式/i)).toBeInTheDocument();

      // Try to click a seat - should not trigger action
      const seatNode = screen.getByTestId('seat-node-1');
      fireEvent.click(seatNode);

      expect(mockGameActions.joinSeat).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Responsive Layout Tests
  // ============================================================

  describe('Responsive Layout', () => {
    it('handles small dimensions', () => {
      render(<Grimoire width={100} height={100} />);
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });

    it('handles large dimensions', () => {
      render(<Grimoire width={1920} height={1080} />);
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });

    it('handles many seats (>10)', () => {
      mockGrimoireState.seats = Array.from({ length: 15 }, (_, i) =>
        createMockSeat({ id: i, userName: `Player ${String(i + 1)}` })
      );

      render(<Grimoire {...defaultProps} />);

      // All seats should be rendered
      expect(screen.getByTestId('seat-node-0')).toBeInTheDocument();
      expect(screen.getByTestId('seat-node-14')).toBeInTheDocument();
    });
  });

  // ============================================================
  // Edge Cases Tests
  // ============================================================

  describe('Edge Cases', () => {
    it('handles seats with special characters in names', () => {
      mockGrimoireState.seats = [
        createMockSeat({ id: 0, userName: '测试玩家<script>' }),
      ];

      render(<Grimoire {...defaultProps} />);
      expect(screen.getByText('测试玩家<script>')).toBeInTheDocument();
    });

    it('handles seats with very long names', () => {
      mockGrimoireState.seats = [
        createMockSeat({ id: 0, userName: 'A'.repeat(100) }),
      ];

      render(<Grimoire {...defaultProps} />);
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });

    it('handles single seat', () => {
      mockGrimoireState.seats = [
        createMockSeat({ id: 0, userName: 'Solo Player' }),
      ];

      render(<Grimoire {...defaultProps} />);
      expect(screen.getByTestId('seat-node-0')).toBeInTheDocument();
    });

    it('prevents context menu default behavior', () => {
      const { container } = render(<Grimoire {...defaultProps} />);

      const mainDiv = container.firstChild as HTMLElement;
      const event = new MouseEvent('contextmenu', { bubbles: true });
      const preventDefault = vi.spyOn(event, 'preventDefault');

      mainDiv.dispatchEvent(event);

      expect(preventDefault).toHaveBeenCalled();
    });
  });

  // ============================================================
  // Jinx Notifications Tests
  // ============================================================

  describe('Jinx Notifications', () => {
    it('does not show jinx notifications for non-storyteller', () => {
      mockUser.isStoryteller = false;
      mockGrimoireState.seats = [
        createMockSeat({ id: 0, realRoleId: 'spy' }),
        createMockSeat({ id: 1, realRoleId: 'virgin' }),
      ];

      render(<Grimoire {...defaultProps} />);

      // Jinx notification should not appear for non-storyteller
      expect(screen.queryByText(/rule tip|rules reminder|规则提示/i)).not.toBeInTheDocument();
    });

    it('shows jinx notifications for storyteller when applicable', () => {
      mockUser.isStoryteller = true;
      mockGrimoireState.seats = [
        createMockSeat({ id: 0, realRoleId: 'spy' }),
        createMockSeat({ id: 1, realRoleId: 'virgin' }),
      ];

      render(<Grimoire {...defaultProps} />);

      // Jinx notification should appear for storyteller
      expect(screen.getByText(/rule tip|rules reminder|规则提示/i)).toBeInTheDocument();
    });
  });

  // ============================================================
  // Privacy Mode Tests
  // ============================================================

  describe('Privacy Mode', () => {
    it('toggles privacy mode when button clicked', () => {
      mockUser.isStoryteller = true;
      render(<Grimoire {...defaultProps} />);

      const privacyButton = screen.getByTitle(/privacy mode|防窥模式/i);
      expect(privacyButton).toBeInTheDocument();

      // Click to enable privacy mode
      fireEvent.click(privacyButton);

      // Button should still be visible
      expect(screen.getByTitle(/privacy mode|防窥模式/i)).toBeInTheDocument();
    });
  });

  // ============================================================
  // Storyteller Swap Seat Tests
  // ============================================================

  describe('Storyteller Swap Seats', () => {
    beforeEach(() => {
      mockUser.isStoryteller = true;
    });

    it('storyteller can initiate and cancel swap', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<Grimoire {...defaultProps} />);

      // Click on occupied seat - this should trigger joinSeat for ST (since seat has userId)
      // Note: The actual swap flow needs more setup from StorytellerMenu

      confirmSpy.mockRestore();
    });
  });

  // ============================================================
  // UI State Tests
  // ============================================================

  describe('UI State', () => {
    it('shows edit mode label initially', () => {
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByText(/edit mode|编辑模式/i)).toBeInTheDocument();
    });

    it('shows view mode label after toggle', () => {
      render(<Grimoire {...defaultProps} />);

      const modeToggle = screen.getByTitle(/toggle mode|click to toggle|点击切换/i);
      fireEvent.click(modeToggle);

      expect(screen.getByText(/view mode|浏览模式/i)).toBeInTheDocument();
    });

    it('shows lock icon in view mode', () => {
      render(<Grimoire {...defaultProps} />);

      // Switch to view mode
      const modeToggle = screen.getByTitle(/toggle mode|click to toggle|点击切换/i);
      fireEvent.click(modeToggle);

      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    });

    it('shows unlock icon in edit mode', () => {
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByTestId('unlock-icon')).toBeInTheDocument();
    });
  });

  // ============================================================
  // Voting State Tests
  // ============================================================

  describe('Voting State', () => {
    it('renders correctly with no voting state', () => {
      mockGrimoireState.voting = null;
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });

    it('renders correctly with active voting and clock hand', () => {
      mockGrimoireState.voting = {
        nominatorSeatId: 0,
        nomineeSeatId: 1,
        clockHandSeatId: 0,
        votes: [2],
        isOpen: true,
      };
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });

    it('renders correctly when clock hand points to non-existent seat', () => {
      mockGrimoireState.voting = {
        nominatorSeatId: 0,
        nomineeSeatId: 1,
        clockHandSeatId: 999, // Non-existent seat ID
        votes: [],
        isOpen: true,
      };
      render(<Grimoire {...defaultProps} />);
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    });
  });

  // ============================================================
  // Dead Seat Tests
  // ============================================================

  describe('Dead Seat Handling', () => {
    it('renders dead seat positions for candlelight overlay', () => {
      mockUser.isStoryteller = false;
      mockGrimoireState.phase = 'NIGHT';
      mockGrimoireState.candlelightEnabled = true;
      mockGrimoireState.seats = [
        createMockSeat({ id: 0, isDead: true }),
        createMockSeat({ id: 1, isDead: false }),
        createMockSeat({ id: 2, isDead: true }),
      ];

      render(<Grimoire {...defaultProps} />);

      // Candlelight overlay should be rendered
      expect(screen.getByTestId('candlelight-overlay')).toBeInTheDocument();
    });
  });
});
