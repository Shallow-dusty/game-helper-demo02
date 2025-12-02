/**
 * UI Slice - 处理 UI 状态
 * 
 * 重命名自 createUISlice.ts，遵循新的命名规范
 */
import { StoreSlice } from '../types';

export interface UISlice {
    roleReferenceMode: 'modal' | 'sidebar';
    isSidebarExpanded: boolean;
    isRolePanelOpen: boolean;
    isRoleRevealOpen: boolean;
    isModalOpen: boolean;
    // v2.0 新增
    isTruthRevealOpen: boolean;
    isReportOpen: boolean;

    setRoleReferenceMode: (mode: 'modal' | 'sidebar') => void;
    toggleSidebar: () => void;
    openRolePanel: () => void;
    closeRolePanel: () => void;
    openRoleReveal: () => void;
    closeRoleReveal: () => void;
    setModalOpen: (isOpen: boolean) => void;
    // v2.0 新增
    openTruthReveal: () => void;
    closeTruthReveal: () => void;
    openReport: () => void;
    closeReport: () => void;
}

export const uiSlice: StoreSlice<UISlice> = (set) => ({
    roleReferenceMode: 'modal',
    isSidebarExpanded: false,
    isRolePanelOpen: false,
    isRoleRevealOpen: false,
    isModalOpen: false,
    // v2.0 新增
    isTruthRevealOpen: false,
    isReportOpen: false,

    setRoleReferenceMode: (mode) => set({ roleReferenceMode: mode }),
    toggleSidebar: () => set((state) => { state.isSidebarExpanded = !state.isSidebarExpanded; }),
    openRolePanel: () => set({ isRolePanelOpen: true, isModalOpen: true }),
    closeRolePanel: () => set({ isRolePanelOpen: false, isModalOpen: false }),
    openRoleReveal: () => set({ isRoleRevealOpen: true, isModalOpen: true }),
    closeRoleReveal: () => set({ isRoleRevealOpen: false, isModalOpen: false }),
    setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
    // v2.0 新增
    openTruthReveal: () => set({ isTruthRevealOpen: true, isModalOpen: true }),
    closeTruthReveal: () => set({ isTruthRevealOpen: false, isModalOpen: false }),
    openReport: () => set({ isReportOpen: true, isModalOpen: true }),
    closeReport: () => set({ isReportOpen: false, isModalOpen: false }),
});

// 向后兼容导出
export const createUISlice = uiSlice;
