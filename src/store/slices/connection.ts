/**
 * Connection Slice - 处理网络连接和 Supabase 通信
 *
 * 重命名自 createConnectionSlice.ts，遵循新的命名规范
 */
import { StoreSlice, ConnectionStatus } from '../types';
import { User, GameState } from '../../types';
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
let isReceivingUpdate = false;

// Debounce state for sync
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSync = false;
const SYNC_DEBOUNCE_MS = 300; // 300ms 防抖延迟

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
    _setRealtimeChannel: (channel: RealtimeChannel | null) => void;
    _getRealtimeChannel: () => RealtimeChannel | null;
}

export const connectionSlice: StoreSlice<ConnectionSlice> = (set, get) => ({
    user: null,
    isOffline: false,
    connectionStatus: 'disconnected',

    _setIsReceivingUpdate: (val) => { isReceivingUpdate = val; },
    _setRealtimeChannel: (channel) => { realtimeChannel = channel; },
    _getRealtimeChannel: () => realtimeChannel,

    login: (name, isStoryteller) => {
        let id = localStorage.getItem('grimoire_uid');
        if (!id) {
            id = generateShortId();
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

            const gameState = data.data as GameState;
            applyGameStateDefaults(gameState);
            applyGameStateDefaults(gameState);

            // 2. Subscribe
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
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
                        // 连接成功，重置重连状态
                        resetReconnectState();
                        set({ connectionStatus: 'connected', isOffline: false });
                    } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
                        set({ connectionStatus: 'disconnected' });
                        // 尝试自动重连
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
                        // 尝试自动重连
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
                                // We need to be careful not to overwrite local optimistic updates if possible,
                                // but for now, simple merge is safer.
                                // However, since we receive public and secret updates separately,
                                // we should merge the new secret data into the CURRENT state.
                                if (currentPublic) {
                                    const merged = mergeGameState(currentPublic, newSecretData);
                                    applyGameStateDefaults(merged);
                                    set({ gameState: merged });
                                }
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
            const { data, error } = await supabase
                .from('game_rooms')
                .select('data')
                .eq('room_code', roomCode)
                .single();

            if (error) {
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
                        const newData = (payload.new as { data?: GameState } | undefined)?.data;
                        if (newData) {
                            applyGameStateDefaults(newData);
                            isReceivingUpdate = true;
                            set({ gameState: newData });
                            isReceivingUpdate = false;
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
                        set({ connectionStatus: 'connected', isOffline: false });
                    } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
                        set({ connectionStatus: 'disconnected' });
                        // 观察者断开连接时显示提示
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
                user: {
                    id: `observer-${String(Date.now())}`,
                    name: 'Observer',
                    isStoryteller: false,
                    roomId: roomCode,
                    isObserver: true,
                    isSeated: false
                }
            });

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
                seat.userId = null;
                seat.userName = `座位 ${String(seat.id + 1)}`;
                // eslint-disable-next-line @typescript-eslint/no-deprecated -- Backward compatibility
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
                logger.warn('同步公共状态失败:', publicError.message);
            }

            if (get().user?.isStoryteller) {
                 // Upsert secrets (in case it doesn't exist yet)
                const { error: secretError } = await supabase
                    .from('game_secrets')
                    .upsert({ room_code: currentGameState.roomId, data: secretState, updated_at: new Date() }, { onConflict: 'room_code' });

                if (secretError) {
                    logger.warn('同步私密状态失败:', secretError.message);
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
                }

                set({ gameState: newState });
                isReceivingUpdate = false;
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
