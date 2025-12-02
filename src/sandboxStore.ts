import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameState, GamePhase } from './types';
import { SCRIPTS } from './constants';
import {
    addSystemMessage,
    applyRoleToSeat,
    toggleSeatDead,
    handlePhaseChange,
    createVotingState,
    createReminder,
    generateRoleAssignment
} from './lib/gameLogic';

/**
 * 沙盒模式 Store
 * 用于离线单人练习，不连接 Supabase
 * 说书人可以模拟操作魔典、分配角色、结算夜间行动
 */

const getInitialSandboxState = (seatCount: number, scriptId = 'tb'): GameState => ({
    roomId: 'SANDBOX',
    currentScriptId: scriptId,
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: true,
    vibrationEnabled: false,
    seats: Array.from({ length: seatCount }, (_, i) => ({
        id: i,
        userId: `sandbox_player_${i}`,
        userName: `玩家 ${String(i + 1)}`,
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
        isVirtual: true, // 所有玩家都是虚拟的
    })),
    messages: [{
        id: 'sandbox_welcome',
        senderId: 'system',
        senderName: '系统',
        recipientId: null,
        content: '🎮 欢迎进入沙盒模式！你可以自由练习说书人操作，无需联网。',
        timestamp: Date.now(),
        type: 'system'
    }],
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
    nightActionRequests: [],
    swapRequests: [],
    candlelightEnabled: false,
    dailyNominations: [],
    interactionLog: []
});

interface SandboxState {
    isActive: boolean;
    gameState: GameState | null;

    // 初始化沙盒
    startSandbox: (seatCount: number, scriptId?: string) => void;
    exitSandbox: () => void;

    // 游戏操作
    setPhase: (phase: GamePhase) => void;
    setScript: (scriptId: string) => void;
    assignRole: (seatId: number, roleId: string | null) => void;
    toggleDead: (seatId: number) => void;
    toggleAbilityUsed: (seatId: number) => void;
    addReminder: (seatId: number, text: string, icon?: string, color?: string) => void;
    removeReminder: (id: string) => void;

    // 夜间行动
    nightNext: () => void;
    nightPrev: () => void;

    // 投票
    startVote: (nomineeId: number) => void;
    closeVote: () => void;

    // 座位管理
    addSeat: () => void;
    removeSeat: () => void;

    // 角色分配
    assignRoles: () => void;

    // 重置
    resetGame: () => void;
}

export const useSandboxStore = create<SandboxState>()(
    immer((set) => ({
        isActive: false,
        gameState: null,

        startSandbox: (seatCount, scriptId = 'tb') => {
            set({
                isActive: true,
                gameState: getInitialSandboxState(seatCount, scriptId)
            });
        },

        exitSandbox: () => {
            set({
                isActive: false,
                gameState: null
            });
        },

        setPhase: (phase) => {
            set((state) => {
                if (!state.gameState) return;
                const prevPhase = state.gameState.phase;
                state.gameState.phase = phase;
                handlePhaseChange(state.gameState, phase, prevPhase);
            });
        },

        setScript: (scriptId) => {
            set((state) => {
                if (!state.gameState) return;
                const script = SCRIPTS[scriptId];
                if (!script) return;
                state.gameState.currentScriptId = scriptId;
                addSystemMessage(state.gameState, `剧本已切换为: ${script.name}`);
            });
        },

        assignRole: (seatId, roleId) => {
            set((state) => {
                if (!state.gameState) return;
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    applyRoleToSeat(seat, roleId);
                }
            });
        },

        toggleDead: (seatId) => {
            set((state) => {
                if (!state.gameState) return;
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    const message = toggleSeatDead(seat);
                    addSystemMessage(state.gameState, message);
                }
            });
        },

        toggleAbilityUsed: (seatId) => {
            set((state) => {
                if (!state.gameState) return;
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.hasUsedAbility = !seat.hasUsedAbility;
                }
            });
        },

        addReminder: (seatId, text, icon, color) => {
            set((state) => {
                if (!state.gameState) return;
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.reminders.push(createReminder(seatId, text, 'ST', icon, color));
                }
            });
        },

        removeReminder: (id) => {
            set((state) => {
                if (!state.gameState) return;
                state.gameState.seats.forEach(seat => {
                    seat.reminders = seat.reminders.filter(r => r.id !== id);
                });
            });
        },

        nightNext: () => {
            set((state) => {
                if (!state.gameState) return;
                if (state.gameState.nightCurrentIndex < state.gameState.nightQueue.length - 1) {
                    state.gameState.nightCurrentIndex++;
                } else {
                    // 夜晚结束
                    const prevPhase = state.gameState.phase;
                    state.gameState.phase = 'DAY';
                    handlePhaseChange(state.gameState, 'DAY', prevPhase);
                }
            });
        },

        nightPrev: () => {
            set((state) => {
                if (!state.gameState) return;
                if (state.gameState.nightCurrentIndex > 0) {
                    state.gameState.nightCurrentIndex--;
                }
            });
        },

        startVote: (nomineeId) => {
            set((state) => {
                if (!state.gameState) return;
                const nominee = state.gameState.seats.find(s => s.id === nomineeId);
                if (!nominee) return;
                state.gameState.voting = createVotingState(nomineeId);
                addSystemMessage(state.gameState, `开始对 ${nominee.userName} 进行投票。`);
            });
        },

        closeVote: () => {
            set((state) => {
                if (!state.gameState) return;
                state.gameState.voting = null;
                addSystemMessage(state.gameState, '投票已结束。');
            });
        },

        addSeat: () => {
            set((state) => {
                if (!state.gameState || state.gameState.seats.length >= 20) return;
                const newId = state.gameState.seats.length;
                state.gameState.seats.push({
                    id: newId,
                    userId: `sandbox_player_${newId}`,
                    userName: `玩家 ${String(newId + 1)}`,
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
                    isVirtual: true
                });
            });
        },

        removeSeat: () => {
            set((state) => {
                if (!state.gameState || state.gameState.seats.length <= 5) return;
                state.gameState.seats.pop();
            });
        },

        assignRoles: () => {
            set((state) => {
                if (!state.gameState) return;
                const seatCount = state.gameState.seats.length;
                const roles = generateRoleAssignment(state.gameState.currentScriptId, seatCount);
                if (roles.length === 0) return;
                state.gameState.seats.forEach((seat, idx) => {
                    if (idx < roles.length) {
                        applyRoleToSeat(seat, roles[idx] ?? null);
                    }
                });
                addSystemMessage(state.gameState, `已自动分配角色 (${String(seatCount)}人)`);
            });
        },

        resetGame: () => {
            set((state) => {
                if (!state.gameState) return;
                state.gameState = getInitialSandboxState(state.gameState.seats.length, state.gameState.currentScriptId);
            });
        }
    }))
);
