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

    // Audio Settings
    audioSettings: import('../types').AudioSettings;
    setAudioMode: (mode: import('../types').AudioMode) => void;
    toggleAudioCategory: (category: keyof import('../types').AudioSettings['categories']) => void;
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

    // Audio Settings Implementation
    audioSettings: {
        mode: 'online', // Default to online
        categories: {
            ambience: true,
            ui: true,
            cues: true,
        }
    },
    setAudioMode: (mode) => set((state) => {
        state.audioSettings.mode = mode;
    }),
    toggleAudioCategory: (category) => set((state) => {
        state.audioSettings.categories[category] = !state.audioSettings.categories[category];
    }),
});

// 向后兼容导出
export const createUISlice = uiSlice;
