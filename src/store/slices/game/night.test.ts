 
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock dependencies
vi.mock('../connection', () => ({
    supabase: {
        rpc: vi.fn()
    }
}));

vi.mock('../../../lib/supabaseService', () => ({
    logNightAction: vi.fn().mockResolvedValue(undefined),
    getTeamFromRoleType: vi.fn().mockReturnValue('GOOD')
}));

vi.mock('../../utils', () => ({
    addSystemMessage: vi.fn()
}));

vi.mock('../../../constants', () => ({
    ROLES: {
        washerwoman: { id: 'washerwoman', name: '洗衣妇', type: 'TOWNSFOLK' },
        imp: { id: 'imp', name: '小恶魔', type: 'DEMON' },
        empath: { id: 'empath', name: '共情者', type: 'TOWNSFOLK' }
    }
}));

import { supabase } from '../connection';
import { createGameNightSlice } from './night';

describe('createGameNightSlice', () => {
    type MockState = {
        gameState: {
            seats: { id: number; userId: string; roleId: string | null }[];
            roundInfo: { nightCount: number };
            nightActionRequests: { id: string; status: string; result?: unknown }[];
            messages: unknown[];
        } | null;
        user: { id: string; roomId: number; isStoryteller: boolean } | null;
    };

    let mockState: MockState;
    let mockSync: Mock;
    let mockSet: (updater: ((state: MockState) => void) | Partial<MockState>) => void;
    let mockGet: () => MockState & { sync: Mock };

    beforeEach(() => {
        vi.clearAllMocks();
        mockSync = vi.fn();
        
        mockState = {
            gameState: {
                seats: [
                    { id: 0, userId: 'user1', roleId: 'washerwoman' },
                    { id: 1, userId: 'user2', roleId: 'imp' },
                    { id: 2, userId: 'user3', roleId: 'empath' }
                ],
                roundInfo: { nightCount: 1 },
                nightActionRequests: [
                    { id: 'req-1', status: 'pending' },
                    { id: 'req-2', status: 'resolved' },
                    { id: 'req-3', status: 'pending' }
                ],
                messages: []
            },
            user: { id: 'user1', roomId: 123, isStoryteller: true }
        };
        
        mockSet = (updater) => {
            if (typeof updater === 'function') {
                updater(mockState);
            } else {
                Object.assign(mockState, updater);
            }
        };
        
        mockGet = () => ({
            ...mockState,
            sync: mockSync
        });
    });

    describe('performNightAction', () => {
        it('应该是一个占位函数', () => {
            const slice = createGameNightSlice(
                mockSet as unknown as Parameters<typeof createGameNightSlice>[0],
                mockGet as unknown as Parameters<typeof createGameNightSlice>[1],
                {} as Parameters<typeof createGameNightSlice>[2]
            );
            // 直接调用不应抛出
            slice.performNightAction({ roleId: 'washerwoman', payload: {} });
            expect(true).toBe(true);
        });
    });

    describe('submitNightAction', () => {
        it('应该成功提交夜间行动', async () => {
            vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never);
            
            const slice = createGameNightSlice(
                mockSet as unknown as Parameters<typeof createGameNightSlice>[0],
                mockGet as unknown as Parameters<typeof createGameNightSlice>[1],
                {} as Parameters<typeof createGameNightSlice>[2]
            );
            

            await slice.submitNightAction({
                roleId: 'washerwoman',
                payload: { seatId: 1 }
            });

            expect(supabase.rpc).toHaveBeenCalledWith('submit_night_action', {
                p_room_code: 123,
                p_seat_id: 0,
                p_role_id: 'washerwoman',
                p_payload: { seatId: 1 }
            });
        });

        it('用户不存在时不应提交', async () => {
            mockState.user = null;
            
            const slice = createGameNightSlice(
                mockSet as unknown as Parameters<typeof createGameNightSlice>[0],
                mockGet as unknown as Parameters<typeof createGameNightSlice>[1],
                {} as Parameters<typeof createGameNightSlice>[2]
            );
            
             
            await slice.submitNightAction({
                roleId: 'washerwoman',
                payload: {}
            });
            
            expect(supabase.rpc).not.toHaveBeenCalled();
        });

        it('gameState 不存在时不应提交', async () => {
            mockState.gameState = null;
            
            const slice = createGameNightSlice(
                mockSet as unknown as Parameters<typeof createGameNightSlice>[0],
                mockGet as unknown as Parameters<typeof createGameNightSlice>[1],
                {} as Parameters<typeof createGameNightSlice>[2]
            );
            
             
            await slice.submitNightAction({
                roleId: 'washerwoman',
                payload: {}
            });
            
            expect(supabase.rpc).not.toHaveBeenCalled();
        });

        it('用户座位不存在时不应提交', async () => {
            mockState.user = { id: 'unknown-user', roomId: 123, isStoryteller: false };
            
            const slice = createGameNightSlice(
                mockSet as unknown as Parameters<typeof createGameNightSlice>[0],
                mockGet as unknown as Parameters<typeof createGameNightSlice>[1],
                {} as Parameters<typeof createGameNightSlice>[2]
            );
            
             
            await slice.submitNightAction({
                roleId: 'washerwoman',
                payload: {}
            });
            
            expect(supabase.rpc).not.toHaveBeenCalled();
        });

        it('RPC 错误时应该捕获错误', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* empty */ });
            vi.mocked(supabase.rpc).mockResolvedValue({ 
                data: null, 
                error: { message: 'RPC failed' } 
            } as never);
            
            const slice = createGameNightSlice(
                mockSet as unknown as Parameters<typeof createGameNightSlice>[0],
                mockGet as unknown as Parameters<typeof createGameNightSlice>[1],
                {} as Parameters<typeof createGameNightSlice>[2]
            );
            
             
            await slice.submitNightAction({
                roleId: 'washerwoman',
                payload: {}
            });
            
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('resolveNightAction', () => {
        it('应该解决夜间行动请求', () => {
            const slice = createGameNightSlice(
                mockSet as unknown as Parameters<typeof createGameNightSlice>[0],
                mockGet as unknown as Parameters<typeof createGameNightSlice>[1],
                {} as Parameters<typeof createGameNightSlice>[2]
            );
            
            const result = '你看到了一个镇民';
            slice.resolveNightAction('req-1', result);
            
            const request = mockState.gameState?.nightActionRequests.find(r => r.id === 'req-1');
            expect(request?.status).toBe('resolved');
            expect(request?.result).toEqual(result);
            expect(mockSync).toHaveBeenCalled();
        });

        it('请求不存在时不应崩溃', () => {
            const slice = createGameNightSlice(
                mockSet as unknown as Parameters<typeof createGameNightSlice>[0],
                mockGet as unknown as Parameters<typeof createGameNightSlice>[1],
                {} as Parameters<typeof createGameNightSlice>[2]
            );
            
            slice.resolveNightAction('non-existent', '空结果');
            expect(true).toBe(true);
        });

        it('gameState 不存在时不应崩溃', () => {
            mockState.gameState = null;
            
            const slice = createGameNightSlice(
                mockSet as unknown as Parameters<typeof createGameNightSlice>[0],
                mockGet as unknown as Parameters<typeof createGameNightSlice>[1],
                {} as Parameters<typeof createGameNightSlice>[2]
            );
            
            slice.resolveNightAction('req-1', '空结果');
            expect(true).toBe(true);
        });
    });

    describe('getPendingNightActions', () => {
        it('应该返回待处理的夜间行动', () => {
            const slice = createGameNightSlice(
                mockSet as unknown as Parameters<typeof createGameNightSlice>[0],
                mockGet as unknown as Parameters<typeof createGameNightSlice>[1],
                {} as Parameters<typeof createGameNightSlice>[2]
            );
            
            const pending = slice.getPendingNightActions();
            
            expect(pending).toHaveLength(2);
            expect(pending.every(r => r.status === 'pending')).toBe(true);
        });

        it('gameState 不存在时应返回空数组', () => {
            mockState.gameState = null;
            
            const slice = createGameNightSlice(
                mockSet as unknown as Parameters<typeof createGameNightSlice>[0],
                mockGet as unknown as Parameters<typeof createGameNightSlice>[1],
                {} as Parameters<typeof createGameNightSlice>[2]
            );
            
            const pending = slice.getPendingNightActions();
            expect(pending).toEqual([]);
        });

        it('无待处理请求时应返回空数组', () => {
            if (mockState.gameState) {
                mockState.gameState.nightActionRequests = [
                    { id: 'req-1', status: 'resolved' },
                    { id: 'req-2', status: 'resolved' }
                ];
            }
            
            const slice = createGameNightSlice(
                mockSet as unknown as Parameters<typeof createGameNightSlice>[0],
                mockGet as unknown as Parameters<typeof createGameNightSlice>[1],
                {} as Parameters<typeof createGameNightSlice>[2]
            );
            
            const pending = slice.getPendingNightActions();
            expect(pending).toEqual([]);
        });
    });
});
