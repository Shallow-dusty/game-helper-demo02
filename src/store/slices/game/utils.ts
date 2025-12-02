import { GameState, Seat } from '../../../types';
import { SCRIPTS, ROLES } from '../../../constants';

export const getInitialState = (roomId: string, seatCount: number, currentScriptId = 'tb'): GameState => ({
    roomId,
    currentScriptId,
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: false,
    vibrationEnabled: false,
    seats: Array.from({ length: seatCount }, (_, i) => ({
        id: i,
        userId: null,
        userName: `座位 ${i + 1}`,
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
        isVirtual: false,
    })),
    swapRequests: [],
    messages: [],
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
    // v2.0 新增字段
    candlelightEnabled: false,
    dailyNominations: [],
    interactionLog: [],
});

export const fallbackTownsfolk = ['washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller', 'undertaker', 'monk', 'ravenkeeper'];

export const applyRoleAssignment = (gameState: GameState, seat: Seat, roleId: string | null) => {
    if (!seat) return;

    seat.realRoleId = roleId;
    seat.seenRoleId = roleId;
    seat.roleId = roleId;
    seat.hasUsedAbility = false;
    seat.statuses = [];

    if (!roleId) {
        return;
    }

    const script = SCRIPTS[gameState.currentScriptId];

    // 收集所有已分配的角色（包括真实角色和假角色），避免重复
    const usedRoles = new Set<string>();
    gameState.seats.forEach(s => {
        if (s.id === seat.id) return; // 跳过当前座位
        if (s.realRoleId) usedRoles.add(s.realRoleId);
        if (s.seenRoleId && s.seenRoleId !== s.realRoleId) usedRoles.add(s.seenRoleId);
    });

    const pickTownsfolk = (): string | null => {
        const availableTownsfolk = script?.roles
            .map(id => ROLES[id])
            .filter(r => r?.team === 'TOWNSFOLK' && r?.id && !usedRoles.has(r.id))
            .map(r => r!.id) || [];
        
        // 如果剧本中没有可用的，尝试从备用列表中选择
        const fallbackAvailable = fallbackTownsfolk.filter(id => !usedRoles.has(id));
        const pool = availableTownsfolk.length > 0 ? availableTownsfolk : fallbackAvailable;
        
        if (pool.length === 0) {
            // 极端情况：没有可用的村民，选择第一个备用
            console.warn('No available townsfolk for fake role assignment');
            return fallbackTownsfolk[0] ?? null;
        }
        
        return pool[Math.floor(Math.random() * pool.length)] ?? null;
    };

    if (roleId === 'drunk') {
        const fakeRole = pickTownsfolk();
        seat.seenRoleId = fakeRole ?? null;
        seat.roleId = fakeRole ?? null;
    }

    if (roleId === 'lunatic') {
        const demons = script?.roles
            .map(id => ROLES[id])
            .filter(r => r?.team === 'DEMON' && r?.id)
            .map(r => r!.id) || [];
        const fakeDemon = demons.length > 0 ? demons[0] : 'imp';
        seat.seenRoleId = fakeDemon ?? null;
        seat.roleId = fakeDemon ?? null;
    }

    if (roleId === 'marionette') {
        const fakeRole = pickTownsfolk();
        seat.seenRoleId = fakeRole ?? null;
        seat.roleId = fakeRole ?? null;
    }
};
