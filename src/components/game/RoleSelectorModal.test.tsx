/**
 * RoleSelectorModal Tests
 *
 * Tests for the role selection modal used by storytellers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoleSelectorModal from './RoleSelectorModal';

// Mock the constants
vi.mock('../../constants', () => ({
  ROLES: {
    washerwoman: { id: 'washerwoman', name: 'Washerwoman', team: 'TOWNSFOLK' },
    librarian: { id: 'librarian', name: 'Librarian', team: 'TOWNSFOLK' },
    drunk: { id: 'drunk', name: 'Drunk', team: 'OUTSIDER' },
    recluse: { id: 'recluse', name: 'Recluse', team: 'OUTSIDER' },
    poisoner: { id: 'poisoner', name: 'Poisoner', team: 'MINION' },
    spy: { id: 'spy', name: 'Spy', team: 'MINION' },
    imp: { id: 'imp', name: 'Imp', team: 'DEMON' },
  },
  SCRIPTS: {
    'trouble-brewing': {
      name: 'Trouble Brewing',
      roles: ['washerwoman', 'librarian', 'drunk', 'recluse', 'poisoner', 'spy', 'imp'],
    },
    'empty-script': {
      name: 'Empty Script',
      roles: [],
    },
  },
  TEAM_COLORS: {
    TOWNSFOLK: '#3B82F6',
    OUTSIDER: '#22C55E',
    MINION: '#EF4444',
    DEMON: '#DC2626',
    TRAVELER: '#8B5CF6',
    FABLED: '#F59E0B',
  },
}));

describe('RoleSelectorModal', () => {
  const mockOnAssignRole = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    seatId: 0,
    currentScriptId: 'trouble-brewing',
    onAssignRole: mockOnAssignRole,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render null when seatId is null', () => {
    const { container } = render(
      <RoleSelectorModal {...defaultProps} seatId={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render the modal with script name', () => {
    render(<RoleSelectorModal {...defaultProps} />);

    expect(screen.getByText(/Assign Role/)).toBeInTheDocument();
    expect(screen.getByText(/Trouble Brewing/)).toBeInTheDocument();
  });

  it('should display all team sections', () => {
    render(<RoleSelectorModal {...defaultProps} />);

    expect(screen.getByText('Townsfolk')).toBeInTheDocument();
    expect(screen.getByText('Outsider')).toBeInTheDocument();
    expect(screen.getByText('Minion')).toBeInTheDocument();
    expect(screen.getByText('Demon')).toBeInTheDocument();
  });

  it('should display roles from the current script', () => {
    render(<RoleSelectorModal {...defaultProps} />);

    expect(screen.getByText('Washerwoman')).toBeInTheDocument();
    expect(screen.getByText('Librarian')).toBeInTheDocument();
    expect(screen.getByText('Drunk')).toBeInTheDocument();
    expect(screen.getByText('Imp')).toBeInTheDocument();
  });

  it('should call onAssignRole and onClose when a role is clicked', () => {
    render(<RoleSelectorModal {...defaultProps} />);

    const washerwomanButton = screen.getByText('Washerwoman').closest('button');
    fireEvent.click(washerwomanButton!);

    expect(mockOnAssignRole).toHaveBeenCalledWith(0, 'washerwoman');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<RoleSelectorModal {...defaultProps} />);

    const cancelButton = screen.getByText('CANCEL');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnAssignRole).not.toHaveBeenCalled();
  });

  it('should call onAssignRole with null when clear role is clicked', () => {
    render(<RoleSelectorModal {...defaultProps} />);

    const clearButton = screen.getByText('CLEAR ROLE');
    fireEvent.click(clearButton);

    expect(mockOnAssignRole).toHaveBeenCalledWith(0, null);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when X button is clicked', () => {
    render(<RoleSelectorModal {...defaultProps} />);

    // Find the close button (Button with X icon)
    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(btn => btn.querySelector('svg'));
    fireEvent.click(xButton!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display role count for each team', () => {
    render(<RoleSelectorModal {...defaultProps} />);

    // Multiple teams have 2 roles (Townsfolk, Outsider, Minion)
    const countElements = screen.getAllByText('(2)');
    expect(countElements.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle unknown script gracefully', () => {
    render(
      <RoleSelectorModal {...defaultProps} currentScriptId="unknown-script" />
    );

    expect(screen.getByText(/Unknown Script/)).toBeInTheDocument();
  });

  it('should handle empty script roles', () => {
    render(
      <RoleSelectorModal {...defaultProps} currentScriptId="empty-script" />
    );

    // Should still render team sections but with 0 roles
    expect(screen.getByText('Townsfolk')).toBeInTheDocument();
    expect(screen.getAllByText('(0)')).toHaveLength(4); // 4 main teams
  });

  it('should use correct seatId when assigning role', () => {
    render(<RoleSelectorModal {...defaultProps} seatId={5} />);

    const impButton = screen.getByText('Imp').closest('button');
    fireEvent.click(impButton!);

    expect(mockOnAssignRole).toHaveBeenCalledWith(5, 'imp');
  });

  it('should display team icons correctly', () => {
    render(<RoleSelectorModal {...defaultProps} />);

    // Check for team emojis
    expect(screen.getAllByText('⚜️').length).toBeGreaterThan(0); // Townsfolk
    expect(screen.getAllByText('⚡').length).toBeGreaterThan(0); // Outsider
    expect(screen.getAllByText('🧪').length).toBeGreaterThan(0); // Minion
    expect(screen.getAllByText('👿').length).toBeGreaterThan(0); // Demon
  });
});
