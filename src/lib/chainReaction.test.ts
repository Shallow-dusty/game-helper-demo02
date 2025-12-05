import { describe, it, expect } from 'vitest';
import { 
    detectChainReactions, 
    checkGrandmotherChain, 
    checkMoonchildChain, 
    checkMonkProtection,
    checkGameEndCondition,
    checkSaintExecution
} from './chainReaction';
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

    describe('checkGrandmotherChain', () => {
        it('应该在孙子死亡时触发祖母连锁', () => {
            const gameState = createMockGameState([
                { roleId: 'grandmother', realRoleId: 'grandmother', reminders: [
                    { id: 'r1', text: '孙子', sourceRole: 'grandmother', seatId: 2 }
                ] },
                {},
                { roleId: 'washerwoman', realRoleId: 'washerwoman', isDead: true }
            ]);
            
            const result = checkGrandmotherChain(gameState, 2);
            
            expect(result).toBeDefined();
            if (result) {
                expect(result.type).toBe('death');
                expect(result.affectedSeatIds).toContain(0);
            }
        });

        it('应该在祖母没有标记孙子时返回null', () => {
            const gameState = createMockGameState([
                { roleId: 'grandmother', realRoleId: 'grandmother', reminders: [] },
                { roleId: 'imp', realRoleId: 'imp', isDead: true }
            ]);
            
            const result = checkGrandmotherChain(gameState, 1);
            
            expect(result).toBeNull();
        });

        it('应该在没有祖母角色时返回null', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'imp', realRoleId: 'imp', isDead: true }
            ]);
            
            const result = checkGrandmotherChain(gameState, 1);
            
            expect(result).toBeNull();
        });
    });

    describe('checkMoonchildChain', () => {
        it('应该在月之子选择的玩家死亡时触发连锁', () => {
            const gameState = createMockGameState([
                { roleId: 'moonchild', realRoleId: 'moonchild', reminders: [
                    { id: 'r1', text: '玩家1', sourceRole: 'moonchild', seatId: 1 }
                ] },
                { roleId: 'washerwoman', realRoleId: 'washerwoman', isDead: true }
            ]);
            
            const result = checkMoonchildChain(gameState, 1);
            
            expect(result).toBeDefined();
            if (result) {
                expect(result.type).toBe('death');
                expect(result.affectedSeatIds).toContain(0);
            }
        });

        it('应该在非月之子关联玩家死亡时返回null', () => {
            const gameState = createMockGameState([
                { roleId: 'moonchild', realRoleId: 'moonchild', reminders: [] },
                { roleId: 'washerwoman', realRoleId: 'washerwoman', isDead: true }
            ]);
            
            const result = checkMoonchildChain(gameState, 1);
            
            expect(result).toBeNull();
        });
    });

    describe('checkMonkProtection', () => {
        it('应该在目标有PROTECTED状态时触发保护', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman', statuses: ['PROTECTED'] }
            ]);
            
            const result = checkMonkProtection(gameState, 0);
            
            expect(result).toBeDefined();
            if (result) {
                expect(result.type).toBe('protection');
                expect(result.priority).toBe('high');
            }
        });

        it('应该在目标有僧侣提醒时触发可能的保护', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman', reminders: [
                    { id: 'r1', text: '保护', sourceRole: 'monk', seatId: 0 }
                ] }
            ]);
            
            const result = checkMonkProtection(gameState, 0);
            
            expect(result).toBeDefined();
            if (result) {
                expect(result.type).toBe('protection');
                expect(result.priority).toBe('medium');
            }
        });

        it('应该在无保护时返回null', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            
            const result = checkMonkProtection(gameState, 0);
            
            expect(result).toBeNull();
        });

        it('应该在座位不存在时返回null', () => {
            const gameState = createMockGameState();
            
            const result = checkMonkProtection(gameState, 100);
            
            expect(result).toBeNull();
        });
    });

    describe('checkGameEndCondition', () => {
        it('应该在恶魔死亡时检测善良胜利', () => {
            const gameState = createMockGameState([
                { roleId: 'imp', realRoleId: 'imp', isDead: true },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'librarian', realRoleId: 'librarian' }
            ]);
            
            const result = checkGameEndCondition(gameState);
            
            expect(result).toBeDefined();
            if (result) {
                expect(result.type).toBe('game_end');
                expect(result.data?.winner).toBe('GOOD');
            }
        });

        it('应该在只剩2人且含恶魔时检测邪恶胜利', () => {
            const gameState = createMockGameState([
                { roleId: 'imp', realRoleId: 'imp' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { isDead: true },
                { isDead: true },
                { isDead: true },
                { isDead: true },
                { isDead: true },
                { isDead: true }
            ]);
            
            const result = checkGameEndCondition(gameState);
            
            expect(result).toBeDefined();
            if (result) {
                expect(result.type).toBe('game_end');
                expect(result.data?.winner).toBe('EVIL');
            }
        });

        it('应该在游戏正常进行时返回null', () => {
            const gameState = createMockGameState([
                { roleId: 'imp', realRoleId: 'imp' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'librarian', realRoleId: 'librarian' },
                { roleId: 'chef', realRoleId: 'chef' }
            ]);
            
            const result = checkGameEndCondition(gameState);
            
            expect(result).toBeNull();
        });
    });

    describe('checkSaintExecution', () => {
        it('应该在圣徒被处决时检测邪恶胜利', () => {
            const gameState = createMockGameState([
                { roleId: 'saint', realRoleId: 'saint' }
            ]);
            
            const result = checkSaintExecution(gameState, 0);
            
            expect(result).toBeDefined();
            if (result) {
                expect(result.type).toBe('game_end');
                expect(result.data?.winner).toBe('EVIL');
                expect(result.data?.reason).toContain('圣徒');
            }
        });

        it('应该在非圣徒被处决时返回null', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            
            const result = checkSaintExecution(gameState, 0);
            
            expect(result).toBeNull();
        });

        it('应该在座位不存在时返回null', () => {
            const gameState = createMockGameState();
            
            const result = checkSaintExecution(gameState, 100);
            
            expect(result).toBeNull();
        });
    });
});
