import { describe, it, expect } from 'vitest';
import { generateAfterActionReport } from './reportGenerator';
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
        gameId: 'test-game-123',
        roomId: 1,
        seats,
        gamePhase: 'GAME_OVER',
        roundInfo: {
            roundNumber: 3,
            phase: 'day',
            totalRounds: 3
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
        voteHistory: [
            {
                round: 1,
                nominatorSeatId: 0,
                nomineeSeatId: 2,
                votes: [0, 1, 3, 4],
                voteCount: 4,
                timestamp: Date.now() - 10000,
                result: 'executed'
            }
        ],
        messages: [
            {
                id: 'msg-1',
                type: 'system',
                content: '游戏阶段变更：白天阶段',
                timestamp: Date.now() - 20000
            },
            {
                id: 'msg-2',
                type: 'system',
                content: '好人阵营胜利！',
                timestamp: Date.now()
            }
        ],
        currentScript: null,
        currentScriptId: '暗流涌动',
        scriptName: '暗流涌动',
        storytellerId: 'st-1',
        isStoryteller: false,
        fabled: [],
        nightActions: {},
        playerNotes: {},
        gameOver: {
            isOver: true,
            winner: 'GOOD',
            reason: '恶魔被处决'
        },
        bluffs: []
    };
};

describe('reportGenerator', () => {
    describe('generateAfterActionReport', () => {
        it('应该生成有效的复盘战报', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'imp', realRoleId: 'imp', isDead: true },
                { roleId: 'poisoner', realRoleId: 'poisoner' },
                { roleId: 'chef', realRoleId: 'chef' },
                { roleId: 'investigator', realRoleId: 'investigator' },
                { roleId: 'librarian', realRoleId: 'librarian' },
                { roleId: 'mayor', realRoleId: 'mayor' }
            ]);
            
            const report = generateAfterActionReport(gameState);
            
            expect(report).toBeDefined();
            // gameId 来自 roomId，是数字
            expect(report.gameId).toBe(1);
            expect(report.winner).toBe('GOOD');
        });

        it('应该包含玩家摘要', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const report = generateAfterActionReport(gameState);
            
            expect(report.playerSummaries).toBeDefined();
            expect(report.playerSummaries.length).toBe(8);
        });

        it('应该包含时间线', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const report = generateAfterActionReport(gameState);
            
            expect(report.timeline).toBeDefined();
            expect(Array.isArray(report.timeline)).toBe(true);
        });

        it('应该包含统计数据', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'imp', realRoleId: 'imp', isDead: true }
            ]);
            
            const report = generateAfterActionReport(gameState);
            
            expect(report.statistics).toBeDefined();
            expect(typeof report.statistics.totalDeaths).toBe('number');
            expect(typeof report.statistics.totalVotes).toBe('number');
        });

        it('应该计算 MVP', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'chef', realRoleId: 'chef' },
                { roleId: 'imp', realRoleId: 'imp', isDead: true },
                { roleId: 'poisoner', realRoleId: 'poisoner' }
            ]);
            
            const report = generateAfterActionReport(gameState);
            
            // MVP 可能为 null 或有值
            expect(report).toHaveProperty('mvp');
        });

        it('应该正确设置脚本名称', () => {
            const gameState = createMockGameState();
            
            const report = generateAfterActionReport(gameState);
            
            // scriptName 来自 currentScriptId
            expect(report.scriptName).toBe('暗流涌动');
        });

        it('应该正确计算总轮数', () => {
            const gameState = createMockGameState();
            gameState.roundInfo.totalRounds = 5;
            
            const report = generateAfterActionReport(gameState);
            
            expect(report.totalRounds).toBe(5);
        });

        it('应该处理邪恶方胜利', () => {
            const gameState = createMockGameState();
            gameState.gameOver.winner = 'EVIL';
            
            const report = generateAfterActionReport(gameState);
            
            expect(report.winner).toBe('EVIL');
        });
    });
});
