import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameState, User, GamePhase, ChatMessage, SeatStatus, Seat, NightActionRequest, GameHistory } from './types';
import { NIGHT_ORDER_FIRST, NIGHT_ORDER_OTHER, ROLES, PHASE_LABELS, SCRIPTS, PHASE_AUDIO_MAP, AUDIO_TRACKS } from './constants';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// --- Toast notification helper (lazy import to avoid circular dependency) ---
let showErrorFn: ((msg: string) => void) | null = null;
let showWarningFn: ((msg: string) => void) | null = null;
let showInfoFn: ((msg: string) => void) | null = null;
let showSuccessFn: ((msg: string) => void) | null = null;

// Lazy initialize toast functions
const getToastFunctions = async () => {
    if (!showErrorFn) {
        const { showError, showWarning, showInfo, showSuccess } = await import('./components/Toast');
        showErrorFn = showError;
        showWarningFn = showWarning;
        showInfoFn = showInfo;
        showSuccessFn = showSuccess;
    }
    return { showError: showErrorFn, showWarning: showWarningFn, showInfo: showInfoFn, showSuccess: showSuccessFn };
};

// --- SUPABASE CONFIG ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase URL or Key in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- CONNECTION STATE TYPE ---
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

// --- DATA FILTERING UTILITIES ---
// 数据视野隔离：根据用户身份过滤敏感信息

/**
 * 为特定用户过滤座位信息
 * @param seat 原始座位数据
 * @param currentUserId 当前用户ID
 * @param isStoryteller 是否是说书人
 * @returns 过滤后的座位数据
 */
// 可以看到魔典的角色
const GRIMOIRE_VIEWING_ROLES = ['spy'];

export const filterSeatForUser = (seat: Seat, currentUserId: string, isStoryteller: boolean, userRoleId?: string | null): Seat => {
    // ST 看到全部信息
    if (isStoryteller) {
        return seat;
    }

    // 间谍等角色可以看到魔典（所有人的角色）
    if (userRoleId && GRIMOIRE_VIEWING_ROLES.includes(userRoleId)) {
        return {
            ...seat,
            // 间谍可以看到所有人的 seenRoleId（展示身份）
            roleId: seat.seenRoleId,
            realRoleId: seat.realRoleId, // 间谍看到真实身份
        };
    }

    // 玩家看到自己的全部信息
    if (seat.userId === currentUserId) {
        // 玩家看到的是 seenRoleId（可能是假角色，如酒鬼）
        return {
            ...seat,
            roleId: seat.seenRoleId, // 向后兼容
            realRoleId: null, // 隐藏真实身份
        };
    }

    // 其他玩家看到的隐藏敏感信息
    return {
        ...seat,
        roleId: null, // 隐藏角色
        realRoleId: null, // 隐藏真实身份
        seenRoleId: null, // 隐藏展示身份
        statuses: [], // 隐藏状态（中毒/醉酒等）
        reminders: seat.reminders.filter(r => r.sourceRole === 'public'), // 只显示公开提醒
        hasUsedAbility: false, // 隐藏技能使用状态
    };
};

/**
 * 为特定用户过滤整个游戏状态
 * @param gameState 原始游戏状态
 * @param currentUserId 当前用户ID
 * @param isStoryteller 是否是说书人
 * @returns 过滤后的游戏状态
 */
export const filterGameStateForUser = (gameState: GameState, currentUserId: string, isStoryteller: boolean): GameState => {
    // 获取当前用户的角色（真实角色，用于判断是否是间谍等）
    const userSeat = gameState.seats.find(s => s.userId === currentUserId);
    const userRoleId = userSeat?.realRoleId || userSeat?.seenRoleId;

    return {
        ...gameState,
        seats: gameState.seats.map(seat => filterSeatForUser(seat, currentUserId, isStoryteller, userRoleId)),
        messages: gameState.messages.filter(msg => {
            // 系统消息对所有人可见
            if (msg.type === 'system') return true;
            // 公开消息对所有人可见
            if (!msg.recipientId) return true;
            // 私聊消息仅对发送者、接收者和 ST 可见
            if (msg.isPrivate) {
                return isStoryteller ||
                    msg.senderId === currentUserId ||
                    msg.recipientId === currentUserId;
            }
            return true;
        })
    };
};

// --- AI CONFIG ---
export type AiProvider =
    | 'deepseek'
    | 'gemini'  // 新增 Gemini (国内无法访问)
    | 'kimi'
    | 'sf_r1'
    | 'sf_r1_llama_70b'
    | 'sf_r1_qwen_32b'
    | 'sf_r1_qwen_7b_pro'
    | 'sf_minimax_m2'
    | 'sf_kimi_k2_thinking';

const AI_CONFIG: Record<AiProvider, { apiKey: string; baseURL: string; model: string; name: string; note?: string }> = {
    deepseek: {
        apiKey: import.meta.env.VITE_DEEPSEEK_KEY || '',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat', // V3.2
        name: 'DeepSeek V3.2 (Official)',
        note: '✅ 稳定可用，推荐使用'
    },
    gemini: {
        apiKey: import.meta.env.VITE_GEMINI_KEY || '',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
        model: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        note: '⚠️ 国内网络无法访问，需要科学上网'
    },
    kimi: {
        apiKey: import.meta.env.VITE_KIMI_KEY || '',
        baseURL: 'https://api.moonshot.cn/v1',
        model: 'moonshot-v1-8k',
        name: 'Kimi (Official)',
        note: '⚠️ 可能有 CORS 问题'
    },
    // SiliconFlow Models - 需要 VITE_SILICONFLOW_KEY
    sf_r1: {
        apiKey: import.meta.env.VITE_SILICONFLOW_KEY || '',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'deepseek-ai/DeepSeek-R1',
        name: '🧠 DeepSeek R1 (Full)',
        note: '⚠️ SiliconFlow 代理，可能有 CORS 问题'
    },
    sf_r1_llama_70b: {
        apiKey: import.meta.env.VITE_SILICONFLOW_KEY || '',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
        name: '🦙 R1 Distill Llama 70B',
        note: '⚠️ SiliconFlow 代理，可能有 CORS 问题'
    },
    sf_r1_qwen_32b: {
        apiKey: import.meta.env.VITE_SILICONFLOW_KEY || '',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
        name: '🤖 R1 Distill Qwen 32B',
        note: '⚠️ SiliconFlow 代理，可能有 CORS 问题'
    },
    sf_r1_qwen_7b_pro: {
        apiKey: import.meta.env.VITE_SILICONFLOW_KEY || '',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'Pro/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
        name: '⚡ R1 Distill Qwen 7B Pro',
        note: '⚠️ SiliconFlow 代理，可能有 CORS 问题'
    },
    sf_minimax_m2: {
        apiKey: import.meta.env.VITE_SILICONFLOW_KEY || '',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'MiniMaxAI/MiniMax-M2',
        name: '🦄 MiniMax M2 (230B)',
        note: '⚠️ SiliconFlow 代理，可能有 CORS 问题'
    },
    sf_kimi_k2_thinking: {
        apiKey: import.meta.env.VITE_SILICONFLOW_KEY || '',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'moonshotai/Kimi-K2-Thinking',
        name: '🤔 Kimi K2 Thinking',
        note: '⚠️ SiliconFlow 代理，可能有 CORS 问题'
    }
};

// 导出配置供组件使用
export const getAiConfig = () => AI_CONFIG;

// Global variables for subscription
let realtimeChannel: any = null;
let isReceivingUpdate = false;

// --- STATE HELPERS ---

const getInitialState = (roomId: string, seatCount: number, currentScriptId = 'tb'): GameState => ({
    roomId,
    currentScriptId,
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: false,
    vibrationEnabled: false, // 默认关闭，避免线下自爆
    seats: Array.from({ length: seatCount }, (_, i) => ({
        id: i,
        userId: null,
        userName: `座位 ${i + 1}`,
        isDead: false,
        hasGhostVote: true,
        roleId: null, // 向后兼容
        realRoleId: null, // 真实身份
        seenRoleId: null, // 展示身份
        reminders: [],
        isHandRaised: false,
        isNominated: false,
        hasUsedAbility: false,
        statuses: [],
        voteLocked: false,
    })),
    swapRequests: [],
    messages: [],
    gameOver: { isOver: false, winner: null, reason: '' },
    audio: {
        trackId: null,
        isPlaying: false,
        volume: 0.5,
    },
    nightQueue: [],
    nightCurrentIndex: -1,
    voting: null,
    customScripts: {},
    customRoles: {},
    voteHistory: [],
    roundInfo: {
        dayCount: 0,
        nightCount: 0,
        nominationCount: 0,
        totalRounds: 0
    },
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: []
});

const addSystemMessage = (gameState: GameState, content: string) => {
    gameState.messages.push({
        id: Math.random().toString(36).substr(2, 9),
        senderId: 'system',
        senderName: '系统',
        recipientId: null,
        content,
        timestamp: Date.now(),
        type: 'system'
    });
};

const fallbackTownsfolk = ['washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller', 'undertaker', 'monk', 'ravenkeeper'];

const applyRoleAssignment = (gameState: GameState, seat: Seat, roleId: string | null) => {
    if (!seat) return;

    seat.realRoleId = roleId;
    seat.seenRoleId = roleId;
    seat.roleId = roleId;
    seat.hasUsedAbility = false;
    seat.statuses = [];

    if (!roleId) {
        return;
    }

    const script = SCRIPTS[gameState.currentScriptId];

    const assignedRoles = gameState.seats
        .filter(s => s.realRoleId && s.id !== seat.id)
        .map(s => s.realRoleId!);

    const pickTownsfolk = (): string | null => {
        const availableTownsfolk = script?.roles
            .map(id => ROLES[id])
            .filter(r => r?.team === 'TOWNSFOLK' && r?.id && !assignedRoles.includes(r.id))
            .map(r => r!.id) || [];
        const pool = availableTownsfolk.length > 0 ? availableTownsfolk : fallbackTownsfolk;
        return pool[Math.floor(Math.random() * pool.length)] ?? null;
    };

    if (roleId === 'drunk') {
        const fakeRole = pickTownsfolk();
        seat.seenRoleId = fakeRole ?? null;
        seat.roleId = fakeRole ?? null;
    }

    if (roleId === 'lunatic') {
        const demons = script?.roles
            .map(id => ROLES[id])
            .filter(r => r?.team === 'DEMON' && r?.id)
            .map(r => r!.id) || [];
        const fakeDemon = demons.length > 0 ? demons[0] : 'imp';
        seat.seenRoleId = fakeDemon ?? null;
        seat.roleId = fakeDemon ?? null;
    }

    if (roleId === 'marionette') {
        const fakeRole = pickTownsfolk();
        seat.seenRoleId = fakeRole ?? null;
        seat.roleId = fakeRole ?? null;
    }
};

// --- STORE ---

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
    importScript: (jsonContent: string) => void;

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
    updateStorytellerNote: (id: string, content: string) => void;
    deleteStorytellerNote: (id: string) => void;
    sendInfoCard: (card: import('./types').InfoCard, recipientId: string | null) => void;

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
}

export const useStore = create<AppState>()(
    immer((set, get) => ({
        user: null,
        gameState: null,
        isAiThinking: false,
        isAudioBlocked: false,
        isOffline: false,
        connectionStatus: 'disconnected' as ConnectionStatus,
        aiProvider: 'deepseek',
        roleReferenceMode: 'modal',
        isSidebarExpanded: false,
        isRolePanelOpen: false,

        login: (name, isStoryteller) => {
            let id = localStorage.getItem('grimoire_uid');
            if (!id) {
                id = Math.random().toString(36).substring(7);
                localStorage.setItem('grimoire_uid', id);
            }
            const newUser: User = { id, name, isStoryteller, roomId: null, isSeated: false };
            set({ user: newUser });

            // 注意：不再自动重连，改为在 RoomSelection 中显示"继续上次游戏"按钮
            // 自动重连容易导致问题（房间已过期、网络错误等）
        },

        createGame: async (seatCount) => {
            const user = get().user;
            if (!user) return;

            set({ connectionStatus: 'connecting' });

            // 1. Prepare Data
            const code = Math.floor(1000 + Math.random() * 9000).toString();
            // 2. Create Game State
            const newState = getInitialState(code, seatCount);
            const updatedUser = { ...user, roomId: code };

            // Set local state immediately
            set({ user: updatedUser, gameState: newState, isOffline: false });
            addSystemMessage(newState, `${user.name} 创建了房间 ${code}`);

            // 保存房间号用于断线重连
            localStorage.setItem('grimoire_last_room', code);

            try {
                // 2. Insert into Supabase
                const { error } = await supabase
                    .from('game_rooms')
                    .insert({ room_code: code, data: newState });

                if (error) throw error;

                // 3. Subscribe to Realtime with connection status tracking
                const channel = supabase.channel(`room:${code}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${code}` },
                        (payload) => {
                            if (payload.new?.data) {
                                isReceivingUpdate = true;
                                set({ gameState: payload.new.data });
                                isReceivingUpdate = false;
                            }
                        }
                    )
                    .subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            set({ connectionStatus: 'connected', isOffline: false });
                        } else if (status === 'CLOSED') {
                            set({ connectionStatus: 'disconnected' });
                        } else if (status === 'CHANNEL_ERROR') {
                            set({ connectionStatus: 'reconnecting' });
                        }
                    });

                realtimeChannel = channel;
                console.log("✅ 云端房间创建成功:", code);

            } catch (error: any) {
                console.warn('⚠️ 云端连接失败，切换到离线模式:', error.message);
                set({ isOffline: true, connectionStatus: 'disconnected' });
            }
        },

        joinGame: async (roomCode) => {
            const user = get().user;
            if (!user) return;

            set({ connectionStatus: 'connecting' });

            try {
                // 1. Fetch Room
                const { data, error } = await supabase
                    .from('game_rooms')
                    .select('data')
                    .eq('room_code', roomCode)
                    .single();

                if (error) {
                    // NFR-02: 区分网络错误和房间不存在
                    if (error.code === 'PGRST116') {
                        // 房间不存在
                        void getToastFunctions().then(({ showError }) => showError("房间不存在！请检查房间号。"));
                    } else {
                        // 网络错误
                        void getToastFunctions().then(({ showError }) => showError("网络连接失败，请检查网络后重试。"));
                    }
                    set({ connectionStatus: 'disconnected' });
                    // 清除无效的房间记录
                    localStorage.removeItem('grimoire_last_room');
                    return;
                }

                if (!data) {
                    void getToastFunctions().then(({ showError }) => showError("房间不存在或已关闭！"));
                    set({ connectionStatus: 'disconnected' });
                    localStorage.removeItem('grimoire_last_room');
                    return;
                }

                const gameState = data.data as GameState;

                // 2. Subscribe
                if (realtimeChannel) void supabase.removeChannel(realtimeChannel);

                const channel = supabase.channel(`room:${roomCode}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` },
                        (payload) => {
                            if (payload.new?.data) {
                                isReceivingUpdate = true;
                                set({ gameState: payload.new.data });
                                isReceivingUpdate = false;
                            }
                        }
                    )
                    .subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            set({ connectionStatus: 'connected', isOffline: false });
                        } else if (status === 'CLOSED') {
                            set({ connectionStatus: 'disconnected' });
                        } else if (status === 'CHANNEL_ERROR') {
                            set({ connectionStatus: 'reconnecting' });
                        }
                    });

                realtimeChannel = channel;

                const updatedUser = { ...user, roomId: roomCode };
                set({ user: updatedUser, gameState: gameState, isOffline: false });

                // 保存房间号用于断线重连
                localStorage.setItem('grimoire_last_room', roomCode);

                // 3. Announce Join
                setTimeout(() => {
                    const currentState = get().gameState;
                    if (currentState) {
                        addSystemMessage(currentState, `${user.name} ${user.isStoryteller ? '(说书人)' : ''} 加入了房间。`);
                        void get().syncToCloud();
                    }
                }, 100);

            } catch (error: any) {
                console.error("Join Game Error:", error);
                set({ connectionStatus: 'disconnected' });
                // 清除可能无效的房间记录
                localStorage.removeItem('grimoire_last_room');
                void getToastFunctions().then(({ showError }) => showError?.(`加入房间失败: ${error.message}`));
            }
        },

        spectateGame: async (roomCode) => {
            set({ connectionStatus: 'connecting' });

            try {
                // 1. Fetch Room
                const { data, error } = await supabase
                    .from('game_rooms')
                    .select('data')
                    .eq('room_code', roomCode)
                    .single();

                if (error || !data) {
                    void getToastFunctions().then(({ showError }) => showError("房间不存在或已关闭！"));
                    set({ connectionStatus: 'disconnected' });
                    return;
                }

                const gameState = data.data as GameState;

                // 2. Subscribe (Read Only)
                if (realtimeChannel) void supabase.removeChannel(realtimeChannel);

                const channel = supabase.channel(`room:${roomCode}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` },
                        (payload) => {
                            if (payload.new?.data) {
                                isReceivingUpdate = true;
                                set({ gameState: payload.new.data });
                                isReceivingUpdate = false;
                            }
                        }
                    )
                    .subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            set({ connectionStatus: 'connected', isOffline: false });
                        } else if (status === 'CLOSED') {
                            set({ connectionStatus: 'disconnected' });
                        } else if (status === 'CHANNEL_ERROR') {
                            set({ connectionStatus: 'reconnecting' });
                        }
                    });

                realtimeChannel = channel;

                // Set GameState and Observer User
                set({
                    gameState: gameState,
                    connectionStatus: 'connected',
                    user: {
                        id: 'observer-' + Date.now(),
                        name: 'Observer',
                        isStoryteller: false,
                        roomId: roomCode,
                        isObserver: true,
                        isSeated: false
                    }
                });

            } catch (error: any) {
                console.error("Spectate Game Error:", error);
                set({ connectionStatus: 'disconnected' });
                void getToastFunctions().then(({ showError }) => showError?.(`连接失败: ${error.message}`));
            }
        },

        leaveGame: () => {
            const user = get().user;
            const state = get().gameState;

            if (!get().isOffline && state && user && !user.isObserver) {
                const seat = state.seats.find(s => s.userId === user.id);
                if (seat) {
                    seat.userId = null;
                    seat.userName = `座位 ${seat.id + 1}`;
                    seat.roleId = null;
                    seat.realRoleId = null;
                    seat.seenRoleId = null;
                    seat.isHandRaised = false;
                    seat.reminders = [];
                    seat.statuses = [];
                    seat.isDead = false;
                    seat.hasGhostVote = true;
                    seat.isNominated = false;
                    seat.hasUsedAbility = false;
                    seat.voteLocked = false;
                }
                addSystemMessage(state, `${user.name} 离开了房间。`);
                void get().syncToCloud();
            }

            // 清除断线重连信息
            if (state?.roomId) {
                localStorage.removeItem(`seat_token_${state.roomId}`);
            }
            localStorage.removeItem('grimoire_last_room');

            if (realtimeChannel) {
                void supabase.removeChannel(realtimeChannel);
                realtimeChannel = null;
            }

            set({
                user: user ? { ...user, roomId: null } : null,
                gameState: null,
                isOffline: false,
                connectionStatus: 'disconnected',
                isAiThinking: false,
                isAudioBlocked: false
            });
        },

        syncToCloud: async () => {
            if (get().isOffline) return;
            if (isReceivingUpdate) return;

            const currentGameState = get().gameState;
            if (!currentGameState) return;

            const { error } = await supabase
                .from('game_rooms')
                .update({ data: currentGameState, updated_at: new Date() })
                .eq('room_code', currentGameState.roomId);

            if (error) {
                console.warn("Sync Error:", error.message);
            }
        },

        // 强制从云端重新获取数据
        refreshFromCloud: async () => {
            const { gameState } = get();
            if (!gameState) return;

            try {
                const { data, error } = await supabase
                    .from('game_rooms')
                    .select('data')
                    .eq('room_code', gameState.roomId)
                    .single();

                if (error) {
                    console.error('refreshFromCloud error:', error);
                    return;
                }

                if (data?.data) {
                    isReceivingUpdate = true;
                    set({ gameState: data.data });
                    isReceivingUpdate = false;
                }
            } catch (err) {
                console.error('refreshFromCloud error:', err);
            }
        },

        sync: () => {
            void get().syncToCloud();
        },

        // --- ACTIONS ---

        joinSeat: async (seatId) => {
            const { user, gameState } = get();
            if (!user || !gameState) return;

            const seat = gameState.seats.find(s => s.id === seatId);
            if (!seat) return;

            // 检查用户是否已在其他座位
            const existingSeat = gameState.seats.find(s => s.userId === user.id && s.id !== seatId);
            if (existingSeat) {
                // 用户已在其他座位，不允许重复入座
                void getToastFunctions().then(({ showWarning }) => {
                    showWarning?.(`你已经在座位 ${existingSeat.id + 1}，不能同时占多个座位。`);
                });
                return;
            }

            // 检查座位是否已被占用（本地快速检查）
            if (seat.userId && seat.userId !== user.id && !seat.isVirtual) {
                void getToastFunctions().then(({ showWarning }) => {
                    showWarning?.(`座位 ${seatId + 1} 已被 ${seat.userName} 占用。`);
                });
                return;
            }

            // 生成客户端令牌（用于验证座位所有权）
            const clientToken = user.id + '_' + Date.now().toString(36);

            try {
                // 调用 Supabase RPC 原子化占座
                const { data, error } = await supabase.rpc('claim_seat', {
                    p_room_code: gameState.roomId,
                    p_seat_id: seatId,
                    p_user_id: user.id,
                    p_player_name: user.name,
                    p_client_token: clientToken
                });

                if (error) {
                    console.error('claim_seat RPC error:', error);
                    // 不降级，仅提示错误
                    void getToastFunctions().then(({ showWarning }) => {
                        showWarning?.('网络错误，请重试');
                    });
                    return;
                }

                if (data && !data.success) {
                    // RPC 返回失败（座位已被占用）
                    void getToastFunctions().then(({ showWarning }) => {
                        showWarning?.(data.error || '座位已被占用');
                    });
                    return;
                }

                // RPC 成功，更新本地状态
                seat.userId = user.id;
                seat.userName = user.name;
                seat.isVirtual = false;

                // SECURITY FIX: 将 clientToken 存储在本地 localStorage，而不是公开的 gameState
                localStorage.setItem(`seat_token_${gameState.roomId}`, clientToken);

                addSystemMessage(gameState, `${user.name} 就坐于座位 ${seatId + 1}。`);
                set({ gameState: { ...gameState } });
                // 不需要 syncToCloud，RPC 已经更新了数据库

            } catch (err) {
                console.error('claim_seat error:', err);
                // 不降级，仅提示错误
                void getToastFunctions().then(({ showWarning }) => {
                    showWarning?.('网络错误，请稍后重试');
                });
            }
        },

        leaveSeat: async () => {
            const { user, gameState } = get();
            if (!user || !gameState) return;

            // 找到用户当前的座位
            const seat = gameState.seats.find(s => s.userId === user.id);
            if (!seat) {
                void getToastFunctions().then(({ showWarning }) => {
                    showWarning?.('你没有座位可以离开。');
                });
                return;
            }

            // SECURITY FIX: 从 localStorage 获取 token
            const clientToken = localStorage.getItem(`seat_token_${gameState.roomId}`);

            const seatId = seat.id;
            const userName = seat.userName;

            try {
                // 如果有 clientToken，调用 RPC 离座
                if (clientToken) {
                    const { data, error } = await supabase.rpc('leave_seat', {
                        p_room_code: gameState.roomId,
                        p_seat_id: seatId,
                        p_client_token: clientToken
                    });

                    if (error) {
                        console.error('leave_seat RPC error:', error);
                        // 降级到本地处理
                    }

                    if (data && !data.success) {
                        // 可能 token 不匹配，但仍允许本地清除
                        console.warn('leave_seat failed:', data.error);
                    }
                }

                // 清除本地座位状态
                seat.userId = null;
                seat.userName = `座位 ${seat.id + 1}`;
                seat.roleId = null;
                seat.realRoleId = null;
                seat.seenRoleId = null;
                seat.reminders = [];
                seat.statuses = [];
                seat.isDead = false;
                seat.hasGhostVote = true;
                seat.isNominated = false;
                seat.hasUsedAbility = false;
                seat.voteLocked = false;

                // 清除本地 token
                localStorage.removeItem(`seat_token_${gameState.roomId}`);

                addSystemMessage(gameState, `${userName} 离开了座位 ${seatId + 1}。`);
                set({ gameState: { ...gameState } });
                void get().syncToCloud();

            } catch (err) {
                console.error('leave_seat error:', err);
                // 降级到本地处理
                seat.userId = null;
                seat.userName = `座位 ${seat.id + 1}`;
                seat.roleId = null;
                seat.realRoleId = null;
                seat.seenRoleId = null;
                seat.reminders = [];
                seat.statuses = [];
                seat.isDead = false;
                seat.hasGhostVote = true;
                seat.isNominated = false;
                seat.hasUsedAbility = false;
                seat.voteLocked = false;

                localStorage.removeItem(`seat_token_${gameState.roomId}`);

                addSystemMessage(gameState, `${userName} 离开了座位 ${seatId + 1}。`);
                set({ gameState: { ...gameState } });
                void get().syncToCloud();
            }
        },

        sendMessage: (content, recipientId) => {
            const { user, gameState } = get();
            if (!user || !gameState) return;

            if (recipientId !== null && !gameState.allowWhispers && !user.isStoryteller) {
                return;
            }

            const msg: ChatMessage = {
                id: Math.random().toString(36).substr(2, 9),
                senderId: user.id,
                senderName: user.name,
                recipientId,
                content,
                timestamp: Date.now(),
                type: 'chat'
            };
            gameState.messages.push(msg);

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },



        setScript: (scriptId) => {
            const { gameState } = get();
            if (!gameState) return; // Added check for gameState
            const script = SCRIPTS[scriptId] || gameState.customScripts[scriptId]; // Define script
            if (!script) return; // Check if script exists

            gameState.currentScriptId = scriptId;
            addSystemMessage(gameState, `剧本已切换为: ${script.name}`);
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        importScript: (jsonContent: string) => {
            const { gameState } = get();
            if (!gameState) return;

            try {
                const data = JSON.parse(jsonContent);
                if (!Array.isArray(data)) throw new Error("Invalid format: Expected array of roles");

                const scriptId = `custom_${Date.now()}`;
                const scriptName = data.find((item: any) => item.id === '_meta')?.name || `Custom Script ${new Date().toLocaleTimeString()}`;

                const roles: string[] = [];

                data.forEach((item: any) => {
                    if (item.id === '_meta') return;

                    if (item.id && item.name && item.team) {
                        gameState.customRoles[item.id] = {
                            id: item.id,
                            name: item.name,
                            team: item.team,
                            ability: item.ability || item.description || '',
                            firstNight: item.firstNightReminder ? true : false,
                            otherNight: item.otherNightReminder ? true : false,
                            icon: item.image || undefined,
                            reminders: item.reminders || []
                        };
                        roles.push(item.id);
                    }
                });

                if (roles.length === 0) throw new Error("No valid roles found");

                gameState.customScripts[scriptId] = {
                    id: scriptId,
                    name: scriptName,
                    roles: roles
                };

                addSystemMessage(gameState, `成功导入剧本: ${scriptName}`);
                set({ gameState: { ...gameState } });
                get().setScript(scriptId);
                void get().syncToCloud();

            } catch (e: any) { // Added type annotation for error
                console.error("Script import failed", e);
                void getToastFunctions().then(({ showError }) => showError?.("导入失败: 剧本格式不正确"));
            }
        },

        setPhase: (phase) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            const prevPhase = gameState.phase;
            gameState.phase = phase;

            if (prevPhase !== phase) {
                addSystemMessage(gameState, `阶段变更为: ${PHASE_LABELS[phase]}`);

                // Round Tracking
                if (phase === 'NIGHT') {
                    gameState.roundInfo.nightCount++;
                    gameState.roundInfo.totalRounds++;
                } else if (phase === 'DAY') {
                    gameState.roundInfo.dayCount++;
                }

                // 自动切换对应阶段的背景音乐
                const audioTrackId = PHASE_AUDIO_MAP[phase as keyof typeof PHASE_AUDIO_MAP];
                if (audioTrackId && gameState.audio) {
                    // 检查音轨是否存在且有有效的 URL
                    const track = AUDIO_TRACKS[audioTrackId];
                    if (track?.url && track.url !== '') {
                        gameState.audio.trackId = audioTrackId;
                        // 保持当前播放状态，如果之前在播放则继续播放
                    }
                }
            }

            if (phase === 'NIGHT') {
                const isFirstNight = !gameState.seats.some(s => s.isDead);
                const availableRoles = gameState.seats
                    .filter(s => s.roleId && !s.isDead)
                    .map(s => s.roleId!);

                const order = isFirstNight ? NIGHT_ORDER_FIRST : NIGHT_ORDER_OTHER;

                gameState.nightQueue = order.filter(role => {
                    const hasRole = availableRoles.includes(role);
                    const def = ROLES[role];
                    if (!def) return false;
                    return hasRole || def.team === 'MINION' || def.team === 'DEMON';
                });
                gameState.nightCurrentIndex = 0;
            }

            if (phase !== 'VOTING' && phase !== 'NOMINATION') {
                gameState.voting = null;
            }

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        assignRole: (seatId, roleId) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            // 游戏开始后禁止修改身份（除非是说书人强制操作）
            if (gameState.setupPhase === 'STARTED') {
                void getToastFunctions().then(({ showWarning }) => {
                    showWarning?.('游戏已开始，无法修改角色分配。');
                });
                return;
            }

            const seat = gameState.seats.find(s => s.id === seatId);
            if (seat) {
                applyRoleAssignment(gameState, seat, roleId);
            }
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        toggleDead: (seatId) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            const seat = gameState.seats.find(s => s.id === seatId);
            if (!seat) return;

            seat.isDead = !seat.isDead;
            if (seat.isDead) {
                seat.hasGhostVote = true;
                addSystemMessage(gameState, `${seat.userName} 死亡了。`);

                const role = seat.roleId ? ROLES[seat.roleId] : null;
                if (role) {
                    if (role.team === 'DEMON') {
                        const hasScarlet = gameState.seats.some(s => s.roleId === 'scarlet_woman' && !s.isDead);
                        if (hasScarlet) {
                            addSystemMessage(gameState, `⚠️ 恶魔死亡！但【猩红女巫】可能接管...请手动处理。`);
                        } else {
                            gameState.gameOver = { isOver: true, winner: 'GOOD', reason: '恶魔已死亡' };
                            addSystemMessage(gameState, `🏆 游戏结束！好人胜利 (恶魔死亡)`);
                            // 播放胜利音乐
                            if (gameState.audio) {
                                gameState.audio.trackId = 'victory_good';
                                gameState.audio.isPlaying = true;
                            }
                            void get().saveGameHistory(gameState); // Save history
                        }
                    }
                    if (role.id === 'saint' && gameState.phase === 'DAY') {
                        gameState.gameOver = { isOver: true, winner: 'EVIL', reason: '圣徒被处决' };
                        addSystemMessage(gameState, `🏆 游戏结束！邪恶胜利 (圣徒被处决)`);
                        // 播放胜利音乐
                        if (gameState.audio) {
                            gameState.audio.trackId = 'victory_evil';
                            gameState.audio.isPlaying = true;
                        }
                        void get().saveGameHistory(gameState); // Save history
                    }
                }
            } else {
                addSystemMessage(gameState, `${seat.userName} 复活了。`);
            }
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        toggleAbilityUsed: (seatId) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;
            const seat = gameState.seats.find(s => s.id === seatId);
            if (seat) {
                seat.hasUsedAbility = !seat.hasUsedAbility;
            }
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        toggleStatus: (seatId, status) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;
            const seat = gameState.seats.find(s => s.id === seatId);
            if (seat) {
                if (seat.statuses.includes(status)) {
                    seat.statuses = seat.statuses.filter(s => s !== status);
                } else {
                    seat.statuses = [...seat.statuses, status];
                }
            }
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        toggleWhispers: () => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;
            gameState.allowWhispers = !gameState.allowWhispers;
            addSystemMessage(gameState, gameState.allowWhispers ? "🟢 说书人开启了私聊功能。" : "🔴 说书人禁用了私聊功能。");
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        toggleVibration: () => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;
            gameState.vibrationEnabled = !gameState.vibrationEnabled;
            addSystemMessage(gameState, gameState.vibrationEnabled ? "📳 说书人开启了夜间振动提醒。" : "🔇 说书人关闭了夜间振动提醒。");
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        addReminder: (seatId, text, icon, color) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;
            const seat = gameState.seats.find(s => s.id === seatId);
            if (seat) {
                seat.reminders = [...seat.reminders, {
                    id: Math.random().toString(36),
                    text,
                    sourceRole: 'ST',
                    seatId,
                    icon,
                    color
                }];
            }
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        addSeat: (() => {
            let isProcessing = false;
            return () => {
                if (isProcessing) return; // 防抖：防止快速重复点击
                isProcessing = true;
                setTimeout(() => { isProcessing = false; }, 300); // 300ms 防抖间隔

                const { gameState, user } = get();
                if (!gameState || !user?.isStoryteller) return;
                // 限制最大座位数为 20
                if (gameState.seats.length >= 20) {
                    void getToastFunctions().then(({ showWarning }) => showWarning?.("座位数已达上限 (20)！"));
                    return;
                }
                const newId = gameState.seats.length;
                gameState.seats = [...gameState.seats, {
                    id: newId,
                    userId: null,
                    userName: `座位 ${newId + 1}`,
                    isDead: false,
                    hasGhostVote: true,
                    roleId: null,
                    realRoleId: null,
                    seenRoleId: null,
                    reminders: [],
                    isHandRaised: false,
                    isNominated: false,
                    hasUsedAbility: false,
                    statuses: [],
                    isVirtual: false, // 新增座位默认为空座位，不是虚拟玩家
                    voteLocked: false
                }];
                addSystemMessage(gameState, `添加了新座位 ${newId + 1}`);
                set({ gameState: { ...gameState } });
                void get().syncToCloud();
            };
        })(),

        swapSeats: (seatId1, seatId2) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            const s1Index = gameState.seats.findIndex(s => s.id === seatId1);
            const s2Index = gameState.seats.findIndex(s => s.id === seatId2);

            if (s1Index === -1 || s2Index === -1) return;

            const s1 = gameState.seats[s1Index];
            const s2 = gameState.seats[s2Index];
            if (!s1 || !s2) return;

            // Swap properties except ID
            const temp = { ...s1 };
            const s1Id = s1.id;
            const s2Id = s2.id;

            // Assign s2 props to s1, but keep s1.id
            Object.assign(s1, s2);
            s1.id = s1Id;

            // Assign temp (s1) props to s2, but keep s2.id
            Object.assign(s2, temp);
            s2.id = s2Id;

            addSystemMessage(gameState, `座位 ${seatId1 + 1} 和 座位 ${seatId2 + 1} 交换了位置`);
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        requestSeatSwap: (toSeatId) => {
            const { gameState, user } = get();
            if (!gameState || !user) return;

            const fromSeat = gameState.seats.find(s => s.userId === user.id);
            if (!fromSeat) {
                void getToastFunctions().then(({ showWarning }) => showWarning?.("你还没有入座！"));
                return;
            }

            const toSeat = gameState.seats.find(s => s.id === toSeatId);
            if (!toSeat) return;

            if (!toSeat.userId) {
                // Empty seat, just move
                void get().joinSeat(toSeatId);
                return;
            }

            // Check if already requested
            const existing = gameState.swapRequests.find(
                r => r.fromUserId === user.id && r.toUserId === toSeat.userId
            );
            if (existing) {
                void getToastFunctions().then(({ showInfo }) => showInfo?.("已发送换座请求，请等待对方回应"));
                return;
            }

            const request: import('./types').SwapRequest = {
                id: Math.random().toString(36).substring(7),
                fromSeatId: fromSeat.id,
                fromUserId: user.id,
                fromName: user.name,
                toSeatId: toSeat.id,
                toUserId: toSeat.userId,
                timestamp: Date.now()
            };

            gameState.swapRequests.push(request);

            void getToastFunctions().then(({ showSuccess }) => showSuccess?.(`已向 ${toSeat.userName} 发送换座请求`));

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        respondToSwapRequest: (requestId, accept) => {
            const { gameState, user } = get();
            if (!gameState || !user) return;

            const requestIndex = gameState.swapRequests.findIndex(r => r.id === requestId);
            if (requestIndex === -1) return;

            const request = gameState.swapRequests[requestIndex];
            if (!request) return;
            if (request.toUserId !== user.id) return; // Only target can respond

            // Remove request
            gameState.swapRequests.splice(requestIndex, 1);

            if (accept) {
                // Perform swap
                get().swapSeats(request.fromSeatId, request.toSeatId);
            } else {
                // Notify sender of rejection (optional)
                void getToastFunctions().then(({ showInfo }) => showInfo?.(`${user.name} 拒绝了换座请求`));
            }

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        removeSeat: () => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller || gameState.seats.length === 0) return;
            // 限制最小座位数为 5
            if (gameState.seats.length <= 5) {
                void getToastFunctions().then(({ showWarning }) => showWarning?.("座位数已达下限 (5)！"));
                return;
            }
            // Remove the last seat
            gameState.seats = gameState.seats.slice(0, -1);
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        removeReminder: (id) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;
            gameState.seats.forEach(s => {
                s.reminders = s.reminders.filter(r => r.id !== id);
            });
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        setRoleReferenceMode: (mode) => {
            set({ roleReferenceMode: mode });
        },

        toggleSidebar: () => {
            set(state => ({ isSidebarExpanded: !state.isSidebarExpanded }));
        },

        openRolePanel: () => {
            set({ isRolePanelOpen: true });
        },

        closeRolePanel: () => {
            set({ isRolePanelOpen: false });
        },

        setAudioTrack: (trackId) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            // 检查音轨是否存在且有有效的 URL
            const track = AUDIO_TRACKS[trackId];
            if (!track?.url || track.url === '') {
                // 音轨无效，不设置
                return;
            }

            gameState.audio.trackId = trackId;
            gameState.audio.isPlaying = true;
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        toggleAudioPlay: () => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;
            gameState.audio.isPlaying = !gameState.audio.isPlaying;
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        setAudioVolume: (() => {
            let syncTimeout: ReturnType<typeof setTimeout> | null = null;
            return (vol: number) => {
                const { gameState, user } = get();
                if (!gameState || !user?.isStoryteller) return;
                gameState.audio.volume = vol;
                set({ gameState: { ...gameState } });

                // 防抖：延迟同步到云端，避免频繁同步
                if (syncTimeout) clearTimeout(syncTimeout);
                syncTimeout = setTimeout(() => {
                    void get().syncToCloud();
                    syncTimeout = null;
                }, 500); // 500ms 防抖
            };
        })(),

        setAudioBlocked: (blocked) => {
            set({ isAudioBlocked: blocked });
        },

        nightNext: () => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;
            if (gameState.nightCurrentIndex < gameState.nightQueue.length - 1) {
                gameState.nightCurrentIndex++;
            }
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        nightPrev: () => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;
            if (gameState.nightCurrentIndex > 0) {
                gameState.nightCurrentIndex--;
            }
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        startVote: (nomineeId) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            gameState.phase = 'VOTING';
            const startIdx = (nomineeId + 1) % gameState.seats.length;
            const nominee = gameState.seats.find(s => s.id === nomineeId);
            if (!nominee) return;

            gameState.voting = {
                nominatorSeatId: null,
                nomineeSeatId: nomineeId,
                clockHandSeatId: startIdx,
                votes: [],
                isOpen: true
            };

            addSystemMessage(gameState, `开始对 ${nominee?.userName} 进行投票。`);
            gameState.roundInfo.nominationCount++;

            if (nominee?.roleId === 'virgin' && !nominee.hasUsedAbility) {
                addSystemMessage(gameState, `⚡ 警告：【处女】被提名！若提名者是村民，请立即处决提名者。`);
            }

            gameState.seats.forEach(s => {
                s.isHandRaised = false;
                s.voteLocked = false;
            });
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        nextClockHand: (() => {
            // 防抖：防止快速点击造成的闪烁
            let isProcessing = false;

            return () => {
                if (isProcessing) return;
                isProcessing = true;

                try {
                    const { gameState } = get();
                    if (!gameState?.voting) {
                        isProcessing = false;
                        return;
                    }

                    const currentHand = gameState.voting.clockHandSeatId;
                    if (currentHand === null) {
                        isProcessing = false;
                        return;
                    }

                    const currentSeat = gameState.seats.find(s => s.id === currentHand);

                    if (currentSeat && !currentSeat.voteLocked) {
                        if (currentSeat.isHandRaised) {
                            gameState.voting.votes.push(currentHand);
                            if (currentSeat.isDead) {
                                currentSeat.hasGhostVote = false;
                                addSystemMessage(gameState, `${currentSeat.userName} 投出了死票。`);
                            }
                        }
                        currentSeat.voteLocked = true;
                    }

                    const nextHand = (currentHand + 1) % gameState.seats.length;
                    if (nextHand === gameState.voting.nomineeSeatId) {
                        // 投票结束，自动结算
                        gameState.voting.clockHandSeatId = null;
                        gameState.voting.isOpen = false;

                        const voteCount = gameState.voting.votes.length;
                        const aliveCount = gameState.seats.filter(s => (s.userId || s.isVirtual) && !s.isDead).length;
                        const majority = aliveCount > 0 ? Math.floor(aliveCount / 2) + 1 : 0;
                        const nominee = gameState.seats.find(s => s.id === gameState.voting?.nomineeSeatId);

                        addSystemMessage(gameState, `投票结束。共 ${voteCount} 票（过半需要 ${majority} 票）。`);

                        // 自动结算结果
                        const result: 'executed' | 'survived' = majority > 0 && voteCount >= majority ? 'executed' : 'survived';

                        if (result === 'executed') {
                            addSystemMessage(gameState, `🪦 ${nominee?.userName || '被提名者'} 票数达标，可被处决。`);
                        } else {
                            addSystemMessage(gameState, `✅ ${nominee?.userName || '被提名者'} 票数不足，存活。`);
                        }

                        // 记录投票历史
                        const voteRecord: import('./types').VoteRecord = {
                            round: gameState.voteHistory.length + 1,
                            nominatorSeatId: gameState.voting.nominatorSeatId || -1,
                            nomineeSeatId: gameState.voting.nomineeSeatId,
                            votes: gameState.voting.votes,
                            voteCount,
                            timestamp: Date.now(),
                            result
                        };
                        gameState.voteHistory.push(voteRecord);
                    } else {
                        gameState.voting.clockHandSeatId = nextHand;
                    }

                    set({ gameState: { ...gameState } });
                    void get().syncToCloud();
                } finally {
                    // 延迟释放锁，避免快速连续点击
                    setTimeout(() => {
                        isProcessing = false;
                    }, 150);
                }
            };
        })(),

        toggleHand: (() => {
            // 防抖：防止快速点击
            let lastToggle = 0;

            return () => {
                const now = Date.now();
                if (now - lastToggle < 150) return;
                lastToggle = now;

                const { user, gameState } = get();
                if (!user || !gameState?.voting?.isOpen) return;

                const seat = gameState.seats.find(s => s.userId === user.id);

                if (seat) {
                    if (seat.voteLocked) return;
                    if (seat.isDead && !seat.hasGhostVote) return;
                    seat.isHandRaised = !seat.isHandRaised;
                    set({ gameState: { ...gameState } });
                    void get().syncToCloud();
                }
            };
        })(),

        closeVote: () => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            // Record vote in history if voting was actually happening
            if (gameState.voting && gameState.voting.nomineeSeatId !== null) {
                const votingData = gameState.voting;
                const voteCount = votingData.votes.length;

                // Determine result based on vote count (simplified logic)
                let result: 'executed' | 'survived' | 'cancelled' = 'cancelled';
                const aliveCount = gameState.seats.filter(s => (s.userId || s.isVirtual) && !s.isDead).length;
                const required = aliveCount > 0 ? Math.floor(aliveCount / 2) + 1 : 0;
                if (required > 0 && voteCount >= required) {
                    result = 'executed';
                } else if (votingData.nomineeSeatId !== null) {
                    result = 'survived';
                }

                const voteRecord: import('./types').VoteRecord = {
                    round: gameState.voteHistory.length + 1,
                    nominatorSeatId: votingData.nominatorSeatId || -1,
                    nomineeSeatId: votingData.nomineeSeatId!,
                    votes: votingData.votes,
                    voteCount,
                    timestamp: Date.now(),
                    result
                };

                gameState.voteHistory.push(voteRecord);
            }

            // Fix: Refund ghost votes if cancelled
            if (gameState.voting && gameState.voting.votes.length > 0) {
                // Check if we are cancelling (either explicit cancel or implicit via this function)
                // The logic above sets result to 'cancelled' if not executed/survived.
                // However, closeVote is often called to FORCE cancel.
                // Let's assume if it wasn't a completed vote (which is handled in nextClockHand usually), it's a cancel.
                // Actually, nextClockHand handles the 'executed'/'survived' logic and closes the vote.
                // closeVote is typically manual intervention or "Cancel".

                // If we are here, it means we are manually closing/cancelling.
                // We should refund ghost votes for anyone who voted in this incomplete/cancelled round.
                gameState.voting.votes.forEach(voterSeatId => {
                    const voter = gameState.seats.find(s => s.id === voterSeatId);
                    if (voter && voter.isDead) {
                        voter.hasGhostVote = true;
                        // Optional: Add individual message? Might be too spammy.
                    }
                });
                if (gameState.voting.votes.some(sid => gameState.seats.find(s => s.id === sid)?.isDead)) {
                    addSystemMessage(gameState, `👻 投票取消，已归还死者投出的幽灵票。`);
                }
            }

            gameState.phase = 'DAY';
            gameState.voting = null;
            gameState.seats.forEach(s => {
                s.isHandRaised = false;
                s.isNominated = false;
                s.voteLocked = false;
            });
            addSystemMessage(gameState, `投票被取消/结束。`);
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        setAiProvider: (provider) => {
            set({ aiProvider: provider });
        },

        askAi: async (prompt: string) => {
            const { user, gameState, aiProvider } = get();
            if (!user || !user.isStoryteller || !gameState) return;

            set({ isAiThinking: true });

            // 添加用户消息到 aiMessages
            const userMsg: ChatMessage = {
                id: Math.random().toString(36).substr(2, 9),
                senderId: user.id,
                senderName: user.name,
                recipientId: null,
                content: prompt,
                timestamp: Date.now(),
                type: 'chat',
                role: 'user'
            };
            gameState.aiMessages.push(userMsg);
            set({ gameState: { ...gameState } });

            try {
                const config = AI_CONFIG[aiProvider];
                if (!config.apiKey) {
                    throw new Error(`缺少 ${config.name} 的 API Key，请在 .env.local 中配置`);
                }

                const openai = new OpenAI({
                    apiKey: config.apiKey,
                    baseURL: config.baseURL,
                    dangerouslyAllowBrowser: true // Required for client-side usage
                });

                const gameContext = {
                    script: SCRIPTS[gameState.currentScriptId]?.name || gameState.customScripts[gameState.currentScriptId]?.name,
                    phase: gameState.phase,
                    seats: gameState.seats.map(s => ({
                        name: s.userName,
                        role: s.roleId ? (ROLES[s.roleId]?.name || gameState.customRoles[s.roleId]?.name) : 'Unknown',
                        isDead: s.isDead,
                        statuses: s.statuses
                    })),
                    nightOrder: gameState.nightQueue.map(r => ROLES[r]?.name || gameState.customRoles[r]?.name),
                };

                const completion = await openai.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are an expert 'Blood on the Clocktower' Storyteller assistant. Keep answers concise and helpful. Respond in Chinese." },
                        { role: "user", content: `Context: ${JSON.stringify(gameContext)}. User Question: ${prompt}` }
                    ],
                    model: config.model,
                });

                let reply = completion.choices[0]?.message?.content || '';

                // Handle DeepSeek R1 "reasoning_content" if available (some APIs might return it this way)
                // @ts-ignore
                const reasoning = completion.choices[0]?.message?.reasoning_content;

                if (reasoning) {
                    reply = `<think>${reasoning}</think>\n${reply}`;
                }

                if (reply) {
                    // 添加AI回复到 aiMessages
                    const assistantMsg: ChatMessage = {
                        id: Math.random().toString(36).substr(2, 9),
                        senderId: 'ai_guide',
                        senderName: AI_CONFIG[aiProvider]?.name || 'AI Assistant',
                        recipientId: null,
                        content: reply,
                        timestamp: Date.now(),
                        type: 'chat',
                        role: 'assistant'
                    };
                    gameState.aiMessages.push(assistantMsg);
                    set({ gameState: { ...gameState } });
                    void get().syncToCloud();
                }
            } catch (error: any) {
                console.error(error);
                // 添加错误消息到 aiMessages
                const errorMsg: ChatMessage = {
                    id: Math.random().toString(36).substr(2, 9),
                    senderId: 'system',
                    senderName: '系统',
                    recipientId: null,
                    content: `❌ AI 助手连接失败: ${error.message}`,
                    timestamp: Date.now(),
                    type: 'system',
                    role: 'system'
                };
                gameState.aiMessages.push(errorMsg);
                set({ gameState: { ...gameState } });
            } finally {
                set({ isAiThinking: false });
            }
        },

        forwardMessage: (messageId: string, targetRecipientId: string | null) => {
            const { gameState, user } = get();
            if (!gameState || !user) return;

            const originalMsg = gameState.messages.find(m => m.id === messageId);
            if (!originalMsg) return;

            const newMsg: ChatMessage = {
                id: Math.random().toString(36).substr(2, 9),
                senderId: 'ai_guide',
                senderName: originalMsg.senderName, // Keep original AI name
                recipientId: targetRecipientId,
                content: originalMsg.content,
                timestamp: Date.now(),
                type: 'chat',
                isPrivate: !!targetRecipientId
            };

            gameState.messages.push(newMsg);

            const targetName = targetRecipientId
                ? gameState.seats.find(s => s.userId === targetRecipientId)?.userName || '玩家'
                : '所有人';

            addSystemMessage(gameState, `说书人转发了 AI 消息给 ${targetName}`);

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        saveGameHistory: async (finalState: GameState) => {
            if (!finalState.gameOver.isOver) return;

            try {
                const historyRecord = {
                    room_code: finalState.roomId,
                    winner: finalState.gameOver.winner,
                    reason: finalState.gameOver.reason,
                    script_name: SCRIPTS[finalState.currentScriptId]?.name ||
                        finalState.customScripts[finalState.currentScriptId]?.name ||
                        'Unknown Script',
                    players: finalState.seats.map(s => ({
                        name: s.userName,
                        role: s.roleId ? (ROLES[s.roleId]?.name || finalState.customRoles[s.roleId]?.name) : null,
                        team: s.roleId ? (ROLES[s.roleId]?.team || finalState.customRoles[s.roleId]?.team) : null,
                        isDead: s.isDead
                    })),
                    messages: finalState.messages,
                    state: finalState
                };

                const { error } = await supabase
                    .from('game_history')
                    .insert(historyRecord);

                if (error) throw error;
                console.log("✅ 游戏记录已保存");

                const currentGameState = get().gameState;
                if (currentGameState) {
                    set({ gameState: { ...currentGameState } });
                }
                void get().syncToCloud();
            } catch (err) {
                console.error("Error saving history:", err);
            }
        },

        deleteAiMessage: (messageId: string) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            gameState.aiMessages = gameState.aiMessages.filter(m => m.id !== messageId);

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        clearAiMessages: () => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            gameState.aiMessages = [];

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        performNightAction: (action: { roleId: string; payload: any }) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            const { roleId, payload } = action;
            const role = ROLES[roleId];

            if (!role) return;

            // Log the action
            let logMessage = `说书人执行了 ${role.name} 的夜间动作`;

            if (payload.seatId !== undefined) {
                const seat = gameState.seats.find(s => s.id === payload.seatId);
                logMessage += `: ${seat?.userName || '未知玩家'}`;
            } else if (payload.seatIds) {
                const seats = payload.seatIds.map((id: number) =>
                    gameState.seats.find(s => s.id === id)?.userName || '未知'
                );
                logMessage += `: ${seats.join(', ')}`;
            } else if (payload.choice !== undefined) {
                const nightAction = role.nightAction;
                if (nightAction?.options) {
                    logMessage += `: ${nightAction.options[payload.choice]}`;
                }
            }

            addSystemMessage(gameState, logMessage);

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        sendInfoCard: (card: import('./types').InfoCard, recipientId: string | null) => {
            const { gameState, user } = get();
            if (!gameState || !user) return;

            const message: ChatMessage = {
                id: Math.random().toString(36).substr(2, 9),
                senderId: user.id,
                senderName: user.name,
                recipientId,
                content: card.content, // Fallback for plain text view
                timestamp: Date.now(),
                type: 'chat',
                isPrivate: !!recipientId,
                card // Attach the structured card
            };

            gameState.messages.push(message);

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },



        distributeRoles: () => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            // 验证：检查所有座位（包含虚拟玩家）是否都已分配角色
            const occupiedSeats = gameState.seats.filter(s => s.userId || s.isVirtual);
            const unassignedSeats = occupiedSeats.filter(s => !s.roleId);

            if (unassignedSeats.length > 0) {
                const seatNumbers = unassignedSeats.map(s => s.id + 1).join(', ');
                addSystemMessage(gameState, `❌ 无法发放角色：座位 ${seatNumbers} 还未分配角色。请先完成角色分配。`);
                set({ gameState: { ...gameState } });
                return;
            }

            gameState.rolesRevealed = true;
            gameState.setupPhase = 'READY';
            addSystemMessage(gameState, '✅ 说书人已发放角色，玩家可查看规则手册');

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        resetRoles: () => {
            const { gameState } = get();
            if (!gameState) return;

            gameState.seats.forEach(seat => {
                seat.roleId = null;
                seat.realRoleId = null;
                seat.seenRoleId = null;
            });

            gameState.setupPhase = 'ASSIGNING';
            gameState.rolesRevealed = false;

            addSystemMessage(gameState, '🔄 说书人重置了所有角色分配');
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        hideRoles: () => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            gameState.rolesRevealed = false;
            gameState.setupPhase = 'ASSIGNING';

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },



        assignRoles: () => {
            const { gameState, user } = get();
            if (!gameState?.currentScriptId || !user?.isStoryteller) return;

            const script = SCRIPTS[gameState.currentScriptId];
            if (!script) return;

            const seatCount = gameState.seats.filter(s => s.userId || s.isVirtual).length;
            if (seatCount < 5) {
                addSystemMessage(gameState, '玩家人数不足5人（含虚拟玩家），无法自动分配');
                set({ gameState: { ...gameState } });
                return;
            }

            // TB规则自动分配
            const composition = getComposition(seatCount);
            if (!composition) return;

            const availableRoles = script.roles.map(id => ROLES[id] as any).filter((r): r is import('./types').RoleDef => !!r);

            const townsfolk = availableRoles.filter(r => r.team === 'TOWNSFOLK');
            const outsiders = availableRoles.filter(r => r.team === 'OUTSIDER');
            const minions = availableRoles.filter(r => r.team === 'MINION');
            const demons = availableRoles.filter(r => r.team === 'DEMON');

            // 随机选择
            const selectedRoles: string[] = [];
            selectedRoles.push(...shuffle(townsfolk).slice(0, composition.townsfolk).map(r => r.id));
            selectedRoles.push(...shuffle(outsiders).slice(0, composition.outsider).map(r => r.id));
            selectedRoles.push(...shuffle(minions).slice(0, composition.minion).map(r => r.id));
            selectedRoles.push(...shuffle(demons).slice(0, composition.demon).map(r => r.id));

            const shuffledRoles = shuffle(selectedRoles);
            gameState.seats.forEach((seat, i) => {
                if ((seat.userId || seat.isVirtual) && shuffledRoles[i]) {
                    applyRoleAssignment(gameState, seat, shuffledRoles[i]);
                }
            });

            addSystemMessage(gameState, `已自动分配角色 (${seatCount}人: ${composition.townsfolk}镇民+${composition.outsider}外来者+${composition.minion}爪牙+${composition.demon}恶魔)`);

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        applyStrategy: (strategyName, roleIds) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            const occupiedSeats = gameState.seats.filter(s => s.userId || s.isVirtual);

            // Clear roles
            gameState.seats.forEach(seat => {
                applyRoleAssignment(gameState, seat, null);
            });

            // Assign new roles
            const shuffledRoles = [...roleIds].sort(() => Math.random() - 0.5);
            occupiedSeats.forEach((seat, index) => {
                if (index < shuffledRoles.length) {
                    applyRoleAssignment(gameState, seat, shuffledRoles[index] || null);
                }
            });

            addSystemMessage(gameState, `📊 已应用 "${strategyName}" 策略，重新分配了 ${shuffledRoles.length} 个角色。`);
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        forceLeaveSeat: (seatId) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;
            const seat = gameState.seats.find(s => s.id === seatId);
            if (seat) {
                const userName = seat.userName;
                seat.userId = null;
                seat.userName = `座位 ${seat.id + 1}`;
                seat.roleId = null;
                seat.realRoleId = null;
                seat.seenRoleId = null;
                seat.isHandRaised = false;

                addSystemMessage(gameState, `说书人强制 ${userName} 离开了座位 ${seatId + 1}`);
                set({ gameState: { ...gameState } });
                void get().syncToCloud();
            }
        },

        addVirtualPlayer: (() => {
            let isProcessing = false;
            return () => {
                if (isProcessing) return; // 防抖
                isProcessing = true;
                setTimeout(() => { isProcessing = false; }, 300);

                const { gameState, user } = get();
                if (!gameState || !user?.isStoryteller) return;

                const emptySeat = gameState.seats.find(s => !s.userId && !s.isVirtual);
                if (emptySeat) {
                    emptySeat.isVirtual = true;
                    emptySeat.userName = `虚拟玩家 ${emptySeat.id + 1}`;
                    emptySeat.voteLocked = false;
                    addSystemMessage(gameState, `说书人添加了虚拟玩家到座位 ${emptySeat.id + 1}`);
                    set({ gameState: { ...gameState } });
                    void get().syncToCloud();
                } else {
                    void getToastFunctions().then(({ showWarning }) => showWarning?.("没有空座位了！"));
                }
            };
        })(),

        removeVirtualPlayer: (seatId: number) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;
            const seat = gameState.seats.find(s => s.id === seatId);
            if (seat?.isVirtual) {
                seat.isVirtual = false;
                seat.userName = `座位 ${seat.id + 1}`;
                seat.roleId = null;
                seat.realRoleId = null;
                seat.seenRoleId = null;
                seat.voteLocked = false;
                addSystemMessage(gameState, `说书人移除了座位 ${seatId + 1} 的虚拟玩家`);
                set({ gameState: { ...gameState } });
                void get().syncToCloud();
            }
        },

        submitNightAction: (action) => {
            const { gameState, user } = get();
            if (!gameState || !user) return;

            const seat = gameState.seats.find(s => s.userId === user.id);
            if (!seat) return;

            const roleName = ROLES[action.roleId]?.name || action.roleId;
            let actionDesc = `提交了 ${roleName} 的夜间行动`;

            if (action.payload?.seatId !== undefined) {
                const target = gameState.seats.find(s => s.id === action.payload.seatId);
                actionDesc += ` (目标: ${target?.userName})`;
            } else if (action.payload?.seatIds) {
                const targets = action.payload.seatIds.map((id: number) =>
                    gameState.seats.find(s => s.id === id)?.userName
                ).filter(Boolean);
                actionDesc += ` (目标: ${targets.join(', ')})`;
            }

            const request: NightActionRequest = {
                id: Math.random().toString(36).substr(2, 9),
                seatId: seat.id,
                roleId: action.roleId,
                payload: action.payload,
                status: 'pending',
                timestamp: Date.now()
            };

            if (!gameState.nightActionRequests) {
                gameState.nightActionRequests = [];
            }
            gameState.nightActionRequests.push(request);

            addSystemMessage(gameState, `🌑 [夜间] ${seat.userName} ${actionDesc}（等待说书人确认）`);

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        resolveNightAction: (requestId: string, result: string) => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            const request = gameState.nightActionRequests?.find(r => r.id === requestId);
            if (!request) return;

            const seat = gameState.seats.find(s => s.id === request.seatId);
            const roleName = ROLES[request.roleId]?.name || request.roleId;

            request.status = 'resolved';
            request.result = result;

            gameState.nightActionRequests = gameState.nightActionRequests.filter(r => r.status !== 'resolved');

            if (seat?.userId) {
                const infoCard: import('./types').InfoCard = {
                    type: 'ability',
                    title: `${roleName} 能力结果`,
                    icon: ROLES[request.roleId]?.icon || '🌙',
                    color: 'indigo',
                    content: result
                };

                const message: ChatMessage = {
                    id: Math.random().toString(36).substr(2, 9),
                    senderId: 'system',
                    senderName: '说书人',
                    recipientId: seat.userId,
                    content: `[${roleName}] ${result}`,
                    timestamp: Date.now(),
                    type: 'chat',
                    isPrivate: true,
                    card: infoCard
                };

                gameState.messages.push(message);
            }

            addSystemMessage(gameState, `✅ 说书人已回复 ${seat?.userName} 的 ${roleName} 行动`);

            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        getPendingNightActions: () => {
            const { gameState } = get();
            if (!gameState?.nightActionRequests) return [];
            return gameState.nightActionRequests.filter(r => r.status === 'pending');
        },

        startGame: () => {
            const { gameState, user } = get();
            if (!gameState || !user?.isStoryteller) return;

            if (gameState.seats.filter(s => s.userId || s.isVirtual).length < 5) {
                addSystemMessage(gameState, '❌ 无法开始：玩家人数不足 5 人 (含虚拟玩家)。');
                return;
            }

            const unassigned = gameState.seats.filter(s => (s.userId || s.isVirtual) && !s.roleId);
            if (unassigned.length > 0) {
                addSystemMessage(gameState, `❌ 无法开始：还有 ${unassigned.length} 位玩家未分配角色。`);
                return;
            }

            gameState.phase = 'NIGHT';
            gameState.setupPhase = 'STARTED';
            gameState.nightCurrentIndex = 0;

            const inPlayRoles = gameState.seats
                .filter(s => !s.isDead && s.roleId)
                .map(s => s.roleId!);

            const firstNightOrder = NIGHT_ORDER_FIRST.filter(id => inPlayRoles.includes(id));
            gameState.nightQueue = firstNightOrder;

            addSystemMessage(gameState, '🌃 游戏开始！进入首个夜晚。');
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        handlePlayerSeating: (seatId: number) => {
            const { user, gameState } = get();
            if (!user || !gameState) return;
            get().joinSeat(seatId);
            const updatedUser = { ...user, isSeated: true };
            set({ user: updatedUser });
        },

        addStorytellerNote: (content) => {
            const { gameState } = get();
            if (!gameState) return;
            gameState.storytellerNotes.push({
                id: Math.random().toString(36).substr(2, 9),
                content,
                timestamp: Date.now()
            });
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        updateStorytellerNote: (id, content) => {
            const { gameState } = get();
            if (!gameState) return;
            const note = gameState.storytellerNotes.find(n => n.id === id);
            if (note) {
                note.content = content;
                note.timestamp = Date.now();
                set({ gameState: { ...gameState } });
                void get().syncToCloud();
            }
        },

        deleteStorytellerNote: (id) => {
            const { gameState } = get();
            if (!gameState) return;
            gameState.storytellerNotes = gameState.storytellerNotes.filter(n => n.id !== id);
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        toggleSkillDescriptionMode: () => {
            const { gameState } = get();
            if (!gameState) return;
            gameState.skillDescriptionMode = gameState.skillDescriptionMode === 'simple' ? 'detailed' : 'simple';
            set({ gameState: { ...gameState } });
            void get().syncToCloud();
        },

        fetchGameHistory: async () => {
            try {
                const { data, error } = await supabase
                    .from('game_history')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) throw error;
                return data as GameHistory[];
            } catch (err) {
                console.error("Error fetching history:", err);
                return [];
            }
        },



    }))
);

// Helper: TB composition rules
function getComposition(players: number) {
    const rules: Record<number, { townsfolk: number; outsider: number; minion: number; demon: number }> = {
        5: { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
        6: { townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
        7: { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
        8: { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
        9: { townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
        10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
        11: { townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
        12: { townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
        13: { townsfolk: 9, outsider: 0, minion: 3, demon: 1 },
        14: { townsfolk: 9, outsider: 1, minion: 3, demon: 1 },
        15: { townsfolk: 9, outsider: 2, minion: 3, demon: 1 }
    };
    return rules[players] || rules[7];
}

// Helper: Shuffle array
function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = result[i];
        result[i] = result[j]!;
        result[j] = temp!;
    }
    return result;
}

