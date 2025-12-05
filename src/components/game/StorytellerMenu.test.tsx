/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StorytellerMenu } from './StorytellerMenu';
import { Seat } from '../../types';

// 不需要单独 mock framer-motion，全局 setup.ts 已处理

describe('StorytellerMenu', () => {
  const mockActions = {
    toggleDead: vi.fn(),
    toggleAbilityUsed: vi.fn(),
    toggleStatus: vi.fn(),
    addReminder: vi.fn(),
    removeReminder: vi.fn(),
    removeVirtualPlayer: vi.fn(),
    startVote: vi.fn(),
    setRoleSelectSeat: vi.fn(),
    setSwapSourceId: vi.fn(),
    forceLeaveSeat: vi.fn(),
  };

  const createMockSeat = (overrides?: Partial<Seat>): Seat => ({
    id: 0,
    userId: 'user1',
    userName: 'Player One',
    isDead: false,
    hasGhostVote: true,
    roleId: 'washerwoman',
    realRoleId: 'washerwoman',
    seenRoleId: 'washerwoman',
    reminders: [],
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
    voteLocked: false,
    isVirtual: false,
    ...overrides,
  });

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders player name', () => {
    render(
      <StorytellerMenu 
        seat={createMockSeat()} 
        onClose={mockOnClose} 
        actions={mockActions}
        currentScriptId="tb"
      />
    );
    expect(screen.getByText('Player One')).toBeInTheDocument();
  });

  it('renders seat number', () => {
    render(
      <StorytellerMenu 
        seat={createMockSeat({ id: 2 })} 
        onClose={mockOnClose} 
        actions={mockActions}
        currentScriptId="tb"
      />
    );
    expect(screen.getByText(/SEAT 3/)).toBeInTheDocument();
  });

  it('calls onClose when backdrop clicked', () => {
    const { container } = render(
      <StorytellerMenu 
        seat={createMockSeat()} 
        onClose={mockOnClose} 
        actions={mockActions}
        currentScriptId="tb"
      />
    );
    
    const backdrop = container.querySelector('.fixed');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('calls toggleDead action when alive/dead button clicked', () => {
    render(
      <StorytellerMenu 
        seat={createMockSeat()} 
        onClose={mockOnClose} 
        actions={mockActions}
        currentScriptId="tb"
      />
    );
    
    const button = screen.getByText('切换存活状态');
    fireEvent.click(button);
    
    expect(mockActions.toggleDead).toHaveBeenCalledWith(0);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls toggleAbilityUsed action when ability button clicked', () => {
    render(
      <StorytellerMenu 
        seat={createMockSeat()} 
        onClose={mockOnClose} 
        actions={mockActions}
        currentScriptId="tb"
      />
    );
    
    const button = screen.getByText('技能使用');
    fireEvent.click(button);
    
    expect(mockActions.toggleAbilityUsed).toHaveBeenCalledWith(0);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls setRoleSelectSeat when assign role clicked', () => {
    render(
      <StorytellerMenu 
        seat={createMockSeat()} 
        onClose={mockOnClose} 
        actions={mockActions}
        currentScriptId="tb"
      />
    );
    
    const button = screen.getByText('分配角色');
    fireEvent.click(button);
    
    expect(mockActions.setRoleSelectSeat).toHaveBeenCalledWith(0);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows dead status when seat is dead', () => {
    render(
      <StorytellerMenu 
        seat={createMockSeat({ isDead: true })} 
        onClose={mockOnClose} 
        actions={mockActions}
        currentScriptId="tb"
      />
    );
    expect(screen.getByText('当前: 已死亡')).toBeInTheDocument();
  });

  it('shows alive status when seat is alive', () => {
    render(
      <StorytellerMenu 
        seat={createMockSeat({ isDead: false })} 
        onClose={mockOnClose} 
        actions={mockActions}
        currentScriptId="tb"
      />
    );
    expect(screen.getByText('当前: 存活')).toBeInTheDocument();
  });

  it('shows ability used status', () => {
    render(
      <StorytellerMenu 
        seat={createMockSeat({ hasUsedAbility: true })} 
        onClose={mockOnClose} 
        actions={mockActions}
        currentScriptId="tb"
      />
    );
    expect(screen.getByText('已使用')).toBeInTheDocument();
  });

  it('shows ability not used status', () => {
    render(
      <StorytellerMenu 
        seat={createMockSeat({ hasUsedAbility: false })} 
        onClose={mockOnClose} 
        actions={mockActions}
        currentScriptId="tb"
      />
    );
    expect(screen.getByText('未使用')).toBeInTheDocument();
  });

  it('displays role icon for demon', () => {
    render(
      <StorytellerMenu 
        seat={createMockSeat({ seenRoleId: 'imp' })} 
        onClose={mockOnClose} 
        actions={mockActions}
        currentScriptId="tb"
      />
    );
    // Demon should show 👿 icon
    expect(screen.getByText('👿')).toBeInTheDocument();
  });

  it('displays placeholder when no role assigned', () => {
    render(
      <StorytellerMenu 
        seat={createMockSeat({ seenRoleId: null })} 
        onClose={mockOnClose} 
        actions={mockActions}
        currentScriptId="tb"
      />
    );
    expect(screen.getByText('👤')).toBeInTheDocument();
    expect(screen.getByText(/NO ROLE/)).toBeInTheDocument();
  });
});
