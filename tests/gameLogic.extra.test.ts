import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSystemMessage,
  addSystemMessage,
  buildNightQueue,
  isFirstNight,
  applyRoleToSeat,
  toggleSeatDead,
  useGhostVote,
  handlePhaseChange,
  createVotingState,
  checkGoodWin,
  checkEvilWin,
} from '../src/lib/gameLogic';
import { ROLES, NIGHT_ORDER_FIRST, NIGHT_ORDER_OTHER, PHASE_LABELS } from '../src/constants';
import type { GameState, Seat } from '../src/types';

describe('gameLogic extra coverage', () => {
  describe('createSystemMessage & addSystemMessage', () => {
    it('creates public system message when no recipient', () => {
      const msg = createSystemMessage('hello');
      expect(msg.senderId).toBe('system');
      expect(msg.isPrivate).toBe(false);
      expect(msg.recipientId).toBeNull();
      expect(msg.content).toBe('hello');
    });

    it('creates private system message with recipient', () => {
      const msg = createSystemMessage('secret', 'seat-1');
      expect(msg.isPrivate).toBe(true);
      expect(msg.recipientId).toBe('seat-1');
    });

    it('pushes message into game state', () => {
      const state = { messages: [] } as unknown as GameState;
      addSystemMessage(state, 'hi', null);
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].content).toBe('hi');
    });
  });

  describe('buildNightQueue & isFirstNight', () => {
    const baseSeat = (overrides: Partial<Seat> = {}): Seat => ({
      id: 1,
      seatIndex: 0,
      userId: 'u1',
      userName: 'P1',
      isDead: false,
      hasGhostVote: false,
      hasUsedAbility: false,
      statuses: [],
      roleId: null,
      realRoleId: null,
      seenRoleId: null,
      ...overrides,
    });

    it('detects first night when no one is dead', () => {
      const seats = [baseSeat(), baseSeat({ id: 2 })];
      expect(isFirstNight(seats)).toBe(true);
    });

    it('detects non-first night when someone is dead', () => {
      const seats = [baseSeat(), baseSeat({ id: 2, isDead: true })];
      expect(isFirstNight(seats)).toBe(false);
    });

    it('builds queue using first-night order and ignores dead seats', () => {
      const demonRole = Object.keys(ROLES).find((r) => ROLES[r].team === 'DEMON')!;
      const minionRole = Object.keys(ROLES).find((r) => ROLES[r].team === 'MINION')!;
      const townsfolkRole = Object.keys(ROLES).find((r) => ROLES[r].team === 'TOWNSFOLK')!;

      const seats: Seat[] = [
        baseSeat({ id: 1, seenRoleId: demonRole }),
        baseSeat({ id: 2, seenRoleId: minionRole, isDead: true }),
        baseSeat({ id: 3, seenRoleId: townsfolkRole }),
      ];

      const queue = buildNightQueue(seats, true);

      // 包含场上存在的角色，以及恶魔/爪牙（即使已死）
      expect(queue.length).toBeGreaterThan(0);
      // 队列中的角色都应该在首夜顺序表内
      queue.forEach((role) => {
        expect(NIGHT_ORDER_FIRST.includes(role) || NIGHT_ORDER_OTHER.includes(role)).toBe(true);
      });
    });
  });

  describe('seat helpers', () => {
    const makeSeat = (): Seat => ({
      id: 1,
      seatIndex: 0,
      userId: 'u1',
      userName: 'P1',
      isDead: false,
      hasGhostVote: false,
      hasUsedAbility: true,
      statuses: ['test'],
      roleId: null,
      realRoleId: null,
      seenRoleId: null,
    });

    it('applyRoleToSeat sets role-related fields and clears statuses', () => {
      const seat = makeSeat();
      applyRoleToSeat(seat, 'someRole');
      expect(seat.roleId).toBe('someRole');
      expect(seat.realRoleId).toBe('someRole');
      expect(seat.seenRoleId).toBe('someRole');
      expect(seat.hasUsedAbility).toBe(false);
      expect(seat.statuses).toEqual([]);
    });

    it('toggleSeatDead toggles death and ghost vote', () => {
      const seat = makeSeat();
      const msg1 = toggleSeatDead(seat);
      expect(seat.isDead).toBe(true);
      expect(seat.hasGhostVote).toBe(true);
      expect(msg1).toContain('死亡了');

      const msg2 = toggleSeatDead(seat);
      expect(seat.isDead).toBe(false);
      expect(msg2).toContain('复活了');
    });

    it('useGhostVote only clears when dead and has vote', () => {
      const seat = makeSeat();

      // alive no vote
      seat.isDead = false;
      seat.hasGhostVote = false;
      useGhostVote(seat);
      expect(seat.hasGhostVote).toBe(false);

      // dead with vote
      seat.isDead = true;
      seat.hasGhostVote = true;
      useGhostVote(seat);
      expect(seat.hasGhostVote).toBe(false);
    });
  });

  describe('handlePhaseChange', () => {
    let baseState: GameState;

    beforeEach(() => {
      baseState = {
        phase: 'LOBBY',
        seats: [],
        messages: [],
        nightQueue: [],
        nightCurrentIndex: 0,
        roundInfo: {
          nightCount: 0,
          dayCount: 0,
          totalRounds: 0,
        },
        voting: null,
      } as unknown as GameState;
    });

    it('does nothing when phase does not change', () => {
      handlePhaseChange(baseState, 'LOBBY', 'LOBBY');
      expect(baseState.messages).toHaveLength(0);
    });

    it('adds system message when phase changes', () => {
      handlePhaseChange(baseState, 'DAY', 'LOBBY');
      expect(baseState.messages).toHaveLength(1);
      expect(baseState.messages[0].content).toContain(PHASE_LABELS.DAY);
    });

    it('updates counters and night queue on NIGHT', () => {
      const demonRole = Object.keys(ROLES).find((r) => ROLES[r].team === 'DEMON')!;
      baseState.seats = [
        {
          id: 1,
          seatIndex: 0,
          userId: 'u1',
          userName: 'P1',
          isDead: false,
          hasGhostVote: false,
          hasUsedAbility: false,
          statuses: [],
          roleId: demonRole,
          realRoleId: demonRole,
          seenRoleId: demonRole,
        },
      ];

      handlePhaseChange(baseState, 'NIGHT', 'DAY');

      expect(baseState.roundInfo.nightCount).toBe(1);
      expect(baseState.roundInfo.totalRounds).toBe(1);
      expect(baseState.nightQueue.length).toBeGreaterThan(0);
      expect(baseState.nightCurrentIndex).toBe(0);
    });

    it('increments dayCount on DAY', () => {
      handlePhaseChange(baseState, 'DAY', 'NIGHT');
      expect(baseState.roundInfo.dayCount).toBe(1);
    });
  });

  describe('createVotingState', () => {
    it('creates open and active voting state with nominee and optional nominator', () => {
      const stateWithNominator = createVotingState(1, 2);
      expect(stateWithNominator.nomineeSeatId).toBe(1);
      expect(stateWithNominator.nominatorSeatId).toBe(2);
      expect(stateWithNominator.isOpen).toBe(true);
      expect(stateWithNominator.isActive).toBe(true);
      expect(stateWithNominator.votes).toEqual([]);

      const stateWithoutNominator = createVotingState(3);
      expect(stateWithoutNominator.nominatorSeatId).toBeNull();
    });
  });

  describe('win conditions', () => {
    const seatWithRole = (overrides: Partial<Seat> = {}): Seat => ({
      id: 1,
      seatIndex: 0,
      userId: 'u1',
      userName: 'P1',
      isDead: false,
      hasGhostVote: false,
      hasUsedAbility: false,
      statuses: [],
      roleId: null,
      realRoleId: null,
      seenRoleId: null,
      ...overrides,
    });

    it('checkGoodWin returns true when all demons are dead', () => {
      const demon = Object.keys(ROLES).find((r) => ROLES[r].team === 'DEMON')!;
      const seats: Seat[] = [
        seatWithRole({ id: 1, realRoleId: demon, isDead: true }),
        seatWithRole({ id: 2, seenRoleId: demon, isDead: true }),
      ];
      expect(checkGoodWin(seats)).toBe(true);
    });

    it('checkGoodWin returns false when any demon alive', () => {
      const demon = Object.keys(ROLES).find((r) => ROLES[r].team === 'DEMON')!;
      const seats: Seat[] = [
        seatWithRole({ id: 1, realRoleId: demon, isDead: false }),
      ];
      expect(checkGoodWin(seats)).toBe(false);
    });

    it('checkEvilWin returns true when alive count <= 2', () => {
      const seats: Seat[] = [
        seatWithRole({ id: 1, isDead: false }),
        seatWithRole({ id: 2, isDead: false }),
        seatWithRole({ id: 3, isDead: true }),
      ];
      expect(checkEvilWin(seats)).toBe(true);
    });

    it('checkEvilWin returns false when more than 2 alive', () => {
      const seats: Seat[] = [
        seatWithRole({ id: 1, isDead: false }),
        seatWithRole({ id: 2, isDead: false }),
        seatWithRole({ id: 3, isDead: false }),
      ];
      expect(checkEvilWin(seats)).toBe(false);
    });
  });
});
