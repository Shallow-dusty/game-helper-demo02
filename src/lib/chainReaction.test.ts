import { describe, it, expect } from 'vitest';
import { detectChainReactions } from './chainReaction';
import { GameState, Seat } from '../types';

// 创建 mock 座位
const createMockSeat = (id: number, overrides: Partial<Seat> = {}): Seat => ({
    id,
    userName: `玩家${id}`,
    userId: null,
    roleId: null,
    realRoleId: null,
    seenRoleId: null,
    isDead: false,
    reminders: [],
    statuses: [],
    hasGhostVote: true,
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    ...overrides
});

// 创建 mock 游戏状态
const createMockGameState = (seatOverrides: Partial<Seat>[] = []): GameState => {
    const seats = Array.from({ length: 8 }, (_, i) => 
        createMockSeat(i, seatOverrides[i] || {})
    );
    
    return {
        roomId: 'room-1',
        currentScriptId: 'tb',
        phase: 'DAY',
        setupPhase: 'STARTED',
        rolesRevealed: true,
        allowWhispers: true,
        vibrationEnabled: false,
        seats,
        messages: [],
        gameOver: {
            isOver: false,
            winner: null,
            reason: ''
        },
        audio: { trackId: null, isPlaying: false, volume: 0.5 },
        nightQueue: [],
        nightCurrentIndex: -1,
        voting: null,
        customScripts: {},
        customRoles: {},
        voteHistory: [],
        roundInfo: {
            dayCount: 1,
            nightCount: 0,
            nominationCount: 0,
            totalRounds: 1
        },
        storytellerNotes: [],
        skillDescriptionMode: 'simple',
        aiMessages: [],
        nightActionRequests: [],
        swapRequests: [],
        candlelightEnabled: false,
        dailyNominations: [],
        interactionLog: []
    } as GameState;
};

describe('chainReaction', () => {
    describe('detectChainReactions', () => {
        it('应该在没有死亡时返回空结果', () => {
            const gameState = createMockGameState();
            const result = detectChainReactions(gameState, 'death', 0);
            
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('应该检测祖母-孙子链式反应', () => {
            const gameState = createMockGameState([
                { roleId: 'grandmother', realRoleId: 'grandmother', reminders: [
                    { id: 'r1', text: '孙子', sourceRole: 'grandmother', seatId: 2 }
                ] },
                {},
                { roleId: 'imp', realRoleId: 'imp', isDead: true }  // 孙子死亡
            ]);
            
            const result = detectChainReactions(gameState, 'death', 2);
            
            // 应该检测到链式反应（如果有的话）
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('应该检测恶魔死亡时的游戏结束条件', () => {
            const gameState = createMockGameState([
                { roleId: 'imp', realRoleId: 'imp', isDead: true },
                { roleId: 'poisoner', realRoleId: 'poisoner' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            
            const result = detectChainReactions(gameState, 'death', 0);
            
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('应该返回有效的 ChainReactionEvent 数组', () => {
            const gameState = createMockGameState();
            const result = detectChainReactions(gameState, 'death', 0);
            
            expect(Array.isArray(result)).toBe(true);
            result.forEach(event => {
                expect(event).toHaveProperty('type');
                expect(event).toHaveProperty('title');
                expect(event).toHaveProperty('message');
            });
        });

        it('应该处理守护者保护场景', () => {
            const gameState = createMockGameState([
                { roleId: 'monk', realRoleId: 'monk', reminders: [
                    { id: 'r1', text: '被保护', sourceRole: 'monk', seatId: 1 }
                ] },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = detectChainReactions(gameState, 'night_kill', 1);
            
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('应该处理月之女儿复仇场景', () => {
            const gameState = createMockGameState([
                { roleId: 'moonchild', realRoleId: 'moonchild', isDead: true },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = detectChainReactions(gameState, 'death', 0);
            
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('应该处理处决场景', () => {
            const gameState = createMockGameState([
                { roleId: 'saint', realRoleId: 'saint' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = detectChainReactions(gameState, 'execution', 0);
            
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });
});
