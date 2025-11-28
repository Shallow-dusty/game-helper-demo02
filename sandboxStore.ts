import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameState, GamePhase } from './types';
import { NIGHT_ORDER_FIRST, NIGHT_ORDER_OTHER, ROLES, PHASE_LABELS, SCRIPTS } from './constants';

/**
 * 沙盒模式 Store
 * 用于离线单人练习，不连接 Supabase
 * 说书人可以模拟操作魔典、分配角色、结算夜间行动
 */

const getInitialSandboxState = (seatCount: number, scriptId: string = 'tb'): GameState => ({
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
        userName: `玩家 ${i + 1}`,
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
    nightActionRequests: []
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

const addSystemMessage = (gameState: GameState, content: string) => {
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

export const useSandboxStore = create<SandboxState>()(
    immer((set, get) => ({
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
            const { gameState } = get();
            if (!gameState) return;
            
            const prevPhase = gameState.phase;
            gameState.phase = phase;
            
            if (prevPhase !== phase) {
                addSystemMessage(gameState, `阶段变更为: ${PHASE_LABELS[phase]}`);
                
                if (phase === 'NIGHT') {
                    gameState.roundInfo.nightCount++;
                    gameState.roundInfo.totalRounds++;
                    
                    // 构建夜间队列
                    const isFirstNight = !gameState.seats.some(s => s.isDead);
                    const availableRoles = gameState.seats
                        .filter(s => s.roleId && !s.isDead)
                        .map(s => s.roleId!);
                    
                    const order = isFirstNight ? NIGHT_ORDER_FIRST : NIGHT_ORDER_OTHER;
                    gameState.nightQueue = order.filter(role => {
                        const hasRole = availableRoles.includes(role);
                        const def = ROLES[role];
                        if (!def) return false;
                        return hasRole || def.team === 'MINION' || def.team === 'DEMON';
                    });
                    gameState.nightCurrentIndex = 0;
                } else if (phase === 'DAY') {
                    gameState.roundInfo.dayCount++;
                }
            }
            
            set({ gameState: { ...gameState } });
        },
        
        setScript: (scriptId) => {
            const { gameState } = get();
            if (!gameState) return;
            
            const script = SCRIPTS[scriptId];
            if (!script) return;
            
            gameState.currentScriptId = scriptId;
            addSystemMessage(gameState, `剧本已切换为: ${script.name}`);
            set({ gameState: { ...gameState } });
        },
        
        assignRole: (seatId, roleId) => {
            const { gameState } = get();
            if (!gameState) return;
            
            const seat = gameState.seats.find(s => s.id === seatId);
            if (seat) {
                seat.roleId = roleId;
                seat.realRoleId = roleId;
                seat.seenRoleId = roleId;
                seat.hasUsedAbility = false;
                seat.statuses = [];
            }
            set({ gameState: { ...gameState } });
        },
        
        toggleDead: (seatId) => {
            const { gameState } = get();
            if (!gameState) return;
            
            const seat = gameState.seats.find(s => s.id === seatId);
            if (seat) {
                seat.isDead = !seat.isDead;
                if (seat.isDead) {
                    seat.hasGhostVote = true;
                    addSystemMessage(gameState, `${seat.userName} 死亡了。`);
                } else {
                    addSystemMessage(gameState, `${seat.userName} 复活了。`);
                }
            }
            set({ gameState: { ...gameState } });
        },
        
        toggleAbilityUsed: (seatId) => {
            const { gameState } = get();
            if (!gameState) return;
            
            const seat = gameState.seats.find(s => s.id === seatId);
            if (seat) {
                seat.hasUsedAbility = !seat.hasUsedAbility;
            }
            set({ gameState: { ...gameState } });
        },
        
        addReminder: (seatId, text, icon, color) => {
            const { gameState } = get();
            if (!gameState) return;
            
            const seat = gameState.seats.find(s => s.id === seatId);
            if (seat) {
                seat.reminders.push({
                    id: Math.random().toString(36),
                    text,
                    sourceRole: 'ST',
                    seatId,
                    icon,
                    color
                });
            }
            set({ gameState: { ...gameState } });
        },
        
        removeReminder: (id) => {
            const { gameState } = get();
            if (!gameState) return;
            
            gameState.seats.forEach(seat => {
                seat.reminders = seat.reminders.filter(r => r.id !== id);
            });
            set({ gameState: { ...gameState } });
        },
        
        nightNext: () => {
            const { gameState } = get();
            if (!gameState) return;
            
            if (gameState.nightCurrentIndex < gameState.nightQueue.length - 1) {
                gameState.nightCurrentIndex++;
            } else {
                // 夜晚结束
                get().setPhase('DAY');
            }
            set({ gameState: { ...gameState } });
        },
        
        nightPrev: () => {
            const { gameState } = get();
            if (!gameState) return;
            
            if (gameState.nightCurrentIndex > 0) {
                gameState.nightCurrentIndex--;
            }
            set({ gameState: { ...gameState } });
        },
        
        startVote: (nomineeId) => {
            const { gameState } = get();
            if (!gameState) return;
            
            const nominee = gameState.seats.find(s => s.id === nomineeId);
            if (!nominee) return;
            
            gameState.voting = {
                nominatorSeatId: null,
                nomineeSeatId: nomineeId,
                clockHandSeatId: null,
                votes: [],
                isOpen: true
            };
            
            addSystemMessage(gameState, `开始对 ${nominee.userName} 进行投票。`);
            set({ gameState: { ...gameState } });
        },
        
        closeVote: () => {
            const { gameState } = get();
            if (!gameState) return;
            
            gameState.voting = null;
            addSystemMessage(gameState, '投票已结束。');
            set({ gameState: { ...gameState } });
        },
        
        addSeat: () => {
            const { gameState } = get();
            if (!gameState || gameState.seats.length >= 20) return;
            
            const newId = gameState.seats.length;
            gameState.seats.push({
                id: newId,
                userId: `sandbox_player_${newId}`,
                userName: `玩家 ${newId + 1}`,
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
            
            set({ gameState: { ...gameState } });
        },
        
        removeSeat: () => {
            const { gameState } = get();
            if (!gameState || gameState.seats.length <= 5) return;
            
            gameState.seats.pop();
            set({ gameState: { ...gameState } });
        },
        
        assignRoles: () => {
            const { gameState } = get();
            if (!gameState) return;
            
            const script = SCRIPTS[gameState.currentScriptId];
            if (!script) return;
            
            const seatCount = gameState.seats.length;
            const composition = getComposition(seatCount);
            
            if (!composition) return;
            
            const availableRoles = script.roles.map(id => ROLES[id]).filter(Boolean);
            const townsfolk = availableRoles.filter(r => r?.team === 'TOWNSFOLK');
            const outsiders = availableRoles.filter(r => r?.team === 'OUTSIDER');
            const minions = availableRoles.filter(r => r?.team === 'MINION');
            const demons = availableRoles.filter(r => r?.team === 'DEMON');
            
            const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
            
            const selectedRoles: string[] = [];
            selectedRoles.push(...shuffle(townsfolk).slice(0, composition.townsfolk).map(r => r?.id).filter((id): id is string => !!id));
            selectedRoles.push(...shuffle(outsiders).slice(0, composition.outsider).map(r => r?.id).filter((id): id is string => !!id));
            selectedRoles.push(...shuffle(minions).slice(0, composition.minion).map(r => r?.id).filter((id): id is string => !!id));
            selectedRoles.push(...shuffle(demons).slice(0, composition.demon).map(r => r?.id).filter((id): id is string => !!id));
            
            const shuffledRoles = shuffle(selectedRoles);
            
            gameState.seats.forEach((seat, idx) => {
                if (idx < shuffledRoles.length) {
                    seat.roleId = shuffledRoles[idx] ?? null;
                    seat.realRoleId = shuffledRoles[idx] ?? null;
                    seat.seenRoleId = shuffledRoles[idx] ?? null;
                }
            });
            
            addSystemMessage(gameState, `已自动分配角色 (${seatCount}人)`);
            set({ gameState: { ...gameState } });
        },
        
        resetGame: () => {
            const { gameState } = get();
            if (!gameState) return;
            
            const seatCount = gameState.seats.length;
            const scriptId = gameState.currentScriptId;
            
            set({
                gameState: getInitialSandboxState(seatCount, scriptId)
            });
        }
    }))
);

// Helper: TB composition rules
function getComposition(players: number) {
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
    return rules[players];
}
