import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module
vi.mock('../../utils', () => ({
    addSystemMessage: vi.fn()
}));

vi.mock('../../../constants', () => ({
    ROLES: {
        washerwoman: { id: 'washerwoman', name: '洗衣妇', team: 'TOWNSFOLK', reminders: ['洗衣妇'] },
        imp: { id: 'imp', name: '小恶魔', team: 'DEMON', reminders: ['死亡'] },
        empath: { id: 'empath', name: '共情者', team: 'TOWNSFOLK', reminders: [] },
        scarlet_woman: { id: 'scarlet_woman', name: '猩红女郎', team: 'MINION', reminders: [] },
        drunk: { id: 'drunk', name: '酒鬼', team: 'OUTSIDER', reminders: ['酒鬼'] }
    }
}));

vi.mock('./utils', () => ({
    applyRoleAssignment: vi.fn((_gameState: unknown, seat: { roleId: string | null; realRoleId: string | null }, roleId: string) => {
        seat.roleId = roleId;
        seat.realRoleId = roleId;
    })
}));

vi.mock('../../../lib/gameLogic', () => ({
    generateRoleAssignment: vi.fn().mockReturnValue(['washerwoman', 'imp', 'empath', 'drunk', 'scarlet_woman']),
    checkGameOver: vi.fn(),
    countAlivePlayers: vi.fn((seats) => seats.filter((seat: { isDead?: boolean; userId?: string | null }) => seat.userId && !seat.isDead).length),
}));

// Import after mocks
import { createGameRolesSlice } from './roles';
import { checkGameOver } from '@/lib/gameLogic';

describe('createGameRolesSlice', () => {
    let mockState: {
        gameState: {
            seats: {
                id: number;
                userId: string;
                userName: string;
                roleId: string | null;
                realRoleId: string | null;
                seenRoleId: string | null;
                isDead: boolean;
                hasUsedAbility: boolean;
                statuses: string[];
                reminders: { id: string; text: string; sourceRole: string; seatId: number; icon?: string; color?: string }[];
            }[];
            rolesRevealed: boolean;
            setupPhase: string;
            phase: string;
            currentScriptId: string;
            messages: unknown[];
        } | null;
        user?: {
            id: string;
            name: string;
            isStoryteller: boolean;
        };
    };
    
    let slice: ReturnType<typeof createGameRolesSlice>;
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
            sync: mockSync,
            initializePhaseMachine: vi.fn(),
            stopPhaseMachine: vi.fn(),
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockSync = vi.fn();
        
        mockState = {
            gameState: {
                seats: [
                    { id: 0, userId: 'user1', userName: '玩家1', roleId: null, realRoleId: null, seenRoleId: null, isDead: false, hasUsedAbility: false, statuses: [], reminders: [] },
                    { id: 1, userId: 'user2', userName: '玩家2', roleId: null, realRoleId: null, seenRoleId: null, isDead: false, hasUsedAbility: false, statuses: [], reminders: [] },
                    { id: 2, userId: 'user3', userName: '玩家3', roleId: null, realRoleId: null, seenRoleId: null, isDead: false, hasUsedAbility: false, statuses: [], reminders: [] },
                    { id: 3, userId: 'user4', userName: '玩家4', roleId: null, realRoleId: null, seenRoleId: null, isDead: false, hasUsedAbility: false, statuses: [], reminders: [] },
                    { id: 4, userId: 'user5', userName: '玩家5', roleId: null, realRoleId: null, seenRoleId: null, isDead: false, hasUsedAbility: false, statuses: [], reminders: [] }
                ],
                rolesRevealed: false,
                setupPhase: 'ASSIGNING',
                phase: 'SETUP',
                currentScriptId: 'trouble_brewing',
                messages: []
            },
            user: {
                id: 'storyteller',
                name: 'Storyteller',
                isStoryteller: true
            }
        };
        
        slice = createGameRolesSlice(
            createMockSet() as unknown as Parameters<typeof createGameRolesSlice>[0],
            createMockGet() as unknown as Parameters<typeof createGameRolesSlice>[1],
            {} as Parameters<typeof createGameRolesSlice>[2]
        );
    });

    describe('assignRole', () => {
        it('应该分配角色给座位', () => {
            slice.assignRole(0, 'washerwoman');
            
            const seat = mockState.gameState?.seats[0];
            expect(seat?.roleId).toBe('washerwoman');
            expect(mockSync).toHaveBeenCalled();
        });

        it('应该自动添加角色提醒标记', () => {
            slice.assignRole(0, 'washerwoman');
            
            const seat = mockState.gameState?.seats[0];
            expect(seat?.reminders.length).toBeGreaterThan(0);
            expect(seat?.reminders[0]?.text).toBe('洗衣妇');
        });

        it('座位不存在时不应崩溃', () => {
            expect(() => slice.assignRole(99, 'washerwoman')).not.toThrow();
        });
    });

    describe('toggleDead', () => {
        it('应该切换死亡状态', () => {
            const seat0 = mockState.gameState!.seats[0]!;
            seat0.roleId = 'washerwoman';
            seat0.realRoleId = 'washerwoman';
            
            slice.toggleDead(0);
            expect(seat0.isDead).toBe(true);
            
            slice.toggleDead(0);
            expect(seat0.isDead).toBe(false);
        });

        it('恶魔死亡时猩红女郎应该继承', () => {
            const seat0 = mockState.gameState!.seats[0]!;
            const seat1 = mockState.gameState!.seats[1]!;
            seat0.roleId = 'imp';
            seat0.realRoleId = 'imp';
            seat1.roleId = 'scarlet_woman';
            seat1.realRoleId = 'scarlet_woman';
            
            slice.toggleDead(0);
            
            expect(seat0.isDead).toBe(true);
            expect(seat1.realRoleId).toBe('imp');
        });

        it('死亡后应该检查游戏结束', () => {
            const seat0 = mockState.gameState!.seats[0]!;
            seat0.roleId = 'washerwoman';
            seat0.realRoleId = 'washerwoman';
            
            slice.toggleDead(0);
            
            expect(checkGameOver).toHaveBeenCalled();
        });
    });

    describe('toggleAbilityUsed', () => {
        it('应该切换能力使用状态', () => {
            const seat0 = mockState.gameState!.seats[0]!;
            
            slice.toggleAbilityUsed(0);
            expect(seat0.hasUsedAbility).toBe(true);
            
            slice.toggleAbilityUsed(0);
            expect(seat0.hasUsedAbility).toBe(false);
        });
    });

    describe('toggleStatus', () => {
        it('应该添加状态', () => {
            const seat0 = mockState.gameState!.seats[0]!;
            
            slice.toggleStatus(0, 'POISONED');
            expect(seat0.statuses).toContain('POISONED');
        });

        it('应该移除已有状态', () => {
            const seat0 = mockState.gameState!.seats[0]!;
            seat0.statuses = ['POISONED'];
            
            slice.toggleStatus(0, 'POISONED');
            expect(seat0.statuses).not.toContain('POISONED');
        });
    });

    describe('addReminder / removeReminder', () => {
        it('应该添加提醒标记', () => {
            slice.addReminder(0, '被保护', '🛡️', 'blue');
            
            const seat0 = mockState.gameState!.seats[0]!;
            const reminder = seat0.reminders[0];
            expect(reminder?.text).toBe('被保护');
            expect(reminder?.icon).toBe('🛡️');
            expect(reminder?.color).toBe('blue');
        });

        it('应该移除提醒标记', () => {
            const seat0 = mockState.gameState!.seats[0]!;
            seat0.reminders = [
                { id: 'rem-1', text: '测试', sourceRole: 'manual', seatId: 0 }
            ];
            
            slice.removeReminder('rem-1');
            expect(seat0.reminders).toHaveLength(0);
        });
    });

    describe('assignRoles', () => {
        it('应该自动分配角色', () => {
            slice.assignRoles();
            
            expect(mockState.gameState?.seats.some(s => s.roleId !== null)).toBe(true);
            expect(mockSync).toHaveBeenCalled();
        });

        it('座位不足5个时不应分配', () => {
            mockState.gameState!.seats = mockState.gameState!.seats.slice(0, 3);
            
            slice.assignRoles();
            
            expect(mockState.gameState?.seats.every(s => s.roleId === null)).toBe(true);
        });
    });

    describe('resetRoles', () => {
        it('应该重置所有角色', () => {
            mockState.gameState!.seats.forEach((s, i) => {
                s.roleId = 'washerwoman';
                s.realRoleId = 'washerwoman';
                s.reminders = [{ id: `r${i}`, text: 'test', sourceRole: 'test', seatId: i }];
            });
            mockState.gameState!.rolesRevealed = true;
            
            slice.resetRoles();
            
            expect(mockState.gameState?.seats.every(s => s.roleId === null)).toBe(true);
            expect(mockState.gameState?.seats.every(s => s.reminders.length === 0)).toBe(true);
            expect(mockState.gameState?.rolesRevealed).toBe(false);
            expect(mockState.gameState?.phase).toBe('SETUP');
        });
    });

    describe('distributeRoles', () => {
        it('应该发放角色并更新状态', () => {
            slice.distributeRoles();
            
            expect(mockState.gameState?.rolesRevealed).toBe(true);
            expect(mockState.gameState?.setupPhase).toBe('READY');
        });
    });

    describe('hideRoles', () => {
        it('应该隐藏角色', () => {
            mockState.gameState!.rolesRevealed = true;
            
            slice.hideRoles();
            
            expect(mockState.gameState?.rolesRevealed).toBe(false);
        });
    });

    describe('applyStrategy', () => {
        it('应该应用分配策略', () => {
            const roles = ['washerwoman', 'imp', 'empath', 'drunk', 'scarlet_woman'];
            
            slice.applyStrategy('测试策略', roles);
            
            const assignedCount = mockState.gameState!.seats.filter(s => s.roleId !== null).length;
            expect(assignedCount).toBe(5);
            expect(mockSync).toHaveBeenCalled();
        });

        it('应该先重置再分配', () => {
            const seat0 = mockState.gameState!.seats[0]!;
            seat0.statuses = ['POISONED'];
            seat0.reminders = [{ id: 'r1', text: 'test', sourceRole: 'test', seatId: 0 }];
            
            slice.applyStrategy('测试策略', ['washerwoman']);
            
            expect(seat0.statuses).toEqual([]);
        });
    });
});
