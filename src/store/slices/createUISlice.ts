import { StoreSlice } from '../types';

export interface UISlice {
    roleReferenceMode: 'modal' | 'sidebar';
    isSidebarExpanded: boolean;
    isRolePanelOpen: boolean;
    isRoleRevealOpen: boolean;
    isModalOpen: boolean;

    setRoleReferenceMode: (mode: 'modal' | 'sidebar') => void;
    toggleSidebar: () => void;
    openRolePanel: () => void;
    closeRolePanel: () => void;
    openRoleReveal: () => void;
    closeRoleReveal: () => void;
    setModalOpen: (isOpen: boolean) => void;
}

export const createUISlice: StoreSlice<UISlice> = (set) => ({
    roleReferenceMode: 'modal',
    isSidebarExpanded: false,
    isRolePanelOpen: false,
    isRoleRevealOpen: false,
    isModalOpen: false,

    setRoleReferenceMode: (mode) => set({ roleReferenceMode: mode }),
    toggleSidebar: () => set((state) => { state.isSidebarExpanded = !state.isSidebarExpanded; }),
    openRolePanel: () => set({ isRolePanelOpen: true, isModalOpen: true }),
    closeRolePanel: () => set({ isRolePanelOpen: false, isModalOpen: false }),
    openRoleReveal: () => set({ isRoleRevealOpen: true, isModalOpen: true }),
    closeRoleReveal: () => set({ isRoleRevealOpen: false, isModalOpen: false }),
    setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
});
