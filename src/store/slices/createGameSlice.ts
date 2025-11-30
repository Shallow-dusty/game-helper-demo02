import { StoreSlice } from '../types';
import { GameState, GamePhase, SeatStatus, NightActionRequest, GameHistory, Seat } from '../../types';
import { ROLES, PHASE_LABELS, SCRIPTS } from '../../constants';
import { supabase } from './createConnectionSlice';
import { addSystemMessage } from '../utils';
import { generateRoleAssignment } from '../../lib/gameLogic';

// --- HELPER FUNCTIONS ---

const getInitialState = (roomId: string, seatCount: number, currentScriptId = 'tb'): GameState => ({
    roomId,
    currentScriptId,
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: false,
    vibrationEnabled: false,
    seats: Array.from({ length: seatCount }, (_, i) => ({
        id: i,
        userId: null,
        userName: `座位 ${i + 1}`,
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

const checkGameOver = (gameState: GameState) => {
    const demon = gameState.seats.find(s => s.realRoleId === 'imp');
    if (demon?.isDead) {
        const scarletWoman = gameState.seats.find(s => s.realRoleId === 'scarlet_woman' && !s.isDead);
        if (scarletWoman) {
            // Scarlet Woman becomes Imp
            scarletWoman.realRoleId = 'imp';
            scarletWoman.roleId = 'imp'; 
            addSystemMessage(gameState, `${scarletWoman.userName} 继承了 恶魔 身份`);
            return;
        }
        
        gameState.gameOver = {
            isOver: true,
            winner: 'GOOD',
            reason: '恶魔死亡'
        };
    }
};

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
    assignRole: (seatId: number, roleId: string) => void;
    toggleDead: (seatId: number) => void;
    toggleAbilityUsed: (seatId: number) => void;
    toggleStatus: (seatId: number, status: SeatStatus) => void;
    toggleWhispers: () => void;
    toggleVibration: () => void;
    addReminder: (seatId: number, text: string, icon?: string, color?: string) => void;
    removeReminder: (id: string) => void;
    importScript: (jsonContent: string) => void;

    // Custom Scripts
    saveCustomScript: (script: import('../../types').ScriptDefinition) => void;
    deleteCustomScript: (scriptId: string) => void;
    loadCustomScript: (scriptId: string) => void;

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
    sendInfoCard: (card: import('../../types').InfoCard, recipientId: string | null) => void;

    // Night Actions
    performNightAction: (action: { roleId: string, payload: any }) => void;
    submitNightAction: (action: { roleId: string, payload: any }) => void;
    resolveNightAction: (requestId: string, result: string) => void;
    getPendingNightActions: () => NightActionRequest[];

    // History
    fetchGameHistory: () => Promise<GameHistory[]>;
    saveGameHistory: (game: GameState) => Promise<void>;
}

export const createGameSlice: StoreSlice<GameSlice> = (set, get) => ({
    gameState: null,
    isAudioBlocked: false,

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

    sendMessage: (content, recipientId) => {
        set((state) => {
            if (state.gameState && state.user) {
                if (recipientId && !state.gameState.allowWhispers && !state.user.isStoryteller) {
                    return;
                }
                const msg = {
                    id: Math.random().toString(36).substr(2, 9),
                    senderId: state.user.id,
                    senderName: state.user.name,
                    recipientId,
                    content,
                    timestamp: Date.now(),
                    type: 'chat' as const,
                    isPrivate: !!recipientId
                };
                state.gameState.messages.push(msg);
            }
        });
        get().sync();
    },

    forwardMessage: (messageId, targetRecipientId) => {
        set((state) => {
            if (state.gameState && state.user) {
                const originalMsg = state.gameState.messages.find(m => m.id === messageId);
                if (originalMsg) {
                    const newMsg = {
                        id: Math.random().toString(36).substr(2, 9),
                        senderId: state.user.id,
                        senderName: state.user.name, // Forwarder name
                        recipientId: targetRecipientId,
                        content: `[转发] ${originalMsg.senderName}: ${originalMsg.content}`,
                        timestamp: Date.now(),
                        type: 'chat' as const,
                        isPrivate: !!targetRecipientId
                    };
                    state.gameState.messages.push(newMsg);
                }
            }
        });
        get().sync();
    },

    setScript: (scriptId) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.currentScriptId = scriptId;
                addSystemMessage(state.gameState, `剧本已切换为: ${SCRIPTS[scriptId]?.name || scriptId}`);
            }
        });
        get().sync();
    },

    setPhase: (phase) => {
        set((state) => {
            if (state.gameState) {
                const oldPhase = state.gameState.phase;
                state.gameState.phase = phase;
                addSystemMessage(state.gameState, `游戏阶段变更为: ${PHASE_LABELS[phase]}`);
                
                if (phase === 'NIGHT' && oldPhase !== 'NIGHT') {
                    state.gameState.roundInfo.nightCount++;
                    state.gameState.roundInfo.totalRounds++;
                }
                if (phase === 'DAY' && oldPhase !== 'DAY') {
                    state.gameState.roundInfo.dayCount++;
                }
            }
        });
        get().sync();
    },

    assignRole: (seatId, roleId) => {
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    applyRoleAssignment(state.gameState, seat, roleId);
                    
                    // Auto-add reminders
                    const role = ROLES[roleId];
                    if (role?.reminders) {
                        seat.reminders = role.reminders.map(r => ({
                            id: Math.random().toString(36).substr(2, 9),
                            text: r,
                            sourceRole: roleId,
                            seatId: seatId
                        }));
                    }
                }
            }
        });
        get().sync();
    },

    toggleDead: (seatId) => {
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.isDead = !seat.isDead;
                    if (seat.isDead) {
                         addSystemMessage(state.gameState, `${seat.userName} 死亡了`);
                         checkGameOver(state.gameState);
                    }
                }
            }
        });
        get().sync();
    },

    toggleAbilityUsed: (seatId) => {
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.hasUsedAbility = !seat.hasUsedAbility;
                }
            }
        });
        get().sync();
    },

    toggleStatus: (seatId, status) => {
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    if (seat.statuses.includes(status)) {
                        seat.statuses = seat.statuses.filter(s => s !== status);
                    } else {
                        seat.statuses.push(status);
                    }
                }
            }
        });
        get().sync();
    },

    toggleWhispers: () => {
        set((state) => {
            if (state.gameState) {
                state.gameState.allowWhispers = !state.gameState.allowWhispers;
                addSystemMessage(state.gameState, state.gameState.allowWhispers ? "说书人开启了私聊" : "说书人关闭了私聊");
            }
        });
        get().sync();
    },

    toggleVibration: () => {
        set((state) => {
            if (state.gameState) {
                state.gameState.vibrationEnabled = !state.gameState.vibrationEnabled;
            }
        });
        get().sync();
    },

    addReminder: (seatId, text, icon, color) => {
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.reminders.push({
                        id: Math.random().toString(36).substr(2, 9),
                        text,
                        sourceRole: 'manual',
                        seatId,
                        icon,
                        color
                    });
                }
            }
        });
        get().sync();
    },

    removeReminder: (id) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.seats.forEach(seat => {
                    seat.reminders = seat.reminders.filter(r => r.id !== id);
                });
            }
        });
        get().sync();
    },

    importScript: (jsonContent) => {
        try {
            const script = JSON.parse(jsonContent);
            if (!script.id || !Array.isArray(script.roles)) {
                throw new Error("Invalid script format");
            }
            
            set((state) => {
                if (state.gameState) {
                    // Placeholder
                }
            });
            get().sync();
        } catch (e) {
            console.error("Import script failed", e);
        }
    },

    saveCustomScript: (script) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.customScripts[script.id] = script;
            }
        });
        get().sync();
    },

    deleteCustomScript: (scriptId) => {
        set((state) => {
            if (state.gameState) {
                delete state.gameState.customScripts[scriptId];
            }
        });
        get().sync();
    },

    loadCustomScript: (scriptId) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.currentScriptId = scriptId;
            }
        });
        get().sync();
    },

    setAudioTrack: (trackId) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.audio.trackId = trackId;
                state.gameState.audio.isPlaying = true;
            }
        });
        get().sync();
    },

    toggleAudioPlay: () => {
        set((state) => {
            if (state.gameState) {
                state.gameState.audio.isPlaying = !state.gameState.audio.isPlaying;
            }
        });
        get().sync();
    },

    setAudioVolume: (vol) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.audio.volume = vol;
            }
        });
        get().sync();
    },

    setAudioBlocked: (blocked) => {
        set({ isAudioBlocked: blocked });
    },

    nightNext: () => {
        set((state) => {
            if (state.gameState) {
                const queue = state.gameState.nightQueue;
                if (state.gameState.nightCurrentIndex < queue.length - 1) {
                    state.gameState.nightCurrentIndex++;
                } else {
                    state.gameState.phase = 'DAY';
                    state.gameState.nightCurrentIndex = -1;
                    state.gameState.roundInfo.dayCount++;
                }
            }
        });
        get().sync();
    },

    nightPrev: () => {
        set((state) => {
            if (state.gameState) {
                if (state.gameState.nightCurrentIndex > 0) {
                    state.gameState.nightCurrentIndex--;
                }
            }
        });
        get().sync();
    },

    startVote: (nomineeId) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.voting = {
                    nominatorSeatId: null,
                    nomineeSeatId: nomineeId,
                    clockHandSeatId: nomineeId,
                    votes: [],
                    isOpen: true
                };
                state.gameState.phase = 'VOTING';
            }
        });
        get().sync();
    },

    nextClockHand: () => {
        set((state) => {
            if (state.gameState?.voting) {
                const current = state.gameState.voting.clockHandSeatId;
                if (current !== null) {
                    const next = (current + 1) % state.gameState.seats.length;
                    state.gameState.voting.clockHandSeatId = next;
                }
            }
        });
        get().sync();
    },

    toggleHand: () => {
        set((state) => {
            if (state.gameState?.voting) {
                const current = state.gameState.voting.clockHandSeatId;
                if (current !== null) {
                    if (state.gameState.voting.votes.includes(current)) {
                        state.gameState.voting.votes = state.gameState.voting.votes.filter(v => v !== current);
                    } else {
                        state.gameState.voting.votes.push(current);
                    }
                }
            }
        });
        get().sync();
    },

    closeVote: () => {
        set((state) => {
            if (state.gameState?.voting) {
                state.gameState.voteHistory.push({
                    round: state.gameState.roundInfo.dayCount,
                    nominatorSeatId: state.gameState.voting.nominatorSeatId || -1,
                    nomineeSeatId: state.gameState.voting.nomineeSeatId || -1,
                    votes: state.gameState.voting.votes,
                    voteCount: state.gameState.voting.votes.length,
                    timestamp: Date.now(),
                    result: 'cancelled'
                });
                
                state.gameState.voting = null;
                state.gameState.phase = 'DAY';
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
    },

    assignRoles: () => {
        set((state) => {
            if (state.gameState) {
                const playerCount = state.gameState.seats.filter(s => s.userId).length;
                if (playerCount < 5) {
                    addSystemMessage(state.gameState, "人数不足5人，无法自动分配角色。");
                    return;
                }

                const scriptId = state.gameState.currentScriptId;
                const roles = generateRoleAssignment(scriptId, playerCount);
                
                // Assign to seats with users
                let roleIndex = 0;
                state.gameState.seats.forEach(seat => {
                    if (seat.userId) {
                        const roleId = roles[roleIndex];
                        if (roleId) {
                            applyRoleAssignment(state.gameState!, seat, roleId);
                        }
                        roleIndex++;
                    }
                });

                addSystemMessage(state.gameState, `已自动分配角色 (${playerCount}人)`);
            }
        });
        get().sync();
    },

    swapSeats: (seatId1, seatId2) => {
        set((state) => {
            if (state.gameState) {
                const s1 = state.gameState.seats.find(s => s.id === seatId1);
                const s2 = state.gameState.seats.find(s => s.id === seatId2);
                if (s1 && s2) {
                    const tempUser = { userId: s1.userId, userName: s1.userName, isVirtual: s1.isVirtual };
                    s1.userId = s2.userId;
                    s1.userName = s2.userName;
                    s1.isVirtual = s2.isVirtual;
                    
                    s2.userId = tempUser.userId;
                    s2.userName = tempUser.userName;
                    s2.isVirtual = tempUser.isVirtual;
                }
            }
        });
        get().sync();
    },

    requestSeatSwap: (toSeatId) => {
        const { user } = get();
        if (!user) return;
        set((state) => {
            if (state.gameState) {
                const fromSeat = state.gameState.seats.find(s => s.userId === user.id);
                const toSeat = state.gameState.seats.find(s => s.id === toSeatId);
                if (fromSeat && toSeat?.userId) {
                    state.gameState.swapRequests.push({
                        id: Date.now().toString(),
                        fromSeatId: fromSeat.id,
                        fromUserId: user.id,
                        fromName: user.name,
                        toSeatId: toSeat.id,
                        toUserId: toSeat.userId,
                        timestamp: Date.now()
                    });
                }
            }
        });
        get().sync();
    },

    respondToSwapRequest: (requestId, accept) => {
        set((state) => {
            if (state.gameState) {
                const reqIndex = state.gameState.swapRequests.findIndex(r => r.id === requestId);
                if (reqIndex !== -1) {
                    // const req = state.gameState.swapRequests[reqIndex];
                    if (accept) {
                        // Placeholder
                    }
                    state.gameState.swapRequests.splice(reqIndex, 1);
                }
            }
        });
        get().sync();
    },

    forceLeaveSeat: (seatId) => {
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.userId = null;
                    seat.userName = `座位 ${seat.id + 1}`;
                    seat.roleId = null;
                }
            }
        });
        get().sync();
    },

    resetRoles: () => {
        set((state) => {
            if (state.gameState) {
                state.gameState.seats.forEach(s => {
                    s.roleId = null;
                    s.realRoleId = null;
                    s.seenRoleId = null;
                    s.reminders = [];
                    s.statuses = [];
                });
                state.gameState.rolesRevealed = false;
                state.gameState.phase = 'SETUP';
            }
        });
        get().sync();
    },

    distributeRoles: () => {
        set((state) => {
            if (state.gameState) {
                state.gameState.rolesRevealed = true;
                state.gameState.setupPhase = 'READY';
                addSystemMessage(state.gameState, "说书人已发放角色，请查看您的角色卡！");
            }
        });
        get().sync();
    },

    hideRoles: () => {
        set((state) => {
            if (state.gameState) {
                state.gameState.rolesRevealed = false;
            }
        });
        get().sync();
    },

    startGame: () => {
        set((state) => {
            if (state.gameState) {
                state.gameState.phase = 'NIGHT';
                state.gameState.roundInfo.nightCount = 1;
            }
        });
        get().sync();
    },

    applyStrategy: (strategyName, roleIds) => {
        set((state) => {
            if (state.gameState) {
                // Clear existing roles first
                state.gameState.seats.forEach(s => {
                    s.roleId = null;
                    s.realRoleId = null;
                    s.seenRoleId = null;
                    s.reminders = [];
                    s.statuses = [];
                });

                // Shuffle roles
                const shuffledRoles = [...roleIds].sort(() => Math.random() - 0.5);
                
                // Assign to seats with users
                let roleIndex = 0;
                state.gameState.seats.forEach(seat => {
                    if (seat.userId && roleIndex < shuffledRoles.length) {
                        const roleId = shuffledRoles[roleIndex];
                        if (roleId) {
                            applyRoleAssignment(state.gameState!, seat, roleId);
                        }
                        roleIndex++;
                    }
                });

                addSystemMessage(state.gameState, `已应用策略: ${strategyName}`);
            }
        });
        get().sync();
    },

    addStorytellerNote: (content) => {
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
        set((state) => {
            if (state.gameState) {
                const note = state.gameState.storytellerNotes.find(n => n.id === id);
                if (note) note.content = content;
            }
        });
        get().sync();
    },

    deleteStorytellerNote: (id) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.storytellerNotes = state.gameState.storytellerNotes.filter(n => n.id !== id);
            }
        });
        get().sync();
    },

    toggleNoteFloating: (id) => {
        set((state) => {
            if (state.gameState) {
                const note = state.gameState.storytellerNotes.find(n => n.id === id);
                if (note) note.isFloating = !note.isFloating;
            }
        });
        get().sync();
    },

    updateNotePosition: (id, x, y) => {
        set((state) => {
            if (state.gameState) {
                const note = state.gameState.storytellerNotes.find(n => n.id === id);
                if (note) note.position = { x, y };
            }
        });
        get().sync();
    },

    setNoteColor: (id, color) => {
        set((state) => {
            if (state.gameState) {
                const note = state.gameState.storytellerNotes.find(n => n.id === id);
                if (note) note.color = color;
            }
        });
        get().sync();
    },

    toggleNoteCollapse: (id) => {
        set((state) => {
            if (state.gameState) {
                const note = state.gameState.storytellerNotes.find(n => n.id === id);
                if (note) note.isCollapsed = !note.isCollapsed;
            }
        });
        get().sync();
    },

    sendInfoCard: (_card, _recipientId) => {
        // Placeholder
    },

    performNightAction: (_action) => {
        // Placeholder
    },

    submitNightAction: (_action) => {
        // Placeholder
    },

    resolveNightAction: (requestId, result) => {
        set((state) => {
            if (state.gameState) {
                const req = state.gameState.nightActionRequests.find(r => r.id === requestId);
                if (req) {
                    req.status = 'resolved';
                    req.result = result;
                }
            }
        });
        get().sync();
    },

    getPendingNightActions: () => {
        const state = get().gameState;
        return state ? state.nightActionRequests.filter(r => r.status === 'pending') : [];
    },

    fetchGameHistory: async () => {
        return [];
    },

    saveGameHistory: async (_game) => {
        // Placeholder
    }
});
