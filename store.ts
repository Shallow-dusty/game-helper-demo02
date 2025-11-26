
import { create } from 'zustand';
import { GameState, User, GamePhase, ChatMessage, AudioState, SeatStatus } from './types';
import { NIGHT_ORDER_FIRST, NIGHT_ORDER_OTHER, ROLES, PHASE_LABELS, SCRIPTS } from './constants';
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// --- SUPABASE CONFIG ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase URL or Key in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Global variables for subscription
let realtimeChannel: any = null;
let isReceivingUpdate = false;

// --- STATE HELPERS ---

const getInitialState = (seatCount: number, roomCode: string): GameState => ({
    roomId: roomCode,
    currentScriptId: 'tb',
    phase: 'SETUP',
    allowWhispers: true,
    seats: Array.from({ length: seatCount }, (_, i) => ({
        id: i,
        userId: null,
        userName: `座位 ${i + 1}`,
        isDead: false,
        hasGhostVote: true,
        roleId: null,
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

const addAiMessage = (gameState: GameState, content: string) => {
    gameState.messages.push({
        id: Math.random().toString(36).substr(2, 9),
        senderId: 'ai_guide',
        senderName: '魔典助手 (AI)',
        recipientId: null,
        content,
        timestamp: Date.now(),
        type: 'chat'
    });
};

// --- STORE ---

interface AppState {
    user: User | null;
    gameState: GameState | null;
    isAiThinking: boolean;
    isAudioBlocked: boolean;
    isOffline: boolean;

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
    addReminder: (seatId: number, text: string) => void;
    removeReminder: (id: string) => void;
    askAi: (prompt: string) => Promise<void>;

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

    syncToCloud: () => void;
    sync: () => void;
}

export const useStore = create<AppState>((set, get) => ({
    user: null,
    gameState: null,
    isAiThinking: false,
    isAudioBlocked: false,
    isOffline: false,

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
        const initialState = getInitialState(seatCount, code);
        const updatedUser = { ...user, roomId: code };

        // Set local state immediately
        set({ user: updatedUser, gameState: initialState, isOffline: false });
        addSystemMessage(initialState, `${user.name} 创建了房间 ${code}`);

        try {
            // 2. Insert into Supabase
            const { error } = await supabase
                .from('game_rooms')
                .insert({ room_code: code, data: initialState });

            if (error) throw error;

            // 3. Subscribe to Realtime
            const channel = supabase.channel(`room:${code}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${code}` },
                    (payload) => {
                        if (payload.new && payload.new.data) {
                            isReceivingUpdate = true;
                            // Merge logic could go here, but for now simple replace
                            // Check if we are the ones who sent it (optional optimization, but hard without sender ID in payload)
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

        // Debounce could be added here
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
        if (seat) {
            const oldSeat = gameState.seats.find(s => s.userId === user.id);
            if (oldSeat) {
                oldSeat.userId = null;
                oldSeat.userName = `座位 ${oldSeat.id + 1}`;
            }
            seat.userId = user.id;
            seat.userName = user.name;
            addSystemMessage(gameState, `${user.name} 入座了 ${seatId + 1} 号位。`);

            set({ gameState: { ...gameState } });
            get().syncToCloud();
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
        get().syncToCloud();
    },

    setScript: (scriptId) => {
        const { gameState } = get();
        if (!gameState || !SCRIPTS[scriptId]) return;

        gameState.currentScriptId = scriptId;
        addSystemMessage(gameState, `剧本切换为: ${SCRIPTS[scriptId].name}`);

        set({ gameState: { ...gameState } });
        get().syncToCloud();
    },

    setPhase: (phase) => {
        const { gameState } = get();
        if (!gameState) return;

        const prevPhase = gameState.phase;
        gameState.phase = phase;

        if (prevPhase !== phase) {
            addSystemMessage(gameState, `阶段变更为: ${PHASE_LABELS[phase]}`);
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
            seat.roleId = roleId;
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
                    }
                }
                if (role.id === 'saint' && gameState.phase === 'DAY') {
                    gameState.gameOver = { isOver: true, winner: 'EVIL', reason: '圣徒被处决' };
                    addSystemMessage(gameState, `🏆 游戏结束！邪恶胜利 (圣徒被处决)`);
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
                seat.statuses.push(status);
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

    addReminder: (seatId, text) => {
        const { gameState } = get();
        if (!gameState) return;
        const seat = gameState.seats.find(s => s.id === seatId);
        if (seat) {
            seat.reminders.push({ id: Math.random().toString(36), text, sourceRole: 'ST', seatId });
        }
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

        if (seat && gameState.voting.clockHandSeatId === seat.id) {
            if (seat.isDead && !seat.hasGhostVote) return;
            seat.isHandRaised = !seat.isHandRaised;
            set({ gameState: { ...gameState } });
            get().syncToCloud();
        }
    },

    closeVote: () => {
        const { gameState } = get();
        if (!gameState) return;

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

    askAi: async (prompt: string) => {
        const { user, gameState } = get();
        if (!user || !user.isStoryteller || !gameState) return;

        set({ isAiThinking: true });

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const gameContext = {
                script: SCRIPTS[gameState.currentScriptId].name,
                phase: gameState.phase,
                seats: gameState.seats.map(s => ({
                    name: s.userName,
                    role: s.roleId ? ROLES[s.roleId]?.name : 'Unknown',
                    isDead: s.isDead,
                    statuses: s.statuses
                })),
                nightOrder: gameState.nightQueue.map(r => ROLES[r]?.name),
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Context: ${JSON.stringify(gameContext)}. User Question: ${prompt}`,
                config: {
                    systemInstruction: "You are an expert 'Blood on the Clocktower' Storyteller assistant. Keep answers concise and helpful.",
                }
            });

            if (response.text) {
                addAiMessage(gameState, response.text);
                set({ gameState: { ...gameState } });
                get().syncToCloud();
            }
        } catch (error) {
            console.error(error);
            addSystemMessage(gameState, "AI 助手暂时无法连接。");
            set({ gameState: { ...gameState } });
            get().syncToCloud();
        } finally {
            set({ isAiThinking: false });
        }
    }
}));
