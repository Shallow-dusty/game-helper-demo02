import { StoreSlice, GameSlice } from '../../types';
import { supabase, setIsReceivingUpdate, setRealtimeChannel, ensureAuthenticatedUser, setupMessageSubscription } from '../connection';
import { addSystemMessage, applyGameStateDefaults, splitGameState } from '../../utils';
import { getInitialState } from './utils';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import type { GameState } from '@/types';
import { generateRoomCode } from '@/lib/random';

// Type for RPC responses
interface RpcResponse {
    success: boolean;
    error?: string;
}

export const createGameCoreSlice: StoreSlice<Pick<GameSlice, 'createGame' | 'joinSeat' | 'leaveSeat' | 'toggleReady' | 'addSeat' | 'removeSeat' | 'addVirtualPlayer' | 'removeVirtualPlayer'>> = (set, get) => ({
    createGame: async (seatCount) => {
        const user = get().user;
        if (!user) return;

        set({ connectionStatus: 'connecting' });

        const code = generateRoomCode();
        const newState = getInitialState(code, seatCount);
        const authUser = await ensureAuthenticatedUser();
        const userId = authUser?.id ?? user.id;
        const updatedUser = { ...user, id: userId, roomId: code };

        set({ user: updatedUser, gameState: newState, isOffline: false });
        addSystemMessage(newState, `${user.name} 创建了房间 ${code}`);

        localStorage.setItem('grimoire_last_room', code);

        try {
            const { publicState, secretState } = splitGameState(newState);

            const { data, error } = await supabase
                .from('game_rooms')
                .insert({ room_code: code, data: publicState, storyteller_id: updatedUser.id })
                .select('id')
                .single<{ id: number }>();

            if (error) throw error;
            if (data?.id) {
                set({ roomDbId: data.id });
                void supabase
                    .from('room_members')
                    .upsert({
                        room_id: data.id,
                        user_id: updatedUser.id,
                        display_name: updatedUser.name,
                        role: 'storyteller'
                    }, { onConflict: 'room_id,user_id' });

                void supabase
                    .from('game_secrets')
                    .upsert({ room_code: code, data: secretState, updated_at: new Date() }, { onConflict: 'room_code' });

                const systemMessages = newState.messages.filter(msg => msg.type === 'system');
                if (systemMessages.length > 0) {
                    void supabase
                        .from('game_messages')
                        .insert(systemMessages.map(msg => ({
                            room_id: data.id,
                            sender_seat_id: null,
                            sender_name: msg.senderName ?? '系统',
                            content: msg.content,
                            recipient_seat_id: null,
                            message_type: 'system',
                            metadata: { client_id: msg.id }
                        })));
                }

                void setupMessageSubscription(code, data.id, set as unknown as (partial: unknown) => void, get);
            }

            const channel = supabase.channel(`room:${code}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${code}` },
                    (payload) => {
                        const newData = payload.new as { data?: GameState } | undefined;
                        if (newData?.data) {
                            applyGameStateDefaults(newData.data);
                            setIsReceivingUpdate(true);
                            set({ gameState: newData.data });
                            setIsReceivingUpdate(false);
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
                        set({ connectionStatus: 'connected', isOffline: false });
                    } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
                        set({ connectionStatus: 'disconnected' });
                    } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
                        set({ connectionStatus: 'reconnecting' });
                    }
                });

             setRealtimeChannel(channel);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.warn('⚠️ 云端连接失败，切换到离线模式:', errorMessage);
            set({ isOffline: true, connectionStatus: 'disconnected' });
        }
    },

    joinSeat: async (seatId) => {
        const { user, gameState } = get();
        if (!user || !gameState) return;

        // Optimistic check
        const seat = gameState.seats.find(s => s.id === seatId);
        if (!seat || seat.userId) return;

        try {
            const response = await supabase.rpc('claim_seat', {
                p_room_code: user.roomId,
                p_seat_id: seatId,
                p_user_id: user.id,
                p_player_name: user.name,
                p_client_token: user.id // Using user.id as token for now
            });

            if (response.error) throw response.error;
            const rpcResult = response.data as RpcResponse | null;
            if (rpcResult && !rpcResult.success) {
                addSystemMessage(gameState, `入座失败: ${rpcResult.error ?? '未知错误'}`);
                return;
            }

            // Success - update local state optimistically or wait for subscription
            set((state) => {
                if (state.user) state.user.isSeated = true;
            });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('Join seat error:', err);
            addSystemMessage(gameState, `入座出错: ${errorMessage}`);
        }
    },

    leaveSeat: async () => {
        const { user, gameState } = get();
        if (!user || !gameState) return;

        const seat = gameState.seats.find(s => s.userId === user.id);
        if (!seat) return;

        try {
            const response = await supabase.rpc('leave_seat', {
                p_room_code: user.roomId,
                p_seat_id: seat.id,
                p_client_token: user.id
            });

            if (response.error) throw response.error;
            const rpcResult = response.data as RpcResponse | null;
            if (rpcResult && !rpcResult.success) {
                console.error('Leave seat failed:', rpcResult.error);
                return;
            }

            set((state) => {
                if (state.user) state.user.isSeated = false;
            });

        } catch (err) {
            console.error('Leave seat error:', err);
        }
    },

    toggleReady: () => {
        const { user, gameState } = get();
        if (!user || !gameState) return;
        const seat = gameState.seats.find(s => s.userId === user.id);
        if (!seat) return;
        void supabase.rpc('toggle_ready', {
            p_room_code: gameState.roomId,
            p_seat_id: seat.id
        });
    },

    addSeat: () => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                if (state.gameState.seats.length >= 20) return;
                const newId = state.gameState.seats.length;
                state.gameState.seats.push({
                    id: newId,
                    userId: null,
                    userName: `座位 ${String(newId + 1)}`,
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
                    voteLocked: false,
                    isVirtual: false,
                });
            }
        });
        get().sync();
    },

    removeSeat: () => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState && state.gameState.seats.length > 5) {
                state.gameState.seats.pop();
            }
        });
        get().sync();
    },

    addVirtualPlayer: () => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const emptySeat = state.gameState.seats.find(s => !s.userId && !s.isVirtual);
                if (emptySeat) {
                    emptySeat.isVirtual = true;
                    emptySeat.userName = `虚拟玩家 ${String(emptySeat.id + 1)}`;
                    emptySeat.userId = `virtual-${String(Date.now())}`;
                }
            }
        });
        get().sync();
    },

    removeVirtualPlayer: (seatId) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat?.isVirtual) {
                    seat.isVirtual = false;
                    seat.userName = `座位 ${String(seat.id + 1)}`;
                    seat.userId = null;
                }
            }
        });
        get().sync();
    }
});
