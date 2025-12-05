/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VotingChart } from './VotingChart';
import * as storeModule from '../../store';

vi.mock('../../store', () => ({
  useStore: vi.fn(() => ({ gameState: null })),
}));

describe('VotingChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty message when no vote history', () => {
    render(<VotingChart voteHistory={[]} seats={[]} />);
    expect(screen.getByText('暂无投票记录')).toBeInTheDocument();
  });

  it('renders nothing when vote history has no records', () => {
    vi.mocked(storeModule.useStore).mockReturnValue({ gameState: null });
    render(<VotingChart />);
    expect(screen.getByText('暂无投票记录')).toBeInTheDocument();
  });

  it('renders vote info when history exists', () => {
    const voteHistory = [{
      id: 'vote1',
      round: 1,
      nominatorSeatId: 0,
      nomineeSeatId: 1,
      votes: [0, 2, 3],
      voteCount: 3,
      result: 'survived' as const,
      timestamp: Date.now(),
    }];
    const seats = [
      { id: 0, userId: 'u1', userName: 'Player1', isDead: false },
      { id: 1, userId: 'u2', userName: 'Player2', isDead: false },
      { id: 2, userId: 'u3', userName: 'Player3', isDead: false },
      { id: 3, userId: 'u4', userName: 'Player4', isDead: false },
    ];

    render(<VotingChart voteHistory={voteHistory} seats={seats as any} />);
    expect(screen.getByText('最新投票 (Latest Vote)')).toBeInTheDocument();
  });

  it('shows passed status when votes meet threshold', () => {
    const voteHistory = [{
      id: 'vote1',
      round: 1,
      nominatorSeatId: 0,
      nomineeSeatId: 1,
      votes: [0, 2, 3, 4], // 4 votes
      voteCount: 4,
      result: 'executed' as const,
      timestamp: Date.now(),
    }];
    const seats = [
      { id: 0, userId: 'u1', userName: 'Player1', isDead: false },
      { id: 1, userId: 'u2', userName: 'Player2', isDead: false },
      { id: 2, userId: 'u3', userName: 'Player3', isDead: false },
      { id: 3, userId: 'u4', userName: 'Player4', isDead: false },
      { id: 4, userId: 'u5', userName: 'Player5', isDead: false },
    ];

    render(<VotingChart voteHistory={voteHistory} seats={seats as any} />);
    expect(screen.getByText('票数足够')).toBeInTheDocument();
  });
});
