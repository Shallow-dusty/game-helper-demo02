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
