import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGameFlowSlice } from './flow';

// Mock dependencies
vi.mock('../connection', () => ({
    supabase: {
        rpc: vi.fn()
    }
}));

vi.mock('../../../lib/gameLogic', () => ({
    checkGameOver: vi.fn()
}));

vi.mock('../../../lib/supabaseService', () => ({
    logInteraction: vi.fn(),
    logExecution: vi.fn().mockResolvedValue(undefined),
    logDeath: vi.fn(),
    updateNominationResult: vi.fn().mockResolvedValue(undefined),
    getTeamFromRoleType: vi.fn(),
    mapPhase: vi.fn()
}));

vi.mock('../../utils', () => ({
    addSystemMessage: vi.fn()
}));

vi.mock('../../../constants', () => ({
    PHASE_LABELS: {
        'SETUP': '准备阶段',
        'NIGHT': '夜晚',
        'DAY': '白天',
        'VOTING': '投票'
    },
    NIGHT_ORDER_FIRST: ['poisoner', 'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller', 'imp'],
    NIGHT_ORDER_OTHER: ['poisoner', 'monk', 'scarlet_woman', 'imp', 'ravenkeeper', 'empath', 'fortune_teller', 'undertaker']
}));

describe('createGameFlowSlice', () => {
    let mockState: {
        gameState: {
            phase: string;
            candlelightEnabled: boolean;
            roundInfo: { nightCount: number; dayCount: number; nominationCount: number; totalRounds: number };
            seats: {
                id: number;
                userId: string;
                userName: string;
                roleId: string | null;
                realRoleId: string | null;
                seenRoleId: string | null;
                isDead: boolean;
                hasGhostVote: boolean;
                reminders: unknown[];
                isHandRaised: boolean;
                isNominated: boolean;
                hasUsedAbility: boolean;
                statuses: unknown[];
            }[];
            nightQueue: string[];
            nightCurrentIndex: number;
            voting: {
                nominatorSeatId: number | null;
                nomineeSeatId: number | null;
                clockHandSeatId: number | null;
                votes: number[];
                isOpen: boolean;
            } | null;
            voteHistory: unknown[];
            interactionLog: unknown[];
            dailyNominations: unknown[];
            gameOver: { isOver: boolean; winner: string; reason: string } | null;
            messages: unknown[];
        } | null;
        user: { id: string; roomId: number; isStoryteller: boolean } | null;
    };
    
    let slice: ReturnType<typeof createGameFlowSlice>;
    let mockSync: ReturnType<typeof vi.fn>;

    const createMockSet = () => {
        return (updater: ((state: typeof mockState) => void) | Partial<typeof mockState>) => {
            if (typeof updater === 'function') {
                updater(mockState);
            } else {
                Object.assign(mockState, updater);
            }
        };
    };

    const createMockGet = () => {
        return () => ({
            ...mockState,
            sync: mockSync
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockSync = vi.fn();
        
        mockState = {
            gameState: {
                phase: 'SETUP',
                candlelightEnabled: false,
                roundInfo: { nightCount: 0, dayCount: 0, nominationCount: 0, totalRounds: 0 },
                seats: [
                    { id: 0, userId: 'user1', userName: '玩家1', roleId: 'washerwoman', realRoleId: 'washerwoman', seenRoleId: 'washerwoman', isDead: false, hasGhostVote: true, reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
                    { id: 1, userId: 'user2', userName: '玩家2', roleId: 'imp', realRoleId: 'imp', seenRoleId: 'imp', isDead: false, hasGhostVote: true, reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
                    { id: 2, userId: 'user3', userName: '玩家3', roleId: 'empath', realRoleId: 'empath', seenRoleId: 'empath', isDead: false, hasGhostVote: true, reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] }
                ],
                nightQueue: [],
                nightCurrentIndex: -1,
                voting: null,
                voteHistory: [],
                interactionLog: [],
                dailyNominations: [],
                gameOver: null,
                messages: []
            },
            user: { id: 'user1', roomId: 123, isStoryteller: true }
        };
        
        slice = createGameFlowSlice(
            createMockSet() as unknown as Parameters<typeof createGameFlowSlice>[0],
            createMockGet() as unknown as Parameters<typeof createGameFlowSlice>[1],
            {} as Parameters<typeof createGameFlowSlice>[2]
        );
    });

    describe('toggleCandlelight', () => {
        it('应该切换烛光模式', () => {
            expect(mockState.gameState?.candlelightEnabled).toBe(false);
            
            slice.toggleCandlelight();
            expect(mockState.gameState?.candlelightEnabled).toBe(true);
            
            slice.toggleCandlelight();
            expect(mockState.gameState?.candlelightEnabled).toBe(false);
        });

        it('gameState 为 null 时不应崩溃', () => {
            mockState.gameState = null;
            expect(() => slice.toggleCandlelight()).not.toThrow();
        });
    });

    describe('addInteractionLog', () => {
        it('应该添加交互日志', () => {
            const entry = {
                type: 'nomination' as const,
                actorSeatId: 0,
                targetSeatIds: [1],
                description: '玩家1提名了玩家2',
                isConfirmed: true
            };
            
            slice.addInteractionLog(entry);
            
            expect(mockState.gameState?.interactionLog).toHaveLength(1);
            expect((mockState.gameState?.interactionLog[0] as { type: string; actorSeatId: number; targetSeatIds: number[] })).toMatchObject({
                type: 'nomination',
                actorSeatId: 0,
                targetSeatIds: [1]
            });
        });

        it('日志应该有唯一ID和时间戳', () => {
            slice.addInteractionLog({
                type: 'vote' as const,
                actorSeatId: 0,
                description: '玩家投票',
                isConfirmed: true
            });
            
            const log = mockState.gameState?.interactionLog[0] as { id: string; timestamp: number };
            expect(log.id).toMatch(/^log-[a-z0-9]+$/);
            expect(log.timestamp).toBeGreaterThan(0);
        });
    });

    describe('setRuleAutomationLevel', () => {
        it('说书人可以设置规则自动化级别', () => {
            expect(mockState.gameState?.ruleAutomationLevel).toBeUndefined();
            slice.setRuleAutomationLevel('FULL_AUTO');
            expect(mockState.gameState?.ruleAutomationLevel).toBe('FULL_AUTO');
            expect(mockSync).toHaveBeenCalled();
        });

        it('非说书人无法设置规则自动化级别', () => {
            if (mockState.user) {
                mockState.user.isStoryteller = false;
            }
            slice.setRuleAutomationLevel('MANUAL');
            expect(mockState.gameState?.ruleAutomationLevel).toBeUndefined();
            expect(mockSync).not.toHaveBeenCalled();
        });
    });

    describe('setPhase', () => {
        it('应该设置游戏阶段', () => {
            slice.setPhase('DAY');
            expect(mockState.gameState?.phase).toBe('DAY');
            expect(mockSync).toHaveBeenCalled();
        });

        it('进入夜晚应该增加夜晚计数（烛光由说书人手动控制）', () => {
            slice.setPhase('NIGHT');
            
            expect(mockState.gameState?.roundInfo.nightCount).toBe(1);
            expect(mockState.gameState?.roundInfo.totalRounds).toBe(1);
            // 烛光不再自动启用，由说书人手动控制
            expect(mockState.gameState?.candlelightEnabled).toBe(false);
        });

        it('进入白天应该增加白天计数并关闭烛光', () => {
            mockState.gameState!.phase = 'NIGHT';
            mockState.gameState!.candlelightEnabled = true;
            
            slice.setPhase('DAY');
            
            expect(mockState.gameState?.roundInfo.dayCount).toBe(1);
            expect(mockState.gameState?.candlelightEnabled).toBe(false);
            expect(mockState.gameState?.dailyNominations).toEqual([]);
        });

        it('进入夜晚应该计算夜间行动队列', () => {
            slice.setPhase('NIGHT');
            
            // 第一夜顺序应该包含存活且在首夜顺序中的角色
            expect(mockState.gameState?.nightQueue).toContain('washerwoman');
            expect(mockState.gameState?.nightQueue).toContain('empath');
            expect(mockState.gameState?.nightQueue).not.toContain('imp');
            expect(mockState.gameState?.nightCurrentIndex).toBe(-1);
        });
    });

    describe('nightNext', () => {
        it('应该前进到下一个夜间行动', () => {
            mockState.gameState!.nightQueue = ['washerwoman', 'empath', 'imp'];
            mockState.gameState!.nightCurrentIndex = -1;
            
            slice.nightNext();
            expect(mockState.gameState?.nightCurrentIndex).toBe(0);
            
            slice.nightNext();
            expect(mockState.gameState?.nightCurrentIndex).toBe(1);
        });

        it('队列结束后应该进入白天', () => {
            mockState.gameState!.nightQueue = ['washerwoman'];
            mockState.gameState!.nightCurrentIndex = 0;
            mockState.gameState!.phase = 'NIGHT';
            
            slice.nightNext();
            
            expect(mockState.gameState?.phase).toBe('DAY');
            expect(mockState.gameState?.nightCurrentIndex).toBe(-1);
            expect(mockState.gameState?.roundInfo.dayCount).toBe(1);
        });
    });

    describe('nightPrev', () => {
        it('应该回退到上一个夜间行动', () => {
            mockState.gameState!.nightQueue = ['washerwoman', 'empath', 'imp'];
            mockState.gameState!.nightCurrentIndex = 2;
            
            slice.nightPrev();
            expect(mockState.gameState?.nightCurrentIndex).toBe(1);
        });

        it('在第一个行动时不应回退', () => {
            mockState.gameState!.nightQueue = ['washerwoman', 'empath'];
            mockState.gameState!.nightCurrentIndex = 0;
            
            slice.nightPrev();
            expect(mockState.gameState?.nightCurrentIndex).toBe(0);
        });
    });

    describe('startVote', () => {
        it('应该开始投票并设置被提名者', () => {
            mockState.gameState!.phase = 'DAY';
            mockState.gameState!.roundInfo.dayCount = 1;
            slice.startVote(1);
            
            expect(mockState.gameState?.voting).toEqual({
                nominatorSeatId: null,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [],
                isOpen: true
            });
            expect(mockState.gameState?.dailyNominations).toHaveLength(1);
            expect(mockState.gameState?.roundInfo.nominationCount).toBe(1);
            expect(mockState.gameState?.phase).toBe('VOTING');
        });
    });

    describe('nextClockHand', () => {
        it('应该移动时钟指针到下一个座位', () => {
            mockState.gameState!.voting = {
                nominatorSeatId: null,
                nomineeSeatId: 1,
                clockHandSeatId: 0,
                votes: [],
                isOpen: true
            };
            
            slice.nextClockHand();
            expect(mockState.gameState?.voting?.clockHandSeatId).toBe(1);
        });

        it('应该循环回到第一个座位', () => {
            mockState.gameState!.voting = {
                nominatorSeatId: null,
                nomineeSeatId: 1,
                clockHandSeatId: 2,
                votes: [],
                isOpen: true
            };
            
            slice.nextClockHand();
            expect(mockState.gameState?.voting?.clockHandSeatId).toBe(0);
        });
    });

    describe('closeVote', () => {
        it('票数足够时应该进入处决候选并在入夜时执行', () => {
            mockState.gameState!.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [0, 2], // 2票，3人存活，超过一半
                isOpen: true
            };
            mockState.gameState!.roundInfo.dayCount = 1;
            
            slice.closeVote();
            
            const seat = mockState.gameState?.seats[1];
            expect(seat?.isDead).toBe(false);
            expect(mockState.gameState?.voting).toBeNull();
            expect(mockState.gameState?.phase).toBe('DAY');
            expect(mockState.gameState?.voteHistory).toHaveLength(1);
            expect(mockState.gameState?.voteHistory[0]).toMatchObject({
                result: 'on_the_block',
                voteCount: 2
            });

            slice.setPhase('NIGHT');
            expect(mockState.gameState?.seats[1]?.isDead).toBe(true);
            const latestVote = mockState.gameState?.voteHistory[0] as { result?: string } | undefined;
            expect(latestVote?.result).toBe('executed');
        });

        it('巫毒师在场时应按最高票处决（不需过半）', () => {
            mockState.gameState!.seats[0]!.isDead = true;
            mockState.gameState!.seats[1]!.roleId = 'voudon';
            mockState.gameState!.seats[1]!.realRoleId = 'voudon';
            mockState.gameState!.seats[1]!.seenRoleId = 'voudon';
            mockState.gameState!.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 2,
                clockHandSeatId: 2,
                votes: [0],
                isOpen: true
            };
            mockState.gameState!.roundInfo.dayCount = 1;

            slice.closeVote();

            slice.setPhase('NIGHT');
            expect(mockState.gameState?.seats[2]?.isDead).toBe(true);
            const latestVote = mockState.gameState?.voteHistory[0] as { result?: string } | undefined;
            expect(latestVote?.result).toBe('executed');
        });

        it('票数不足时不应处决', () => {
            mockState.gameState!.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [0], // 1票，3人存活，不足一半
                isOpen: true
            };
            mockState.gameState!.roundInfo.dayCount = 1;
            
            slice.closeVote();
            
            const seat = mockState.gameState?.seats[1];
            expect(seat?.isDead).toBe(false);
            expect(mockState.gameState?.voteHistory[0]).toMatchObject({
                result: 'survived',
                voteCount: 1
            });

            slice.setPhase('NIGHT');
            expect(mockState.gameState?.seats[1]?.isDead).toBe(false);
        });

        it('0票时不应处决', () => {
            mockState.gameState!.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [],
                isOpen: true
            };
            mockState.gameState!.roundInfo.dayCount = 1;
            
            slice.closeVote();
            
            const seat0votes = mockState.gameState?.seats[1];
            expect(seat0votes?.isDead).toBe(false);
        });
    });

    describe('startGame', () => {
        it('应该开始游戏并进入第一夜', () => {
            slice.startGame();
            
            expect(mockState.gameState?.phase).toBe('NIGHT');
            expect(mockState.gameState?.roundInfo.nightCount).toBe(1);
            // 烛光模式不应自动开启，由说书人手动控制
            expect(mockState.gameState?.candlelightEnabled).toBe(false);
            expect(mockState.gameState?.nightQueue.length).toBeGreaterThan(0);
        });
    });

    describe('endGame', () => {
        it('应该结束游戏并记录胜利者', () => {
            slice.endGame('GOOD', '恶魔被处决');
            
            expect(mockState.gameState?.gameOver).toEqual({
                isOver: true,
                winner: 'GOOD',
                reason: '恶魔被处决'
            });
            expect(mockState.gameState?.candlelightEnabled).toBe(false);
        });

        it('邪恶获胜时应该正确记录', () => {
            slice.endGame('EVIL', '只剩2名玩家存活');
            
            expect(mockState.gameState?.gameOver?.winner).toBe('EVIL');
        });
    });
});
