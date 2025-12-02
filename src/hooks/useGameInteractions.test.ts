import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGameInteractions } from './useGameInteractions';
import * as supabaseService from '../lib/supabaseService';
import type { InteractionLog, GamePhase as ServiceGamePhase } from '../lib/supabaseService';

// Mock store
vi.mock('../store', () => ({
    useStore: vi.fn((selector: (state: unknown) => unknown) => {
        const state = {
            user: { id: 'test-user', roomId: '123' },
            gameState: {
                seats: [{ id: 0, userId: 'test-user' }],
                roundInfo: { dayCount: 1 },
                gameOver: { isOver: false }
            }
        };
        return selector(state);
    })
}));

// Mock supabaseService
vi.mock('../lib/supabaseService', () => ({
    getGameInteractions: vi.fn()
}));

const mockInteractions: InteractionLog[] = [
    {
        id: 'int-1',
        roomId: '123',
        gameDay: 1,
        phase: 'DAY' as ServiceGamePhase,
        actionType: 'VOTE',
        actorSeat: 0,
        targetSeat: 1,
        result: 'SUCCESS',
        createdAt: new Date().toISOString()
    },
    {
        id: 'int-2',
        roomId: '123',
        gameDay: 1,
        phase: 'NIGHT' as ServiceGamePhase,
        actionType: 'DEATH',
        actorSeat: 2,
        targetSeat: 3,
        result: 'SUCCESS',
        createdAt: new Date().toISOString()
    },
    {
        id: 'int-3',
        roomId: '123',
        gameDay: 2,
        phase: 'DAY' as ServiceGamePhase,
        actionType: 'VOTE',
        actorSeat: 1,
        targetSeat: 4,
        result: 'FAILED',
        createdAt: new Date().toISOString()
    }
];

describe('useGameInteractions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(supabaseService.getGameInteractions).mockResolvedValue(mockInteractions);
    });

    describe('初始化', () => {
        it('应该在有 roomId 时加载交互数据', async () => {
            const { result } = renderHook(() => useGameInteractions());
            
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
            
            expect(supabaseService.getGameInteractions).toHaveBeenCalledWith('123');
            expect(result.current.interactions).toEqual(mockInteractions);
        });

        it('API 失败时应该设置错误', async () => {
            vi.mocked(supabaseService.getGameInteractions).mockRejectedValue(new Error('Network error'));
            
            const { result } = renderHook(() => useGameInteractions());
            
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
            
            expect(result.current.error).toBe('Failed to load game interactions');
            expect(result.current.interactions).toEqual([]);
        });
    });

    describe('fetchByDay', () => {
        it('应该获取指定日期的交互', async () => {
            const dayInteractions: InteractionLog[] = [mockInteractions[0]!];
            vi.mocked(supabaseService.getGameInteractions).mockResolvedValue(dayInteractions);
            
            const { result } = renderHook(() => useGameInteractions());
            
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
            
            const data = await result.current.fetchByDay(1);
            
            expect(supabaseService.getGameInteractions).toHaveBeenCalledWith('123', 1);
            expect(data).toEqual(dayInteractions);
        });

        it('API 失败时应该返回空数组', async () => {
            const { result } = renderHook(() => useGameInteractions());
            
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
            
            vi.mocked(supabaseService.getGameInteractions).mockRejectedValue(new Error('Error'));
            
            const data = await result.current.fetchByDay(1);
            
            expect(data).toEqual([]);
        });
    });

    describe('refresh', () => {
        it('应该刷新交互数据', async () => {
            const { result } = renderHook(() => useGameInteractions());
            
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
            
            vi.clearAllMocks();
            const newInteractions: InteractionLog[] = [...mockInteractions, {
                id: 'int-4',
                roomId: '123',
                gameDay: 2,
                phase: 'NIGHT' as ServiceGamePhase,
                actionType: 'NIGHT_ACTION',
                actorSeat: 5,
                targetSeat: 0,
                result: 'SUCCESS',
                createdAt: new Date().toISOString()
            }];
            vi.mocked(supabaseService.getGameInteractions).mockResolvedValue(newInteractions);
            
            await act(async () => {
                await result.current.refresh();
            });
            
            expect(result.current.interactions).toEqual(newInteractions);
        });

        it('刷新失败时应该设置错误', async () => {
            const { result } = renderHook(() => useGameInteractions());
            
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
            
            vi.mocked(supabaseService.getGameInteractions).mockRejectedValue(new Error('Error'));
            
            await act(async () => {
                await result.current.refresh();
            });
            
            expect(result.current.error).toBe('Failed to refresh game interactions');
        });
    });

    describe('getByDay', () => {
        it('应该按天分组交互', async () => {
            const { result } = renderHook(() => useGameInteractions());
            
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
            
            const grouped = result.current.getByDay();
            
            expect(grouped instanceof Map).toBe(true);
            expect(grouped.get(1)?.length).toBe(2);  // day 1 有 2 条
            expect(grouped.get(2)?.length).toBe(1);  // day 2 有 1 条
        });

        it('无数据时应该返回空 Map', async () => {
            vi.mocked(supabaseService.getGameInteractions).mockResolvedValue([]);
            
            const { result } = renderHook(() => useGameInteractions());
            
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
            
            const grouped = result.current.getByDay();
            
            expect(grouped.size).toBe(0);
        });
    });

    describe('getByPhase', () => {
        it('应该按阶段分组交互', async () => {
            const { result } = renderHook(() => useGameInteractions());
            
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
            
            const grouped = result.current.getByPhase();
            
            expect(grouped instanceof Map).toBe(true);
            expect(grouped.get('DAY')?.length).toBe(2);   // DAY phase 有 2 条
            expect(grouped.get('NIGHT')?.length).toBe(1); // NIGHT phase 有 1 条
        });
    });
});
