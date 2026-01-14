import { StateCreator } from 'zustand';
import { GameState, User, GamePhase, SeatStatus, NightActionRequest, GameHistory } from '../types';

// --- CONNECTION STATE TYPE ---
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

// --- AI CONFIG ---
export type AiProvider =
    | 'deepseek'
    | 'gemini'
    | 'kimi'
    | 'glm'
    | 'hw_deepseek_v3'      // 华为云 MaaS DeepSeek-V3.2
    | 'hw_deepseek_r1'      // 华为云 MaaS DeepSeek-R1
    | 'sf_deepseek_v3_2'
    | 'sf_minimax_m2'
    | 'sf_qwen_3_vl'
    | 'sf_glm_4_6'
    | 'sf_kimi_k2'
    | 'sf_kimi_k2_instruct';

// --- AUDIO SETTINGS ---
export type AudioMode = 'online' | 'offline';

export interface AudioSettings {
    mode: AudioMode;
    categories: {
        ambience: boolean; // Public: BGM, bells
        ui: boolean;       // Private: Clicks, feedback
        cues: boolean;     // Secret: Night actions, whispers
    };
}

// --- GAME SLICE INTERFACE ---
export interface GameSlice {
    gameState: GameState | null;
    isAudioBlocked: boolean;

    createGame: (seatCount: number) => Promise<void>;
    
    joinSeat: (seatId: number) => Promise<void>;
    leaveSeat: () => Promise<void>;
    sendMessage: (content: string, recipientId: string | null) => void;
    forwardMessage: (messageId: string, targetRecipientId: string | null) => void;
    setScript: (scriptId: string) => void;
    setPhase: (phase: GamePhase) => void;
    assignRole: (seatId: number, roleId: string | null) => void;
    toggleDead: (seatId: number) => void;
    toggleAbilityUsed: (seatId: number) => void;
    toggleStatus: (seatId: number, status: SeatStatus) => void;
    toggleWhispers: () => void;
    toggleVibration: () => void;
    addReminder: (seatId: number, text: string, icon?: string, color?: string) => void;
    removeReminder: (id: string) => void;
    importScript: (jsonContent: string) => void;

    // Custom Scripts
    saveCustomScript: (script: import('../types').ScriptDefinition) => void;
    deleteCustomScript: (scriptId: string) => void;
    loadCustomScript: (scriptId: string) => void;

    setAudioTrack: (trackId: string) => void;
    toggleAudioPlay: () => void;
    setAudioVolume: (vol: number) => void;
    setAudioBlocked: (blocked: boolean) => void;

    nightNext: () => void;
    nightPrev: () => void;

    startVote: (nomineeId: number, nominatorId?: number) => void;
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
    endGame: (winner: 'GOOD' | 'EVIL', reason: string) => void;
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

    // History
    fetchGameHistory: () => Promise<GameHistory[]>;
    saveGameHistory: (game: GameState) => Promise<void>;
    
    // v2.0 沉浸式 UI 控制
    toggleCandlelight: () => void;
    addInteractionLog: (entry: Omit<import('../types').InteractionLogEntry, 'id' | 'timestamp'>) => void;
}

export interface AppState extends GameSlice {
    user: User | null;
    isAiThinking: boolean;
    isOffline: boolean;
    connectionStatus: ConnectionStatus;
    aiProvider: AiProvider;
    roleReferenceMode: 'modal' | 'sidebar';
    isSidebarExpanded: boolean;
    isRolePanelOpen: boolean;
    isRoleRevealOpen: boolean;
    isTruthRevealOpen: boolean;  // v2.0: 真相揭示模态框
    isReportOpen: boolean;       // v2.0: 战报模态框


    login: (name: string, isStoryteller: boolean) => void;
    joinGame: (roomCode: string) => Promise<void>;
    spectateGame: (roomCode: string) => Promise<void>;
    leaveGame: () => void;

    setRoleReferenceMode: (mode: 'modal' | 'sidebar') => void;
    toggleSidebar: () => void;
    openRolePanel: () => void;
    closeRolePanel: () => void;
    openRoleReveal: () => void;
    closeRoleReveal: () => void;
    
    // v2.0: 真相揭示和战报控制
    openTruthReveal: () => void;
    closeTruthReveal: () => void;
    openReport: () => void;
    closeReport: () => void;

    askAi: (prompt: string) => Promise<void>;
    setAiProvider: (provider: AiProvider) => void;

    // AI
    clearAiMessages: () => void;
    deleteAiMessage: (id: string) => void;

    // Sync
    sync: () => void;
    syncToCloud: () => Promise<void>;
    refreshFromCloud: () => Promise<void>;


    // UI State
    isModalOpen: boolean;
    setModalOpen: (isOpen: boolean) => void;

    // Audio Settings
    audioSettings: AudioSettings;
    setAudioMode: (mode: AudioMode) => void;
    toggleAudioCategory: (category: keyof AudioSettings['categories']) => void;
}

export type StoreSlice<T> = StateCreator<AppState, [["zustand/immer", never]], [], T>;
