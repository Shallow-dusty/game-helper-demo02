/**
 * 游戏核心逻辑层
 * 
 * 这个模块包含游戏的纯逻辑函数，被 store.ts 和 sandboxStore.ts 共享使用。
 * 这些函数不依赖于任何 UI 或状态管理框架，只处理游戏规则的计算。
 */

import { GameState, Seat, GamePhase, ChatMessage, Team } from '../types';
import { getNightOrder } from '../constants/nightOrder';
import { ROLES, PHASE_LABELS, SCRIPTS } from '../constants';
import { GAME_RULES } from '../constants/gameRules';
import { generateShortId, shuffle } from './random';

// ==================== 消息创建 ====================

/**
 * 创建系统消息
 */
/**
 * 创建系统消息
 */
export const createSystemMessage = (content: string, recipientId: string | null = null): ChatMessage => ({
    id: generateShortId(),
    senderId: 'system',
    senderName: '系统',
    recipientId,
    content,
    timestamp: Date.now(),
    type: 'system',
    isPrivate: !!recipientId
});

/**
 * 向游戏状态添加系统消息（可变操作，用于 immer）
 */
export const addSystemMessage = (gameState: GameState, content: string, recipientId: string | null = null): void => {
    gameState.messages.push(createSystemMessage(content, recipientId));
};

// ==================== 夜间行动队列 ====================

/**
 * 构建夜间行动队列
 * @param seats 座位列表
 * @param isFirstNight 是否为首夜
 * @param scriptId 剧本ID（可选，用于获取剧本特定顺序）
 * @returns 按顺序排列的角色ID列表
 */
export const buildNightQueue = (seats: Seat[], isFirstNight: boolean, scriptId?: string): string[] => {
    const order = getNightOrder(scriptId ?? 'tb', isFirstNight);
    const roleCounts = new Map<string, { alive: number; dead: number }>();
    const deathTriggerRoles = new Set(['ravenkeeper', 'sage']);

    seats.forEach((seat) => {
        const roleId = seat.realRoleId;
        if (!roleId) return;
        const entry = roleCounts.get(roleId) ?? { alive: 0, dead: 0 };
        if (seat.isDead) {
            entry.dead += 1;
        } else {
            entry.alive += 1;
        }
        roleCounts.set(roleId, entry);
    });

    return order.filter((roleId) => {
        const counts = roleCounts.get(roleId);
        if (!counts) return false;
        if (counts.alive > 0) return true;
        return counts.dead > 0 && deathTriggerRoles.has(roleId);
    });
};

/**
 * 判断是否为首夜
 * @param seats 座位列表
 * @returns 如果没有死亡玩家则为首夜
 */
export const isFirstNight = (nightCount: number): boolean => {
    return nightCount === 1;
};

// ==================== 角色分配 ====================

/**
 * 获取标准角色配比
 * @param playerCount 玩家人数
 * @returns 各类型角色的数量配置
 */
export const getStandardComposition = (playerCount: number): {
    townsfolk: number;
    outsider: number;
    minion: number;
    demon: number;
} => {
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
    // 如果人数超出范围，默认使用7人规则
    const rule = rules[playerCount] ?? rules[7];
    return rule ?? { townsfolk: 5, outsider: 0, minion: 1, demon: 1 };
};

/**
 * 根据剧本和人数自动分配角色
 * @param scriptId 剧本ID
 * @param playerCount 玩家人数
 * @returns 角色ID数组，按座位顺序排列
 */
export const generateRoleAssignment = (scriptId: string, playerCount: number): string[] => {
    const script = SCRIPTS[scriptId];
    if (!script) return [];

    const composition = getStandardComposition(playerCount);
    const rolePool = script.roles;

    // 按阵营分组
    const townsfolkRoles = rolePool.filter(id => ROLES[id]?.team === 'TOWNSFOLK');
    const outsiderRoles = rolePool.filter(id => ROLES[id]?.team === 'OUTSIDER');
    const minionRoles = rolePool.filter(id => ROLES[id]?.team === 'MINION');
    const demonRoles = rolePool.filter(id => ROLES[id]?.team === 'DEMON');

    // 随机打乱（使用 Fisher-Yates 算法）
    // shuffle 函数已从 ./random 导入

    // 先随机选择爪牙（需要先确定是否有男爵）
    const selectedMinions = shuffle(minionRoles).slice(0, composition.minion);
    const hasBaron = selectedMinions.includes('baron');

    // 男爵规则：外来者 +2，村民 -2
    let townsfolkCount = composition.townsfolk;
    let outsiderCount = composition.outsider;
    if (hasBaron) {
        outsiderCount = Math.min(outsiderCount + 2, outsiderRoles.length);
        townsfolkCount = Math.max(townsfolkCount - 2, 0);
    }

    // 选择角色
    const selectedRoles: string[] = [
        ...shuffle(townsfolkRoles).slice(0, townsfolkCount),
        ...shuffle(outsiderRoles).slice(0, outsiderCount),
        ...selectedMinions,
        ...shuffle(demonRoles).slice(0, composition.demon)
    ];

    // 打乱最终顺序
    return shuffle(selectedRoles);
};

// ==================== 座位操作 ====================

/**
 * 应用角色分配到座位
 * @param seat 座位对象（会被修改）
 * @param roleId 角色ID
 */
export const applyRoleToSeat = (seat: Seat, roleId: string | null): void => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- 保持向后兼容性，直到 v0.8.0 移除
    seat.roleId = roleId;
    seat.realRoleId = roleId;
    seat.seenRoleId = roleId;
    seat.hasUsedAbility = false;
    seat.statuses = [];
};

/**
 * 切换座位死亡状态
 * @param seat 座位对象（会被修改）
 * @returns 变更描述
 */
export const toggleSeatDead = (seat: Seat): string => {
    seat.isDead = !seat.isDead;
    if (seat.isDead) {
        seat.hasGhostVote = true;
        return `${seat.userName} 死亡了。`;
    } else {
        return `${seat.userName} 复活了。`;
    }
};

/**
 * 使用幽灵票
 * @param seat 座位对象（会被修改）
 */
export const useGhostVote = (seat: Seat): void => {
    if (seat.isDead && seat.hasGhostVote) {
        seat.hasGhostVote = false;
    }
};

// ==================== 阶段管理 ====================

/**
 * 处理阶段变更时的副作用
 * @param gameState 游戏状态（会被修改）
 * @param newPhase 新阶段
 * @param prevPhase 之前的阶段
 */
export const handlePhaseChange = (
    gameState: GameState,
    newPhase: GamePhase,
    prevPhase: GamePhase
): void => {
    if (prevPhase === newPhase) return;

    addSystemMessage(gameState, `阶段变更为: ${PHASE_LABELS[newPhase] ?? '未知阶段'}`);

    if (newPhase === 'NIGHT') {
        gameState.roundInfo.nightCount++;
        gameState.roundInfo.totalRounds++;

        // 重置每日处决标记（每日一次处决规则）
        gameState.dailyExecutionCompleted = false;
        // 清空每日提名记录
        gameState.dailyNominations = [];

        // 构建夜间队列
        const firstNight = isFirstNight(gameState.roundInfo.nightCount);
        gameState.nightQueue = buildNightQueue(gameState.seats, firstNight, gameState.currentScriptId);
        gameState.nightCurrentIndex = 0;
    } else if (newPhase === 'DAY') {
        gameState.roundInfo.dayCount++;
    }
};

// ==================== 投票管理 ====================

/**
 * 创建投票状态
 * @param nomineeSeatId 被提名者座位ID
 * @param nominatorSeatId 提名者座位ID（可选）
 */
export const createVotingState = (
    nomineeSeatId: number,
    nominatorSeatId: number | null = null
) => ({
    nominatorSeatId,
    nomineeSeatId,
    clockHandSeatId: null,
    votes: [] as number[],
    isOpen: true
});

// ==================== 游戏结束检测 ====================

/**
 * 检查好人胜利条件（恶魔死亡）
 * @param seats 座位列表
 * @returns 是否满足好人胜利条件
 */
export const checkGoodWin = (seats: Seat[]): boolean => {
    const demons = seats.filter(s => {
        const role = ROLES[s.realRoleId ?? s.seenRoleId ?? ''];
        return role?.team === 'DEMON';
    });
    return demons.every(d => d.isDead);
};

const getSeatRoleTeam = (seat: Seat): Team | null => {
    const roleId = seat.realRoleId ?? seat.seenRoleId ?? seat.roleId;
    if (!roleId) return null;
    return ROLES[roleId]?.team ?? null;
};

export const isTravelerSeat = (seat: Seat): boolean => {
    return getSeatRoleTeam(seat) === 'TRAVELER';
};

export const countAlivePlayers = (seats: Seat[]): number => {
    return seats.filter(seat => !seat.isDead && !isTravelerSeat(seat)).length;
};

/**
 * 检查邪恶胜利条件（存活人数 <= EVIL_WIN_THRESHOLD）
 * @param seats 座位列表
 * @returns 是否满足邪恶胜利条件
 */
export const checkEvilWin = (seats: Seat[]): boolean => {
    const aliveCount = countAlivePlayers(seats);
    return aliveCount <= GAME_RULES.EVIL_WIN_THRESHOLD;
};

/**
 * 检查游戏是否结束
 * @param seats 座位列表
 * @param executedSeatId 本次被处决的座位ID（可选，用于圣徒检查）
 * @returns 游戏结束状态，null 表示未结束
 */
export const checkGameOver = (
    seats: Seat[],
    options?: { executedSeatId?: number; executionOccurred?: boolean }
): {
    isOver: boolean;
    winner: 'GOOD' | 'EVIL' | null;
    reason: string;
} | null => {
    if (checkGoodWin(seats)) {
        return {
            isOver: true,
            winner: 'GOOD',
            reason: '恶魔已被处决，好人胜利！'
        };
    }
    if (checkEvilWin(seats)) {
        return {
            isOver: true,
            winner: 'EVIL',
            reason: '存活玩家不足，邪恶胜利！'
        };
    }

    const executedSeatId = options?.executedSeatId;
    const executionOccurred = options?.executionOccurred;

    // Saint only triggers evil win when EXECUTED, not killed at night
    if (executionOccurred === true && executedSeatId !== undefined) {
        const executedSeat = seats.find(s => s.id === executedSeatId);

        // 圣徒被处决检查
        if (executedSeat?.realRoleId === 'saint') {
            return {
                isOver: true,
                winner: 'EVIL',
                reason: '圣徒被处决，邪恶胜利！'
            };
        }
    }

    // Bug#11 fix: Mayor wins if 3 alive and NO execution occurs
    if (executionOccurred === false) {
        const aliveSeats = seats.filter(s => !s.isDead && !isTravelerSeat(s));
        if (aliveSeats.length === GAME_RULES.MAYOR_TRIGGER_COUNT) {
            const mayorSeat = aliveSeats.find(s => s.realRoleId === 'mayor');
            const mayorIsPoisonedOrDrunk = mayorSeat?.statuses?.some(
                status => status === 'POISONED' || status === 'DRUNK'
            );
            if (mayorSeat && !mayorIsPoisonedOrDrunk) {
                return {
                    isOver: true,
                    winner: 'GOOD',
                    reason: '市长特殊胜利！仅剩3名玩家且无人被处决，好人获胜！'
                };
            }
        }
    }

    return null;
};

/**
 * 创建提醒标记
 */
export const createReminder = (
    seatId: number,
    text: string,
    sourceRole = 'ST',
    icon?: string,
    color?: string
) => ({
    id: generateShortId(),
    text,
    sourceRole,
    seatId,
    icon,
    color
});
