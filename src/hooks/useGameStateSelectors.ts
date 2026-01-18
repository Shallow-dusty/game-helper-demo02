/**
 * Zustand 选择器优化工具
 *
 * 使用细粒度选择器减少不必要的重新渲染
 * 示例：const votingState = useStore(state => state.voting)
 * 而非：const gameState = useStore(state => state.gameState)
 */

import { useStore } from '../store';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

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
// 基础选择器 - 单一属性访问（最高效）
// ============================================================

/** 仅选择座位列表 */
export const useSeats = () =>
    useStore(state => state.gameState?.seats);

/** 仅选择当前阶段 */
export const usePhase = () =>
    useStore(state => state.gameState?.phase);

/** 仅选择投票状态 */
export const useVoting = () =>
    useStore(state => state.gameState?.voting);

/** 仅选择夜间队列 */
export const useNightQueue = () =>
    useStore(state => state.gameState?.nightQueue);

/** 仅选择夜间当前索引 */
export const useNightCurrentIndex = () =>
    useStore(state => state.gameState?.nightCurrentIndex);

/** 仅选择当前剧本 ID */
export const useCurrentScriptId = () =>
    useStore(state => state.gameState?.currentScriptId);

/** 仅选择设置阶段 */
export const useSetupPhase = () =>
    useStore(state => state.gameState?.setupPhase);

/** 仅选择角色是否已揭示 */
export const useRolesRevealed = () =>
    useStore(state => state.gameState?.rolesRevealed);

/** 仅选择烛光模式 */
export const useCandlelightEnabled = () =>
    useStore(state => state.gameState?.candlelightEnabled);

/** 仅选择消息列表 */
export const useMessages = () =>
    useStore(state => state.gameState?.messages);

/** 仅选择房间 ID */
export const useRoomId = () =>
    useStore(state => state.gameState?.roomId);

/** 仅选择游戏结束状态 */
export const useGameOver = () =>
    useStore(state => state.gameState?.gameOver);

/** 仅选择用户信息 */
export const useUser = () =>
    useStore(state => state.user);

/** 仅选择连接状态 */
export const useConnectionStatus = () =>
    useStore(state => state.connectionStatus);

/** 仅选择是否离线 */
export const useIsOffline = () =>
    useStore(state => state.isOffline);

// ============================================================
// 组合选择器 - 使用 shallow 比较优化
// ============================================================

/** 选择游戏状态中的投票信息 */
export const useVotingState = () =>
    useStore(
        useShallow(state => ({
            voting: state.gameState?.voting,
            phase: state.gameState?.phase,
        }))
    );

/** 选择夜间行动相关信息 */
export const useNightActionState = () =>
    useStore(
        useShallow(state => ({
            phase: state.gameState?.phase,
            nightQueue: state.gameState?.nightQueue,
            nightCurrentIndex: state.gameState?.nightCurrentIndex,
            nightActionRequests: state.gameState?.nightActionRequests,
        }))
    );

/** 仅选择座位列表 - 兼容旧 API */
export const useSeatList = () =>
    useStore(state => state.gameState?.seats);

/** 选择游戏消息 - 兼容旧 API */
export const useGameMessages = () =>
    useStore(state => state.gameState?.messages);

/** 选择房间基本信息 */
export const useRoomInfo = () =>
    useStore(
        useShallow(state => ({
            roomId: state.gameState?.roomId,
            phase: state.gameState?.phase,
            currentScriptId: state.gameState?.currentScriptId,
        }))
    );

/** 选择玩家信息 */
export const usePlayerInfo = () =>
    useStore(
        useShallow(state => ({
            user: state.user,
            isStoryteller: state.user?.isStoryteller,
            isSeated: state.user?.isSeated,
        }))
    );

/** 选择连接状态信息 */
export const useConnectionState = () =>
    useStore(
        useShallow(state => ({
            connectionStatus: state.connectionStatus,
            isOffline: state.isOffline,
        }))
    );

/** Grimoire 组件专用选择器 */
export const useGrimoireState = () =>
    useStore(
        useShallow(state => ({
            seats: state.gameState?.seats,
            phase: state.gameState?.phase,
            voting: state.gameState?.voting,
            setupPhase: state.gameState?.setupPhase,
            rolesRevealed: state.gameState?.rolesRevealed,
            candlelightEnabled: state.gameState?.candlelightEnabled,
            currentScriptId: state.gameState?.currentScriptId,
        }))
    );

/** App 组件专用选择器 */
export const useAppState = () =>
    useStore(
        useShallow(state => ({
            user: state.user,
            gameState: state.gameState ? {
                roomId: state.gameState.roomId,
                phase: state.gameState.phase,
            } : null,
            isAudioBlocked: state.isAudioBlocked,
            roleReferenceMode: state.roleReferenceMode,
            isRolePanelOpen: state.isRolePanelOpen,
            isSidebarExpanded: state.isSidebarExpanded,
            isTruthRevealOpen: state.isTruthRevealOpen,
            isReportOpen: state.isReportOpen,
        }))
    );

// ============================================================
// 派生选择器 - 带 useMemo 优化
// ============================================================

/** 选择当前玩家的座位 */
export const useCurrentSeat = () => {
    const user = useStore(state => state.user);
    const seats = useStore(state => state.gameState?.seats);

    return useMemo(() => {
        return seats?.find(s => s.userId === user?.id);
    }, [seats, user?.id]);
};

/** 选择游戏结束信息 */
export const useGameOverState = () => {
    const gameOver = useStore(state => state.gameState?.gameOver);

    return useMemo(() => ({
        gameOver,
        winner: gameOver?.winner,
        reason: gameOver?.reason,
    }), [gameOver]);
};

/** 选择投票统计信息 */
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
    const phase = useStore(state => state.gameState?.phase);
    const nightQueue = useStore(state => state.gameState?.nightQueue);
    const nightCurrentIndex = useStore(state => state.gameState?.nightCurrentIndex);

    return useMemo(() => {
        if (phase !== 'NIGHT') return null;
        return nightQueue?.[nightCurrentIndex ?? 0] ?? null;
    }, [phase, nightQueue, nightCurrentIndex]);
};

/** 选择当前用户可以执行的操作 */
export const useAvailableActions = () => {
    const user = useStore(state => state.user);
    const currentSeat = useCurrentSeat();
    const currentNightRole = useCurrentNightRole();
    const phase = useStore(state => state.gameState?.phase);
    const votingIsOpen = useStore(state => state.gameState?.voting?.isOpen);

    return useMemo(() => {
        if (!user || !currentSeat) return [];

        const actions: string[] = [];

        // 说书人操作
        if (user.isStoryteller) {
            actions.push('advance_phase');
            actions.push('update_reminders');
        }

        // 投票阶段
        if (phase === 'DAY' && votingIsOpen) {
            actions.push('raise_hand');
        }

        // 夜间行动
        if (currentNightRole === currentSeat.seenRoleId && phase === 'NIGHT') {
            actions.push('night_action');
        }

        return actions;
    }, [user, currentSeat, currentNightRole, phase, votingIsOpen]);
};

/** 选择存活玩家数量 */
export const useAlivePlayersCount = () => {
    const seats = useStore(state => state.gameState?.seats);

    return useMemo(() => {
        return seats?.filter(s => !s.isDead).length ?? 0;
    }, [seats]);
};

/** 选择死亡玩家列表 */
export const useDeadPlayers = () => {
    const seats = useStore(state => state.gameState?.seats);

    return useMemo(() => {
        return seats?.filter(s => s.isDead) ?? [];
    }, [seats]);
};

// ============================================================
// Store Actions 选择器（稳定引用）
// ============================================================

/** 选择所有游戏动作 */
export const useGameActions = () =>
    useStore(
        useShallow(state => ({
            joinSeat: state.joinSeat,
            leaveSeat: state.leaveSeat,
            toggleDead: state.toggleDead,
            toggleAbilityUsed: state.toggleAbilityUsed,
            toggleStatus: state.toggleStatus,
            startVote: state.startVote,
            assignRole: state.assignRole,
            addReminder: state.addReminder,
            removeReminder: state.removeReminder,
            forceLeaveSeat: state.forceLeaveSeat,
            removeVirtualPlayer: state.removeVirtualPlayer,
            swapSeats: state.swapSeats,
            requestSeatSwap: state.requestSeatSwap,
            setPhase: state.setPhase,
            nightNext: state.nightNext,
            nightPrev: state.nightPrev,
            closeVote: state.closeVote,
            nextClockHand: state.nextClockHand,
            toggleHand: state.toggleHand,
        }))
    );

/** 选择 UI 动作 */
export const useUIActions = () =>
    useStore(
        useShallow(state => ({
            toggleAudioPlay: state.toggleAudioPlay,
            openRolePanel: state.openRolePanel,
            closeRolePanel: state.closeRolePanel,
            toggleSidebar: state.toggleSidebar,
            closeTruthReveal: state.closeTruthReveal,
            closeReport: state.closeReport,
        }))
    );

// ============================================================
// 最佳实践文档
// ============================================================

/*
✅ 推荐做法：

// 使用单一属性选择器（最高效）
const seats = useSeats();
const phase = usePhase();

// 使用组合选择器
const { seats, phase, voting } = useGrimoireState();

// 使用派生选择器
const stats = useVotingStats();
const currentSeat = useCurrentSeat();

// 使用 action 选择器
const { toggleDead, assignRole } = useGameActions();


❌ 不推荐做法：

// 订阅整个 gameState - 任何变化都会重渲染
const gameState = useStore(state => state.gameState);

// 在选择器中创建新对象 - 每次都是新引用
const bad = useStore(state => ({
    seats: state.gameState?.seats,
    phase: state.gameState?.phase,
}));
// 改为使用 useShallow 比较：
const good = useStore(
    useShallow(state => ({
        seats: state.gameState?.seats,
        phase: state.gameState?.phase,
    }))
);
*/
