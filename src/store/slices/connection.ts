/**
 * Connection Slice - 处理网络连接和 Supabase 通信
 *
 * 重命名自 createConnectionSlice.ts，遵循新的命名规范
 */
import { StoreSlice, ConnectionStatus } from '../types';
import { User, GameState, ChatMessage } from '../../types';
import { createClient, RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import { addSystemMessage, splitGameState, mergeGameState, applyGameStateDefaults, type SecretState } from '../utils';
import { generateShortId } from '../../lib/random';
import { env } from '../../config/env';
import { connectionLogger as logger } from '../../lib/logger';

// --- SUPABASE CONFIG ---
// 使用经过运行时校验的环境变量配置
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Global variables for subscription (kept here for now, but encapsulated)
let realtimeChannel: RealtimeChannel | null = null;
let secretChannel: RealtimeChannel | null = null;
let messagesChannel: RealtimeChannel | null = null;
let memberChannel: RealtimeChannel | null = null;
let isReceivingUpdate = false;
let pendingSyncAfterReceive = false;
const syncedSystemMessageIds = new Set<string>();
let memberSeenRoleId: string | null = null;

// Debounce state for sync
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSync = false;
const SYNC_DEBOUNCE_MS = 300; // 300ms 防抖延迟

interface JoinRoomResponse {
    room_id: number;
    room_code: string;
    data: GameState;
    storyteller_id: string | null;
    member_role: string;
    seen_role_id: string | null;
}

const isJoinRoomResponse = (value: unknown): value is JoinRoomResponse => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return typeof record.room_id === 'number' && 'data' in record;
};

export const ensureAuthenticatedUser = async (): Promise<{ id: string } | null> => {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
            return { id: sessionData.session.user.id };
        }

        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
            logger.warn('匿名登录失败:', error.message);
            return null;
        }
        if (data?.user) {
            return { id: data.user.id };
        }
    } catch (err) {
        logger.warn('匿名登录异常:', err);
    }
    return null;
};

// ============================================================================
// 自动重连机制
// ============================================================================

interface ReconnectState {
    isReconnecting: boolean;
    attemptCount: number;
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    timer: ReturnType<typeof setTimeout> | null;
}

const reconnectState: ReconnectState = {
    isReconnecting: false,
    attemptCount: 0,
    maxAttempts: 10,
    baseDelayMs: 1000,  // 初始延迟 1 秒
    maxDelayMs: 30000,  // 最大延迟 30 秒
    timer: null,
};

/**
 * 计算指数退避延迟
 * 公式: min(maxDelay, baseDelay * 2^attempt) + 随机抖动
 */
function calculateBackoffDelay(attempt: number): number {
    const exponentialDelay = reconnectState.baseDelayMs * Math.pow(2, attempt);
    const cappedDelay = Math.min(exponentialDelay, reconnectState.maxDelayMs);
    // 添加 0-25% 的随机抖动，避免雷群效应
    const jitter = cappedDelay * Math.random() * 0.25;
    return Math.floor(cappedDelay + jitter);
}

/**
 * 重置重连状态
 */
function resetReconnectState(): void {
    reconnectState.isReconnecting = false;
    reconnectState.attemptCount = 0;
    if (reconnectState.timer) {
        clearTimeout(reconnectState.timer);
        reconnectState.timer = null;
    }
}

/**
 * 尝试重新连接到房间
 */
async function attemptReconnect(
    roomCode: string,
    joinGameFn: (code: string) => Promise<void>,
    _setStatus: (status: ConnectionStatus) => void
): Promise<boolean> {
    try {
        reconnectState.attemptCount++;
        const attempt = reconnectState.attemptCount;

        logger.info(`尝试重连 #${attempt}/${reconnectState.maxAttempts} - 房间: ${roomCode}`);

        await joinGameFn(roomCode);

        resetReconnectState();
        logger.info('重连成功！');
        return true;
    } catch (error) {
        logger.warn('重连失败:', error);
        return false;
    }
}

/**
 * 启动自动重连流程
 */
function startReconnect(
    roomCode: string,
    joinGameFn: (code: string) => Promise<void>,
    setStatus: (status: ConnectionStatus) => void,
    onMaxAttemptsReached: () => void
): void {
    if (reconnectState.isReconnecting) {
        logger.debug('已经在重连中，跳过');
        return;
    }

    reconnectState.isReconnecting = true;
    reconnectState.attemptCount = 0;
    setStatus('reconnecting');

    const scheduleNextAttempt = () => {
        if (reconnectState.attemptCount >= reconnectState.maxAttempts) {
            logger.error(`达到最大重试次数 (${reconnectState.maxAttempts})，停止重连`);
            resetReconnectState();
            setStatus('disconnected');
            onMaxAttemptsReached();
            return;
        }

        const delay = calculateBackoffDelay(reconnectState.attemptCount);
        logger.info(`将在 ${delay}ms 后进行第 ${reconnectState.attemptCount + 1} 次重连尝试`);

        reconnectState.timer = setTimeout(() => {
            void attemptReconnect(roomCode, joinGameFn, setStatus).then((success) => {
                if (!success && reconnectState.isReconnecting) {
                    scheduleNextAttempt();
                }
            });
        }, delay);
    };

    // 立即开始第一次重连尝试
    scheduleNextAttempt();
}

/**
 * 停止自动重连
 */
function stopReconnect(): void {
    if (reconnectState.isReconnecting) {
        logger.info('手动停止重连');
        resetReconnectState();
    }
}

// Helper functions for managing realtime state (exported for use in other slices)
export const setIsReceivingUpdate = (val: boolean): void => { isReceivingUpdate = val; };
export const setRealtimeChannel = (channel: RealtimeChannel | null): void => { realtimeChannel = channel; };
export const getRealtimeChannel = (): RealtimeChannel | null => realtimeChannel;

// Helper to get toast functions (lazy load)
let showErrorFn: ((msg: string) => void) | null = null;
const getToastFunctions = async () => {
    if (!showErrorFn) {
        const { showError } = await import('../../components/ui/Toast');
        showErrorFn = showError;
    }
    return { showError: showErrorFn };
};

interface GameMessageRow {
    id: number;
    room_id: number;
    sender_seat_id: number | null;
    sender_name: string | null;
    content: string;
    recipient_seat_id: number | null;
    message_type: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

const mapMessageRow = (row: GameMessageRow, state: GameState | null): ChatMessage => {
    const metadata = row.metadata ?? {};
    const clientId = typeof metadata === 'object' && metadata !== null ? (metadata).client_id : undefined;
    const senderUserId = typeof metadata === 'object' && metadata !== null ? (metadata).sender_user_id : undefined;
    const recipientUserId = typeof metadata === 'object' && metadata !== null ? (metadata).recipient_user_id : undefined;

    const senderSeat = row.sender_seat_id !== null ? state?.seats.find(s => s.id === row.sender_seat_id) : undefined;
    const recipientSeat = row.recipient_seat_id !== null ? state?.seats.find(s => s.id === row.recipient_seat_id) : undefined;

    return {
        id: typeof clientId === 'string' ? clientId : String(row.id),
        senderId: typeof senderUserId === 'string' ? senderUserId : (senderSeat?.userId ?? 'system'),
        senderName: row.sender_name ?? senderSeat?.userName ?? '系统',
        recipientId: typeof recipientUserId === 'string' ? recipientUserId : (recipientSeat?.userId ?? null),
        content: row.content,
        timestamp: new Date(row.created_at).getTime(),
        type: row.message_type === 'system' ? 'system' : 'chat',
        isPrivate: row.recipient_seat_id !== null,
    };
};

const upsertMessage = (gameState: GameState, msg: ChatMessage): void => {
    const idx = gameState.messages.findIndex(m => m.id === msg.id);
    if (idx >= 0) {
        gameState.messages[idx] = msg;
        return;
    }
    gameState.messages.push(msg);
};

const applyMemberRoleToState = (gameState: GameState, userId: string, seenRoleId: string | null): void => {
    const seat = gameState.seats.find(s => s.userId === userId);
    if (!seat) return;
    seat.seenRoleId = seenRoleId;
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Backward compatibility
    seat.roleId = seenRoleId;
};

const isUuid = (value: string | null | undefined): value is string => {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

export const setupMessageSubscription = async (
    roomCode: string,
    roomDbId: number,
    set: (partial: unknown) => void,
    get: () => { gameState: GameState | null }
): Promise<void> => {
    if (messagesChannel) void supabase.removeChannel(messagesChannel);

    const { data: messageRows } = await supabase
        .from('game_messages')
        .select('*')
        .eq('room_id', roomDbId)
        .order('created_at', { ascending: true })
        .limit(200);

    if (messageRows) {
        const currentState = get().gameState;
        if (currentState) {
            const mapped = (messageRows as GameMessageRow[]).map(row => mapMessageRow(row, currentState));
            currentState.messages = mapped;
            mapped.forEach(msg => {
                if (msg.type === 'system') {
                    syncedSystemMessageIds.add(msg.id);
                }
            });
            set({ gameState: currentState });
        }
    }

    messagesChannel = supabase.channel(`room-messages:${roomCode}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'game_messages', filter: `room_id=eq.${roomDbId}` },
            (payload) => {
                const row = payload.new as GameMessageRow;
                const currentState = get().gameState;
                if (!currentState) return;
                const msg = mapMessageRow(row, currentState);
                set((state: { gameState?: GameState | null }) => {
                    if (state.gameState) {
                        upsertMessage(state.gameState, msg);
                    }
                });
            }
        )
        .subscribe();
};
export interface ConnectionSlice {
    user: User | null;
    roomDbId: number | null;
    isOffline: boolean;
    connectionStatus: ConnectionStatus;

    login: (name: string, isStoryteller: boolean) => Promise<void>;
    joinGame: (roomCode: string) => Promise<void>;
    spectateGame: (roomCode: string) => Promise<void>;
    leaveGame: () => void;
    sync: () => void;
    syncToCloud: () => Promise<void>;
    refreshFromCloud: () => Promise<void>;
    
    // Internal helper to set receiving update flag
    _setIsReceivingUpdate: (val: boolean) => void;
    _setRealtimeChannel: (channel: RealtimeChannel | null) => void;
    _getRealtimeChannel: () => RealtimeChannel | null;
}

export const connectionSlice: StoreSlice<ConnectionSlice> = (set, get) => ({
    user: null,
    roomDbId: null,
    isOffline: false,
    connectionStatus: 'disconnected',

    _setIsReceivingUpdate: (val) => { isReceivingUpdate = val; },
    _setRealtimeChannel: (channel) => { realtimeChannel = channel; },
    _getRealtimeChannel: () => realtimeChannel,

    login: async (name, isStoryteller) => {
        const authUser = await ensureAuthenticatedUser();
        let id = authUser?.id ?? localStorage.getItem('grimoire_uid');
        if (!id) {
            id = generateShortId();
            localStorage.setItem('grimoire_uid', id);
        }

        const newUser: User = { id, name, isStoryteller, roomId: null, isSeated: false };
        set({ user: newUser });
    },

    joinGame: async (roomCode) => {
        let user = get().user;
        if (!user) return;

        set({ connectionStatus: 'connecting' });

        try {
            const authUser = await ensureAuthenticatedUser();
            if (authUser && authUser.id !== user.id) {
                user = { ...user, id: authUser.id };
                set({ user });
            }

            // 1. Join via secure RPC (handles membership + returns room data)
            const { data, error } = await supabase
                .rpc('join_room', {
                    p_room_code: roomCode,
                    p_display_name: user.name,
                    p_role: user.isStoryteller ? 'storyteller' : 'player'
                })
                .single() as { data: JoinRoomResponse | null; error: { message: string } | null };

            if (error || !data) {
                const message = error?.message ?? '';
                if (message.includes('Room not found')) {
                    void getToastFunctions().then(({ showError }) => showError("房间不存在！请检查房间号。"));
                } else if (message.includes('Not storyteller')) {
                    void getToastFunctions().then(({ showError }) => showError("只有房间说书人可以以说书人身份加入。"));
                } else {
                    void getToastFunctions().then(({ showError }) => showError("网络连接失败，请检查网络后重试。"));
                }
                set({ connectionStatus: 'disconnected' });
                localStorage.removeItem('grimoire_last_room');
                return;
            }

            const rawData = data;
            if (!isJoinRoomResponse(rawData)) {
                throw new Error('房间数据无效');
            }
            const joinData = rawData;
            const roomId = joinData.room_id;
            if (!Number.isFinite(roomId)) {
                throw new Error('房间数据无效');
            }

            const gameState = joinData.data;
            applyGameStateDefaults(gameState);

            // 2. Subscribe to public room updates
            if (realtimeChannel) void supabase.removeChannel(realtimeChannel);

            const channel = supabase.channel(`room:${roomCode}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` },
                    (payload) => {
                        const newData = (payload.new as { data?: GameState } | undefined)?.data;
                        if (newData) {
                            applyGameStateDefaults(newData);
                            isReceivingUpdate = true;
                            const currentUser = get().user;
                            if (memberSeenRoleId && currentUser) {
                                applyMemberRoleToState(newData, currentUser.id, memberSeenRoleId);
                            }
                            set({ gameState: newData });
                            isReceivingUpdate = false;
                            if (pendingSyncAfterReceive) {
                                pendingSyncAfterReceive = false;
                                get().sync();
                            }
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
                        resetReconnectState();
                        set({ connectionStatus: 'connected', isOffline: false });
                    } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
                        set({ connectionStatus: 'disconnected' });
                        const currentUser = get().user;
                        if (currentUser?.roomId && !currentUser.isObserver) {
                            startReconnect(
                                currentUser.roomId,
                                get().joinGame,
                                (s) => set({ connectionStatus: s }),
                                () => {
                                    void getToastFunctions().then(({ showError }) =>
                                        showError('连接已断开，请手动重新加入房间')
                                    );
                                }
                            );
                        }
                    } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
                        set({ connectionStatus: 'reconnecting' });
                        const currentUser = get().user;
                        if (currentUser?.roomId && !currentUser.isObserver) {
                            startReconnect(
                                currentUser.roomId,
                                get().joinGame,
                                (s) => set({ connectionStatus: s }),
                                () => {
                                    void getToastFunctions().then(({ showError }) =>
                                        showError('连接失败，请检查网络后重试')
                                    );
                                }
                            );
                        }
                    }
                });

            realtimeChannel = channel;

            const updatedUser = { ...user, roomId: roomCode };
            set({ user: updatedUser, gameState: gameState, roomDbId: roomId, isOffline: false });

            localStorage.setItem('grimoire_last_room', roomCode);

            // 3. Fetch member seen_role_id for players and subscribe for updates
            if (!updatedUser.isStoryteller) {
                memberSeenRoleId = joinData.seen_role_id ?? null;
                if (memberSeenRoleId) {
                    const currentState = get().gameState;
                    if (currentState) {
                        applyMemberRoleToState(currentState, updatedUser.id, memberSeenRoleId);
                        set({ gameState: currentState });
                    }
                }

                if (memberChannel) void supabase.removeChannel(memberChannel);
                memberChannel = supabase.channel(`room-member:${roomCode}:${updatedUser.id}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'room_members', filter: `user_id=eq.${updatedUser.id}` },
                        (payload) => {
                            const updated = payload.new as { seen_role_id?: string | null } | undefined;
                            memberSeenRoleId = updated?.seen_role_id ?? null;
                            const currentState = get().gameState;
                            const currentUser = get().user;
                            if (currentState && currentUser) {
                                applyMemberRoleToState(currentState, currentUser.id, memberSeenRoleId);
                                set({ gameState: currentState });
                            }
                        }
                    )
                    .subscribe();
            }

            // 5. Subscribe to Secrets (Storyteller only)
            if (updatedUser.isStoryteller) {
                if (secretChannel) void supabase.removeChannel(secretChannel);

                const { data: secretData } = await supabase
                    .from('game_secrets')
                    .select('data')
                    .eq('room_code', roomCode)
                    .single();

                if (secretData?.data) {
                    const currentState = get().gameState;
                    if (currentState) {
                        const merged = mergeGameState(currentState, secretData.data as SecretState);
                        applyGameStateDefaults(merged);
                        set({ gameState: merged });
                    }
                }

                const sChannel = supabase.channel(`room-secrets:${roomCode}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'game_secrets', filter: `room_code=eq.${roomCode}` },
                        (payload) => {
                            const newSecretData = (payload.new as { data?: SecretState } | undefined)?.data;
                            if (newSecretData) {
                                isReceivingUpdate = true;
                                const currentPublic = get().gameState;
                                if (currentPublic) {
                                    const merged = mergeGameState(currentPublic, newSecretData);
                                    applyGameStateDefaults(merged);
                                    set({ gameState: merged });
                                }
                                isReceivingUpdate = false;
                                if (pendingSyncAfterReceive) {
                                    pendingSyncAfterReceive = false;
                                    get().sync();
                                }
                            }
                        }
                    )
                    .subscribe();
                secretChannel = sChannel;
            }

            // 6. Fetch and subscribe to messages
            await setupMessageSubscription(roomCode, roomId, set as unknown as (partial: unknown) => void, get);

            // 7. Announce Join (storyteller only)
            if (updatedUser.isStoryteller) {
                setTimeout(() => {
                    const currentState = get().gameState;
                    if (currentState) {
                        addSystemMessage(currentState, `${updatedUser.name} (说书人) 加入了房间。`);
                        void get().syncToCloud();
                    }
                }, 100);
            }

        } catch (error) {
            logger.error('加入房间失败:', error);
            set({ connectionStatus: 'disconnected' });
            localStorage.removeItem('grimoire_last_room');
            const errorMessage = error instanceof Error ? error.message : String(error);
            void getToastFunctions().then(({ showError }) => showError(`加入房间失败: ${errorMessage}`));
        }
    },

    spectateGame: async (roomCode) => {
        set({ connectionStatus: 'connecting' });

        try {
            const authUser = await ensureAuthenticatedUser();
            if (!authUser) {
                void getToastFunctions().then(({ showError }) => showError("无法验证身份，请稍后重试。"));
                set({ connectionStatus: 'disconnected' });
                return;
            }

            const { data, error } = await supabase
                .rpc('join_room', {
                    p_room_code: roomCode,
                    p_display_name: 'Observer',
                    p_role: 'observer'
                })
                .single() as { data: JoinRoomResponse | null; error: { message: string } | null };

            if (error || !data) {
                void getToastFunctions().then(({ showError }) => showError("房间不存在或已关闭！"));
                set({ connectionStatus: 'disconnected' });
                return;
            }

            const rawData = data;
            if (!isJoinRoomResponse(rawData)) {
                throw new Error('房间数据无效');
            }
            const joinData = rawData;
            const roomId = joinData.room_id;
            if (!Number.isFinite(roomId)) {
                throw new Error('房间数据无效');
            }

            const gameState = joinData.data;
            applyGameStateDefaults(gameState);

            if (realtimeChannel) void supabase.removeChannel(realtimeChannel);

            const channel = supabase.channel(`room:${roomCode}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` },
                    (payload) => {
                        const newData = (payload.new as { data?: GameState } | undefined)?.data;
                        if (newData) {
                            applyGameStateDefaults(newData);
                            isReceivingUpdate = true;
                            set({ gameState: newData });
                            isReceivingUpdate = false;
                            if (pendingSyncAfterReceive) {
                                pendingSyncAfterReceive = false;
                                get().sync();
                            }
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
                        set({ connectionStatus: 'connected', isOffline: false });
                    } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
                        set({ connectionStatus: 'disconnected' });
                        void getToastFunctions().then(({ showError }) =>
                            showError('观察连接已断开')
                        );
                    } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
                        set({ connectionStatus: 'disconnected' });
                        void getToastFunctions().then(({ showError }) =>
                            showError('观察连接出错')
                        );
                    }
                });

            realtimeChannel = channel;

            set({
                gameState: gameState,
                connectionStatus: 'connected',
                roomDbId: roomId,
                user: {
                    id: authUser.id,
                    name: 'Observer',
                    isStoryteller: false,
                    roomId: roomCode,
                    isObserver: true,
                    isSeated: false
                }
            });

            await setupMessageSubscription(roomCode, roomId, set as unknown as (partial: unknown) => void, get);

        } catch (error) {
            logger.error('观察游戏失败:', error);
            set({ connectionStatus: 'disconnected' });
            const errorMessage = error instanceof Error ? error.message : String(error);
            void getToastFunctions().then(({ showError }) => showError(`连接失败: ${errorMessage}`));
        }
    },

    leaveGame: () => {
        // 停止任何正在进行的重连尝试
        stopReconnect();

        const user = get().user;
        const state = get().gameState;

        if (!get().isOffline && state && user && !user.isObserver) {
            const seat = state.seats.find(s => s.userId === user.id);
            if (seat) {
                void supabase.rpc('leave_seat', {
                    p_room_code: state.roomId,
                    p_seat_id: seat.id,
                    p_client_token: user.id
                });
            }
        }

        const roomDbId = get().roomDbId;
        if (user && roomDbId) {
            void supabase
                .from('room_members')
                .delete()
                .eq('room_id', roomDbId)
                .eq('user_id', user.id);
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
        if (messagesChannel) {
            void supabase.removeChannel(messagesChannel);
            messagesChannel = null;
        }
        if (memberChannel) {
            void supabase.removeChannel(memberChannel);
            memberChannel = null;
        }
        memberSeenRoleId = null;
        syncedSystemMessageIds.clear();

        set({
            user: user ? { ...user, roomId: null, isSeated: false } : null,
            gameState: null,
            roomDbId: null,
            isOffline: false,
            connectionStatus: 'disconnected',
            isAudioBlocked: false
        });
    },

    syncToCloud: async () => {
        try {
            if (get().isOffline) return;
            if (isReceivingUpdate) {
                pendingSyncAfterReceive = true;
                return;
            }

            const currentGameState = get().gameState;
            const currentUser = get().user;
            if (!currentGameState || !currentUser?.isStoryteller) return;

            const { publicState, secretState } = splitGameState(currentGameState);

            // Update Public State
            const { error: publicError } = await supabase
                .from('game_rooms')
                .update({ data: publicState, updated_at: new Date() })
                .eq('room_code', currentGameState.roomId);

            if (publicError) {
                logger.warn('同步公共状态失败:', publicError.message);
            }

            // Upsert secrets (in case it doesn't exist yet)
            const { error: secretError } = await supabase
                .from('game_secrets')
                .upsert({ room_code: currentGameState.roomId, data: secretState, updated_at: new Date() }, { onConflict: 'room_code' });

            if (secretError) {
                logger.warn('同步私密状态失败:', secretError.message);
            }

            // Sync system messages into game_messages (chat is inserted directly)
            const roomDbId = get().roomDbId;
            if (roomDbId) {
                const pendingSystemMessages = currentGameState.messages.filter(
                    msg => msg.type === 'system' && !syncedSystemMessageIds.has(msg.id)
                );

                if (pendingSystemMessages.length > 0) {
                    const rows = pendingSystemMessages.map(msg => {
                        const recipientSeat = msg.recipientId
                            ? currentGameState.seats.find(s => s.userId === msg.recipientId)
                            : null;
                        return {
                            room_id: roomDbId,
                            sender_seat_id: null,
                            sender_name: msg.senderName ?? '系统',
                            content: msg.content,
                            recipient_seat_id: recipientSeat?.id ?? null,
                            message_type: 'system',
                            metadata: {
                                client_id: msg.id,
                                sender_user_id: msg.senderId ?? 'system',
                                recipient_user_id: msg.recipientId ?? null
                            }
                        };
                    });

                    const { error: msgError } = await supabase
                        .from('game_messages')
                        .insert(rows);

                    if (msgError) {
                        logger.warn('同步系统消息失败:', msgError.message);
                    } else {
                        pendingSystemMessages.forEach(msg => syncedSystemMessageIds.add(msg.id));
                    }
                }

                const memberUpdates = currentGameState.seats
                    .filter(seat => isUuid(seat.userId))
                    .map(seat => ({
                        room_id: roomDbId,
                        user_id: seat.userId,
                        display_name: seat.userName,
                        role: seat.userId === currentUser.id ? 'storyteller' : 'player',
                        seat_id: seat.id,
                        seen_role_id: seat.seenRoleId
                    }));

                if (memberUpdates.length > 0) {
                    const { error: memberError } = await supabase
                        .from('room_members')
                        .upsert(memberUpdates, { onConflict: 'room_id,user_id' });

                    if (memberError) {
                        logger.warn('同步成员信息失败:', memberError.message);
                    }
                }
            }
        } catch (e) {
            logger.error('syncToCloud 异常:', e);
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
                logger.error('refreshFromCloud 失败:', error);
                return;
            }

            if (data.data) {
                isReceivingUpdate = true;
                let newState = data.data as GameState;
                applyGameStateDefaults(newState);

                // If ST, also fetch secrets
                if (get().user?.isStoryteller) {
                    const { data: secretData } = await supabase
                        .from('game_secrets')
                        .select('data')
                        .eq('room_code', gameState.roomId)
                        .single();

                    if (secretData?.data) {
                        newState = mergeGameState(newState, secretData.data as SecretState);
                        applyGameStateDefaults(newState);
                    }
                } else {
                    const currentUser = get().user;
                    if (currentUser && memberSeenRoleId) {
                        applyMemberRoleToState(newState, currentUser.id, memberSeenRoleId);
                    }
                }

                set({ gameState: newState });
                isReceivingUpdate = false;
                if (pendingSyncAfterReceive) {
                    pendingSyncAfterReceive = false;
                    get().sync();
                }
            }
        } catch (err) {
            logger.error('refreshFromCloud 异常:', err);
        }
    },

    sync: () => {
        // 使用防抖避免高频同步
        pendingSync = true;

        if (syncDebounceTimer) {
            clearTimeout(syncDebounceTimer);
        }

        syncDebounceTimer = setTimeout(() => {
            if (pendingSync) {
                pendingSync = false;
                void get().syncToCloud();
            }
            syncDebounceTimer = null;
        }, SYNC_DEBOUNCE_MS);
    },
});

// 向后兼容导出
export const createConnectionSlice = connectionSlice;
