import { create } from 'zustand';
import { GameState, User, GamePhase, ChatMessage, AudioState, SeatStatus, Seat } from './types';
import { NIGHT_ORDER_FIRST, NIGHT_ORDER_OTHER, ROLES, PHASE_LABELS, SCRIPTS } from './constants';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// --- SUPABASE CONFIG ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase URL or Key in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- DATA FILTERING UTILITIES ---
// 数据视野隔离：根据用户身份过滤敏感信息

/**
 * 为特定用户过滤座位信息
 * @param seat 原始座位数据
 * @param currentUserId 当前用户ID
 * @param isStoryteller 是否是说书人
 * @returns 过滤后的座位数据
 */
export const filterSeatForUser = (seat: Seat, currentUserId: string, isStoryteller: boolean): Seat => {
    // ST 看到全部信息
    if (isStoryteller) {
        return seat;
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
    return {
        ...gameState,
        seats: gameState.seats.map(seat => filterSeatForUser(seat, currentUserId, isStoryteller)),
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
    | 'kimi'
    | 'sf_r1'
    | 'sf_r1_llama_70b'
    | 'sf_r1_qwen_32b'
    | 'sf_r1_qwen_7b_pro'
    | 'sf_minimax_m2'
    | 'sf_kimi_k2_thinking';

const AI_CONFIG = {
    deepseek: {
        apiKey: import.meta.env.VITE_DEEPSEEK_KEY,
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat', // V3.2
        name: 'DeepSeek V3.2 (Official)'
    },
    kimi: {
        apiKey: import.meta.env.VITE_KIMI_KEY,
        baseURL: 'https://api.moonshot.cn/v1',
        model: 'moonshot-v1-8k', // K2
        name: 'Kimi (Official - Fixing)'
    },
    // SiliconFlow Models
    sf_r1: {
        apiKey: import.meta.env.VITE_SILICONFLOW_KEY,
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'deepseek-ai/DeepSeek-R1',
        name: '🧠 DeepSeek R1 (Full)'
    },
    sf_r1_llama_70b: {
        apiKey: import.meta.env.VITE_SILICONFLOW_KEY,
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
        name: '🦙 R1 Distill Llama 70B'
    },
    sf_r1_qwen_32b: {
        apiKey: import.meta.env.VITE_SILICONFLOW_KEY,
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
        name: '🤖 R1 Distill Qwen 32B'
    },
    sf_r1_qwen_7b_pro: {
        apiKey: import.meta.env.VITE_SILICONFLOW_KEY,
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'Pro/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
        name: '⚡ R1 Distill Qwen 7B Pro'
    },
    sf_minimax_m2: {
        apiKey: import.meta.env.VITE_SILICONFLOW_KEY,
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'MiniMaxAI/MiniMax-M2',
        name: '🦄 MiniMax M2 (230B)'
    },
    sf_kimi_k2_thinking: {
        apiKey: import.meta.env.VITE_SILICONFLOW_KEY,
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'moonshotai/Kimi-K2-Thinking',
        name: '🤔 Kimi K2 Thinking'
    }
};

// Global variables for subscription
let realtimeChannel: any = null;
let isReceivingUpdate = false;

// --- STATE HELPERS ---

const getInitialState = (roomId: string, seatCount: number, currentScriptId: string = 'tb'): GameState => ({
    roomId,
    currentScriptId,
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: false,
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
    })),
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
    aiMessages: []
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

const addAiMessage = (gameState: GameState, content: string, provider: string, recipientId: string | null = null) => {
    const providerName = AI_CONFIG[provider as AiProvider]?.name || provider;
    gameState.messages.push({
        id: Math.random().toString(36).substr(2, 9),
        senderId: 'ai_guide',
        senderName: `魔典助手 (${providerName})`,
        recipientId: recipientId,
        content,
        timestamp: Date.now(),
        type: 'chat',
        isPrivate: !!recipientId
    });
};

// --- STORE ---

interface AppState {
    user: User | null;
    gameState: GameState | null;
    isAiThinking: boolean;
    isAudioBlocked: boolean;
    isOffline: boolean;
    aiProvider: AiProvider;
    roleReferenceMode: 'modal' | 'sidebar';
    isSidebarExpanded: boolean;
    isRolePanelOpen: boolean;

    login: (name: string, isStoryteller: boolean) => void;
    createGame: (seatCount: number) => Promise<void>;
    joinGame: (roomCode: string) => Promise<void>;
    leaveGame: () => void;

    joinSeat: (seatId: number) => void;
    sendMessage: (content: string, recipientId: string | null) => void;
    setScript: (scriptId: string) => void;
    setPhase: (phase: GamePhase) => void;
    assignRole: (seatId: number, roleId: string) => void;
    toggleDead: (seatId: number) => void;
    toggleAbilityUsed: (seatId: number) => void;
    toggleStatus: (seatId: number, status: SeatStatus) => void;
    toggleWhispers: () => void;
    addReminder: (seatId: number, text: string, icon?: string, color?: string) => void;
    removeReminder: (id: string) => void;

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
    assignRoles: () => void;
    distributeRoles: () => void;
    startGame: () => void;

    // Note Actions
    addStorytellerNote: (content: string) => void;
    updateStorytellerNote: (id: string, content: string) => void;
    deleteStorytellerNote: (id: string) => void;

    // Night Actions
    performNightAction: (action: { roleId: string, payload: any }) => void;
    submitNightAction: (action: { roleId: string, payload: any }) => void;

    importScript: (jsonContent: string) => void;

    // Sync & History
    syncToCloud: () => void;
    sync: () => void;
    saveGameHistory: (gameState: GameState) => void;

    // UI State
    openRolePanel: () => void;
    closeRolePanel: () => void;
    toggleSidebar: () => void;
    toggleSkillDescriptionMode: () => void;

    // AI
    clearAiMessages: () => void;
    deleteAiMessage: (id: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
    user: null,
    gameState: null,
    isAiThinking: false,
    isAudioBlocked: false,
    isOffline: false,
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
        const newUser: User = { id, name, isStoryteller, roomId: null };
        set({ user: newUser });
    },

    createGame: async (seatCount) => {
        const user = get().user;
        if (!user) return;

        // 1. Prepare Data
        let code = Math.floor(1000 + Math.random() * 9000).toString();
        // 2. Create Game State
        const newState = getInitialState(code, seatCount);
        const updatedUser = { ...user, roomId: code };

        // Set local state immediately
        set({ user: updatedUser, gameState: newState, isOffline: false });
        addSystemMessage(newState, `${user.name} 创建了房间 ${code}`);

        try {
            // 2. Insert into Supabase
            const { error } = await supabase
                .from('game_rooms')
                .insert({ room_code: code, data: newState });

            if (error) throw error;

            // 3. Subscribe to Realtime
            const channel = supabase.channel(`room:${code}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${code}` },
                    (payload) => {
                        if (payload.new && payload.new.data) {
                            isReceivingUpdate = true;
                            set({ gameState: payload.new.data });
                            isReceivingUpdate = false;
                        }
                    }
                )
                .subscribe();

            realtimeChannel = channel;
            console.log("✅ 云端房间创建成功:", code);

        } catch (error: any) {
            console.warn('⚠️ 云端连接失败，切换到离线模式:', error.message);
            set({ isOffline: true });
        }
    },

    joinGame: async (roomCode) => {
        const user = get().user;
        if (!user) return;

        try {
            // 1. Fetch Room
            const { data, error } = await supabase
                .from('game_rooms')
                .select('data')
                .eq('room_code', roomCode)
                .single();

            if (error || !data) {
                alert("房间不存在！请检查房间号。");
                return;
            }

            const gameState = data.data as GameState;

            // 2. Subscribe
            if (realtimeChannel) supabase.removeChannel(realtimeChannel);

            const channel = supabase.channel(`room:${roomCode}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` },
                    (payload) => {
                        if (payload.new && payload.new.data) {
                            isReceivingUpdate = true;
                            set({ gameState: payload.new.data });
                            isReceivingUpdate = false;
                        }
                    }
                )
                .subscribe();

            realtimeChannel = channel;

            const updatedUser = { ...user, roomId: roomCode };
            set({ user: updatedUser, gameState: gameState, isOffline: false });

            // 3. Announce Join
            setTimeout(() => {
                const currentState = get().gameState;
                if (currentState) {
                    addSystemMessage(currentState, `${user.name} ${user.isStoryteller ? '(说书人)' : ''} 加入了房间。`);
                    get().syncToCloud();
                }
            }, 100);

        } catch (error: any) {
            console.error("Join Game Error:", error);
            alert(`加入房间失败: ${error.message}\n请检查网络或房间号。`);
        }
    },

    leaveGame: () => {
        const user = get().user;
        const state = get().gameState;

        if (!get().isOffline && state && user) {
            const seat = state.seats.find(s => s.userId === user.id);
            if (seat) {
                seat.userId = null;
                seat.userName = `座位 ${seat.id + 1}`;
            }
            addSystemMessage(state, `${user.name} 离开了房间。`);
            get().syncToCloud();
        }

        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
        set({ user: user ? { ...user, roomId: null } : null, gameState: null, isOffline: false });
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

    sync: () => {
        get().syncToCloud();
    },


    // --- ACTIONS ---

    joinSeat: (seatId) => {
        const { user, gameState } = get();
        if (!user || !gameState) return;

        const seat = gameState.seats.find(s => s.id === seatId);
        if (!seat) return;

        // 检查座位是否已被占用
        if (seat.userId && seat.userId !== user.id) {
            if (seat.isVirtual) {
                // 虚拟玩家座位：自动清除虚拟标记并允许真实玩家入座
                addSystemMessage(gameState, `${user.name} 接管了虚拟玩家的座位 ${seatId + 1}。`);
            } else {
                // 真实玩家座位：阻止入座
                addSystemMessage(gameState, `❌ 座位 ${seatId + 1} 已被 ${seat.userName} 占用。`);
                set({ gameState: { ...gameState } });
                return;
            }
        }

        // 占座
        seat.userId = user.id;
        seat.userName = user.name;
        seat.isVirtual = false; // 清除虚拟标记
        addSystemMessage(gameState, `${user.name} 就坐于座位 ${seatId + 1}。`);
        set({ gameState: { ...gameState } });
        get().syncToCloud();
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
        get().syncToCloud();
    },



    setScript: (scriptId) => {
        const { gameState } = get();
        if (!gameState) return; // Added check for gameState
        const script = SCRIPTS[scriptId] || gameState.customScripts[scriptId]; // Define script
        if (!script) return; // Check if script exists

        gameState.currentScriptId = scriptId;
        addSystemMessage(gameState, `剧本已切换为: ${script.name}`);
        set({ gameState: { ...gameState } });
        get().syncToCloud();
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
            get().syncToCloud();

        } catch (e: any) { // Added type annotation for error
            console.error("Script import failed", e);
            alert("导入失败: 格式不正确");
        }
    },

    setPhase: (phase) => {
        const { gameState } = get();
        if (!gameState) return;

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
        get().syncToCloud();
    },

    assignRole: (seatId, roleId) => {
        const { gameState } = get();
        if (!gameState) return;

        const seat = gameState.seats.find(s => s.id === seatId);
        if (seat) {
            // 设置角色身份
            seat.roleId = roleId; // 向后兼容
            seat.realRoleId = roleId; // 真实身份
            seat.seenRoleId = roleId; // 默认展示身份与真实身份相同

            // 特殊角色处理：酒鬼
            if (roleId === 'drunk') {
                // 酒鬼以为自己是某个镇民，但实际不是
                const townsfolkRoles = ['washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller'];
                const randomTownsfolk = townsfolkRoles[Math.floor(Math.random() * townsfolkRoles.length)];
                seat.seenRoleId = randomTownsfolk; // 酒鬼看到的是假角色
                seat.roleId = randomTownsfolk; // 向后兼容，也设置为假角色
            }

            seat.hasUsedAbility = false;
            seat.statuses = [];
        }
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    toggleDead: (seatId) => {
        const { gameState } = get();
        if (!gameState) return;

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
                        get().saveGameHistory(gameState); // Save history
                    }
                }
                if (role.id === 'saint' && gameState.phase === 'DAY') {
                    gameState.gameOver = { isOver: true, winner: 'EVIL', reason: '圣徒被处决' };
                    addSystemMessage(gameState, `🏆 游戏结束！邪恶胜利 (圣徒被处决)`);
                    get().saveGameHistory(gameState); // Save history
                }
            }
        } else {
            addSystemMessage(gameState, `${seat.userName} 复活了。`);
        }
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    toggleAbilityUsed: (seatId) => {
        const { gameState } = get();
        if (!gameState) return;
        const seat = gameState.seats.find(s => s.id === seatId);
        if (seat) {
            seat.hasUsedAbility = !seat.hasUsedAbility;
        }
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    toggleStatus: (seatId, status) => {
        const { gameState } = get();
        if (!gameState) return;
        const seat = gameState.seats.find(s => s.id === seatId);
        if (seat) {
            if (seat.statuses.includes(status)) {
                seat.statuses = seat.statuses.filter(s => s !== status);
            } else {
                seat.statuses = [...seat.statuses, status];
            }
        }
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    toggleWhispers: () => {
        const { gameState } = get();
        if (!gameState) return;
        gameState.allowWhispers = !gameState.allowWhispers;
        addSystemMessage(gameState, gameState.allowWhispers ? "🟢 说书人开启了私聊功能。" : "🔴 说书人禁用了私聊功能。");
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    addReminder: (seatId, text, icon, color) => {
        const { gameState } = get();
        if (!gameState) return;
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
        get().syncToCloud();
    },

    addSeat: () => {
        const { gameState } = get();
        if (!gameState) return;
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
            isVirtual: true // Default to virtual/empty
        }];
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    removeSeat: () => {
        const { gameState } = get();
        if (!gameState || gameState.seats.length === 0) return;
        // Remove the last seat
        gameState.seats = gameState.seats.slice(0, -1);
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    removeReminder: (id) => {
        const { gameState } = get();
        if (!gameState) return;
        gameState.seats.forEach(s => {
            s.reminders = s.reminders.filter(r => r.id !== id);
        });
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    setAudioTrack: (trackId) => {
        const { gameState } = get();
        if (!gameState) return;
        gameState.audio.trackId = trackId;
        gameState.audio.isPlaying = true;
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    toggleAudioPlay: () => {
        const { gameState } = get();
        if (!gameState) return;
        gameState.audio.isPlaying = !gameState.audio.isPlaying;
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    setAudioVolume: (vol) => {
        const { gameState } = get();
        if (!gameState) return;
        gameState.audio.volume = vol;
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    setAudioBlocked: (blocked) => {
        set({ isAudioBlocked: blocked });
    },

    nightNext: () => {
        const { gameState } = get();
        if (!gameState) return;
        if (gameState.nightCurrentIndex < gameState.nightQueue.length - 1) {
            gameState.nightCurrentIndex++;
        }
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    nightPrev: () => {
        const { gameState } = get();
        if (!gameState) return;
        if (gameState.nightCurrentIndex > 0) {
            gameState.nightCurrentIndex--;
        }
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    startVote: (nomineeId) => {
        const { gameState } = get();
        if (!gameState) return;

        gameState.phase = 'VOTING';
        const startIdx = (nomineeId + 1) % gameState.seats.length;
        const nominee = gameState.seats.find(s => s.id === nomineeId);

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

        gameState.seats.forEach(s => s.isHandRaised = false);
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    nextClockHand: () => {
        const { gameState } = get();
        if (!gameState || !gameState.voting) return;

        const currentHand = gameState.voting.clockHandSeatId!;
        const currentSeat = gameState.seats.find(s => s.id === currentHand);

        if (currentSeat && currentSeat.isHandRaised) {
            gameState.voting.votes.push(currentHand);
            if (currentSeat.isDead) {
                currentSeat.hasGhostVote = false;
                addSystemMessage(gameState, `${currentSeat.userName} 投出了死票。`);
            }
        }

        if ((currentHand + 1) % gameState.seats.length === gameState.voting.nomineeSeatId) {
            gameState.voting.clockHandSeatId = null; // End
            gameState.voting.isOpen = false;
            addSystemMessage(gameState, `投票结束。共 ${gameState.voting.votes.length} 票。`);
        } else {
            gameState.voting.clockHandSeatId = (currentHand + 1) % gameState.seats.length;
        }
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    toggleHand: () => {
        const { user, gameState } = get();
        if (!user || !gameState || !gameState.voting || !gameState.voting.isOpen) return;

        const seat = gameState.seats.find(s => s.userId === user.id);

        if (seat) {
            if (seat.isDead && !seat.hasGhostVote) return;
            seat.isHandRaised = !seat.isHandRaised;
            set({ gameState: { ...gameState } });
            get().syncToCloud();
        }
    },

    closeVote: () => {
        const { gameState } = get();
        if (!gameState) return;

        // Record vote in history if voting was actually happening
        if (gameState.voting && gameState.voting.nomineeSeatId !== null) {
            const votingData = gameState.voting;
            const voteCount = votingData.votes.length;

            // Determine result based on vote count (simplified logic)
            let result: 'executed' | 'survived' | 'cancelled' = 'cancelled';
            if (voteCount > gameState.seats.filter(s => !s.isDead).length / 2) {
                result = 'executed';
            } else if (votingData.nomineeSeatId !== null) {
                result = 'survived';
            }

            const voteRecord: import('./types').VoteRecord = {
                round: gameState.voteHistory.length + 1,
                nominatorSeatId: votingData.nominatorSeatId || -1,
                nomineeSeatId: votingData.nomineeSeatId,
                votes: votingData.votes,
                voteCount,
                timestamp: Date.now(),
                result
            };

            gameState.voteHistory.push(voteRecord);
        }

        gameState.phase = 'DAY';
        gameState.voting = null;
        gameState.seats.forEach(s => {
            s.isHandRaised = false;
            s.isNominated = false;
        });
        addSystemMessage(gameState, `投票被取消。`);
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    setAiProvider: (provider) => {
        set({ aiProvider: provider });
    },

    askAi: async (prompt: string) => {
        const { user, gameState, aiProvider } = get();
        if (!user || !user.isStoryteller || !gameState) return;

        set({ isAiThinking: true });

        try {
            const config = AI_CONFIG[aiProvider];
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
                    { role: "system", content: "You are an expert 'Blood on the Clocktower' Storyteller assistant. Keep answers concise and helpful." },
                    { role: "user", content: `Context: ${JSON.stringify(gameContext)}. User Question: ${prompt}` }
                ],
                model: config.model,
            });

            let reply = completion.choices[0].message.content;

            // Handle DeepSeek R1 "reasoning_content" if available (some APIs might return it this way)
            // @ts-ignore
            const reasoning = completion.choices[0].message.reasoning_content;

            if (reasoning) {
                reply = `<think>${reasoning}</think>\n${reply}`;
            }

            if (reply) {
                // Send as private message to ST
                addAiMessage(gameState, reply, aiProvider, user.id);
                set({ gameState: { ...gameState } });
                get().syncToCloud();
            }
        } catch (error: any) {
            console.error(error);
            addSystemMessage(gameState, `AI 助手 (${aiProvider}) 连接失败: ${error.message}`);
            set({ gameState: { ...gameState } });
            get().syncToCloud();
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
        get().syncToCloud();

        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    saveGameHistory: async (finalState: GameState) => {
        if (!finalState.gameOver.isOver) return;

        try {
            const { error } = await supabase
                .from('game_rooms')
                .insert({
                    room_id: finalState.roomId,
                    state: JSON.stringify(finalState), // Assuming finalState is the 'newState' intended
                    winner: finalState.gameOver.winner,
                    reason: finalState.gameOver.reason,
                    script_name: SCRIPTS[finalState.currentScriptId]?.name || finalState.customScripts[finalState.currentScriptId]?.name || 'Unknown Script',
                    players: finalState.seats.map(s => ({
                        name: s.userName,
                        role: s.roleId ? (ROLES[s.roleId]?.name || finalState.customRoles[s.roleId]?.name) : null,
                        team: s.roleId ? (ROLES[s.roleId]?.team || finalState.customRoles[s.roleId]?.team) : null,
                        isDead: s.isDead
                    })),
                    messages: finalState.messages,
                    created_at: new Date()
                });

            if (error) throw error;
            console.log("✅ 游戏记录已保存");
        } catch (err) {
            console.error("Failed to save game history:", err);
        }
    },

    clearAiMessages: () => {
        const { gameState } = get();
        if (!gameState) return;

        // Filter out AI messages (senderId = 'ai_guide')
        gameState.messages = gameState.messages.filter(m => m.senderId !== 'ai_guide');

        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    deleteAiMessage: (messageId: string) => {
        const { gameState } = get();
        if (!gameState) return;

        gameState.messages = gameState.messages.filter(m => m.id !== messageId);

        set({ gameState: { ...gameState } });
        get().syncToCloud();
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
        get().syncToCloud();
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
        get().syncToCloud();
    },

    setRoleReferenceMode: (mode) => {
        set({ roleReferenceMode: mode });
    },

    toggleSidebar: () => {
        set({ isSidebarExpanded: !get().isSidebarExpanded });
    },

    openRolePanel: () => {
        set({ isRolePanelOpen: true });
    },

    closeRolePanel: () => {
        set({ isRolePanelOpen: false });
    },

    distributeRoles: () => {
        const { gameState } = get();
        if (!gameState) return;

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
        get().syncToCloud();
    },

    hideRoles: () => {
        const { gameState } = get();
        if (!gameState) return;

        gameState.rolesRevealed = false;
        gameState.setupPhase = 'ASSIGNING';

        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },



    assignRoles: () => {
        const { gameState } = get();
        if (!gameState || !gameState.currentScriptId) return;

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
        const availableRoles = script.roles.map(id => ROLES[id]).filter(Boolean);

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

        // 分配到座位（包含真实玩家和虚拟玩家）
        const shuffledRoles = shuffle(selectedRoles);
        gameState.seats.forEach((seat, i) => {
            if ((seat.userId || seat.isVirtual) && shuffledRoles[i]) {
                seat.roleId = shuffledRoles[i];
            }
        });

        addSystemMessage(gameState, `已自动分配角色 (${seatCount}人: ${composition.townsfolk}镇民+${composition.outsider}外来者+${composition.minion}爪牙+${composition.demon}恶魔)`);

        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    // --- NEW ACTIONS IMPLEMENTATION ---

    addVirtualPlayer: () => {
        const { gameState } = get();
        if (!gameState) return;

        // Find first empty seat
        const emptySeat = gameState.seats.find(s => !s.userId && !s.isVirtual);
        if (emptySeat) {
            emptySeat.isVirtual = true;
            emptySeat.userName = `虚拟玩家 ${emptySeat.id + 1}`;
            addSystemMessage(gameState, `说书人添加了虚拟玩家到座位 ${emptySeat.id + 1}`);
            set({ gameState: { ...gameState } });
            get().syncToCloud();
        } else {
            alert("没有空座位了！");
        }
    },

    removeVirtualPlayer: (seatId) => {
        const { gameState } = get();
        if (!gameState) return;
        const seat = gameState.seats.find(s => s.id === seatId);
        if (seat && seat.isVirtual) {
            seat.isVirtual = false;
            seat.userName = `座位 ${seat.id + 1}`;
            seat.roleId = null;
            addSystemMessage(gameState, `说书人移除了座位 ${seatId + 1} 的虚拟玩家`);
            set({ gameState: { ...gameState } });
            get().syncToCloud();
        }
    },



    submitNightAction: (action) => {
        const { gameState, user } = get();
        if (!gameState || !user) return;

        // Find player's seat
        const seat = gameState.seats.find(s => s.userId === user.id);
        if (!seat) return;

        const roleName = ROLES[action.roleId]?.name || action.roleId;
        let actionDesc = `提交了 ${roleName} 的夜间行动`;

        if (action.payload?.targetId) {
            const target = gameState.seats.find(s => s.id === action.payload.targetId);
            actionDesc += ` (目标: ${target?.userName})`;
        }

        // Add to ST notes or system message (private to ST?)
        // For now, add a system message that only ST can see? 
        // System messages are public.
        // Maybe add a private AI message to ST?
        addAiMessage(gameState, `🌑 玩家 ${seat.userName} ${actionDesc}`, 'system', user.id); // Send to self? No, send to ST.

        // Find ST user
        // We don't have easy access to ST user ID here unless we store it.
        // But we can just add a system message for now.
        addSystemMessage(gameState, `🌑 [夜间] ${seat.userName} ${actionDesc}`);

        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    startGame: () => {
        const { gameState } = get();
        if (!gameState) return;

        // Validation
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
        gameState.nightCurrentIndex = 0;

        // Build night queue
        const inPlayRoles = gameState.seats
            .filter(s => !s.isDead && s.roleId)
            .map(s => s.roleId!);

        // First night order
        const firstNightOrder = NIGHT_ORDER_FIRST.filter(id => inPlayRoles.includes(id));
        gameState.nightQueue = firstNightOrder;

        addSystemMessage(gameState, '🌃 游戏开始！进入首个夜晚。');
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    handlePlayerSeating: (seatId) => {
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
        get().syncToCloud();
    },

    updateStorytellerNote: (id, content) => {
        const { gameState } = get();
        if (!gameState) return;
        const note = gameState.storytellerNotes.find(n => n.id === id);
        if (note) {
            note.content = content;
            note.timestamp = Date.now();
            set({ gameState: { ...gameState } });
            get().syncToCloud();
        }
    },

    deleteStorytellerNote: (id) => {
        const { gameState } = get();
        if (!gameState) return;
        gameState.storytellerNotes = gameState.storytellerNotes.filter(n => n.id !== id);
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    toggleSkillDescriptionMode: () => {
        const { gameState } = get();
        if (!gameState) return;
        gameState.skillDescriptionMode = gameState.skillDescriptionMode === 'simple' ? 'detailed' : 'simple';
        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },


}));

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
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
