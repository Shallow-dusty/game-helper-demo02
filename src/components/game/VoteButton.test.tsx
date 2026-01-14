/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoteButton } from './VoteButton';

describe('VoteButton', () => {
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default state correctly', () => {
    render(<VoteButton isRaised={false} isLocked={false} onToggle={mockOnToggle} />);
    expect(screen.getByText('game.voteButton.raiseHand')).toBeInTheDocument();
  });

  it('renders raised state', () => {
    render(<VoteButton isRaised isLocked={false} onToggle={mockOnToggle} />);
    expect(screen.getByText(/game\.voteButton\.handRaised/)).toBeInTheDocument();
  });

  it('renders locked state', () => {
    render(<VoteButton isRaised={false} isLocked onToggle={mockOnToggle} />);
    expect(screen.getByText(/game\.voteButton\.locked/)).toBeInTheDocument();
  });

  it('renders dead player ghost vote option', () => {
    render(<VoteButton isRaised={false} isLocked={false} isDead onToggle={mockOnToggle} />);
    expect(screen.getByText(/game\.voteButton\.useGhostVote/)).toBeInTheDocument();
  });

  it('renders ghost vote used state', () => {
    render(<VoteButton isRaised={false} isLocked={false} isDead hasGhostVote={false} onToggle={mockOnToggle} />);
    expect(screen.getByText('game.voteButton.ghostVoteUsed')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    render(<VoteButton isRaised={false} isLocked={false} onToggle={mockOnToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('does not call onToggle when locked', () => {
    render(<VoteButton isRaised={false} isLocked onToggle={mockOnToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnToggle).not.toHaveBeenCalled();
  });

  it('does not call onToggle when ghost vote used', () => {
    render(<VoteButton isRaised={false} isLocked={false} isDead hasGhostVote={false} onToggle={mockOnToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnToggle).not.toHaveBeenCalled();
  });
});
