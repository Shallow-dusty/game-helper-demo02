import { describe, it, expect, beforeEach } from 'vitest';
import { createUISlice, UISlice } from './createUISlice';

describe('createUISlice', () => {
    let slice: UISlice;
    let mockState: Partial<UISlice>;
    
    const createMockSet = (): ((updater: Partial<UISlice> | ((state: Partial<UISlice>) => void)) => void) => {
        return (updater) => {
            if (typeof updater === 'function') {
                updater(mockState);
            } else {
                Object.assign(mockState, updater);
            }
        };
    };

    beforeEach(() => {
        mockState = {};
        const mockSet = createMockSet();
        slice = createUISlice(
            mockSet as Parameters<typeof createUISlice>[0], 
            () => mockState as ReturnType<Parameters<typeof createUISlice>[1]>, 
            {} as Parameters<typeof createUISlice>[2]
        );
        // 复制初始状态到 mockState
        Object.assign(mockState, slice);
    });

    describe('初始状态', () => {
        it('应该有正确的默认值', () => {
            expect(slice.roleReferenceMode).toBe('modal');
            expect(slice.isSidebarExpanded).toBe(false);
            expect(slice.isRolePanelOpen).toBe(false);
            expect(slice.isRoleRevealOpen).toBe(false);
            expect(slice.isModalOpen).toBe(false);
            expect(slice.isTruthRevealOpen).toBe(false);
            expect(slice.isReportOpen).toBe(false);
        });
    });

    describe('setRoleReferenceMode', () => {
        it('应该设置角色引用模式为 sidebar', () => {
            slice.setRoleReferenceMode('sidebar');
            expect(mockState.roleReferenceMode).toBe('sidebar');
        });

        it('应该设置角色引用模式为 modal', () => {
            slice.setRoleReferenceMode('modal');
            expect(mockState.roleReferenceMode).toBe('modal');
        });
    });

    describe('toggleSidebar', () => {
        it('应该切换侧边栏状态', () => {
            expect(mockState.isSidebarExpanded).toBe(false);
            
            slice.toggleSidebar();
            expect(mockState.isSidebarExpanded).toBe(true);
            
            slice.toggleSidebar();
            expect(mockState.isSidebarExpanded).toBe(false);
        });
    });

    describe('openRolePanel / closeRolePanel', () => {
        it('应该打开角色面板并设置 isModalOpen', () => {
            slice.openRolePanel();
            expect(mockState.isRolePanelOpen).toBe(true);
            expect(mockState.isModalOpen).toBe(true);
        });

        it('应该关闭角色面板并重置 isModalOpen', () => {
            slice.openRolePanel();
            slice.closeRolePanel();
            expect(mockState.isRolePanelOpen).toBe(false);
            expect(mockState.isModalOpen).toBe(false);
        });
    });

    describe('openRoleReveal / closeRoleReveal', () => {
        it('应该打开角色揭示并设置 isModalOpen', () => {
            slice.openRoleReveal();
            expect(mockState.isRoleRevealOpen).toBe(true);
            expect(mockState.isModalOpen).toBe(true);
        });

        it('应该关闭角色揭示并重置 isModalOpen', () => {
            slice.openRoleReveal();
            slice.closeRoleReveal();
            expect(mockState.isRoleRevealOpen).toBe(false);
            expect(mockState.isModalOpen).toBe(false);
        });
    });

    describe('setModalOpen', () => {
        it('应该直接设置 isModalOpen', () => {
            slice.setModalOpen(true);
            expect(mockState.isModalOpen).toBe(true);
            
            slice.setModalOpen(false);
            expect(mockState.isModalOpen).toBe(false);
        });
    });

    describe('openTruthReveal / closeTruthReveal (v2.0)', () => {
        it('应该打开真相揭示并设置 isModalOpen', () => {
            slice.openTruthReveal();
            expect(mockState.isTruthRevealOpen).toBe(true);
            expect(mockState.isModalOpen).toBe(true);
        });

        it('应该关闭真相揭示并重置 isModalOpen', () => {
            slice.openTruthReveal();
            slice.closeTruthReveal();
            expect(mockState.isTruthRevealOpen).toBe(false);
            expect(mockState.isModalOpen).toBe(false);
        });
    });

    describe('openReport / closeReport (v2.0)', () => {
        it('应该打开复盘报告并设置 isModalOpen', () => {
            slice.openReport();
            expect(mockState.isReportOpen).toBe(true);
            expect(mockState.isModalOpen).toBe(true);
        });

        it('应该关闭复盘报告并重置 isModalOpen', () => {
            slice.openReport();
            slice.closeReport();
            expect(mockState.isReportOpen).toBe(false);
            expect(mockState.isModalOpen).toBe(false);
        });
    });
});
