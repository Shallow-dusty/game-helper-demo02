import { describe, it, expect } from 'vitest';
import { filterGameStateForUser, addSystemMessage } from './utils';
import { GameState, NightActionRequest } from '../types';

// Mock minimal GameState
const createMockState = (): GameState => ({
    roomId: 'test',
    currentScriptId: 'tb',
    phase: 'NIGHT',
    setupPhase: 'STARTED',
    rolesRevealed: true,
    allowWhispers: false,
    vibrationEnabled: false,
    seats: [
        { id: 0, userId: 'user1', userName: 'P1', isDead: false, hasGhostVote: true, roleId: 'villager', realRoleId: 'villager', seenRoleId: 'villager', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [], isVirtual: false },
        { id: 1, userId: 'user2', userName: 'P2', isDead: false, hasGhostVote: true, roleId: 'imp', realRoleId: 'imp', seenRoleId: 'imp', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [], isVirtual: false },
        { id: 2, userId: 'user3', userName: 'P3', isDead: false, hasGhostVote: true, roleId: 'scarlet_woman', realRoleId: 'scarlet_woman', seenRoleId: 'scarlet_woman', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [], isVirtual: false }
    ],
    messages: [],
    gameOver: { isOver: false, winner: null, reason: '' },
    audio: { trackId: null, isPlaying: false, volume: 0.5 },
    nightQueue: [],
    nightCurrentIndex: 0,
    voting: null,
    customScripts: {},
    customRoles: {},
    voteHistory: [],
    roundInfo: { dayCount: 0, nightCount: 0, nominationCount: 0, totalRounds: 0 },
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [],
    swapRequests: [],
    candlelightEnabled: false,
    dailyNominations: [],
    interactionLog: []
});

describe('Visibility & Security', () => {
    it('should filter nightActionRequests for players', () => {
        const state = createMockState();
        const request1: NightActionRequest = {
            id: 'req1',
            seatId: 0, // User 1
            roleId: 'villager',
            payload: {},
            status: 'pending',
            timestamp: Date.now()
        };
        const request2: NightActionRequest = {
            id: 'req2',
            seatId: 1, // User 2
            roleId: 'imp',
            payload: {},
            status: 'pending',
            timestamp: Date.now()
        };
        state.nightActionRequests = [request1, request2];

        // User 1 should only see their own request
        const user1View = filterGameStateForUser(state, 'user1', false);
        expect(user1View.nightActionRequests).toHaveLength(1);
        expect(user1View.nightActionRequests[0]!.id).toBe('req1');

        // Storyteller should see all
        const stView = filterGameStateForUser(state, 'st', true);
        expect(stView.nightActionRequests).toHaveLength(2);
    });

    it('should filter private system messages', () => {
        const state = createMockState();
        
        // Add public message
        addSystemMessage(state, 'Public Message');
        
        // Add private message for User 1
        addSystemMessage(state, 'Private Message for User 1', 'user1');

        // User 1 should see both
        const user1View = filterGameStateForUser(state, 'user1', false);
        expect(user1View.messages).toHaveLength(2);

        // User 2 should only see public
        const user2View = filterGameStateForUser(state, 'user2', false);
        expect(user2View.messages).toHaveLength(1);
        expect(user2View.messages[0]!.content).toBe('Public Message');

        // Storyteller should see both (ST sees all private messages)
        const stView = filterGameStateForUser(state, 'st', true);
        expect(stView.messages).toHaveLength(2);
    });
});
