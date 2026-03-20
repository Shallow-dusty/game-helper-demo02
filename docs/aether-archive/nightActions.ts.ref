/**
 * Night Action System - 夜晚行动顺序管理
 *
 * 负责管理夜晚阶段的角色行动顺序和能力触发
 */

import type { Character, Player, PlayerId, CharacterId, GameConfig, ExecutionRecord, ErrorInfoMode } from '../../types/game';
import { Team } from '../../types/game';
import { getCharacterById } from '../../data/characters/trouble-brewing';

// ============================================================
// 类型定义
// ============================================================

/**
 * 夜晚行动项
 */
export interface NightActionItem {
    /** 行动角色 ID */
    characterId: CharacterId;
    /** 行动角色对象 */
    character: Character;
    /** 执行行动的玩家 ID */
    playerId: PlayerId;
    /** 行动顺序 */
    order: number;
    /** 是否已完成 */
    completed: boolean;
}

/**
 * 夜晚行动队列
 */
export interface NightQueue {
    /** 当前夜晚序号 */
    night: number;
    /** 是否是首夜 */
    isFirstNight: boolean;
    /** 行动项列表 */
    actions: NightActionItem[];
    /** 当前行动索引 */
    currentIndex: number;
}

/**
 * 角色行动结果
 */
export interface AbilityResult {
    /** 行动者 ID */
    actorId: PlayerId;
    /** 目标玩家 ID（如果有） */
    targetIds?: PlayerId[];
    /** 结果数据 */
    data?: Record<string, unknown>;
    /** 是否成功 */
    success: boolean;
    /** 错误信息 */
    error?: string;
}

// ============================================================
// 夜晚行动队列构建
// ============================================================

/**
 * 构建夜晚行动队列
 */
export function buildNightQueue(
    players: Player[],
    isFirstNight: boolean,
    night: number
): NightQueue {
    const actions: NightActionItem[] = [];

    // 收集所有需要行动的玩家，每个玩家创建一个独立的行动项
    players.forEach(player => {
        if (!player.characterId || player.isDead) return;

        const character = getCharacterById(player.characterId);
        if (!character) return;

        // 检查该角色在当前夜晚是否需要行动
        const shouldAct = isFirstNight ? character.firstNight : character.otherNight;
        if (!shouldAct) return;

        // 检查是否中毒或醉酒（这些状态会在后续实现）
        // if (player.statusFlags.poisoned || player.statusFlags.drunk) return;

        const order = isFirstNight
            ? character.firstNightOrder || 999
            : character.otherNightOrder || 999;

        actions.push({
            characterId: character.id,
            character,
            playerId: player.id,
            order,
            completed: false
        });
    });

    // 按顺序排序
    actions.sort((a, b) => a.order - b.order);

    return {
        night,
        isFirstNight,
        actions,
        currentIndex: 0
    };
}

/**
 * 获取当前待执行的行动
 */
export function getCurrentAction(queue: NightQueue): NightActionItem | null {
    if (queue.currentIndex >= queue.actions.length) {
        return null;
    }
    return queue.actions[queue.currentIndex];
}

/**
 * 标记当前行动为完成
 */
export function completeCurrentAction(queue: NightQueue): NightQueue {
    if (queue.currentIndex >= queue.actions.length) {
        return queue;
    }

    const updatedActions = [...queue.actions];
    updatedActions[queue.currentIndex] = {
        ...updatedActions[queue.currentIndex],
        completed: true
    };

    return {
        ...queue,
        actions: updatedActions,
        currentIndex: queue.currentIndex + 1
    };
}

/**
 * 检查夜晚是否结束
 */
export function isNightComplete(queue: NightQueue): boolean {
    return queue.currentIndex >= queue.actions.length;
}

/**
 * 跳过当前行动（说书人可以跳过某些行动）
 */
export function skipCurrentAction(queue: NightQueue): NightQueue {
    return completeCurrentAction(queue);
}

// ============================================================
// 角色能力执行框架
// ============================================================

/**
 * 角色能力处理器类型
 */
export type AbilityHandler = (
    actorId: PlayerId,
    targetIds: PlayerId[] | undefined,
    context: AbilityContext
) => Promise<AbilityResult>;

/**
 * 能力执行上下文
 */
export interface AbilityContext {
    /** 所有玩家 */
    players: Player[];
    /** 当前夜晚 */
    night: number;
    /** 是否首夜 */
    isFirstNight: boolean;
    /** 游戏历史数据 */
    history?: unknown[];
    /** 被保护的玩家ID集合（僧侣保护） */
    protectedPlayers?: Set<PlayerId>;
    /** 游戏配置 */
    config?: GameConfig;
    /** 说书人自定义的错误信息 */
    customErrorInfo?: Record<PlayerId, any>;
    /** 处决历史记录 */
    executionHistory?: ExecutionRecord[];
    /** 红鲱鱼玩家ID */
    redHerringPlayerId?: PlayerId;
}

/**
 * 能力处理器注册表
 */
const abilityHandlers = new Map<CharacterId, AbilityHandler>();

/**
 * 注册角色能力处理器
 */
export function registerAbilityHandler(
    characterId: CharacterId,
    handler: AbilityHandler
): void {
    abilityHandlers.set(characterId, handler);
}

// ============================================================
// 中毒/醉酒系统
// ============================================================

/**
 * 生成随机错误信息
 */
function generateRandomErrorInfo(result: AbilityResult): any {
    if (!result.data) return {};

    const data = { ...result.data };

    // 共情者：随机0-2的邪恶邻居数
    if (data.evilNeighborCount !== undefined) {
        data.evilNeighborCount = Math.floor(Math.random() * 3);
    }

    // 占卜师：随机真假
    if (data.hasDemon !== undefined) {
        data.hasDemon = Math.random() < 0.5;
    }

    // 厨师：随机邪恶对数
    if (data.evilPairs !== undefined) {
        data.evilPairs = Math.floor(Math.random() * 3);
    }

    return data;
}

/**
 * 应用基于规则的错误信息
 */
function applyErrorRules(result: AbilityResult): any {
    if (!result.data) return {};

    const data = { ...result.data };

    // 共情者：显示相反数字
    if (data.evilNeighborCount !== undefined) {
        data.evilNeighborCount = 2 - data.evilNeighborCount;
    }

    // 占卜师：显示相反结果
    if (data.hasDemon !== undefined) {
        data.hasDemon = !data.hasDemon;
    }

    // 厨师：显示错误对数
    if (data.evilPairs !== undefined) {
        data.evilPairs = Math.max(0, data.evilPairs - 1);
    }

    return data;
}

/**
 * 包装中毒/醉酒角色的能力，返回错误信息
 */
function wrapPoisonedAbility(
    originalResult: AbilityResult,
    actorId: PlayerId,
    context: AbilityContext
): AbilityResult {
    const mode = context.config?.errorInfoMode;

    // 如果没有配置，默认使用自定义模式
    if (!mode) {
        return originalResult;
    }

    switch (mode) {
        case 'custom':
            // 使用说书人提供的自定义信息
            return {
                ...originalResult,
                data: context.customErrorInfo?.[actorId] || originalResult.data
            };

        case 'random':
            // 生成随机错误信息
            return {
                ...originalResult,
                data: generateRandomErrorInfo(originalResult)
            };

        case 'rule':
            // 基于规则生成错误
            return {
                ...originalResult,
                data: applyErrorRules(originalResult)
            };

        default:
            return originalResult;
    }
}

/**
 * 执行角色能力
 */
export async function executeAbility(
    characterId: CharacterId,
    actorId: PlayerId,
    targetIds: PlayerId[] | undefined,
    context: AbilityContext
): Promise<AbilityResult> {
    const handler = abilityHandlers.get(characterId);

    if (!handler) {
        // 没有注册的能力处理器，返回默认成功
        return {
            actorId,
            targetIds,
            success: true,
            data: { message: '该角色能力尚未实现' }
        };
    }

    try {
        const result = await handler(actorId, targetIds, context);

        // 检查执行者是否中毒或醉酒
        const actor = context.players.find(p => p.id === actorId);
        if (actor && (actor.status.poisoned || actor.status.drunk)) {
            return wrapPoisonedAbility(result, actorId, context);
        }

        return result;
    } catch (error) {
        return {
            actorId,
            targetIds,
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        };
    }
}

// ============================================================
// 示例能力处理器
// ============================================================

/**
 * 小恶魔能力：每晚杀死一名玩家
 */
registerAbilityHandler('imp', async (actorId, targetIds, context) => {
    if (!targetIds || targetIds.length === 0) {
        return {
            actorId,
            success: false,
            error: '必须选择一个目标'
        };
    }

    const targetId = targetIds[0];
    const target = context.players.find(p => p.id === targetId);

    if (!target) {
        return {
            actorId,
            success: false,
            error: '目标玩家不存在'
        };
    }

    if (target.isDead) {
        return {
            actorId,
            success: false,
            error: '目标玩家已死亡'
        };
    }

    // 检查目标是否是士兵（免疫恶魔攻击）
    if (target.characterId === 'soldier') {
        return {
            actorId,
            targetIds,
            success: true,
            data: {
                killed: false,
                reason: '目标是士兵，免疫攻击'
            }
        };
    }

    // 检查目标是否被僧侣保护
    if (context.protectedPlayers?.has(targetId)) {
        return {
            actorId,
            targetIds,
            success: true,
            data: {
                killed: false,
                reason: '目标被僧侣保护'
            }
        };
    }

    return {
        actorId,
        targetIds,
        success: true,
        data: {
            killed: true,
            victimId: targetId
        }
    };
});

/**
 * 共情者能力：查看邻居中的邪恶玩家数量
 */
registerAbilityHandler('empath', async (actorId, _targetIds, context) => {
    const actor = context.players.find(p => p.id === actorId);
    if (!actor) {
        return {
            actorId,
            success: false,
            error: '玩家不存在'
        };
    }

    const seatIndex = actor.seatIndex;
    const playerCount = context.players.length;

    // 获取左右邻居
    const leftNeighborIndex = (seatIndex - 1 + playerCount) % playerCount;
    const rightNeighborIndex = (seatIndex + 1) % playerCount;

    const leftNeighbor = context.players.find(p => p.seatIndex === leftNeighborIndex);
    const rightNeighbor = context.players.find(p => p.seatIndex === rightNeighborIndex);

    let evilCount = 0;

    // 检查左邻居
    if (leftNeighbor && !leftNeighbor.isDead && leftNeighbor.characterId) {
        const leftChar = getCharacterById(leftNeighbor.characterId);
        if (leftChar && (leftChar.team === Team.MINION || leftChar.team === Team.DEMON)) {
            evilCount++;
        }
    }

    // 检查右邻居
    if (rightNeighbor && !rightNeighbor.isDead && rightNeighbor.characterId) {
        const rightChar = getCharacterById(rightNeighbor.characterId);
        if (rightChar && (rightChar.team === Team.MINION || rightChar.team === Team.DEMON)) {
            evilCount++;
        }
    }

    return {
        actorId,
        success: true,
        data: {
            evilNeighborCount: evilCount,
            leftNeighborId: leftNeighbor?.id,
            rightNeighborId: rightNeighbor?.id
        }
    };
});

/**
 * 占卜师能力：查看两名玩家中是否有恶魔
 */
registerAbilityHandler('fortune_teller', async (actorId, targetIds, context) => {
    if (!targetIds || targetIds.length !== 2) {
        return {
            actorId,
            success: false,
            error: '必须选择两名玩家'
        };
    }

    const [target1Id, target2Id] = targetIds;
    const target1 = context.players.find(p => p.id === target1Id);
    const target2 = context.players.find(p => p.id === target2Id);

    if (!target1 || !target2) {
        return {
            actorId,
            success: false,
            error: '目标玩家不存在'
        };
    }

    // 检查是否有恶魔
    let hasDemon = false;

    if (target1.characterId) {
        const char1 = getCharacterById(target1.characterId);
        if (char1?.team === Team.DEMON) hasDemon = true;
    }

    if (target2.characterId) {
        const char2 = getCharacterById(target2.characterId);
        if (char2?.team === Team.DEMON) hasDemon = true;
    }

    // 检查红鲱鱼（一名善良玩家始终被视为恶魔）
    if (!hasDemon && context.redHerringPlayerId) {
        if (target1Id === context.redHerringPlayerId || target2Id === context.redHerringPlayerId) {
            hasDemon = true; // 红鲱鱼被误判为恶魔
        }
    }

    return {
        actorId,
        targetIds,
        success: true,
        data: {
            hasDemon,
            isRedHerring: context.redHerringPlayerId &&
                (target1Id === context.redHerringPlayerId || target2Id === context.redHerringPlayerId),
            target1Id,
            target1Name: target1.name,
            target2Id,
            target2Name: target2.name
        }
    };
});

/**
 * 调查员能力：首夜得知两名玩家和一个爪牙角色
 */
registerAbilityHandler('investigator', async (actorId, _targetIds, context) => {
    const actor = context.players.find(p => p.id === actorId);
    if (!actor) {
        return {
            actorId,
            success: false,
            error: '玩家不存在'
        };
    }

    // 获取所有爪牙玩家
    const minions = context.players.filter(p => {
        if (!p.characterId || p.isDead) return false;
        const char = getCharacterById(p.characterId);
        return char?.team === Team.MINION;
    });

    // 如果没有爪牙，说书人需要提供虚假信息
    const hasMinions = minions.length > 0;

    return {
        actorId,
        success: true,
        data: {
            role: 'investigator',
            hasMinions,
            message: hasMinions
                ? '说书人应向调查员提供：两名玩家中有一名是某个爪牙角色'
                : '说书人应向调查员提供：两名玩家和一个爪牙角色（虚假信息）'
        }
    };
});

/**
 * 图书管理员能力：首夜得知两名玩家和一个外来者角色
 */
registerAbilityHandler('librarian', async (actorId, _targetIds, context) => {
    const actor = context.players.find(p => p.id === actorId);
    if (!actor) {
        return {
            actorId,
            success: false,
            error: '玩家不存在'
        };
    }

    // 获取所有外来者玩家
    const outsiders = context.players.filter(p => {
        if (!p.characterId || p.isDead) return false;
        const char = getCharacterById(p.characterId);
        return char?.team === Team.OUTSIDER;
    });

    const hasOutsiders = outsiders.length > 0;

    return {
        actorId,
        success: true,
        data: {
            role: 'librarian',
            hasOutsiders,
            message: hasOutsiders
                ? '说书人应向图书管理员提供：两名玩家中有一名是某个外来者角色'
                : '说书人应向图书管理员提供：两名玩家和一个外来者角色（虚假信息）'
        }
    };
});

/**
 * 洗衣妇能力：首夜得知两名玩家和一个镇民角色
 */
registerAbilityHandler('washerwoman', async (actorId, _targetIds, context) => {
    const actor = context.players.find(p => p.id === actorId);
    if (!actor) {
        return {
            actorId,
            success: false,
            error: '玩家不存在'
        };
    }

    // 获取所有镇民玩家（排除自己）
    const townsfolk = context.players.filter(p => {
        if (!p.characterId || p.isDead || p.id === actorId) return false;
        const char = getCharacterById(p.characterId);
        return char?.team === Team.TOWNSFOLK;
    });

    return {
        actorId,
        success: true,
        data: {
            role: 'washerwoman',
            availableTownsfolk: townsfolk.length,
            message: '说书人应向洗衣妇提供：两名玩家中有一名是某个镇民角色'
        }
    };
});

/**
 * 守鸦人能力：死亡当晚查看一名玩家的角色
 */
registerAbilityHandler('ravenkeeper', async (actorId, targetIds, context) => {
    if (!targetIds || targetIds.length === 0) {
        return {
            actorId,
            success: false,
            error: '必须选择一名玩家'
        };
    }

    const targetId = targetIds[0];
    const target = context.players.find(p => p.id === targetId);

    if (!target) {
        return {
            actorId,
            success: false,
            error: '目标玩家不存在'
        };
    }

    const targetCharacter = target.characterId ? getCharacterById(target.characterId) : null;

    return {
        actorId,
        targetIds,
        success: true,
        data: {
            targetId,
            targetName: target.name,
            targetCharacterId: target.characterId,
            targetCharacterName: targetCharacter?.name || '未知',
            message: `守鸦人查看了 ${target.name}，其角色为 ${targetCharacter?.name || '未知'}`
        }
    };
});

/**
 * 间谍能力：查看魔典（说书人展示所有信息）
 */
registerAbilityHandler('spy', async (actorId, _targetIds, context) => {
    const actor = context.players.find(p => p.id === actorId);
    if (!actor) {
        return {
            actorId,
            success: false,
            error: '玩家不存在'
        };
    }

    // 收集所有玩家信息
    const grimoireInfo = context.players.map(p => ({
        id: p.id,
        name: p.name,
        characterId: p.characterId,
        characterName: p.characterId ? getCharacterById(p.characterId)?.name : '未分配',
        isDead: p.isDead,
        statusFlags: p.statusFlags
    }));

    return {
        actorId,
        success: true,
        data: {
            role: 'spy',
            grimoireInfo,
            message: '说书人应向间谍展示魔典中的所有信息'
        }
    };
});

/**
 * 僧侣能力：每晚保护一名玩家（不能是自己）
 */
registerAbilityHandler('monk', async (actorId, targetIds, context) => {
    if (!targetIds || targetIds.length === 0) {
        return {
            actorId,
            success: false,
            error: '必须选择一名玩家'
        };
    }

    const targetId = targetIds[0];

    if (targetId === actorId) {
        return {
            actorId,
            success: false,
            error: '僧侣不能保护自己'
        };
    }

    const target = context.players.find(p => p.id === targetId);

    if (!target) {
        return {
            actorId,
            success: false,
            error: '目标玩家不存在'
        };
    }

    if (target.isDead) {
        return {
            actorId,
            success: false,
            error: '不能保护已死亡的玩家'
        };
    }

    return {
        actorId,
        targetIds,
        success: true,
        data: {
            protectedPlayerId: targetId,
            protectedPlayerName: target.name,
            message: `僧侣保护了 ${target.name}`
        }
    };
});

/**
 * 殓葬师能力：得知前一天被处决玩家的角色
 */
registerAbilityHandler('undertaker', async (actorId, _targetIds, context) => {
    const actor = context.players.find(p => p.id === actorId);
    if (!actor) {
        return {
            actorId,
            success: false,
            error: '玩家不存在'
        };
    }

    // 查找昨天被处决的玩家
    // 殓葬师在夜晚行动，night表示当前夜晚，昨天白天对应的day = night
    const yesterday = context.night;
    const lastExecution = context.executionHistory?.find(
        ex => ex.day === yesterday
    );

    if (!lastExecution) {
        return {
            actorId,
            success: true,
            data: {
                hasExecution: false,
                message: '昨天没有人被处决'
            }
        };
    }

    const executed = context.players.find(p => p.id === lastExecution.executedId);
    const character = lastExecution.executedCharacterId
        ? getCharacterById(lastExecution.executedCharacterId)
        : null;

    return {
        actorId,
        success: true,
        data: {
            hasExecution: true,
            executedPlayerId: lastExecution.executedId,
            executedPlayerName: executed?.name,
            characterId: lastExecution.executedCharacterId,
            characterName: character?.name,
            message: `昨天被处决的是 ${executed?.name}（${character?.name || '未知'}）`
        }
    };
});

/**
 * 厨师能力：首夜获知邪恶玩家相邻的对数
 */
registerAbilityHandler('chef', async (actorId, _targetIds, context) => {
    const actor = context.players.find(p => p.id === actorId);
    if (!actor) {
        return {
            actorId,
            success: false,
            error: '玩家不存在'
        };
    }

    // 计算相邻的邪恶玩家对数
    let evilPairs = 0;
    const players = context.players;

    for (let i = 0; i < players.length; i++) {
        const current = players[i];
        const next = players[(i + 1) % players.length];

        // 只计算活着的玩家
        if (!current.isDead && !next.isDead && current.characterId && next.characterId) {
            const currentChar = getCharacterById(current.characterId);
            const nextChar = getCharacterById(next.characterId);

            const currentEvil = currentChar &&
                (currentChar.team === Team.MINION || currentChar.team === Team.DEMON);
            const nextEvil = nextChar &&
                (nextChar.team === Team.MINION || nextChar.team === Team.DEMON);

            if (currentEvil && nextEvil) {
                evilPairs++;
            }
        }
    }

    return {
        actorId,
        success: true,
        data: {
            evilPairs,
            message: `厨师看到 ${evilPairs} 对邪恶玩家相邻`
        }
    };
});

/**
 * 管家能力：选择主人，明天只能在主人投票后投票
 */
registerAbilityHandler('butler', async (actorId, targetIds, context) => {
    if (!targetIds || targetIds.length === 0) {
        return {
            actorId,
            success: false,
            error: '必须选择一名玩家作为主人'
        };
    }

    const targetId = targetIds[0];

    if (targetId === actorId) {
        return {
            actorId,
            success: false,
            error: '管家不能选择自己作为主人'
        };
    }

    const target = context.players.find(p => p.id === targetId);

    if (!target) {
        return {
            actorId,
            success: false,
            error: '目标玩家不存在'
        };
    }

    if (target.isDead) {
        return {
            actorId,
            success: false,
            error: '不能选择已死亡的玩家作为主人'
        };
    }

    // 返回主人信息，由状态机保存
    return {
        actorId,
        targetIds,
        success: true,
        data: {
            butlerMasterId: targetId,
            butlerMasterName: target.name,
            message: `管家选择了 ${target.name} 作为今天的主人`
        }
    };
});

/**
 * 隐士能力：可能被视为邪恶（被动能力，由说书人决定）
 * 注：隐士没有主动能力，但其他角色的能力可能将隐士视为邪恶
 * 这个处理器主要用于提示说书人
 */
registerAbilityHandler('recluse', async (actorId, _targetIds, context) => {
    const actor = context.players.find(p => p.id === actorId);
    if (!actor) {
        return {
            actorId,
            success: false,
            error: '玩家不存在'
        };
    }

    return {
        actorId,
        success: true,
        data: {
            role: 'recluse',
            message: '隐士可能被其他角色的能力视为邪恶、爪牙或恶魔（说书人决定）'
        }
    };
});

/**
 * 投毒者能力：夜晚投毒一名玩家，使其能力失效并获得错误信息
 */
registerAbilityHandler('poisoner', async (actorId, targetIds, context) => {
    const actor = context.players.find(p => p.id === actorId);
    if (!actor) {
        return {
            actorId,
            success: false,
            error: '玩家不存在'
        };
    }

    if (!targetIds || targetIds.length === 0) {
        return {
            actorId,
            success: false,
            error: '必须选择一个目标'
        };
    }

    const targetId = targetIds[0];
    const target = context.players.find(p => p.id === targetId);

    if (!target) {
        return {
            actorId,
            success: false,
            error: '目标玩家不存在'
        };
    }

    if (target.isDead) {
        return {
            actorId,
            success: false,
            error: '目标玩家已死亡'
        };
    }

    // 返回中毒标记，由状态机应用
    return {
        actorId,
        targetIds,
        success: true,
        data: {
            poisonedPlayerId: targetId,
            poisonedPlayerName: target.name,
            message: `投毒者毒害了 ${target.name}`
        }
    };
});

// ============================================================
// 工具函数
// ============================================================

/**
 * 获取玩家的邻居
 */
export function getNeighbors(player: Player, players: Player[]): {
    left: Player | null;
    right: Player | null;
} {
    const seatIndex = player.seatIndex;
    const playerCount = players.length;

    const leftIndex = (seatIndex - 1 + playerCount) % playerCount;
    const rightIndex = (seatIndex + 1) % playerCount;

    // 返回所有邻居，包括死亡的（用于共情者等角色）
    const left = players.find(p => p.seatIndex === leftIndex) || null;
    const right = players.find(p => p.seatIndex === rightIndex) || null;

    return { left, right };
}

/**
 * 检查玩家是否是邪恶阵营
 */
export function isEvil(player: Player): boolean {
    if (!player.characterId) return false;
    const character = getCharacterById(player.characterId);
    return character?.team === Team.MINION || character?.team === Team.DEMON;
}

/**
 * 检查玩家是否是恶魔
 */
export function isDemon(player: Player): boolean {
    if (!player.characterId) return false;
    const character = getCharacterById(player.characterId);
    return character?.team === Team.DEMON;
}

/**
 * 获取存活的邪恶玩家数量
 */
export function countAliveEvil(players: Player[]): number {
    return players.filter(p => !p.isDead && isEvil(p)).length;
}

/**
 * 获取存活的恶魔数量
 */
export function countAliveDemon(players: Player[]): number {
    return players.filter(p => !p.isDead && isDemon(p)).length;
}
