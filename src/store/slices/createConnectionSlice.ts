import { StoreSlice, ConnectionStatus } from '../types';
import { User, GameState } from '../../types';
import { createClient } from '@supabase/supabase-js';
import { addSystemMessage, splitGameState, mergeGameState } from '../utils';

// --- SUPABASE CONFIG ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase URL or Key in .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Global variables for subscription (kept here for now, but encapsulated)
let realtimeChannel: any = null;
let secretChannel: any = null;
let isReceivingUpdate = false;

// Helper to get toast functions (lazy load)
let showErrorFn: ((msg: string) => void) | null = null;
const getToastFunctions = async () => {
    if (!showErrorFn) {
        const { showError } = await import('../../components/ui/Toast');
        showErrorFn = showError;
    }
    return { showError: showErrorFn };
};
export interface ConnectionSlice {
    user: User | null;
    isOffline: boolean;
    connectionStatus: ConnectionStatus;

    login: (name: string, isStoryteller: boolean) => void;
    joinGame: (roomCode: string) => Promise<void>;
    spectateGame: (roomCode: string) => Promise<void>;
    leaveGame: () => void;
    sync: () => void;
    syncToCloud: () => Promise<void>;
    refreshFromCloud: () => Promise<void>;
    
    // Internal helper to set receiving update flag
    _setIsReceivingUpdate: (val: boolean) => void;
    _setRealtimeChannel: (channel: any) => void;
    _getRealtimeChannel: () => any;
}

export const createConnectionSlice: StoreSlice<ConnectionSlice> = (set, get) => ({
    user: null,
    isOffline: false,
    connectionStatus: 'disconnected',

    _setIsReceivingUpdate: (val) => { isReceivingUpdate = val; },
    _setRealtimeChannel: (channel) => { realtimeChannel = channel; },
    _getRealtimeChannel: () => realtimeChannel,

    login: (name, isStoryteller) => {
        let id = localStorage.getItem('grimoire_uid');
        if (!id) {
            id = Math.random().toString(36).substring(7);
            localStorage.setItem('grimoire_uid', id);
        }
        const newUser: User = { id, name, isStoryteller, roomId: null, isSeated: false };
        set({ user: newUser });
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
                if (error.code === 'PGRST116') {
                    void getToastFunctions().then(({ showError }) => showError("房间不存在！请检查房间号。"));
                } else {
                    void getToastFunctions().then(({ showError }) => showError("网络连接失败，请检查网络后重试。"));
                }
                set({ connectionStatus: 'disconnected' });
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

            localStorage.setItem('grimoire_last_room', roomCode);

            // 3. Subscribe to Secrets (if Storyteller)
            if (user.isStoryteller) {
                if (secretChannel) void supabase.removeChannel(secretChannel);
                
                // Fetch initial secret state
                const { data: secretData } = await supabase
                    .from('game_secrets')
                    .select('data')
                    .eq('room_code', roomCode)
                    .single();

                if (secretData?.data) {
                    const merged = mergeGameState(get().gameState!, secretData.data);
                    set({ gameState: merged });
                }

                const sChannel = supabase.channel(`room-secrets:${roomCode}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'game_secrets', filter: `room_code=eq.${roomCode}` },
                        (payload) => {
                            if (payload.new?.data) {
                                isReceivingUpdate = true;
                                const currentPublic = get().gameState!;
                                // We need to be careful not to overwrite local optimistic updates if possible,
                                // but for now, simple merge is safer.
                                // However, since we receive public and secret updates separately, 
                                // we should merge the new secret data into the CURRENT state.
                                const merged = mergeGameState(currentPublic, payload.new.data);
                                set({ gameState: merged });
                                isReceivingUpdate = false;
                            }
                        }
                    )
                    .subscribe();
                secretChannel = sChannel;
            }

            // 4. Announce Join
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
            localStorage.removeItem('grimoire_last_room');
            void getToastFunctions().then(({ showError }) => showError?.(`加入房间失败: ${error.message}`));
        }
    },

    spectateGame: async (roomCode) => {
        set({ connectionStatus: 'connecting' });

        try {
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

        if (state?.roomId) {
            localStorage.removeItem(`seat_token_${state.roomId}`);
        }
        localStorage.removeItem('grimoire_last_room');

        if (realtimeChannel) {
            void supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
        if (secretChannel) {
            void supabase.removeChannel(secretChannel);
            secretChannel = null;
        }

        set({
            user: user ? { ...user, roomId: null } : null,
            gameState: null,
            isOffline: false,
            connectionStatus: 'disconnected',
            isAudioBlocked: false
        });
    },

    syncToCloud: async () => {
        try {
            if (get().isOffline) return;
            if (isReceivingUpdate) return;

            const currentGameState = get().gameState;
            if (!currentGameState) return;

            const { publicState, secretState } = splitGameState(currentGameState);

            // Update Public State
            const { error: publicError } = await supabase
                .from('game_rooms')
                .update({ data: publicState, updated_at: new Date() })
                .eq('room_code', currentGameState.roomId);

            if (publicError) {
                console.warn("Sync Public Error:", publicError.message);
            }

            if (get().user?.isStoryteller) {
                 // Upsert secrets (in case it doesn't exist yet)
                const { error: secretError } = await supabase
                    .from('game_secrets')
                    .upsert({ room_code: currentGameState.roomId, data: secretState, updated_at: new Date() }, { onConflict: 'room_code' });

                if (secretError) {
                    console.warn("Sync Secret Error:", secretError.message);
                }
            }
        } catch (e) {
            console.error('DEBUG: syncToCloud ERROR:', e);
        }
    },

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
                let newState = data.data as GameState;

                // If ST, also fetch secrets
                if (get().user?.isStoryteller) {
                    const { data: secretData } = await supabase
                        .from('game_secrets')
                        .select('data')
                        .eq('room_code', gameState.roomId)
                        .single();
                    
                    if (secretData?.data) {
                        newState = mergeGameState(newState, secretData.data);
                    }
                }

                set({ gameState: newState });
                isReceivingUpdate = false;
            }
        } catch (err) {
            console.error('refreshFromCloud error:', err);
        }
    },

    sync: () => {
        void get().syncToCloud();
    },
});
