import { StoreSlice, GameSlice } from '../../types';
import { supabase } from '../createConnectionSlice';
import { addSystemMessage } from '../../utils';
import { getInitialState } from './utils';

export const createGameCoreSlice: StoreSlice<Pick<GameSlice, 'createGame' | 'joinSeat' | 'leaveSeat' | 'toggleReady' | 'addSeat' | 'removeSeat' | 'addVirtualPlayer' | 'removeVirtualPlayer'>> = (set, get) => ({
    createGame: async (seatCount) => {
        const user = get().user;
        if (!user) return;

        set({ connectionStatus: 'connecting' });

        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const newState = getInitialState(code, seatCount);
        const updatedUser = { ...user, roomId: code };

        set({ user: updatedUser, gameState: newState, isOffline: false });
        addSystemMessage(newState, `${user.name} 创建了房间 ${code}`);

        localStorage.setItem('grimoire_last_room', code);

        try {
            const { error } = await supabase
                .from('game_rooms')
                .insert({ room_code: code, data: newState });

            if (error) throw error;

            const channel = supabase.channel(`room:${code}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${code}` },
                    (payload) => {
                        if (payload.new?.data) {
                            const connection = get() as any;
                            if (connection._setIsReceivingUpdate) connection._setIsReceivingUpdate(true);
                            set({ gameState: payload.new.data });
                            if (connection._setIsReceivingUpdate) connection._setIsReceivingUpdate(false);
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
            
             const connection = get() as any;
             if (connection._setRealtimeChannel) connection._setRealtimeChannel(channel);

        } catch (error: any) {
            console.warn('⚠️ 云端连接失败，切换到离线模式:', error.message);
            set({ isOffline: true, connectionStatus: 'disconnected' });
        }
    },

    joinSeat: async (seatId) => {
        const { user, gameState } = get();
        if (!user || !gameState) return;

        const seat = gameState.seats.find(s => s.id === seatId);
        if (!seat) return;

        const existingSeat = gameState.seats.find(s => s.userId === user.id);
        if (existingSeat) {
            return;
        }

        if (seat.userId) {
            return;
        }

        set((state) => {
            if (state.gameState) {
                const s = state.gameState.seats.find(x => x.id === seatId);
                if (s) {
                    s.userId = user.id;
                    s.userName = user.name;
                }
                addSystemMessage(state.gameState, `${user.name} 入座了 ${seatId + 1} 号位`);
            }
            if (state.user) {
                state.user.isSeated = true;
            }
        });

        get().sync();
    },

    leaveSeat: async () => {
        const { user } = get();
        if (!user) return;

        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.userId === user.id);
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
                    
                    addSystemMessage(state.gameState, `${user.name} 离开了座位`);
                }
            }
            if (state.user) {
                state.user.isSeated = false;
            }
        });

        get().sync();
    },

    toggleReady: () => {
        const { user } = get();
        if (!user) return;
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.userId === user.id);
                if (seat) {
                    seat.isReady = !seat.isReady;
                }
            }
        });
        get().sync();
    },

    addSeat: () => {
        set((state) => {
            if (state.gameState) {
                if (state.gameState.seats.length >= 20) return;
                const newId = state.gameState.seats.length;
                state.gameState.seats.push({
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
                    voteLocked: false,
                    isVirtual: false,
                });
            }
        });
        get().sync();
    },

    removeSeat: () => {
        set((state) => {
            if (state.gameState && state.gameState.seats.length > 5) {
                state.gameState.seats.pop();
            }
        });
        get().sync();
    },

    addVirtualPlayer: () => {
        set((state) => {
            if (state.gameState) {
                const emptySeat = state.gameState.seats.find(s => !s.userId && !s.isVirtual);
                if (emptySeat) {
                    emptySeat.isVirtual = true;
                    emptySeat.userName = `虚拟玩家 ${emptySeat.id + 1}`;
                    emptySeat.userId = `virtual-${Date.now()}`;
                }
            }
        });
        get().sync();
    },

    removeVirtualPlayer: (seatId) => {
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat?.isVirtual) {
                    seat.isVirtual = false;
                    seat.userName = `座位 ${seat.id + 1}`;
                    seat.userId = null;
                }
            }
        });
        get().sync();
    }
});
