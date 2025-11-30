import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../src/store';

// Reset store before each test
beforeEach(() => {
  useStore.setState({
    user: null,
    gameState: null,
    isAiThinking: false,
    isAudioBlocked: false,
    isOffline: true, // Use offline mode for testing
    connectionStatus: 'disconnected',
    aiProvider: 'deepseek',
    roleReferenceMode: 'modal',
    isSidebarExpanded: false,
    isRolePanelOpen: false,
  });
});

describe('Store: User Management', () => {
  it('should login user correctly', () => {
    const store = useStore.getState();
    store.login('TestPlayer', false);

    const { user } = useStore.getState();
    expect(user).not.toBeNull();
    expect(user?.name).toBe('TestPlayer');
    expect(user?.isStoryteller).toBe(false);
    expect(user?.id).toBeDefined();
  });

  it('should login storyteller correctly', () => {
    const store = useStore.getState();
    store.login('TestST', true);

    const { user } = useStore.getState();
    expect(user?.isStoryteller).toBe(true);
  });

  it('should persist user id across logins', () => {
    const store = useStore.getState();
    store.login('Player1', false);
    const firstId = useStore.getState().user?.id;

    // Simulate re-login
    store.login('Player2', false);
    const secondId = useStore.getState().user?.id;

    expect(firstId).toBe(secondId);
  });
});

describe('Store: Game State Management', () => {
  beforeEach(() => {
    useStore.getState().login('TestST', true);
  });

  it('should create game with correct seat count', async () => {
    const store = useStore.getState();
    await store.createGame(10);

    const { gameState } = useStore.getState();
    expect(gameState).not.toBeNull();
    expect(gameState?.seats.length).toBe(10);
    expect(gameState?.phase).toBe('SETUP');
  });

  it('should initialize seats correctly', async () => {
    const store = useStore.getState();
    await store.createGame(5);

    const { gameState } = useStore.getState();
    const firstSeat = gameState?.seats[0];

    expect(firstSeat?.id).toBe(0);
    expect(firstSeat?.userId).toBeNull();
    expect(firstSeat?.isDead).toBe(false);
    expect(firstSeat?.hasGhostVote).toBe(true);
    expect(firstSeat?.roleId).toBeNull();
  });
});

describe('Store: Phase Management', () => {
  beforeEach(async () => {
    useStore.getState().login('TestST', true);
    await useStore.getState().createGame(7);
  });

  it('should change phase correctly', () => {
    const store = useStore.getState();

    store.setPhase('NIGHT');
    expect(useStore.getState().gameState?.phase).toBe('NIGHT');

    store.setPhase('DAY');
    expect(useStore.getState().gameState?.phase).toBe('DAY');
  });

  it('should track round info on phase changes', () => {
    const store = useStore.getState();

    store.setPhase('NIGHT');
    const afterNight = useStore.getState().gameState?.roundInfo;
    expect(afterNight?.nightCount).toBe(1);
    expect(afterNight?.totalRounds).toBe(1);

    store.setPhase('DAY');
    const afterDay = useStore.getState().gameState?.roundInfo;
    expect(afterDay?.dayCount).toBe(1);
  });
});

describe('Store: Role Assignment', () => {
  beforeEach(async () => {
    useStore.getState().login('TestST', true);
    await useStore.getState().createGame(7);
  });

  it('should assign role to seat', () => {
    const store = useStore.getState();
    store.assignRole(0, 'washerwoman');

    const seat = useStore.getState().gameState?.seats[0];
    expect(seat?.roleId).toBe('washerwoman');
    expect(seat?.realRoleId).toBe('washerwoman');
    expect(seat?.seenRoleId).toBe('washerwoman');
  });

  it('should handle drunk role correctly', () => {
    const store = useStore.getState();
    store.assignRole(0, 'drunk');

    const seat = useStore.getState().gameState?.seats[0];
    expect(seat?.realRoleId).toBe('drunk');
    // Drunk sees a fake townsfolk role
    expect(seat?.seenRoleId).not.toBe('drunk');
    expect(seat?.seenRoleId).toBeDefined();
  });

  it('should clear role correctly', () => {
    const store = useStore.getState();
    store.assignRole(0, 'washerwoman');
    store.assignRole(0, null as unknown as string);

    const seat = useStore.getState().gameState?.seats[0];
    expect(seat?.roleId).toBeNull();
  });
});

describe('Store: Seat Management', () => {
  beforeEach(async () => {
    useStore.getState().login('TestST', true);
    await useStore.getState().createGame(7);
  });

  it('should add seat correctly', () => {
    const store = useStore.getState();
    const initialCount = useStore.getState().gameState?.seats.length ?? 0;

    store.addSeat();

    const newCount = useStore.getState().gameState?.seats.length;
    expect(newCount).toBe(initialCount + 1);
  });

  it('should not exceed 20 seats', () => {
    const store = useStore.getState();

    // Add seats until limit
    for (let i = 0; i < 20; i++) {
      store.addSeat();
    }

    const count = useStore.getState().gameState?.seats.length;
    expect(count).toBeLessThanOrEqual(20);
  });

  it('should remove seat correctly', () => {
    const store = useStore.getState();
    const initialCount = useStore.getState().gameState?.seats.length ?? 0;

    store.removeSeat();

    const newCount = useStore.getState().gameState?.seats.length;
    expect(newCount).toBe(initialCount - 1);
  });

  it('should not go below 5 seats', async () => {
    const store = useStore.getState();

    // Try to remove all seats
    for (let i = 0; i < 10; i++) {
      store.removeSeat();
    }

    const count = useStore.getState().gameState?.seats.length;
    expect(count).toBeGreaterThanOrEqual(5);
  });
});

describe('Store: Death and Voting', () => {
  beforeEach(async () => {
    useStore.getState().login('TestST', true);
    await useStore.getState().createGame(7);
    useStore.getState().assignRole(0, 'washerwoman');
  });

  it('should toggle death status', () => {
    const store = useStore.getState();

    store.toggleDead(0);
    expect(useStore.getState().gameState?.seats[0]?.isDead).toBe(true);
    expect(useStore.getState().gameState?.seats[0]?.hasGhostVote).toBe(true);

    store.toggleDead(0);
    expect(useStore.getState().gameState?.seats[0]?.isDead).toBe(false);
  });

  it('should trigger game over when demon dies', () => {
    const store = useStore.getState();
    store.assignRole(0, 'imp');

    store.toggleDead(0);

    const gameOver = useStore.getState().gameState?.gameOver;
    expect(gameOver?.isOver).toBe(true);
    expect(gameOver?.winner).toBe('GOOD');
  });

  it('should not trigger game over if scarlet woman exists', () => {
    const store = useStore.getState();
    store.assignRole(0, 'imp');
    store.assignRole(1, 'scarlet_woman');

    store.toggleDead(0);

    // Scarlet woman should prevent immediate game over
    const gameOver = useStore.getState().gameState?.gameOver;
    expect(gameOver?.isOver).toBe(false);
  });
});

describe('Store: Chat and Messages', () => {
  beforeEach(async () => {
    useStore.getState().login('TestPlayer', false);
    await useStore.getState().createGame(7);
  });

  it('should send public message', () => {
    const store = useStore.getState();
    const initialCount = useStore.getState().gameState?.messages.length ?? 0;

    store.sendMessage('Hello world', null);

    const messages = useStore.getState().gameState?.messages;
    expect(messages?.length).toBe(initialCount + 1);
    expect(messages?.[messages.length - 1]?.content).toBe('Hello world');
    expect(messages?.[messages.length - 1]?.recipientId).toBeNull();
  });

  it('should block whispers when disabled', () => {
    const store = useStore.getState();
    // Whispers are disabled by default
    const initialCount = useStore.getState().gameState?.messages.length ?? 0;

    store.sendMessage('Secret message', 'some-user-id');

    // Message should not be added
    expect(useStore.getState().gameState?.messages.length).toBe(initialCount);
  });

  it('should allow whispers when enabled by ST', () => {
    // Login as ST
    useStore.getState().login('TestST', true);
    const store = useStore.getState();

    store.toggleWhispers();
    expect(useStore.getState().gameState?.allowWhispers).toBe(true);

    // Now whispers should work
    const initialCount = useStore.getState().gameState?.messages.length ?? 0;
    store.sendMessage('Secret message', 'some-user-id');

    expect(useStore.getState().gameState?.messages.length).toBeGreaterThan(initialCount);
  });
});

describe('Store: Virtual Players', () => {
  beforeEach(async () => {
    useStore.getState().login('TestST', true);
    await useStore.getState().createGame(7);
  });

  it('should add virtual player', () => {
    const store = useStore.getState();

    store.addVirtualPlayer();

    const virtualSeat = useStore.getState().gameState?.seats.find(s => s.isVirtual);
    expect(virtualSeat).toBeDefined();
    expect(virtualSeat?.userName).toContain('虚拟玩家');
  });

  it('should remove virtual player', () => {
    const store = useStore.getState();

    store.addVirtualPlayer();
    const virtualSeat = useStore.getState().gameState?.seats.find(s => s.isVirtual);

    if (virtualSeat) {
      store.removeVirtualPlayer(virtualSeat.id);
    }

    const remainingVirtual = useStore.getState().gameState?.seats.find(s => s.isVirtual);
    expect(remainingVirtual).toBeUndefined();
  });
});

describe('Store: Status and Reminders', () => {
  beforeEach(async () => {
    useStore.getState().login('TestST', true);
    await useStore.getState().createGame(7);
  });

  it('should toggle status on seat', () => {
    const store = useStore.getState();

    store.toggleStatus(0, 'POISONED');
    expect(useStore.getState().gameState?.seats[0]?.statuses).toContain('POISONED');

    store.toggleStatus(0, 'POISONED');
    expect(useStore.getState().gameState?.seats[0]?.statuses).not.toContain('POISONED');
  });

  it('should add reminder to seat', () => {
    const store = useStore.getState();

    store.addReminder(0, 'Test reminder', '🔍', 'red');

    const reminders = useStore.getState().gameState?.seats[0]?.reminders;
    expect(reminders?.length).toBeGreaterThan(0);
    expect(reminders?.[0]?.text).toBe('Test reminder');
  });

  it('should remove reminder', () => {
    const store = useStore.getState();

    store.addReminder(0, 'Test reminder');
    const reminderId = useStore.getState().gameState?.seats[0]?.reminders[0]?.id;

    if (reminderId) {
      store.removeReminder(reminderId);
    }

    const reminders = useStore.getState().gameState?.seats[0]?.reminders;
    expect(reminders?.length).toBe(0);
  });
});
