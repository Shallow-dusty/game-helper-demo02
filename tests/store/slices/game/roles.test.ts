/**
 * Game Roles Slice Tests
 *
 * 角色管理状态测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameRolesSlice } from '../../../../src/store/slices/game/roles';
import type { Seat, GameState } from '../../../../src/types';

// 创建测试座位
function createTestSeat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: 1,
    userId: null,
    userName: '',
    isDead: false,
    hasGhostVote: true,
    roleId: null,
    realRoleId: null,
    seenRoleId: null,
    reminders: [],
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
    ...overrides
  };
}

// Mock store state
const createMockStore = () => {
  type MockStoreState = {
    gameState: Partial<GameState> | null;
    user?: { id: string; name: string; isStoryteller: boolean };
    sync: () => void;
  };

  const state: MockStoreState = {
    gameState: {
      seats: [
        createTestSeat({ id: 1, userId: 'user1' }),
        createTestSeat({ id: 2, userId: 'user2' }),
        createTestSeat({ id: 3, userId: 'user3' }),
        createTestSeat({ id: 4, userId: 'user4' }),
        createTestSeat({ id: 5, userId: 'user5' })
      ],
      currentScriptId: 'tb',
      messages: [],
      rolesRevealed: false,
      phase: 'SETUP',
      setupPhase: 'ASSIGNING'
    } as Partial<GameState>,
    sync: vi.fn(),
    user: { id: 'storyteller', name: 'Storyteller', isStoryteller: true }
  };

  const set = vi.fn((fn: (state: MockStoreState) => void) => {
    fn(state);
  });

  const get = vi.fn(() => state);

  return { state, set, get };
};

describe('Game Roles Slice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let rolesSlice: ReturnType<typeof createGameRolesSlice>;

  beforeEach(() => {
    mockStore = createMockStore();
    rolesSlice = (createGameRolesSlice as any)(
      mockStore.set,
      mockStore.get
    );
  });

  describe('assignRole', () => {
    it('should assign role to a seat', () => {
      rolesSlice.assignRole(1, 'washerwoman');
      expect(mockStore.set).toHaveBeenCalled();
      expect(mockStore.state.sync).toHaveBeenCalled();
    });
  });

  describe('toggleDead', () => {
    it('should toggle seat death state', () => {
      rolesSlice.toggleDead(1);
      expect(mockStore.set).toHaveBeenCalled();

      const seat = mockStore.state.gameState?.seats?.find(s => s.id === 1);
      expect(seat?.isDead).toBe(true);
    });

    it('should toggle death back to alive', () => {
      rolesSlice.toggleDead(1);
      rolesSlice.toggleDead(1);

      const seat = mockStore.state.gameState?.seats?.find(s => s.id === 1);
      expect(seat?.isDead).toBe(false);
    });
  });

  describe('toggleAbilityUsed', () => {
    it('should toggle ability used state', () => {
      rolesSlice.toggleAbilityUsed(1);
      expect(mockStore.set).toHaveBeenCalled();

      const seat = mockStore.state.gameState?.seats?.find(s => s.id === 1);
      expect(seat?.hasUsedAbility).toBe(true);
    });
  });

  describe('toggleStatus', () => {
    it('should add status to seat', () => {
      rolesSlice.toggleStatus(1, 'POISONED');

      const seat = mockStore.state.gameState?.seats?.find(s => s.id === 1);
      expect(seat?.statuses).toContain('POISONED');
    });

    it('should remove status from seat', () => {
      rolesSlice.toggleStatus(1, 'POISONED');
      rolesSlice.toggleStatus(1, 'POISONED');

      const seat = mockStore.state.gameState?.seats?.find(s => s.id === 1);
      expect(seat?.statuses).not.toContain('POISONED');
    });
  });

  describe('addReminder', () => {
    it('should add reminder to seat', () => {
      rolesSlice.addReminder(1, 'Test reminder');

      const seat = mockStore.state.gameState?.seats?.find(s => s.id === 1);
      expect(seat?.reminders.length).toBe(1);
      expect(seat?.reminders[0]?.text).toBe('Test reminder');
    });

    it('should add reminder with icon and color', () => {
      rolesSlice.addReminder(1, 'Colored reminder', 'star', 'red');

      const seat = mockStore.state.gameState?.seats?.find(s => s.id === 1);
      expect(seat?.reminders[0]?.icon).toBe('star');
      expect(seat?.reminders[0]?.color).toBe('red');
    });
  });

  describe('removeReminder', () => {
    it('should remove reminder by id', () => {
      rolesSlice.addReminder(1, 'Test reminder');
      const seat = mockStore.state.gameState?.seats?.find(s => s.id === 1);
      const reminderId = seat?.reminders[0]?.id;

      if (reminderId) {
        rolesSlice.removeReminder(reminderId);
        expect(seat?.reminders.length).toBe(0);
      }
    });
  });

  describe('assignRoles', () => {
    it('should auto-assign roles to all seats', () => {
      rolesSlice.assignRoles();
      expect(mockStore.set).toHaveBeenCalled();
    });
  });

  describe('resetRoles', () => {
    it('should reset all roles', () => {
      // First assign a role
      rolesSlice.assignRole(1, 'washerwoman');

      // Then reset
      rolesSlice.resetRoles();

      const seats = mockStore.state.gameState?.seats;
      seats?.forEach(seat => {
        expect(seat.roleId).toBeNull();
        expect(seat.realRoleId).toBeNull();
      });
    });
  });

  describe('distributeRoles', () => {
    it('should reveal roles to players', () => {
      rolesSlice.distributeRoles();

      expect(mockStore.state.gameState?.rolesRevealed).toBe(true);
      expect(mockStore.state.gameState?.setupPhase).toBe('READY');
    });
  });

  describe('hideRoles', () => {
    it('should hide roles from players', () => {
      rolesSlice.distributeRoles();
      rolesSlice.hideRoles();

      expect(mockStore.state.gameState?.rolesRevealed).toBe(false);
    });
  });

  describe('applyStrategy', () => {
    it('should apply role strategy', () => {
      const roles = ['washerwoman', 'empath', 'chef', 'imp', 'poisoner'];
      rolesSlice.applyStrategy('Test Strategy', roles);

      expect(mockStore.set).toHaveBeenCalled();
    });
  });
});
