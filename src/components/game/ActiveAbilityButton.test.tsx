/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActiveAbilityButton, ACTIVE_ABILITY_ROLES } from './ActiveAbilityButton';
import * as storeModule from '../../store';
import { RoleDef, Seat, GamePhase } from '../../types';

vi.mock('../../store', () => ({
  useStore: vi.fn(),
}));

describe('ActiveAbilityButton', () => {
  const mockSendMessage = vi.fn();

  const createMockSeat = (overrides?: Partial<Seat>): Seat => ({
    id: 0,
    userId: 'user1',
    userName: 'Player 1',
    isDead: false,
    hasGhostVote: true,
    roleId: 'slayer',
    realRoleId: 'slayer',
    seenRoleId: 'slayer',
    reminders: [],
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
    voteLocked: false,
    isVirtual: false,
    ...overrides,
  });

  const slayerRole: RoleDef = {
    id: 'slayer',
    name: '杀手',
    team: 'TOWNSFOLK',
    ability: '白天可选择一名玩家射杀',
    firstNight: false,
    otherNight: false,
    reminders: [],
  };

  const chefRole: RoleDef = {
    id: 'chef',
    name: '厨师',
    team: 'TOWNSFOLK',
    ability: '首夜知道有多少邪恶玩家相邻',
    firstNight: true,
    otherNight: false,
    reminders: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        sendMessage: mockSendMessage,
      };
      return selector(state);
    });
  });

  describe('ACTIVE_ABILITY_ROLES', () => {
    it('should contain slayer role config', () => {
      expect(ACTIVE_ABILITY_ROLES.slayer).toBeDefined();
      expect(ACTIVE_ABILITY_ROLES.slayer.name).toBe('game.activeAbility.roles.slayer.name');
      expect(ACTIVE_ABILITY_ROLES.slayer.requiresTarget).toBe(true);
    });

    it('should contain virgin role config', () => {
      expect(ACTIVE_ABILITY_ROLES.virgin).toBeDefined();
      expect(ACTIVE_ABILITY_ROLES.virgin.requiresTarget).toBe(false);
    });
  });

  it('renders nothing for roles without active abilities', () => {
    const { container } = render(
      <ActiveAbilityButton role={chefRole} seat={createMockSeat()} gamePhase="DAY" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders ability used message when ability is used', () => {
    render(
      <ActiveAbilityButton
        role={slayerRole}
        seat={createMockSeat({ hasUsedAbility: true })}
        gamePhase="DAY"
      />
    );
    expect(screen.getByText('game.activeAbility.abilityUsed')).toBeInTheDocument();
  });

  it('renders activate button for unused ability', () => {
    render(
      <ActiveAbilityButton role={slayerRole} seat={createMockSeat()} gamePhase="DAY" />
    );
    expect(screen.getByText('game.activeAbility.roles.slayer.button')).toBeInTheDocument();
  });

  it('shows modal when clicking button for targeted ability', () => {
    render(
      <ActiveAbilityButton role={slayerRole} seat={createMockSeat()} gamePhase="DAY" />
    );

    const button = screen.getByText('game.activeAbility.roles.slayer.button');
    fireEvent.click(button);

    // Modal should appear with target input - 使用实际组件的 placeholder 文本
    expect(screen.getByPlaceholderText('game.activeAbility.enterTargetPlaceholder')).toBeInTheDocument();
  });

  it('sends message for non-targeted ability', () => {
    const virginRole: RoleDef = {
      id: 'virgin',
      name: '处女',
      team: 'TOWNSFOLK',
      ability: '被提名后处死提名者',
      firstNight: false,
      otherNight: false,
      reminders: [],
    };

    render(
      <ActiveAbilityButton role={virginRole} seat={createMockSeat({ roleId: 'virgin' })} gamePhase="DAY" />
    );

    const button = screen.getByText('game.activeAbility.roles.virgin.button');
    fireEvent.click(button);

    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.stringContaining('处女'),
      null
    );
  });

  it('disables button when not in correct phase', () => {
    render(
      <ActiveAbilityButton role={slayerRole} seat={createMockSeat()} gamePhase="NIGHT" />
    );

    const button = screen.getByText('game.activeAbility.roles.slayer.button').closest('button');
    expect(button).toBeDisabled();
  });
});
