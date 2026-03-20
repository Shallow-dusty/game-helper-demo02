/**
 * Game End Conditions - 游戏结束判定
 *
 * 负责检测游戏胜利/失败条件
 */

import type { Player, PlayerId } from '../../types/game';
import { Team } from '../../types/game';
import { getCharacterById } from '../../data/characters/trouble-brewing';
import { isDemon, isEvil } from '../night/nightActions';

// ============================================================
// 类型定义
// ============================================================

/**
 * 游戏结束结果
 */
export interface GameEndResult {
    /** 是否游戏结束 */
    isEnded: boolean;
    /** 获胜阵营（如果游戏结束） */
    winner?: Team;
    /** 结束原因 */
    reason?: string;
    /** 触发条件类型 */
    conditionType?: EndConditionType;
}

/**
 * 结束条件类型
 */
export enum EndConditionType {
    /** 恶魔死亡 */
    DEMON_DIED = 'DEMON_DIED',
    /** 善良阵营全灭 */
    GOOD_ELIMINATED = 'GOOD_ELIMINATED',
    /** 只剩 3 人且无处决（市长胜利） */
    MAYOR_WIN = 'MAYOR_WIN',
    /** 圣徒被处决 */
    SAINT_EXECUTED = 'SAINT_EXECUTED',
    /** 猩红女郎变成恶魔 */
    SCARLET_WOMAN_TRANSFORM = 'SCARLET_WOMAN_TRANSFORM',
    /** 说书人宣布结束 */
    STORYTELLER_DECISION = 'STORYTELLER_DECISION'
}

// ============================================================
// 核心判定函数
// ============================================================

/**
 * 检查游戏是否结束
 */
export function checkGameEnd(
    players: Player[],
    executedToday: boolean,
    lastExecutedId?: PlayerId
): GameEndResult {
    // 1. 检查恶魔是否全部死亡
    const demonDeathResult = checkDemonDeath(players);
    if (demonDeathResult.isEnded) {
        return demonDeathResult;
    }

    // 2. 检查善良阵营是否全灭
    const goodEliminatedResult = checkGoodEliminated(players);
    if (goodEliminatedResult.isEnded) {
        return goodEliminatedResult;
    }

    // 3. 检查圣徒是否被处决
    if (lastExecutedId) {
        const saintResult = checkSaintExecution(players, lastExecutedId);
        if (saintResult.isEnded) {
            return saintResult;
        }
    }

    // 4. 检查市长胜利条件（3 人存活且今日无处决）
    if (!executedToday) {
        const mayorResult = checkMayorWin(players);
        if (mayorResult.isEnded) {
            return mayorResult;
        }
    }

    // 游戏未结束
    return { isEnded: false };
}

/**
 * 检查恶魔死亡（善良阵营胜利）
 */
export function checkDemonDeath(players: Player[]): GameEndResult {
    const alivePlayers = players.filter(p => !p.isDead);
    const aliveDemons = alivePlayers.filter(isDemon);

    // 所有恶魔死亡 = 善良胜利
    if (aliveDemons.length === 0) {
        return {
            isEnded: true,
            winner: Team.TOWNSFOLK,
            reason: '所有恶魔已死亡，善良阵营获胜！',
            conditionType: EndConditionType.DEMON_DIED
        };
    }

    return { isEnded: false };
}

/**
 * 检查善良阵营全灭（邪恶阵营胜利）
 */
export function checkGoodEliminated(players: Player[]): GameEndResult {
    const alivePlayers = players.filter(p => !p.isDead);
    const aliveGood = alivePlayers.filter(p => !isEvil(p));

    // 所有善良玩家死亡 = 邪恶胜利
    if (aliveGood.length === 0) {
        return {
            isEnded: true,
            winner: Team.DEMON,
            reason: '所有善良玩家已死亡，邪恶阵营获胜！',
            conditionType: EndConditionType.GOOD_ELIMINATED
        };
    }

    return { isEnded: false };
}

/**
 * 检查圣徒被处决（邪恶阵营胜利）
 */
export function checkSaintExecution(
    players: Player[],
    executedId: PlayerId
): GameEndResult {
    const executed = players.find(p => p.id === executedId);
    if (!executed || !executed.characterId) {
        return { isEnded: false };
    }

    // 圣徒被处决 = 邪恶胜利
    if (executed.characterId === 'saint') {
        return {
            isEnded: true,
            winner: Team.DEMON,
            reason: '圣徒被处决，邪恶阵营获胜！',
            conditionType: EndConditionType.SAINT_EXECUTED
        };
    }

    return { isEnded: false };
}

/**
 * 检查市长胜利条件
 */
export function checkMayorWin(players: Player[]): GameEndResult {
    const alivePlayers = players.filter(p => !p.isDead);

    // 市长胜利条件：只剩 3 人且今日无处决
    if (alivePlayers.length === 3) {
        const hasMayor = alivePlayers.some(p => p.characterId === 'mayor');

        if (hasMayor) {
            return {
                isEnded: true,
                winner: Team.TOWNSFOLK,
                reason: '只剩 3 名玩家且今日无处决，市长带领善良阵营获胜！',
                conditionType: EndConditionType.MAYOR_WIN
            };
        }
    }

    return { isEnded: false };
}

/**
 * 检查猩红女郎是否应该变成恶魔
 */
export function checkScarletWomanTransform(
    players: Player[]
): { shouldTransform: boolean; scarletWomanId?: PlayerId } {
    const alivePlayers = players.filter(p => !p.isDead);

    // 猩红女郎条件：5 人或更多存活 + 恶魔死亡
    if (alivePlayers.length < 5) {
        return { shouldTransform: false };
    }

    const aliveDemons = alivePlayers.filter(isDemon);
    if (aliveDemons.length > 0) {
        return { shouldTransform: false };
    }

    // 查找猩红女郎
    const scarletWoman = players.find(
        p => !p.isDead && p.characterId === 'scarlet_woman'
    );

    if (scarletWoman) {
        return {
            shouldTransform: true,
            scarletWomanId: scarletWoman.id
        };
    }

    return { shouldTransform: false };
}

// ============================================================
// 辅助判定函数
// ============================================================

/**
 * 获取存活的善良玩家
 */
export function getAliveGoodPlayers(players: Player[]): Player[] {
    return players.filter(p => !p.isDead && !isEvil(p));
}

/**
 * 获取存活的邪恶玩家
 */
export function getAliveEvilPlayers(players: Player[]): Player[] {
    return players.filter(p => !p.isDead && isEvil(p));
}

/**
 * 获取存活的恶魔
 */
export function getAliveDemons(players: Player[]): Player[] {
    return players.filter(p => !p.isDead && isDemon(p));
}

/**
 * 计算阵营存活比例
 */
export function getTeamBalance(players: Player[]): {
    aliveGood: number;
    aliveEvil: number;
    totalAlive: number;
    goodPercentage: number;
    evilPercentage: number;
} {
    const alivePlayers = players.filter(p => !p.isDead);
    const aliveGood = getAliveGoodPlayers(players);
    const aliveEvil = getAliveEvilPlayers(players);

    const totalAlive = alivePlayers.length;

    return {
        aliveGood: aliveGood.length,
        aliveEvil: aliveEvil.length,
        totalAlive,
        goodPercentage: totalAlive > 0 ? (aliveGood.length / totalAlive) * 100 : 0,
        evilPercentage: totalAlive > 0 ? (aliveEvil.length / totalAlive) * 100 : 0
    };
}

/**
 * 检查游戏是否处于危险状态（即将结束）
 */
export function isGameInDanger(players: Player[]): {
    inDanger: boolean;
    reason?: string;
    daysLeft?: number;
} {
    const balance = getTeamBalance(players);

    // 邪恶玩家占比过高（优先级最高）
    if (balance.evilPercentage >= 40) {
        return {
            inDanger: true,
            reason: `邪恶玩家比例达到 ${balance.evilPercentage.toFixed(0)}%！`,
            daysLeft: Math.floor(balance.aliveGood / balance.aliveEvil)
        };
    }

    // 只剩 4 人
    if (balance.totalAlive === 4) {
        return {
            inDanger: true,
            reason: '只剩 4 名玩家，局势危急！',
            daysLeft: 2
        };
    }

    // 只剩 3 人
    if (balance.totalAlive === 3) {
        return {
            inDanger: true,
            reason: '只剩 3 名玩家，最后一天！',
            daysLeft: 1
        };
    }

    return { inDanger: false };
}

/**
 * 预测游戏剩余回合数
 */
export function estimateRemainingRounds(players: Player[]): number {
    const balance = getTeamBalance(players);

    if (balance.aliveEvil === 0) return 0; // 邪恶全灭
    if (balance.aliveGood === 0) return 0; // 善良全灭

    // 假设每天处决 1 人
    // 剩余回合 = (存活善良人数 - 存活邪恶人数) / 2
    return Math.max(1, Math.floor((balance.aliveGood - balance.aliveEvil) / 2));
}

// ============================================================
// 特殊胜利条件检测
// ============================================================

/**
 * 检查特殊角色的胜利条件
 */
export function checkSpecialWinConditions(
    players: Player[],
    context: {
        currentDay: number;
        executedToday: boolean;
        lastExecutedId?: PlayerId;
    }
): GameEndResult {
    // 市长胜利条件
    if (!context.executedToday) {
        const mayorResult = checkMayorWin(players);
        if (mayorResult.isEnded) return mayorResult;
    }

    // 圣徒被处决
    if (context.lastExecutedId) {
        const saintResult = checkSaintExecution(players, context.lastExecutedId);
        if (saintResult.isEnded) return saintResult;
    }

    return { isEnded: false };
}

/**
 * 获取游戏状态摘要
 */
export function getGameStatusSummary(players: Player[]): {
    status: string;
    balance: ReturnType<typeof getTeamBalance>;
    danger: ReturnType<typeof isGameInDanger>;
    estimatedRounds: number;
} {
    const balance = getTeamBalance(players);
    const danger = isGameInDanger(players);
    const estimatedRounds = estimateRemainingRounds(players);

    let status = '游戏进行中';
    if (danger.inDanger) {
        status = '局势危急';
    } else if (balance.evilPercentage > balance.goodPercentage) {
        status = '邪恶占优';
    } else if (balance.goodPercentage > 70) {
        status = '善良占优';
    }

    return {
        status,
        balance,
        danger,
        estimatedRounds
    };
}
