import { StoreSlice, GameSlice } from '../../types';

export const createGameNotesSlice: StoreSlice<Pick<GameSlice, 'addStorytellerNote' | 'addAutoNote' | 'updateStorytellerNote' | 'deleteStorytellerNote' | 'toggleNoteFloating' | 'updateNotePosition' | 'setNoteColor' | 'toggleNoteCollapse' | 'sendInfoCard'>> = (set, get) => ({
    addStorytellerNote: (content) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.storytellerNotes.push({
                    id: Date.now().toString(),
                    content,
                    timestamp: Date.now(),
                    type: 'manual'
                });
            }
        });
        get().sync();
    },

    addAutoNote: (content, color) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.storytellerNotes.push({
                    id: Date.now().toString(),
                    content,
                    timestamp: Date.now(),
                    type: 'auto',
                    color
                });
            }
        });
        get().sync();
    },

    updateStorytellerNote: (id, content) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const note = state.gameState.storytellerNotes.find(n => n.id === id);
                if (note) note.content = content;
            }
        });
        get().sync();
    },

    deleteStorytellerNote: (id) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.storytellerNotes = state.gameState.storytellerNotes.filter(n => n.id !== id);
            }
        });
        get().sync();
    },

    toggleNoteFloating: (id) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const note = state.gameState.storytellerNotes.find(n => n.id === id);
                if (note) note.isFloating = !note.isFloating;
            }
        });
        get().sync();
    },

    updateNotePosition: (id, x, y) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const note = state.gameState.storytellerNotes.find(n => n.id === id);
                if (note) note.position = { x, y };
            }
        });
        get().sync();
    },

    setNoteColor: (id, color) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const note = state.gameState.storytellerNotes.find(n => n.id === id);
                if (note) note.color = color;
            }
        });
        get().sync();
    },

    toggleNoteCollapse: (id) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const note = state.gameState.storytellerNotes.find(n => n.id === id);
                if (note) note.isCollapsed = !note.isCollapsed;
            }
        });
        get().sync();
    },

    sendInfoCard: (_card, _recipientId) => {
        if (!get().user?.isStoryteller) return;
        // Placeholder
    }
});
