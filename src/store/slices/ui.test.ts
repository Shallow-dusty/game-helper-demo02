import { describe, it, expect, beforeEach } from 'vitest';
import { uiSlice, createUISlice, UISlice } from './ui';

describe('uiSlice (ui.ts)', () => {
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
        slice = uiSlice(
            mockSet as Parameters<typeof uiSlice>[0],
            () => mockState as ReturnType<Parameters<typeof uiSlice>[1]>,
            {} as Parameters<typeof uiSlice>[2]
        );
        // Copy initial state to mockState
        Object.assign(mockState, slice);
    });

    describe('Initial State', () => {
        it('should have correct default values for UI state', () => {
            expect(slice.roleReferenceMode).toBe('modal');
            expect(slice.isSidebarExpanded).toBe(false);
            expect(slice.isRolePanelOpen).toBe(false);
            expect(slice.isRoleRevealOpen).toBe(false);
            expect(slice.isModalOpen).toBe(false);
            expect(slice.isTruthRevealOpen).toBe(false);
            expect(slice.isReportOpen).toBe(false);
        });

        it('should have correct default values for audio settings', () => {
            expect(slice.audioSettings).toBeDefined();
            expect(slice.audioSettings.mode).toBe('online');
            expect(slice.audioSettings.categories).toEqual({
                ambience: true,
                ui: true,
                cues: true,
            });
        });
    });

    describe('setRoleReferenceMode', () => {
        it('should set role reference mode to sidebar', () => {
            slice.setRoleReferenceMode('sidebar');
            expect(mockState.roleReferenceMode).toBe('sidebar');
        });

        it('should set role reference mode to modal', () => {
            slice.setRoleReferenceMode('modal');
            expect(mockState.roleReferenceMode).toBe('modal');
        });

        it('should allow switching between modes', () => {
            slice.setRoleReferenceMode('sidebar');
            expect(mockState.roleReferenceMode).toBe('sidebar');

            slice.setRoleReferenceMode('modal');
            expect(mockState.roleReferenceMode).toBe('modal');
        });
    });

    describe('toggleSidebar', () => {
        it('should toggle sidebar state from false to true', () => {
            expect(mockState.isSidebarExpanded).toBe(false);

            slice.toggleSidebar();
            expect(mockState.isSidebarExpanded).toBe(true);
        });

        it('should toggle sidebar state from true to false', () => {
            mockState.isSidebarExpanded = true;

            slice.toggleSidebar();
            expect(mockState.isSidebarExpanded).toBe(false);
        });

        it('should toggle sidebar multiple times correctly', () => {
            expect(mockState.isSidebarExpanded).toBe(false);

            slice.toggleSidebar();
            expect(mockState.isSidebarExpanded).toBe(true);

            slice.toggleSidebar();
            expect(mockState.isSidebarExpanded).toBe(false);

            slice.toggleSidebar();
            expect(mockState.isSidebarExpanded).toBe(true);
        });
    });

    describe('openRolePanel / closeRolePanel', () => {
        it('should open role panel and set isModalOpen to true', () => {
            slice.openRolePanel();
            expect(mockState.isRolePanelOpen).toBe(true);
            expect(mockState.isModalOpen).toBe(true);
        });

        it('should close role panel and reset isModalOpen to false', () => {
            slice.openRolePanel();
            slice.closeRolePanel();
            expect(mockState.isRolePanelOpen).toBe(false);
            expect(mockState.isModalOpen).toBe(false);
        });

        it('should handle multiple open/close cycles', () => {
            slice.openRolePanel();
            expect(mockState.isRolePanelOpen).toBe(true);

            slice.closeRolePanel();
            expect(mockState.isRolePanelOpen).toBe(false);

            slice.openRolePanel();
            expect(mockState.isRolePanelOpen).toBe(true);
        });
    });

    describe('openRoleReveal / closeRoleReveal', () => {
        it('should open role reveal and set isModalOpen to true', () => {
            slice.openRoleReveal();
            expect(mockState.isRoleRevealOpen).toBe(true);
            expect(mockState.isModalOpen).toBe(true);
        });

        it('should close role reveal and reset isModalOpen to false', () => {
            slice.openRoleReveal();
            slice.closeRoleReveal();
            expect(mockState.isRoleRevealOpen).toBe(false);
            expect(mockState.isModalOpen).toBe(false);
        });
    });

    describe('setModalOpen', () => {
        it('should set isModalOpen to true', () => {
            slice.setModalOpen(true);
            expect(mockState.isModalOpen).toBe(true);
        });

        it('should set isModalOpen to false', () => {
            slice.setModalOpen(false);
            expect(mockState.isModalOpen).toBe(false);
        });

        it('should handle repeated calls with same value', () => {
            slice.setModalOpen(true);
            slice.setModalOpen(true);
            expect(mockState.isModalOpen).toBe(true);

            slice.setModalOpen(false);
            slice.setModalOpen(false);
            expect(mockState.isModalOpen).toBe(false);
        });
    });

    describe('openTruthReveal / closeTruthReveal (v2.0)', () => {
        it('should open truth reveal and set isModalOpen to true', () => {
            slice.openTruthReveal();
            expect(mockState.isTruthRevealOpen).toBe(true);
            expect(mockState.isModalOpen).toBe(true);
        });

        it('should close truth reveal and reset isModalOpen to false', () => {
            slice.openTruthReveal();
            slice.closeTruthReveal();
            expect(mockState.isTruthRevealOpen).toBe(false);
            expect(mockState.isModalOpen).toBe(false);
        });
    });

    describe('openReport / closeReport (v2.0)', () => {
        it('should open report and set isModalOpen to true', () => {
            slice.openReport();
            expect(mockState.isReportOpen).toBe(true);
            expect(mockState.isModalOpen).toBe(true);
        });

        it('should close report and reset isModalOpen to false', () => {
            slice.openReport();
            slice.closeReport();
            expect(mockState.isReportOpen).toBe(false);
            expect(mockState.isModalOpen).toBe(false);
        });
    });

    describe('Audio Settings - setAudioMode', () => {
        it('should set audio mode to online', () => {
            slice.setAudioMode('online');
            expect(mockState.audioSettings?.mode).toBe('online');
        });

        it('should set audio mode to offline', () => {
            slice.setAudioMode('offline');
            expect(mockState.audioSettings?.mode).toBe('offline');
        });

        it('should switch between online and offline modes', () => {
            slice.setAudioMode('offline');
            expect(mockState.audioSettings?.mode).toBe('offline');

            slice.setAudioMode('online');
            expect(mockState.audioSettings?.mode).toBe('online');
        });

        it('should preserve other audio settings when changing mode', () => {
            // First set categories to a specific state
            mockState.audioSettings!.categories.ambience = false;

            slice.setAudioMode('offline');

            expect(mockState.audioSettings?.mode).toBe('offline');
            expect(mockState.audioSettings?.categories.ambience).toBe(false);
        });
    });

    describe('Audio Settings - toggleAudioCategory', () => {
        it('should toggle ambience category from true to false', () => {
            expect(mockState.audioSettings?.categories.ambience).toBe(true);

            slice.toggleAudioCategory('ambience');
            expect(mockState.audioSettings?.categories.ambience).toBe(false);
        });

        it('should toggle ambience category from false to true', () => {
            mockState.audioSettings!.categories.ambience = false;

            slice.toggleAudioCategory('ambience');
            expect(mockState.audioSettings?.categories.ambience).toBe(true);
        });

        it('should toggle ui category', () => {
            expect(mockState.audioSettings?.categories.ui).toBe(true);

            slice.toggleAudioCategory('ui');
            expect(mockState.audioSettings?.categories.ui).toBe(false);

            slice.toggleAudioCategory('ui');
            expect(mockState.audioSettings?.categories.ui).toBe(true);
        });

        it('should toggle cues category', () => {
            expect(mockState.audioSettings?.categories.cues).toBe(true);

            slice.toggleAudioCategory('cues');
            expect(mockState.audioSettings?.categories.cues).toBe(false);

            slice.toggleAudioCategory('cues');
            expect(mockState.audioSettings?.categories.cues).toBe(true);
        });

        it('should toggle categories independently', () => {
            // Toggle each category independently and verify others are unaffected
            slice.toggleAudioCategory('ambience');
            expect(mockState.audioSettings?.categories.ambience).toBe(false);
            expect(mockState.audioSettings?.categories.ui).toBe(true);
            expect(mockState.audioSettings?.categories.cues).toBe(true);

            slice.toggleAudioCategory('ui');
            expect(mockState.audioSettings?.categories.ambience).toBe(false);
            expect(mockState.audioSettings?.categories.ui).toBe(false);
            expect(mockState.audioSettings?.categories.cues).toBe(true);

            slice.toggleAudioCategory('cues');
            expect(mockState.audioSettings?.categories.ambience).toBe(false);
            expect(mockState.audioSettings?.categories.ui).toBe(false);
            expect(mockState.audioSettings?.categories.cues).toBe(false);
        });

        it('should preserve audio mode when toggling categories', () => {
            mockState.audioSettings!.mode = 'offline';

            slice.toggleAudioCategory('ambience');

            expect(mockState.audioSettings?.mode).toBe('offline');
            expect(mockState.audioSettings?.categories.ambience).toBe(false);
        });
    });

    describe('Multiple Modal State Management', () => {
        it('should track isModalOpen correctly when opening different modals', () => {
            // Open role panel
            slice.openRolePanel();
            expect(mockState.isModalOpen).toBe(true);
            expect(mockState.isRolePanelOpen).toBe(true);

            // Close role panel
            slice.closeRolePanel();
            expect(mockState.isModalOpen).toBe(false);
            expect(mockState.isRolePanelOpen).toBe(false);

            // Open role reveal
            slice.openRoleReveal();
            expect(mockState.isModalOpen).toBe(true);
            expect(mockState.isRoleRevealOpen).toBe(true);
        });

        it('should handle truth reveal modal state', () => {
            slice.openTruthReveal();
            expect(mockState.isModalOpen).toBe(true);
            expect(mockState.isTruthRevealOpen).toBe(true);

            slice.closeTruthReveal();
            expect(mockState.isModalOpen).toBe(false);
            expect(mockState.isTruthRevealOpen).toBe(false);
        });

        it('should handle report modal state', () => {
            slice.openReport();
            expect(mockState.isModalOpen).toBe(true);
            expect(mockState.isReportOpen).toBe(true);

            slice.closeReport();
            expect(mockState.isModalOpen).toBe(false);
            expect(mockState.isReportOpen).toBe(false);
        });
    });

    describe('Backward Compatibility', () => {
        it('createUISlice should be exported and work the same as uiSlice', () => {
            expect(createUISlice).toBeDefined();
            expect(createUISlice).toBe(uiSlice);
        });

        it('should create a slice with createUISlice alias', () => {
            const mockSet = createMockSet();
            const aliasSlice = createUISlice(
                mockSet as Parameters<typeof createUISlice>[0],
                () => mockState as ReturnType<Parameters<typeof createUISlice>[1]>,
                {} as Parameters<typeof createUISlice>[2]
            );

            expect(aliasSlice.roleReferenceMode).toBe('modal');
            expect(aliasSlice.audioSettings.mode).toBe('online');
        });
    });

    describe('Edge Cases', () => {
        it('should handle closing already closed modals', () => {
            // All modals are closed by default
            expect(mockState.isRolePanelOpen).toBe(false);
            expect(mockState.isModalOpen).toBe(false);

            // Closing already closed modal should not cause issues
            slice.closeRolePanel();
            expect(mockState.isRolePanelOpen).toBe(false);
            expect(mockState.isModalOpen).toBe(false);
        });

        it('should handle setting same role reference mode', () => {
            expect(mockState.roleReferenceMode).toBe('modal');

            // Setting same mode should work without issues
            slice.setRoleReferenceMode('modal');
            expect(mockState.roleReferenceMode).toBe('modal');
        });

        it('should handle setting same audio mode', () => {
            expect(mockState.audioSettings?.mode).toBe('online');

            // Setting same mode should work without issues
            slice.setAudioMode('online');
            expect(mockState.audioSettings?.mode).toBe('online');
        });

        it('should handle rapid toggle operations on sidebar', () => {
            for (let i = 0; i < 10; i++) {
                slice.toggleSidebar();
            }
            // After 10 toggles (even number), should be back to original state
            expect(mockState.isSidebarExpanded).toBe(false);

            slice.toggleSidebar();
            // After 11 toggles (odd number), should be toggled
            expect(mockState.isSidebarExpanded).toBe(true);
        });

        it('should handle rapid toggle operations on audio categories', () => {
            for (let i = 0; i < 10; i++) {
                slice.toggleAudioCategory('ambience');
            }
            // After 10 toggles (even number), should be back to original state (true)
            expect(mockState.audioSettings?.categories.ambience).toBe(true);

            slice.toggleAudioCategory('ambience');
            // After 11 toggles (odd number), should be toggled (false)
            expect(mockState.audioSettings?.categories.ambience).toBe(false);
        });
    });

    describe('State Isolation', () => {
        it('should not affect audio settings when toggling sidebar', () => {
            const originalAudioSettings = { ...mockState.audioSettings };

            slice.toggleSidebar();

            expect(mockState.audioSettings).toEqual(originalAudioSettings);
        });

        it('should not affect sidebar when changing audio settings', () => {
            const originalSidebarState = mockState.isSidebarExpanded;

            slice.setAudioMode('offline');
            slice.toggleAudioCategory('ambience');

            expect(mockState.isSidebarExpanded).toBe(originalSidebarState);
        });

        it('should not affect modals when changing audio settings', () => {
            slice.openRolePanel();
            const originalModalState = { ...mockState };

            slice.setAudioMode('offline');

            expect(mockState.isRolePanelOpen).toBe(originalModalState.isRolePanelOpen);
            expect(mockState.isModalOpen).toBe(originalModalState.isModalOpen);
        });
    });
});
