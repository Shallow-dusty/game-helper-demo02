/**
 * Test Data Factories
 * 
 * 集中管理测试数据创建，解决 Mock 数据维护痛点
 * 一处修改，处处生效
 */

import { 
    GameState, 
    Seat, 
    User, 
    ChatMessage, 
    RoleDef, 
    ScriptDefinition,
    VoteRecord,
    StorytellerNote,
    SwapRequest,
    InteractionLogEntry
} from '../src/types';

// ============================================================================
// Seat Factory
// ============================================================================

export const createMockSeat = (id: number, overrides?: Partial<Seat>): Seat => ({
    id,
    userId: null,
    userName: `座位 ${String(id + 1)}`,
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
    ...overrides,
});

/**
 * 创建已入座的玩家
 */
export const createSeatedPlayer = (
    id: number, 
    userId: string, 
    userName: string,
    overrides?: Partial<Seat>
): Seat => createMockSeat(id, {
    userId,
    userName,
    ...overrides,
});

/**
 * 创建虚拟玩家
 */
export const createVirtualPlayer = (id: number, overrides?: Partial<Seat>): Seat => 
    createMockSeat(id, {
        isVirtual: true,
        userId: `virtual-${String(id)}`,
        userName: `虚拟玩家 ${String(id + 1)}`,
        ...overrides,
    });

/**
 * 创建死亡玩家
 */
export const createDeadPlayer = (id: number, overrides?: Partial<Seat>): Seat =>
    createMockSeat(id, {
        isDead: true,
        hasGhostVote: true,
        ...overrides,
    });

// ============================================================================
// User Factory
// ============================================================================

export const createMockUser = (overrides?: Partial<User>): User => ({
    id: 'user-123',
    name: 'TestUser',
    isStoryteller: false,
    roomId: 'TEST123',
    isSeated: false,
    ...overrides,
});

/**
 * 创建说书人用户
 */
export const createStoryteller = (overrides?: Partial<User>): User => 
    createMockUser({
        isStoryteller: true,
        name: '说书人',
        ...overrides,
    });

/**
 * 创建已入座玩家用户
 */
export const createSeatedUser = (overrides?: Partial<User>): User =>
    createMockUser({
        isSeated: true,
        ...overrides,
    });

// ============================================================================
// GameState Factory
// ============================================================================

export const createMockGameState = (
    seatCount = 5, 
    overrides?: Partial<GameState>
): GameState => ({
    roomId: 'TEST123',
    currentScriptId: 'tb',
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: false,
    vibrationEnabled: false,
    seats: Array.from({ length: seatCount }, (_, i) => createMockSeat(i)),
    swapRequests: [],
    messages: [],
    gameOver: { isOver: false, winner: null, reason: '' },
    audio: { trackId: null, isPlaying: false, volume: 0.5 },
    nightQueue: [],
    nightCurrentIndex: -1,
    voting: null,
    customScripts: {},
    customRoles: {},
    voteHistory: [],
    roundInfo: { dayCount: 0, nightCount: 0, nominationCount: 0, totalRounds: 0 },
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [],
    candlelightEnabled: false,
    dailyExecutionCompleted: false,
    dailyNominations: [],
    interactionLog: [],
    ...overrides,
});

/**
 * 创建夜间阶段状态
 */
export const createNightGameState = (seatCount = 5, overrides?: Partial<GameState>): GameState =>
    createMockGameState(seatCount, {
        phase: 'NIGHT',
        roundInfo: { dayCount: 0, nightCount: 1, nominationCount: 0, totalRounds: 1 },
        candlelightEnabled: true,
        ...overrides,
    });

/**
 * 创建白天阶段状态
 */
export const createDayGameState = (seatCount = 5, overrides?: Partial<GameState>): GameState =>
    createMockGameState(seatCount, {
        phase: 'DAY',
        roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 2 },
        candlelightEnabled: false,
        ...overrides,
    });

/**
 * 创建投票阶段状态
 */
export const createVotingGameState = (
    nomineeSeatId: number,
    seatCount = 5, 
    overrides?: Partial<GameState>
): GameState =>
    createMockGameState(seatCount, {
        phase: 'VOTING',
        voting: {
            nominatorSeatId: 0,
            nomineeSeatId,
            clockHandSeatId: nomineeSeatId,
            votes: [],
            isOpen: true,
        },
        ...overrides,
    });

// ============================================================================
// Role Factory
// ============================================================================

export const createMockRole = (overrides?: Partial<RoleDef>): RoleDef => ({
    id: 'washerwoman',
    name: '洗衣妇',
    team: 'TOWNSFOLK',
    ability: '每个夜晚*，你会得知两名玩家其中之一是某一特定的村民角色。',
    firstNight: true,
    otherNight: false,
    reminders: ['村民', '错误'],
    ...overrides,
});

/**
 * 创建村民角色
 */
export const createTownsfolk = (id: string, name: string, overrides?: Partial<RoleDef>): RoleDef =>
    createMockRole({
        id,
        name,
        team: 'TOWNSFOLK',
        ...overrides,
    });

/**
 * 创建外来者角色
 */
export const createOutsider = (id: string, name: string, overrides?: Partial<RoleDef>): RoleDef =>
    createMockRole({
        id,
        name,
        team: 'OUTSIDER',
        ...overrides,
    });

/**
 * 创建爪牙角色
 */
export const createMinion = (id: string, name: string, overrides?: Partial<RoleDef>): RoleDef =>
    createMockRole({
        id,
        name,
        team: 'MINION',
        ...overrides,
    });

/**
 * 创建恶魔角色
 */
export const createDemon = (id: string, name: string, overrides?: Partial<RoleDef>): RoleDef =>
    createMockRole({
        id,
        name,
        team: 'DEMON',
        ...overrides,
    });

// ============================================================================
// Message Factory
// ============================================================================

export const createMockMessage = (overrides?: Partial<ChatMessage>): ChatMessage => ({
    id: `msg-${String(Date.now())}-${Math.random().toString(36).slice(2, 9)}`,
    senderId: 'user-123',
    senderName: 'TestUser',
    recipientId: null,
    content: 'Test message',
    timestamp: Date.now(),
    type: 'chat',
    isPrivate: false,
    ...overrides,
});

/**
 * 创建系统消息
 */
export const createSystemMessage = (content: string, overrides?: Partial<ChatMessage>): ChatMessage =>
    createMockMessage({
        senderId: 'system',
        senderName: 'System',
        content,
        type: 'system',
        ...overrides,
    });

/**
 * 创建私聊消息
 */
export const createPrivateMessage = (
    recipientId: string,
    content: string,
    overrides?: Partial<ChatMessage>
): ChatMessage =>
    createMockMessage({
        recipientId,
        content,
        isPrivate: true,
        ...overrides,
    });

// ============================================================================
// Vote Factory
// ============================================================================

export const createMockVoteRecord = (overrides?: Partial<VoteRecord>): VoteRecord => ({
    round: 1,
    nominatorSeatId: 0,
    nomineeSeatId: 1,
    votes: [0, 2],  // 投票者的座位 ID 列表
    voteCount: 2,
    result: 'survived',
    timestamp: Date.now(),
    ...overrides,
});

// ============================================================================
// Script Factory
// ============================================================================

export const createMockScript = (overrides?: Partial<ScriptDefinition>): ScriptDefinition => ({
    id: 'test-script',
    name: '测试剧本',
    roles: ['washerwoman', 'librarian', 'investigator', 'chef', 'empath'],
    ...overrides,
});

// ============================================================================
// Note Factory
// ============================================================================

export const createMockNote = (overrides?: Partial<StorytellerNote>): StorytellerNote => ({
    id: `note-${String(Date.now())}`,
    content: 'Test note content',
    timestamp: Date.now(),
    type: 'manual',
    ...overrides,
});

// ============================================================================
// Swap Request Factory
// ============================================================================

export const createMockSwapRequest = (overrides?: Partial<SwapRequest>): SwapRequest => ({
    id: `swap-${String(Date.now())}`,
    fromSeatId: 0,
    fromUserId: 'user-123',
    fromName: 'Player1',
    toSeatId: 1,
    toUserId: 'user-456',
    timestamp: Date.now(),
    ...overrides,
});

// ============================================================================
// Interaction Log Factory
// ============================================================================

export const createMockInteractionLog = (
    overrides?: Partial<InteractionLogEntry>
): InteractionLogEntry => ({
    id: `log-${String(Date.now())}`,
    timestamp: Date.now(),
    type: 'ability_used',
    actorSeatId: 0,
    targetSeatIds: [1],
    roleId: 'washerwoman',
    description: 'Test interaction',
    isConfirmed: false,
    ...overrides,
});

// ============================================================================
// Composite Factories (复合工厂)
// ============================================================================

/**
 * 创建一个完整的游戏场景：5人局，所有人入座
 */
export const createFullGameScenario = (): {
    gameState: GameState;
    users: User[];
    storyteller: User;
} => {
    const users = Array.from({ length: 5 }, (_, i) => 
        createMockUser({
            id: `user-${String(i)}`,
            name: `玩家${String(i + 1)}`,
            isSeated: true,
        })
    );

    const storyteller = createStoryteller({ id: 'st-1' });

    const gameState = createMockGameState(5, {
        seats: users.map((user, i) => 
            createSeatedPlayer(i, user.id, user.name)
        ),
    });

    return { gameState, users, storyteller };
};

/**
 * 创建夜间行动场景
 */
export const createNightActionScenario = (roleId: string): {
    gameState: GameState;
    user: User;
    seat: Seat;
} => {
    const user = createSeatedUser({ id: 'acting-user' });
    const seat = createSeatedPlayer(0, user.id, user.name, {
        roleId,
        realRoleId: roleId,
    });
    const gameState = createNightGameState(5, {
        seats: [seat, ...Array.from({ length: 4 }, (_, i) => createMockSeat(i + 1))],
        nightQueue: [roleId],
        nightCurrentIndex: 0,
    });

    return { gameState, user, seat };
};
