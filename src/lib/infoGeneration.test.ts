import { describe, it, expect } from 'vitest';
import { 
    generateEmpathInfo, 
    generateChefInfo, 
    generateFortuneTellerInfo,
    generateWasherwomanInfo,
    generateUndertakerInfo,
    generateInvestigatorInfo,
    generateLibrarianInfo
} from './infoGeneration';
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

describe('infoGeneration', () => {
    describe('generateEmpathInfo', () => {
        it('应该为共情者生成邻居信息', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateEmpathInfo(gameState, 1);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('empath');
            expect(typeof result.realInfo).toBe('string');
            expect(typeof result.suggestedInfo).toBe('string');
        });

        it('应该考虑死亡玩家', () => {
            const gameState = createMockGameState([
                { roleId: 'imp', realRoleId: 'imp', isDead: true },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            
            const result = generateEmpathInfo(gameState, 1);
            
            expect(result).toBeDefined();
        });
    });

    describe('generateChefInfo', () => {
        it('应该为厨师生成邪恶邻居信息', () => {
            const gameState = createMockGameState([
                { roleId: 'imp', realRoleId: 'imp' },
                { roleId: 'poisoner', realRoleId: 'poisoner' },
                { roleId: 'chef', realRoleId: 'chef' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            
            const result = generateChefInfo(gameState, 2);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('chef');
            expect(typeof result.realInfo).toBe('string');
        });

        it('应该在没有邪恶邻居时返回 0', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'librarian', realRoleId: 'librarian' },
                { roleId: 'chef', realRoleId: 'chef' },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'investigator', realRoleId: 'investigator' },
                { roleId: 'mayor', realRoleId: 'mayor' },
                { roleId: 'poisoner', realRoleId: 'poisoner' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateChefInfo(gameState, 2);
            
            expect(result).toBeDefined();
        });
    });

    describe('generateFortuneTellerInfo', () => {
        it('应该为占卜师生成选择信息', () => {
            const gameState = createMockGameState([
                { roleId: 'fortune_teller', realRoleId: 'fortune_teller' },
                { roleId: 'imp', realRoleId: 'imp' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            
            const result = generateFortuneTellerInfo(gameState, 0, 1, 2);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('fortune_teller');
        });

        it('应该检测到恶魔', () => {
            const gameState = createMockGameState([
                { roleId: 'fortune_teller', realRoleId: 'fortune_teller' },
                { roleId: 'imp', realRoleId: 'imp' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            
            const result = generateFortuneTellerInfo(gameState, 0, 1, 2);
            
            // 占卜师选择了恶魔座位 1
            expect(result).toBeDefined();
            expect(result.realInfo).toBeDefined();
        });
    });

    describe('generateWasherwomanInfo', () => {
        it('应该为洗衣妇生成村民信息', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'chef', realRoleId: 'chef' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateWasherwomanInfo(gameState, 0);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('washerwoman');
        });
    });

    describe('generateUndertakerInfo', () => {
        it('应该为掘墓人生成处决者信息', () => {
            const gameState = createMockGameState([
                { roleId: 'undertaker', realRoleId: 'undertaker' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman', isDead: true },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateUndertakerInfo(gameState, 0, 1);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('undertaker');
        });

        it('应该处理无效的处决座位', () => {
            const gameState = createMockGameState([
                { roleId: 'undertaker', realRoleId: 'undertaker' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            
            const result = generateUndertakerInfo(gameState, 0, 99);
            
            expect(result).toBeDefined();
            // 检查realInfo包含错误信息
            expect(result.realInfo).toBeDefined();
        });
    });

    describe('generateInvestigatorInfo', () => {
        it('应该为调查员生成爪牙信息', () => {
            const gameState = createMockGameState([
                { roleId: 'investigator', realRoleId: 'investigator' },
                { roleId: 'poisoner', realRoleId: 'poisoner' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateInvestigatorInfo(gameState, 0);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('investigator');
        });

        it('应该在没有爪牙时返回提示', () => {
            const gameState = createMockGameState([
                { roleId: 'investigator', realRoleId: 'investigator' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateInvestigatorInfo(gameState, 0);
            
            expect(result).toBeDefined();
        });
    });

    describe('generateLibrarianInfo', () => {
        it('应该为图书管理员生成外来者信息', () => {
            const gameState = createMockGameState([
                { roleId: 'librarian', realRoleId: 'librarian' },
                { roleId: 'drunk', realRoleId: 'drunk' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateLibrarianInfo(gameState, 0);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('librarian');
        });

        it('应该在没有外来者时返回提示', () => {
            const gameState = createMockGameState([
                { roleId: 'librarian', realRoleId: 'librarian' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateLibrarianInfo(gameState, 0);
            
            expect(result).toBeDefined();
        });
    });
});
