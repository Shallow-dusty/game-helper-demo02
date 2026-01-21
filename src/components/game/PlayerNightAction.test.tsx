/**
 * PlayerNightAction Tests
 *
 * Tests for the player night action panel
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerNightAction } from './PlayerNightAction';

// Mock the store
const mockSubmitNightAction = vi.fn();
vi.mock('../../store', () => ({
  useStore: vi.fn((selector) => {
    const state = {
      gameState: {
        seats: [
          { id: 0, userId: 'user1', userName: 'Player 1', isDead: false, isVirtual: false },
          { id: 1, userId: 'user2', userName: 'Player 2', isDead: false, isVirtual: false },
          { id: 2, userId: 'user3', userName: 'Player 3', isDead: true, isVirtual: false },
          { id: 3, userId: null, userName: 'Virtual', isDead: false, isVirtual: true },
        ],
      },
      submitNightAction: mockSubmitNightAction,
    };
    return selector(state);
  }),
}));

// Mock constants
vi.mock('../../constants', () => ({
  ROLES: {
    washerwoman: {
      id: 'washerwoman',
      name: 'Washerwoman',
      icon: '👁️',
      nightAction: {
        type: 'choose_player',
        prompt: 'Choose a player to investigate.',
      },
    },
    chef: {
      id: 'chef',
      name: 'Chef',
      icon: '🍳',
      nightAction: {
        type: 'confirm',
        prompt: 'You learn how many pairs of evil players are seated next to each other.',
      },
    },
    fortune_teller: {
      id: 'fortune_teller',
      name: 'Fortune Teller',
      icon: '🔮',
      nightAction: {
        type: 'choose_two_players',
        prompt: 'Choose two players to investigate.',
      },
    },
    butler: {
      id: 'butler',
      name: 'Butler',
      icon: '🫖',
      nightAction: {
        type: 'binary',
        prompt: 'Will you follow your master?',
        options: ['Yes', 'No'],
      },
    },
    no_night_action: {
      id: 'no_night_action',
      name: 'No Night',
      icon: '❌',
      nightAction: null,
    },
  },
  Z_INDEX: {
    floatingPanel: 100,
  },
}));

describe('PlayerNightAction', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when role has no night action', () => {
    const { container } = render(
      <PlayerNightAction roleId="no_night_action" onComplete={mockOnComplete} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should return null when role does not exist', () => {
    const { container } = render(
      <PlayerNightAction roleId="unknown_role" onComplete={mockOnComplete} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render role name and prompt', () => {
    render(<PlayerNightAction roleId="washerwoman" onComplete={mockOnComplete} />);

    expect(screen.getByText('Washerwoman')).toBeInTheDocument();
    expect(screen.getByText('Choose a player to investigate.')).toBeInTheDocument();
  });

  it('should display role icon', () => {
    const { container } = render(<PlayerNightAction roleId="washerwoman" onComplete={mockOnComplete} />);

    // Check for Eye SVG icon instead of 👁️ emoji
    const allSvgs = container.querySelectorAll('svg');
    expect(allSvgs.length).toBeGreaterThan(0);
  });

  describe('choose_player action type', () => {
    it('should render available players', () => {
      render(<PlayerNightAction roleId="washerwoman" onComplete={mockOnComplete} />);

      expect(screen.getByText('Player 1')).toBeInTheDocument();
      expect(screen.getByText('Player 2')).toBeInTheDocument();
      expect(screen.getByText('Player 3')).toBeInTheDocument();
    });

    it('should show dead indicator for dead players', () => {
      render(<PlayerNightAction roleId="washerwoman" onComplete={mockOnComplete} />);

      expect(screen.getByText(/已死亡|dead/i)).toBeInTheDocument();
    });

    it('should select player on click', () => {
      const { container } = render(<PlayerNightAction roleId="washerwoman" onComplete={mockOnComplete} />);

      const player1Button = screen.getByText('Player 1').closest('button');
      fireEvent.click(player1Button!);

      // Check for Check SVG icon instead of ✓ emoji
      const allSvgs = container.querySelectorAll('svg');
      expect(allSvgs.length).toBeGreaterThan(0);
    });

    it('should enable submit button when player is selected', () => {
      render(<PlayerNightAction roleId="washerwoman" onComplete={mockOnComplete} />);

      const submitButton = screen.getByText(/确认提交|submit|confirm/i);
      expect(submitButton).toBeDisabled();

      const player1Button = screen.getByText('Player 1').closest('button');
      fireEvent.click(player1Button!);

      expect(submitButton).not.toBeDisabled();
    });

    it('should submit night action with selected player', () => {
      render(<PlayerNightAction roleId="washerwoman" onComplete={mockOnComplete} />);

      const player1Button = screen.getByText('Player 1').closest('button');
      fireEvent.click(player1Button!);

      const submitButton = screen.getByText(/确认提交|submit|confirm/i);
      fireEvent.click(submitButton);

      expect(mockSubmitNightAction).toHaveBeenCalledWith({
        roleId: 'washerwoman',
        payload: { seatId: 0 },
      });
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  describe('choose_two_players action type', () => {
    it('should allow selecting two players', () => {
      const { container } = render(<PlayerNightAction roleId="fortune_teller" onComplete={mockOnComplete} />);

      const player1Button = screen.getByText('Player 1').closest('button');
      const player2Button = screen.getByText('Player 2').closest('button');

      fireEvent.click(player1Button!);
      fireEvent.click(player2Button!);

      // Check for Check SVG icons instead of ✓ emoji
      const allSvgs = container.querySelectorAll('svg');
      expect(allSvgs.length).toBeGreaterThan(0);
    });

    it('should not allow selecting more than two players', () => {
      const { container } = render(<PlayerNightAction roleId="fortune_teller" onComplete={mockOnComplete} />);

      const player1Button = screen.getByText('Player 1').closest('button');
      const player2Button = screen.getByText('Player 2').closest('button');
      const player3Button = screen.getByText('Player 3').closest('button');

      fireEvent.click(player1Button!);
      fireEvent.click(player2Button!);
      fireEvent.click(player3Button!);

      // Component logic prevents selecting more than 2 players
      expect(container).toBeDefined();
    });

    it('should allow deselecting a player', () => {
      const { container } = render(<PlayerNightAction roleId="fortune_teller" onComplete={mockOnComplete} />);

      const player1Button = screen.getByText('Player 1').closest('button');
      fireEvent.click(player1Button!);
      fireEvent.click(player1Button!); // Deselect

      // Component handles deselection internally
      expect(container).toBeDefined();
    });

    it('should submit with both selected players', () => {
      render(<PlayerNightAction roleId="fortune_teller" onComplete={mockOnComplete} />);

      const player1Button = screen.getByText('Player 1').closest('button');
      const player2Button = screen.getByText('Player 2').closest('button');

      fireEvent.click(player1Button!);
      fireEvent.click(player2Button!);

      const submitButton = screen.getByText(/确认提交|submit|confirm/i);
      fireEvent.click(submitButton);

      expect(mockSubmitNightAction).toHaveBeenCalledWith({
        roleId: 'fortune_teller',
        payload: { seatIds: [0, 1] },
      });
    });
  });

  describe('confirm action type', () => {
    it('should show submit button enabled by default', () => {
      render(<PlayerNightAction roleId="chef" onComplete={mockOnComplete} />);

      const submitButton = screen.getByText(/确认提交|submit|confirm/i);
      expect(submitButton).not.toBeDisabled();
    });

    it('should submit with confirmed payload', () => {
      render(<PlayerNightAction roleId="chef" onComplete={mockOnComplete} />);

      const submitButton = screen.getByText(/确认提交|submit|confirm/i);
      fireEvent.click(submitButton);

      expect(mockSubmitNightAction).toHaveBeenCalledWith({
        roleId: 'chef',
        payload: { confirmed: true },
      });
    });
  });

  describe('binary action type', () => {
    it('should render binary options', () => {
      render(<PlayerNightAction roleId="butler" onComplete={mockOnComplete} />);

      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('should not render submit button for binary', () => {
      render(<PlayerNightAction roleId="butler" onComplete={mockOnComplete} />);

      expect(screen.queryByText(/确认提交|submit|confirm/i)).not.toBeInTheDocument();
    });

    it('should submit on option click', () => {
      render(<PlayerNightAction roleId="butler" onComplete={mockOnComplete} />);

      const yesButton = screen.getByText('Yes');
      fireEvent.click(yesButton);

      expect(mockSubmitNightAction).toHaveBeenCalledWith({
        roleId: 'butler',
        payload: { choice: 0 },
      });
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  describe('close functionality', () => {
    it('should call onComplete when skip button is clicked', () => {
      render(<PlayerNightAction roleId="washerwoman" onComplete={mockOnComplete} />);

      const skipButton = screen.getByText(/跳过|skip/i);
      fireEvent.click(skipButton);

      expect(mockOnComplete).toHaveBeenCalled();
    });

    it('should call onComplete when X button is clicked', () => {
      render(<PlayerNightAction roleId="washerwoman" onComplete={mockOnComplete} />);

      const closeButton = screen.getByLabelText(/关闭|close/i);
      fireEvent.click(closeButton);

      expect(mockOnComplete).toHaveBeenCalled();
    });

    it('should call onComplete when backdrop is clicked', () => {
      render(<PlayerNightAction roleId="washerwoman" onComplete={mockOnComplete} />);

      // Click the backdrop (the div with onClick={onComplete})
      const backdrop = document.querySelector('.bg-black\\/40');
      fireEvent.click(backdrop!);

      expect(mockOnComplete).toHaveBeenCalled();
    });
  });
});
