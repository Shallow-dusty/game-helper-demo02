/**
 * Zustand 选择器优化工具
 *
 * 使用细粒度选择器减少不必要的重新渲染
 * 示例：const votingState = useStore(state => state.voting)
 * 而非：const gameState = useStore(state => state.gameState)
 */

import { useStore } from '../store';
import { useMemo } from 'react';

// ============================================================
// 选择器工具函数
// ============================================================

/**
 * 创建一个稳定的选择器 - 防止因对象引用变化导致的重新渲染
 */
export const createSelector = <T, U>(
    selector: (state: T) => U,
    _equalityCheck?: (a: U, b: U) => boolean
) => selector;

// ============================================================
// 高效选择器集合 - 使用细粒度访问
// ============================================================

/** 仅选择游戏状态中的投票信息 */
export const useVotingState = () =>
    useStore(state => ({
        voting: state.gameState?.voting,
        phase: state.gameState?.phase,
    }));

/** 仅选择夜间行动相关信息 */
export const useNightActionState = () =>
    useStore(state => ({
        phase: state.gameState?.phase,
        nightQueue: state.gameState?.nightQueue,
        nightCurrentIndex: state.gameState?.nightCurrentIndex,
        nightActionRequests: state.gameState?.nightActionRequests,
    }));

/** 仅选择座位列表 */
export const useSeatList = () =>
    useStore(state => state.gameState?.seats);

/** 仅选择当前玩家的座位 */
export const useCurrentSeat = () => {
    const user = useStore(state => state.user);
    const seats = useStore(state => state.gameState?.seats);

    return useMemo(() => {
        return seats?.find(s => s.userId === user?.id);
    }, [seats, user?.id]);
};

/** 仅选择游戏消息 */
export const useGameMessages = () =>
    useStore(state => state.gameState?.messages);

/** 仅选择游戏结束信息 */
export const useGameOverState = () =>
    useStore(state => {
        const gameOver = state.gameState?.gameOver;
        return {
            gameOver,
            winner: gameOver?.winner,
            reason: gameOver?.reason,
        };
    });

/** 仅选择房间基本信息 */
export const useRoomInfo = () =>
    useStore(state => ({
        roomId: state.gameState?.roomId,
        phase: state.gameState?.phase,
        currentScriptId: state.gameState?.currentScriptId,
    }));

/** 仅选择玩家信息 */
export const usePlayerInfo = () =>
    useStore(state => ({
        user: state.user,
        isStoryteller: state.user?.isStoryteller,
        isSeated: state.user?.isSeated,
    }));

/** 仅选择连接状态 */
export const useConnectionState = () =>
    useStore(state => ({
        connectionStatus: state.connectionStatus,
        isOffline: state.isOffline,
    }));

// ============================================================
// 高级选择器 - 派生数据
// ============================================================

/** 选择投票统计信息（带 useMemo 优化） */
export const useVotingStats = () => {
    const seats = useStore(state => state.gameState?.seats);
    const voting = useStore(state => state.gameState?.voting);

    return useMemo(() => {
        if (!seats || !voting) return null;

        const handsRaised = seats.filter(s => s.isHandRaised && !s.isDead).length;
        const totalVoters = seats.filter(s => !s.isDead).length;

        return {
            handsRaised,
            totalVoters,
            percentage: totalVoters > 0 ? (handsRaised / totalVoters) * 100 : 0,
            isOpen: voting.isOpen,
            nomineeSeatId: voting.nomineeSeatId,
        };
    }, [seats, voting]);
};

/** 选择当前该行动的角色（夜间） */
export const useCurrentNightRole = () => {
    const gameState = useStore(state => state.gameState);

    return useMemo(() => {
        if (gameState?.phase !== 'NIGHT') return null;

        const currentRoleId = gameState.nightQueue[gameState.nightCurrentIndex];
        return currentRoleId ?? null;
    }, [gameState?.phase, gameState?.nightQueue, gameState?.nightCurrentIndex]);
};

/** 选择当前用户可以执行的操作 */
export const useAvailableActions = () => {
    const user = useStore(state => state.user);
    const currentSeat = useCurrentSeat();
    const currentNightRole = useCurrentNightRole();
    const gameState = useStore(state => state.gameState);

    return useMemo(() => {
        if (!user || !gameState || !currentSeat) return [];

        const actions = [];

        // 说书人操作
        if (user.isStoryteller) {
            actions.push('advance_phase');
            actions.push('update_reminders');
        }

        // 投票阶段
        if (gameState.phase === 'DAY' && gameState.voting?.isOpen) {
            actions.push('raise_hand');
        }

        // 夜间行动
        if (currentNightRole === currentSeat.seenRoleId && gameState.phase === 'NIGHT') {
            actions.push('night_action');
        }

        return actions;
    }, [user, currentSeat, currentNightRole, gameState?.phase, gameState?.voting?.isOpen]);
};

// ============================================================
// 最佳实践文档
// ============================================================

/*
✅ 推荐做法：

// 仅选择需要的数据
const voting = useStore(state => state.gameState?.voting);
const seats = useStore(state => state.gameState?.seats);

// 使用细粒度选择器
const { handsRaised, totalVoters } = useVotingStats();

// 在组件中使用
export const VotingDisplay = () => {
    const stats = useVotingStats();
    return <div>{stats?.handsRaised} 提议</div>;
};


❌ 不推荐做法：

// 这会导致每次 gameState 任何属性变化都重新渲染
const gameState = useStore(state => state.gameState);

// 避免在选择器中进行复杂计算
const complexCalc = useStore(state => {
    // ❌ 每次都会重新计算，且每次引用不同
    return state.gameState?.seats?.map(...);
});

// 改为：
const complexCalc = useMemo(() => {
    return seats?.map(...);
}, [seats]);
*/
