import { StateCreator } from 'zustand';
import { GameState, User, GamePhase, SeatStatus, NightActionRequest, GameHistory } from '../types';

// --- CONNECTION STATE TYPE ---
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

// --- AI CONFIG ---
export type AiProvider =
    | 'deepseek'
    | 'gemini'
    | 'kimi'
    | 'sf_deepseek_v3_2'
    | 'sf_minimax_m2'
    | 'sf_qwen_3_vl'
    | 'sf_glm_4_6'
    | 'sf_kimi_k2'
    | 'sf_kimi_k2_instruct';

export interface AppState {
    user: User | null;
    gameState: GameState | null;
    isAiThinking: boolean;
    isAudioBlocked: boolean;
    isOffline: boolean;
    connectionStatus: ConnectionStatus;
    aiProvider: AiProvider;
    roleReferenceMode: 'modal' | 'sidebar';
    isSidebarExpanded: boolean;
    isRolePanelOpen: boolean;
    isRoleRevealOpen: boolean;

    login: (name: string, isStoryteller: boolean) => void;
    createGame: (seatCount: number) => Promise<void>;
    joinGame: (roomCode: string) => Promise<void>;
    spectateGame: (roomCode: string) => Promise<void>;
    leaveGame: () => void;

    joinSeat: (seatId: number) => Promise<void>;
    leaveSeat: () => Promise<void>;
    sendMessage: (content: string, recipientId: string | null) => void;
    forwardMessage: (messageId: string, targetRecipientId: string | null) => void;
    setScript: (scriptId: string) => void;
    setPhase: (phase: GamePhase) => void;
    assignRole: (seatId: number, roleId: string) => void;
    toggleDead: (seatId: number) => void;
    toggleAbilityUsed: (seatId: number) => void;
    toggleStatus: (seatId: number, status: SeatStatus) => void;
    toggleWhispers: () => void;
    toggleVibration: () => void;
    addReminder: (seatId: number, text: string, icon?: string, color?: string) => void;
    removeReminder: (id: string) => void;
    setRoleReferenceMode: (mode: 'modal' | 'sidebar') => void;
    toggleSidebar: () => void;
    openRolePanel: () => void;
    closeRolePanel: () => void;
    openRoleReveal: () => void;
    closeRoleReveal: () => void;
    importScript: (jsonContent: string) => void;

    // Custom Scripts
    saveCustomScript: (script: import('../types').ScriptDefinition) => void;
    deleteCustomScript: (scriptId: string) => void;
    loadCustomScript: (scriptId: string) => void;

    askAi: (prompt: string) => Promise<void>;
    setAiProvider: (provider: AiProvider) => void;

    setAudioTrack: (trackId: string) => void;
    toggleAudioPlay: () => void;
    setAudioVolume: (vol: number) => void;
    setAudioBlocked: (blocked: boolean) => void;

    nightNext: () => void;
    nightPrev: () => void;

    startVote: (nomineeId: number) => void;
    nextClockHand: () => void;
    toggleHand: () => void;
    closeVote: () => void;

    // New Actions
    toggleReady: () => void;
    addSeat: () => void;
    removeSeat: () => void;
    addVirtualPlayer: () => void;
    removeVirtualPlayer: (seatId: number) => void;
    assignRoles: () => void;
    swapSeats: (seatId1: number, seatId2: number) => void;
    requestSeatSwap: (toSeatId: number) => void;
    respondToSwapRequest: (requestId: string, accept: boolean) => void;
    forceLeaveSeat: (seatId: number) => void;
    resetRoles: () => void;
    distributeRoles: () => void;
    hideRoles: () => void;
    startGame: () => void;
    applyStrategy: (strategyName: string, roleIds: string[]) => void;

    // Note Actions
    addStorytellerNote: (content: string) => void;
    addAutoNote: (content: string, color?: string) => void;
    updateStorytellerNote: (id: string, content: string) => void;
    deleteStorytellerNote: (id: string) => void;
    toggleNoteFloating: (id: string) => void;
    updateNotePosition: (id: string, x: number, y: number) => void;
    setNoteColor: (id: string, color: string) => void;
    toggleNoteCollapse: (id: string) => void;
    sendInfoCard: (card: import('../types').InfoCard, recipientId: string | null) => void;

    // Night Actions
    performNightAction: (action: { roleId: string, payload: any }) => void;
    submitNightAction: (action: { roleId: string, payload: any }) => void;
    resolveNightAction: (requestId: string, result: string) => void;
    getPendingNightActions: () => NightActionRequest[];

    // AI
    clearAiMessages: () => void;
    deleteAiMessage: (id: string) => void;

    // History
    fetchGameHistory: () => Promise<GameHistory[]>;
    saveGameHistory: (game: GameState) => Promise<void>;

    // Sync
    sync: () => void;
    syncToCloud: () => Promise<void>;
    refreshFromCloud: () => Promise<void>;

    // UI State
    isModalOpen: boolean;
    setModalOpen: (isOpen: boolean) => void;
}

export type StoreSlice<T> = StateCreator<AppState, [["zustand/immer", never]], [], T>;
