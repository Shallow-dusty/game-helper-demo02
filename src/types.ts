
export interface User {
  id: string;
  name: string;
  isStoryteller: boolean;
  roomId: string | null;
  isSeated: boolean;
  isObserver?: boolean;
}

export type GamePhase = 'SETUP' | 'NIGHT' | 'DAY' | 'NOMINATION' | 'VOTING';

export type Team = 'TOWNSFOLK' | 'OUTSIDER' | 'MINION' | 'DEMON' | 'TRAVELER' | 'FABLED';

export interface NightActionDef {
  type: 'choose_player' | 'choose_two_players' | 'binary' | 'confirm' | 'choose_role';
  prompt: string;
  options?: string[]; // For binary choices
}

export type InfoCardType = 'role_info' | 'ability' | 'hint' | 'custom';

export interface InfoCard {
  type: InfoCardType;
  title: string;
  icon?: string;
  color?: string; // Tailwind color class prefix (e.g., 'blue', 'purple', 'red')
  content: string;
}

export interface VoteRecord {
  round: number;          // 投票轮次
  nominatorSeatId: number;
  nomineeSeatId: number;
  votes: number[];        // 投票者的座位ID列表
  voteCount: number;      // 投票数
  timestamp: number;
  result: 'executed' | 'survived' | 'cancelled' | 'on_the_block' | 'tied';
}

// 夜间行动请求载荷类型
export interface NightActionPayload {
  seatId?: number;           // 单选玩家目标 (choose_player)
  seatIds?: number[];        // 多选玩家目标 (choose_two_players)
  choice?: number;           // 二选一选项索引 (binary)
  confirmed?: boolean;       // 确认类操作 (confirm)
  roleId?: string;           // 选择角色目标 (choose_role)
  customData?: string;       // 自定义数据
}

// 夜间行动请求（玩家提交给ST）
export interface NightActionRequest {
  id: string;
  seatId: number;
  roleId: string;
  payload: NightActionPayload;
  status: 'pending' | 'resolved';
  result?: string; // ST回复的结果信息
  timestamp: number;
}

export interface RoleDef {
  id: string;
  name: string;
  team: Team;
  ability: string;
  detailedDescription?: string; // 详细描述（包含官方完整说明+额外补充）
  firstNight?: boolean;
  otherNight?: boolean;
  icon?: string; // Visual indicator for the role (emoji)
  reminders?: string[]; // Default reminders for this role
  nightAction?: NightActionDef; // Interactive night action configuration
}

export interface ScriptDefinition {
  id: string;
  name: string;
  author?: string;
  description?: string;
  roles: string[]; // Role IDs
  meta?: Record<string, unknown>; // Extra metadata
  isCustom?: boolean;
}

export interface Reminder {
  id: string;
  text: string;
  sourceRole: string;
  seatId: number;
  icon?: string; // New: Emoji or icon name
  color?: string; // New: Tailwind color class
}

export type SeatStatus = 'POISONED' | 'DRUNK' | 'PROTECTED' | 'MADNESS';

export interface RoundInfo {
  dayCount: number;
  nightCount: number;
  nominationCount: number;
  totalRounds: number;
}

export interface StorytellerNote {
  id: string;
  content: string;
  timestamp: number;
  type: 'manual' | 'auto'; // 笔记类型

  // v2 新增特性
  isCollapsed?: boolean;   // 是否折叠
  color?: string;          // 标记颜色 (Tailwind class or hex)
  isFloating?: boolean;    // 是否为悬浮状态
  position?: { x: number; y: number }; // 悬浮位置
  size?: { width: number; height: number }; // 悬浮尺寸
}

export interface Seat {
  id: number;
  userId: string | null;
  userName: string;
  isDead: boolean;
  hasGhostVote: boolean;

  // 角色身份系统：支持"表里"角色机制
  /**
   * @deprecated 请使用 seenRoleId 代替。此字段仅用于向后兼容。
   * 在 filterSeatForUser 中会自动将 seenRoleId 映射到此字段。
   * 计划在 v0.8.0 移除。
   */
  roleId: string | null;
  realRoleId: string | null; // 真实身份（ST 可见，用于游戏逻辑判定）
  seenRoleId: string | null; // 展示身份（玩家看到的，可能是假的）

  reminders: Reminder[];
  // Interaction states
  isHandRaised: boolean;
  isNominated: boolean;
  hasUsedAbility: boolean; // New: Tracks if "Once per game" ability is spent
  statuses: SeatStatus[]; // New: Tracks visual/logic statuses like Poisoned
  isVirtual?: boolean; // New: Virtual player for testing/filling
  voteLocked?: boolean; // 新增：时针对该座位结算后锁定投票状态
  isReady?: boolean; // 新增：准备状态
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'system' for system messages
  senderName: string;
  recipientId: string | null; // null = Public, otherwise User ID
  content: string;
  timestamp: number;
  type: 'chat' | 'system';
  role?: 'user' | 'assistant' | 'system'; // New: For AI chat context
  isPrivate?: boolean; // New: If true, only visible to recipient (or sender)
  card?: InfoCard; // Optional: Structured info card
}

export interface AudioState {
  trackId: string | null; // The ID from AUDIO_TRACKS
  isPlaying: boolean;
  volume: number; // 0.0 to 1.0
}

export interface GameOverState {
  isOver: boolean;
  winner: 'GOOD' | 'EVIL' | null;
  reason: string;
}

export type SetupPhase = 'ASSIGNING' | 'READY' | 'STARTED';

// 换座请求
export interface SwapRequest {
  id: string;
  fromSeatId: number;
  fromUserId: string;
  fromName: string;
  toSeatId: number;
  toUserId: string;
  timestamp: number;
}

// 交互日志条目（用于战报生成）
export interface InteractionLogEntry {
  id: string;
  timestamp: number;
  type: 'info_given' | 'ability_used' | 'death' | 'vote' | 'nomination' | 'phase_change' | 'chain_reaction';
  actorSeatId?: number;
  targetSeatIds?: number[];
  roleId?: string;
  description: string;
  isConfirmed: boolean; // ST 是否确认过
  metadata?: Record<string, unknown>;
}

export type RuleAutomationLevel = 'FULL_AUTO' | 'GUIDED' | 'MANUAL';

// 每日提名记录
export interface DailyNomination {
  nominatorSeatId: number;
  nomineeSeatId: number;
  round: number;
  timestamp: number;
}

export interface VotingState {
  nominatorSeatId: number | null;
  nomineeSeatId: number | null;
  clockHandSeatId: number | null; // The seat the ST is currently pointing at
  votes: number[]; // SeatIDs of those who voted
  isOpen: boolean;
}

export interface GameState {
  roomId: string;
  currentScriptId: string; // 'tb', 'bmr', 'sv'
  phase: GamePhase;
  setupPhase: SetupPhase; // NEW: Track setup progress
  rolesRevealed: boolean; // NEW: Whether roles have been revealed to players
  allowWhispers: boolean; // New: Controls if players can whisper
  vibrationEnabled: boolean; // 是否启用夜间唤醒震动（线下游戏应关闭）
  seats: Seat[];
  messages: ChatMessage[];
  gameOver: GameOverState;

  // Audio State (New)
  audio: AudioState;

  // Clock / Night Order
  nightQueue: string[]; // Array of RoleIDs
  nightCurrentIndex: number; // -1 if not started

  // Voting State
  voting: VotingState | null;

  customScripts: Record<string, ScriptDefinition>; // New: Store uploaded scripts
  customRoles: Record<string, RoleDef>; // New: Store custom roles from scripts
  voteHistory: VoteRecord[]; // Track voting history

  // New Features
  roundInfo: RoundInfo;
  storytellerNotes: StorytellerNote[];
  skillDescriptionMode: 'simple' | 'detailed';
  aiMessages: ChatMessage[];

  // 夜间行动请求队列
  nightActionRequests: NightActionRequest[];

  // 换座请求队列
  swapRequests: SwapRequest[];

  // 语音房间链接（可选）
  voiceRoomUrl?: string;

  // === v2.0 新增字段 ===
  
  // 烛光守夜模式
  candlelightEnabled: boolean;
  
  // 每日提名记录（用于规则约束）
  dailyNominations: DailyNomination[];

  // 每日处决完成标记（一天只能处决一人）
  dailyExecutionCompleted: boolean;

  // 规则自动化级别（可选，默认 GUIDED）
  ruleAutomationLevel?: RuleAutomationLevel;

  // 交互日志（用于战报生成）
  interactionLog: InteractionLogEntry[];
}

export interface GameHistory {
  id: number;
  room_code: string;
  winner: 'GOOD' | 'EVIL' | null;
  reason: string;
  script_name: string;
  created_at: string;
  players: {
    name: string;
    role: string | null;
    team: Team | null;
    isDead: boolean;
  }[];
  messages: ChatMessage[];
  state: GameState;
}
