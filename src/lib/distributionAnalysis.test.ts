import { describe, it, expect } from 'vitest';
import { 
    analyzeDistribution, 
    getStandardComposition, 
    validateDistribution, 
    suggestDistributionFixes 
} from './distributionAnalysis';
import { Seat } from '../types';

// 创建 mock 座位
const createMockSeat = (id: number, roleId: string | null, realRoleId?: string): Seat => ({
    id,
    userName: `玩家${id}`,
    userId: null,
    roleId,
    realRoleId: realRoleId || roleId,
    seenRoleId: roleId,
    isDead: false,
    reminders: [],
    statuses: [],
    hasGhostVote: true,
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false
});

describe('distributionAnalysis', () => {
    describe('getStandardComposition', () => {
        it('应该返回 7 人局标准组合', () => {
            const result = getStandardComposition(7);
            expect(result).toBeDefined();
            expect(result?.townsfolk).toBe(5);
            expect(result?.outsider).toBe(0);
            expect(result?.minion).toBe(1);
            expect(result?.demon).toBe(1);
        });

        it('应该返回 10 人局标准组合', () => {
            const result = getStandardComposition(10);
            expect(result).toBeDefined();
            expect(result?.townsfolk).toBe(7);
            expect(result?.outsider).toBe(0);
            expect(result?.minion).toBe(2);
            expect(result?.demon).toBe(1);
        });

        it('应该返回 15 人局标准组合', () => {
            const result = getStandardComposition(15);
            expect(result).toBeDefined();
            expect(result?.minion).toBe(3);
            expect(result?.demon).toBe(1);
        });

        it('应该对超出范围的人数返回 null', () => {
            const result = getStandardComposition(3);
            expect(result).toBeNull();
        });
    });

    describe('analyzeDistribution', () => {
        it('应该分析有效的角色分配', () => {
            const seats = [
                createMockSeat(0, 'washerwoman'),
                createMockSeat(1, 'librarian'),
                createMockSeat(2, 'investigator'),
                createMockSeat(3, 'chef'),
                createMockSeat(4, 'empath'),
                createMockSeat(5, 'poisoner'),
                createMockSeat(6, 'imp')
            ];
            
            // analyzeDistribution 第二个参数是 playerCount，不是 scriptId
            const result = analyzeDistribution(seats, 7);
            
            expect(result).toBeDefined();
            expect(result.isValid).toBeDefined();
            expect(result.playerCount).toBe(7);
            expect(result.composition).toBeDefined();
        });

        it('应该检测到缺少恶魔', () => {
            const seats = [
                createMockSeat(0, 'washerwoman'),
                createMockSeat(1, 'librarian'),
                createMockSeat(2, 'investigator'),
                createMockSeat(3, 'chef'),
                createMockSeat(4, 'empath'),
                createMockSeat(5, 'mayor'),
                createMockSeat(6, 'poisoner')
            ];
            
            const result = analyzeDistribution(seats, 7);
            
            expect(result.isValid).toBe(false);
            expect(result.warnings.length).toBeGreaterThan(0);
        });

        it('应该返回策略评估', () => {
            const seats = [
                createMockSeat(0, 'washerwoman'),
                createMockSeat(1, 'librarian'),
                createMockSeat(2, 'chef'),
                createMockSeat(3, 'empath'),
                createMockSeat(4, 'soldier'),
                createMockSeat(5, 'poisoner'),
                createMockSeat(6, 'imp')
            ];
            
            const result = analyzeDistribution(seats, 7);
            
            expect(result.strategyEvaluation).toBeDefined();
            expect(result.strategyEvaluation.name).toBeDefined();
        });
    });

    describe('validateDistribution', () => {
        it('应该验证有效的分配', () => {
            const seats = [
                createMockSeat(0, 'washerwoman'),
                createMockSeat(1, 'librarian'),
                createMockSeat(2, 'investigator'),
                createMockSeat(3, 'chef'),
                createMockSeat(4, 'empath'),
                createMockSeat(5, 'poisoner'),
                createMockSeat(6, 'imp')
            ];
            
            const result = validateDistribution(seats, 'trouble-brewing', 7);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('应该检测缺少恶魔的错误', () => {
            const seats = [
                createMockSeat(0, 'washerwoman'),
                createMockSeat(1, 'librarian'),
                createMockSeat(2, 'investigator'),
                createMockSeat(3, 'chef'),
                createMockSeat(4, 'empath'),
                createMockSeat(5, 'mayor'),
                createMockSeat(6, 'poisoner')
            ];
            
            const result = validateDistribution(seats, 'trouble-brewing', 7);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('恶魔'))).toBe(true);
        });

        it('应该检测未分配座位的警告', () => {
            const seats = [
                createMockSeat(0, 'washerwoman'),
                createMockSeat(1, null),
                createMockSeat(2, 'investigator'),
                createMockSeat(3, null),
                createMockSeat(4, 'empath'),
                createMockSeat(5, 'poisoner'),
                createMockSeat(6, 'imp')
            ];
            
            const result = validateDistribution(seats, 'trouble-brewing', 7);
            
            expect(result.warnings.some(w => w.includes('未分配'))).toBe(true);
        });
    });

    describe('suggestDistributionFixes', () => {
        it('应该为有效分配返回空建议', () => {
            const seats = [
                createMockSeat(0, 'washerwoman'),
                createMockSeat(1, 'librarian'),
                createMockSeat(2, 'investigator'),
                createMockSeat(3, 'chef'),
                createMockSeat(4, 'empath'),
                createMockSeat(5, 'poisoner'),
                createMockSeat(6, 'imp')
            ];
            
            const result = suggestDistributionFixes(seats, 'trouble-brewing', 7);
            
            expect(result).toHaveLength(0);
        });

        it('应该为缺少恶魔提供建议', () => {
            const seats = [
                createMockSeat(0, 'washerwoman'),
                createMockSeat(1, 'librarian'),
                createMockSeat(2, 'investigator'),
                createMockSeat(3, 'chef'),
                createMockSeat(4, 'empath'),
                createMockSeat(5, 'mayor'),
                createMockSeat(6, 'poisoner')
            ];
            
            const result = suggestDistributionFixes(seats, 'trouble-brewing', 7);
            
            expect(result.length).toBeGreaterThan(0);
            expect(result.some(s => s.includes('恶魔'))).toBe(true);
        });

        it('应该为多余的恶魔提供建议', () => {
            const seats = [
                createMockSeat(0, 'washerwoman'),
                createMockSeat(1, 'librarian'),
                createMockSeat(2, 'investigator'),
                createMockSeat(3, 'imp'),
                createMockSeat(4, 'imp'),
                createMockSeat(5, 'poisoner'),
                createMockSeat(6, 'imp')
            ];
            
            const result = suggestDistributionFixes(seats, 'trouble-brewing', 7);
            
            expect(result.length).toBeGreaterThan(0);
        });

        it('应该为重复角色提供建议', () => {
            const seats = [
                createMockSeat(0, 'washerwoman'),
                createMockSeat(1, 'washerwoman'),
                createMockSeat(2, 'investigator'),
                createMockSeat(3, 'chef'),
                createMockSeat(4, 'empath'),
                createMockSeat(5, 'poisoner'),
                createMockSeat(6, 'imp')
            ];
            
            const result = suggestDistributionFixes(seats, 'trouble-brewing', 7);
            
            expect(result.some(s => s.includes('重复'))).toBe(true);
        });
    });

    describe('validateDistribution with special cases', () => {
        it('应该检测玩家数量过少', () => {
            const seats = [
                createMockSeat(0, 'washerwoman'),
                createMockSeat(1, 'librarian'),
                createMockSeat(2, 'imp')
            ];
            
            const result = validateDistribution(seats, 'trouble-brewing', 3);
            
            expect(result.ruleChecks.some(r => r.rule === 'PLAYER_COUNT' && !r.passed)).toBe(true);
        });

        it('应该检测玩家数量过多', () => {
            const seats = Array.from({ length: 20 }, (_, i) => createMockSeat(i, 'washerwoman'));
            seats[19] = createMockSeat(19, 'imp');
            
            const result = validateDistribution(seats, 'trouble-brewing', 20);
            
            expect(result.ruleChecks.some(r => r.rule === 'PLAYER_COUNT' && !r.passed)).toBe(true);
        });
    });
});
