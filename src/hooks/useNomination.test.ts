import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useNomination } from './useNomination';
import * as supabaseService from '../lib/supabaseService';

// Mock store
const mockStartVote = vi.fn();
const mockUser = { id: 'test-user', roomId: 123 };
const mockGameState = {
    phase: 'DAY',
    dailyExecutionCompleted: false,
    dailyNominations: [],
    seats: [
        { id: 0, userId: 'test-user', isDead: false },
        { id: 1, userId: 'other-user', isDead: false }
    ],
    roundInfo: { dayCount: 1 },
    ruleAutomationLevel: 'GUIDED'
};

vi.mock('../store', () => ({
    useStore: vi.fn((selector: (state: unknown) => unknown) => {
        const state = {
            user: mockUser,
            gameState: mockGameState,
            startVote: mockStartVote
        };
        return selector(state);
    })
}));

// Mock supabaseService
vi.mock('../lib/supabaseService', () => ({
    checkNominationEligibility: vi.fn(),
    recordNomination: vi.fn(),
    getNominationHistory: vi.fn()
}));

describe('useNomination', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGameState.ruleAutomationLevel = 'GUIDED';
        
        vi.mocked(supabaseService.checkNominationEligibility).mockResolvedValue({
            canNominate: true,
            reason: null,
            previousNominee: null
        });
        
        vi.mocked(supabaseService.getNominationHistory).mockResolvedValue([]);
        
        vi.mocked(supabaseService.recordNomination).mockResolvedValue({
            success: true,
            error: null,
            nominationId: 'nom-123'
        });
    });

    describe('初始化', () => {
        it('应该检查用户资格', async () => {
            const { result } = renderHook(() => useNomination());
            
            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });
            
            expect(supabaseService.checkNominationEligibility).toHaveBeenCalledWith(123, 1, 0);
        });

        it('应该获取今日提名历史', async () => {
            const { result } = renderHook(() => useNomination());
            
            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });
            
            expect(supabaseService.getNominationHistory).toHaveBeenCalledWith(123, 1);
        });

        it('资格检查成功时在引导模式下保持可提名，但更新上次提名信息', async () => {
            vi.mocked(supabaseService.checkNominationEligibility).mockResolvedValue({
                canNominate: false,
                reason: '今日已提名',
                previousNominee: 3
            });
            
            const { result } = renderHook(() => useNomination());
            
            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });
            
            expect(result.current.canNominate).toBe(true);
            expect(result.current.previousNominee).toBe(3);
        });

        it('资格检查失败时在引导模式下默认允许提名', async () => {
            vi.mocked(supabaseService.checkNominationEligibility).mockRejectedValue(new Error('Network error'));
            
            const { result } = renderHook(() => useNomination());
            
            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });
            
            expect(result.current.canNominate).toBe(true);
        });

        it('自动化全开时资格检查失败应默认禁止提名', async () => {
            vi.mocked(supabaseService.checkNominationEligibility).mockRejectedValue(new Error('Network error'));
            mockGameState.ruleAutomationLevel = 'FULL_AUTO';

            const { result } = renderHook(() => useNomination());

            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });

            expect(result.current.canNominate).toBe(false);
        });
    });

    describe('checkSeatEligibility', () => {
        it('应该检查指定座位的资格', async () => {
            const { result } = renderHook(() => useNomination());

            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });

            vi.mocked(supabaseService.checkNominationEligibility).mockResolvedValue({
                canNominate: true,
                reason: null,
                previousNominee: null
            });

            let eligibility: any;
            await act(async () => {
                eligibility = await result.current.checkSeatEligibility(0);
            });

            expect(supabaseService.checkNominationEligibility).toHaveBeenCalledWith(123, 1, 0);
            expect(eligibility.canNominate).toBe(true);
        });

        it('API 失败时引导模式下默认允许提名', async () => {
            const { result } = renderHook(() => useNomination());

            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });

            vi.mocked(supabaseService.checkNominationEligibility).mockRejectedValue(new Error('Error'));

            let eligibility: any;
            await act(async () => {
                eligibility = await result.current.checkSeatEligibility(0);
            });

            expect(eligibility.canNominate).toBe(true);
        });

        it('API 失败时自动化全开应默认禁止', async () => {
            mockGameState.ruleAutomationLevel = 'FULL_AUTO';
            const { result } = renderHook(() => useNomination());

            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });

            vi.mocked(supabaseService.checkNominationEligibility).mockRejectedValue(new Error('Error'));

            let eligibility: any;
            await act(async () => {
                eligibility = await result.current.checkSeatEligibility(0);
            });

            expect(eligibility.canNominate).toBe(false);
        });
    });

    describe('makeNomination', () => {
        it('提名成功应该返回 true', async () => {
            const { result } = renderHook(() => useNomination());

            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });

            let success = false;
            await act(async () => {
                success = await result.current.makeNomination(0, 1);
            });

            expect(success).toBe(true);
            expect(supabaseService.recordNomination).toHaveBeenCalledWith(123, 1, 0, 1);
        });

        it('提名成功应该启动投票', async () => {
            const { result } = renderHook(() => useNomination());

            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });

            await act(async () => {
                await result.current.makeNomination(0, 1);
            });

            expect(mockStartVote).toHaveBeenCalledWith(1, 0);
        });

        it('当前用户提名成功后应该更新本地状态', async () => {
            const { result } = renderHook(() => useNomination());
            
            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });
            
            await act(async () => {
                await result.current.makeNomination(0, 1);  // 座位 0 是当前用户
            });
            
            // 等待状态更新
            await waitFor(() => {
                expect(result.current.canNominate).toBe(false);
            });
            
            expect(result.current.previousNominee).toBe(1);
        });

        it('提名失败应该返回 false', async () => {
            vi.mocked(supabaseService.recordNomination).mockResolvedValue({
                success: false,
                error: '提名失败',
                nominationId: null
            });

            const { result } = renderHook(() => useNomination());

            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });

            let success = true;
            await act(async () => {
                success = await result.current.makeNomination(0, 1);
            });

            expect(success).toBe(false);
        });

        it('API 异常应该返回 false', async () => {
            vi.mocked(supabaseService.recordNomination).mockRejectedValue(new Error('Error'));

            const { result } = renderHook(() => useNomination());

            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });

            let success = true;
            await act(async () => {
                success = await result.current.makeNomination(0, 1);
            });

            expect(success).toBe(false);
        });
    });

    describe('refresh', () => {
        it('应该刷新资格和提名历史（引导模式默认允许）', async () => {
            const { result } = renderHook(() => useNomination());
            
            await waitFor(() => {
                expect(result.current.isCheckingEligibility).toBe(false);
            });
            
            vi.clearAllMocks();
            
            vi.mocked(supabaseService.checkNominationEligibility).mockResolvedValue({
                canNominate: false,
                reason: '已提名',
                previousNominee: 2
            });
            
            vi.mocked(supabaseService.getNominationHistory).mockResolvedValue([
                { id: 'nom-1', gameDay: 1, nominatorSeat: 0, nomineeSeat: 2, wasSeconded: false, voteCount: 0, wasExecuted: false, createdAt: new Date().toISOString() }
            ]);
            
            await act(async () => {
                await result.current.refresh();
            });
            
            expect(supabaseService.checkNominationEligibility).toHaveBeenCalled();
            expect(supabaseService.getNominationHistory).toHaveBeenCalled();
            expect(result.current.canNominate).toBe(true);
            expect(result.current.previousNominee).toBe(2);
            expect(result.current.todayNominations.length).toBe(1);
        });
    });
});
