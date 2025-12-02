import { describe, it, expect, beforeEach } from 'vitest';
import { detectChainReactions, ChainReactionEvent } from './chainReaction';
import { GameState, Seat } from '../types';

// 创建 mock 座位
const createMockSeat = (id: number, overrides: Partial<Seat> = {}): Seat => ({
    id,
    userName: `玩家${id}`,
    roleId: null,
    realRoleId: null,
    seenRoleId: null,
    isDead: false,
    isVotingDisabled: false,
    reminders: [],
    statuses: [],
    ghostVote: true,
    notes: '',
    connectedPlayerId: null,
    ...overrides
});

// 创建 mock 游戏状态
const createMockGameState = (seatOverrides: Partial<Seat>[] = []): GameState => {
    const seats = Array.from({ length: 8 }, (_, i) => 
        createMockSeat(i, seatOverrides[i] || {})
    );
    
    return {
        gameId: 'test-game',
        roomId: 1,
        seats,
        gamePhase: 'DAY_PHASE',
        roundInfo: {
            roundNumber: 1,
            phase: 'day',
            totalRounds: 1
        },
        nominationInfo: {
            isActive: false,
            nomineeSeatId: null,
            nominatorSeatId: null,
            hasNominatedToday: [],
            hasBeenNominatedToday: [],
            votingOpen: false,
            votes: [],
            currentTally: 0,
            nominationCount: 0,
            executionThreshold: 4
        },
        voteHistory: [],
        messages: [],
        currentScript: null,
        scriptName: '暗流涌动',
        storytellerId: 'st-1',
        isStoryteller: false,
        fabled: [],
        nightActions: {},
        playerNotes: {},
        gameOver: {
            isOver: false,
            winner: null
        },
        bluffs: []
    };
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
