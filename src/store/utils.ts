import { Seat, GameState } from '../types';

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
            // seenRoleId: seat.seenRoleId // 保持原样
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
            
            console.log('DEBUG: filtering msg', { id: msg.id, type: msg.type, isPrivate: msg.isPrivate });

            // 私聊消息仅对发送者、接收者和 ST 可见
            if (msg.isPrivate) {
                const visible = isStoryteller ||
                    msg.senderId === currentUserId ||
                    msg.recipientId === currentUserId;
                console.log('DEBUG: filter private', { msgId: msg.id, isPrivate: msg.isPrivate, visible, currentUserId, senderId: msg.senderId, recipientId: msg.recipientId });
                return visible;
            }
            
            // 系统消息对所有人可见 (除非标记为 private)
            if (msg.type === 'system') return true;
            
            // 公开消息对所有人可见
            if (!msg.recipientId) return true;
            
            return true;
        })
    };
};

export const addSystemMessage = (gameState: GameState, content: string) => {
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

// --- SECURITY UTILITIES ---

/**
 * 将完整游戏状态拆分为公开状态和秘密状态
 */
export const splitGameState = (fullState: GameState): { publicState: GameState, secretState: Partial<GameState> } => {
    // 1. 克隆状态以避免修改原始对象
    const publicState = JSON.parse(JSON.stringify(fullState)) as GameState;
    const secretState: Partial<GameState> = {};

    // 2. 提取敏感数据到 secretState
    // 真实角色 ID
    secretState.seats = fullState.seats.map(s => ({
        id: s.id,
        realRoleId: s.realRoleId,
        // 其他敏感字段如果需要也可以放在这里
    })) as any;

    // 说书人笔记
    secretState.storytellerNotes = fullState.storytellerNotes;

    // 3. 从 publicState 中移除敏感数据
    publicState.seats.forEach(s => {
        s.realRoleId = null; // 清除真实角色
        // 注意：seenRoleId (展示角色) 是公开的（或者至少是发给客户端的），
        // 具体的视野过滤由 filterGameStateForUser 在客户端进一步处理。
        // 这里我们主要剥离 "绝对不能泄露给普通玩家" 的数据。
    });

    publicState.storytellerNotes = []; // 清空笔记

    return { publicState, secretState };
};

/**
 * 将公开状态和秘密状态合并为完整状态
 */
export const mergeGameState = (publicState: GameState, secretState: any): GameState => {
    if (!secretState) return publicState;

    const mergedState = JSON.parse(JSON.stringify(publicState)) as GameState;

    // 1. 恢复座位真实角色
    if (secretState.seats && Array.isArray(secretState.seats)) {
        secretState.seats.forEach((secretSeat: any) => {
            const targetSeat = mergedState.seats.find(s => s.id === secretSeat.id);
            if (targetSeat) {
                targetSeat.realRoleId = secretSeat.realRoleId;
            }
        });
    }

    // 2. 恢复笔记
    if (secretState.storytellerNotes) {
        mergedState.storytellerNotes = secretState.storytellerNotes;
    }

    return mergedState;
};
