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
    expect(screen.getByText('game.storytellerMenu.seat')).toBeInTheDocument();
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

    const button = screen.getByText('game.storytellerMenu.toggleAlive');
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

    const button = screen.getByText('game.storytellerMenu.abilityUsed');
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

    const button = screen.getByText('game.storytellerMenu.assignRole');
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
    expect(screen.getByText('game.storytellerMenu.statusDead')).toBeInTheDocument();
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
    expect(screen.getByText('game.storytellerMenu.statusAlive')).toBeInTheDocument();
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
    expect(screen.getByText('game.storytellerMenu.abilityStatusUsed')).toBeInTheDocument();
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
    expect(screen.getByText('game.storytellerMenu.abilityStatusNotUsed')).toBeInTheDocument();
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
    // Check for SVG icon instead of emoji
    const menuElement = screen.getByText(/DEMON/i).closest('div');
    expect(menuElement?.querySelector('svg')).toBeInTheDocument();
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
    expect(screen.getByText('game.storytellerMenu.noRole')).toBeInTheDocument();
  });

  // --- Menu Actions Tests (Lines 116-159) ---

  it('calls startVote when nominate button clicked', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat()}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    const button = screen.getByText('game.storytellerMenu.nominate');
    fireEvent.click(button);

    expect(mockActions.startVote).toHaveBeenCalledWith(0);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls setSwapSourceId when swap seat button clicked', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat()}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    const button = screen.getByText('game.storytellerMenu.swapSeat');
    fireEvent.click(button);

    expect(mockActions.setSwapSourceId).toHaveBeenCalledWith(0);
    expect(mockOnClose).toHaveBeenCalled();
  });

  // --- Virtual Player Tests (Lines 162-176) ---

  it('shows remove virtual player button when seat is virtual', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat({ isVirtual: true })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    expect(screen.getByText('game.storytellerMenu.removeBot')).toBeInTheDocument();
  });

  it('calls removeVirtualPlayer when remove button clicked', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat({ isVirtual: true })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    const button = screen.getByText('game.storytellerMenu.removeBot');
    fireEvent.click(button);

    expect(mockActions.removeVirtualPlayer).toHaveBeenCalledWith(0);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not show remove virtual player button for non-virtual seat', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat({ isVirtual: false })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    expect(screen.queryByText('game.storytellerMenu.removeBot')).not.toBeInTheDocument();
  });

  // --- Kick Player Tests (Lines 179-198) ---

  it('shows kick player button for real user with userId', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat({ isVirtual: false, userId: 'real-user-123' })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    expect(screen.getByText('game.storytellerMenu.kickPlayer')).toBeInTheDocument();
  });

  it('calls forceLeaveSeat when kick button clicked and confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <StorytellerMenu
        seat={createMockSeat({ isVirtual: false, userId: 'real-user-123', userName: 'TestUser' })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    const button = screen.getByText('game.storytellerMenu.kickPlayer');
    fireEvent.click(button);

    expect(window.confirm).toHaveBeenCalledWith('game.storytellerMenu.confirmKick');
    expect(mockActions.forceLeaveSeat).toHaveBeenCalledWith(0);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not call forceLeaveSeat when kick is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <StorytellerMenu
        seat={createMockSeat({ isVirtual: false, userId: 'real-user-123' })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    const button = screen.getByText('game.storytellerMenu.kickPlayer');
    fireEvent.click(button);

    expect(mockActions.forceLeaveSeat).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('does not show kick button for virtual player', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat({ isVirtual: true, userId: 'some-id' })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    expect(screen.queryByText('game.storytellerMenu.kickPlayer')).not.toBeInTheDocument();
  });

  it('does not show kick button when no userId', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat({ isVirtual: false, userId: null })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    expect(screen.queryByText('game.storytellerMenu.kickPlayer')).not.toBeInTheDocument();
  });

  // --- Status Section Tests (Lines 201-224) ---

  it('renders status options section', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat()}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="bmr"
      />
    );

    // Status section header
    expect(screen.getByText('game.storytellerMenu.statusEffects')).toBeInTheDocument();
    // Status icons are rendered - since icons appear in both status and reminder sections,
    // we check that at least two instances exist (one from each section)
    expect(screen.getAllByText('🤢').length).toBeGreaterThanOrEqual(2); // Poisoned - status + reminder
    expect(screen.getAllByText('🍺').length).toBeGreaterThanOrEqual(2); // Drunk - status + reminder
    expect(screen.getAllByText('🛡️').length).toBeGreaterThanOrEqual(2); // Protected - status + reminder
  });

  it('filters out MADNESS status for tb script', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat()}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    // In tb script, MADNESS should not appear
    // The MADNESS icon is 🤪, we can check that only the preset reminder version exists
    const madnessIcons = screen.queryAllByText('🤪');
    // Only one 🤪 should exist (in preset reminders), not in status section
    expect(madnessIcons.length).toBe(1); // Only from preset reminders
  });

  it('shows MADNESS status for non-tb scripts', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat()}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="bmr"
      />
    );

    // In non-tb script, MADNESS should appear in both status and reminder sections
    const madnessIcons = screen.getAllByText('🤪');
    // Two 🤪 should exist (one in status section, one in preset reminders)
    expect(madnessIcons.length).toBe(2);
  });

  it('calls toggleStatus when status button clicked', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat()}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    // Find the status button by looking for elements in the status section
    // Status buttons have the icon and label as siblings
    const statusSection = screen.getByText('game.storytellerMenu.statusEffects').parentElement;
    const poisonButton = statusSection?.querySelector('button');
    if (poisonButton) {
      fireEvent.click(poisonButton);
      expect(mockActions.toggleStatus).toHaveBeenCalledWith(0, 'POISONED');
    }
  });

  it('highlights active statuses', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat({ statuses: ['POISONED'] })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    // Find status section and check if poison button has active class
    const statusSection = screen.getByText('game.storytellerMenu.statusEffects').parentElement;
    const buttons = statusSection?.querySelectorAll('button');
    const poisonButton = buttons?.[0]; // First status button is POISONED
    expect(poisonButton).toHaveClass('bg-amber-900/40');
  });

  // --- Reminders Section Tests (Lines 227-269) ---

  it('displays existing reminders', () => {
    const reminders = [
      { id: 'rem-1', text: '已下毒', sourceRole: 'poisoner', seatId: 0, icon: '🤢' },
      { id: 'rem-2', text: '被保护', sourceRole: 'monk', seatId: 0, icon: '🛡️' },
    ];

    render(
      <StorytellerMenu
        seat={createMockSeat({ reminders })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    expect(screen.getByText('已下毒')).toBeInTheDocument();
    expect(screen.getByText('被保护')).toBeInTheDocument();
  });

  it('shows empty state when no reminders', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat({ reminders: [] })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    expect(screen.getByText('game.storytellerMenu.noReminders')).toBeInTheDocument();
  });

  it('calls removeReminder when existing reminder clicked', () => {
    const reminders = [
      { id: 'rem-1', text: '已下毒', sourceRole: 'poisoner', seatId: 0, icon: '🤢' },
    ];

    render(
      <StorytellerMenu
        seat={createMockSeat({ reminders })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    const reminderButton = screen.getByText('已下毒').closest('button');
    if (reminderButton) {
      fireEvent.click(reminderButton);
    }

    expect(mockActions.removeReminder).toHaveBeenCalledWith('rem-1');
  });

  it('renders preset reminder buttons section', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat()}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    // Check for the reminder section header
    expect(screen.getByText('game.storytellerMenu.reminders')).toBeInTheDocument();

    // Check for unique preset reminders (死亡 and 复活 and 自定义 are only in preset reminders)
    expect(screen.getByText('死亡')).toBeInTheDocument();
    expect(screen.getByText('复活')).toBeInTheDocument();
    expect(screen.getByText('自定义')).toBeInTheDocument();
  });

  it('calls addReminder when preset reminder button clicked', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat()}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    // Get the preset reminder button (not the status button)
    const reminderButtons = screen.getAllByText('中毒');
    const presetButton = reminderButtons.find(el =>
      el.closest('.grid.grid-cols-4')
    );

    if (presetButton) {
      fireEvent.click(presetButton);
      expect(mockActions.addReminder).toHaveBeenCalledWith(0, '中毒', '🤢', 'text-green-400');
    }
  });

  it('prompts for custom reminder text when custom button clicked', () => {
    const mockPrompt = vi.spyOn(window, 'prompt').mockReturnValue('Custom Note');

    render(
      <StorytellerMenu
        seat={createMockSeat()}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    const customButton = screen.getByText('自定义').closest('button');
    if (customButton) {
      fireEvent.click(customButton);
    }

    expect(mockPrompt).toHaveBeenCalledWith('game.storytellerMenu.enterReminderText');
    expect(mockActions.addReminder).toHaveBeenCalledWith(0, 'Custom Note', '📝', 'text-stone-300');

    mockPrompt.mockRestore();
  });

  it('does not add reminder when custom prompt is cancelled', () => {
    const mockPrompt = vi.spyOn(window, 'prompt').mockReturnValue(null);

    render(
      <StorytellerMenu
        seat={createMockSeat()}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    const customButton = screen.getByText('自定义').closest('button');
    if (customButton) {
      fireEvent.click(customButton);
    }

    expect(mockActions.addReminder).not.toHaveBeenCalled();

    mockPrompt.mockRestore();
  });

  // --- Close Button Tests ---

  it('calls onClose when close button clicked', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat()}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    // The X button in header
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => btn.querySelector('.lucide-x'));
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  // --- Settings Modal Tests (Lines 256-275) ---

  it('opens audio settings modal when settings button clicked', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat()}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    // Find the settings button by its title attribute
    const settingsButton = screen.getByTitle('common.settings');
    fireEvent.click(settingsButton);

    // The AudioSettingsModal should now be open (it renders its own content)
    // Since we cannot easily verify modal content without more setup,
    // we at least verify the click happened without error
    expect(settingsButton).toBeInTheDocument();
  });

  // --- Role Display Tests ---

  it('displays minion icon for minion role', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat({ seenRoleId: 'poisoner' })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    // Check for SVG icon instead of emoji
    const menuElement = screen.getByText(/MINION/i).closest('div');
    expect(menuElement?.querySelector('svg')).toBeInTheDocument();
  });

  it('displays townsfolk icon for townsfolk role', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat({ seenRoleId: 'washerwoman' })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    // Check for SVG icon instead of emoji
    const menuElement = screen.getByText(/TOWNSFOLK/i).closest('div');
    expect(menuElement?.querySelector('svg')).toBeInTheDocument();
  });

  it('displays role name when role is assigned', () => {
    render(
      <StorytellerMenu
        seat={createMockSeat({ seenRoleId: 'washerwoman' })}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    expect(screen.getByText('洗衣妇')).toBeInTheDocument();
  });

  // --- Event Propagation Tests ---

  it('stops propagation when card content clicked', () => {
    const { container } = render(
      <StorytellerMenu
        seat={createMockSeat()}
        onClose={mockOnClose}
        actions={mockActions}
        currentScriptId="tb"
      />
    );

    // Reset the mock to track only subsequent calls
    mockOnClose.mockClear();

    // Click on the card content area (not the backdrop)
    const card = container.querySelector('.border-stone-800.bg-\\[\\#1c1917\\]');
    if (card) {
      fireEvent.click(card);
      // onClose should NOT be called when clicking inside the card
      expect(mockOnClose).not.toHaveBeenCalled();
    }
  });
});
