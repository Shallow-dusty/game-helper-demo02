
export type GamePhase = 'SETUP' | 'NIGHT' | 'DAY' | 'NOMINATION' | 'VOTING';

export type Team = 'TOWNSFOLK' | 'OUTSIDER' | 'MINION' | 'DEMON' | 'TRAVELER';

export type NightActionDef = {
  type: 'choose_player' | 'choose_two_players' | 'binary' | 'confirm';
  prompt: string;
  options?: string[]; // For binary choices
};

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
  result: 'executed' | 'survived' | 'cancelled';
}

export interface RoleDef {
  id: string;
  name: string;
  team: Team;
  ability: string;
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
  roles: string[]; // Role IDs
  meta?: any; // Extra metadata
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
}

export interface Seat {
  id: number;
  userId: string | null;
  userName: string;
  isDead: boolean;
  hasGhostVote: boolean;
  roleId: string | null; // Null if not assigned
  reminders: Reminder[];
  // Interaction states
  isHandRaised: boolean;
  isNominated: boolean;
  hasUsedAbility: boolean; // New: Tracks if "Once per game" ability is spent
  statuses: SeatStatus[]; // New: Tracks visual/logic statuses like Poisoned
  isVirtual?: boolean; // New: Virtual player for testing/filling
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

export interface GameState {
  roomId: string;
  currentScriptId: string; // 'tb', 'bmr', 'sv'
  phase: GamePhase;
  setupPhase: SetupPhase; // NEW: Track setup progress
  rolesRevealed: boolean; // NEW: Whether roles have been revealed to players
  allowWhispers: boolean; // New: Controls if players can whisper
  seats: Seat[];
  messages: ChatMessage[];
  gameOver: GameOverState;

  // Audio State (New)
  audio: AudioState;

  // Clock / Night Order
  nightQueue: string[]; // Array of RoleIDs
  nightCurrentIndex: number; // -1 if not started

  // Voting State
  voting: {
    nominatorSeatId: number | null;
    nomineeSeatId: number | null;
    clockHandSeatId: number | null; // The seat the ST is currently pointing at
    votes: number[]; // SeatIDs of those who voted
    isOpen: boolean;
  } | null;

  customScripts: Record<string, ScriptDefinition>; // New: Store uploaded scripts
  customRoles: Record<string, RoleDef>; // New: Store custom roles from scripts
  voteHistory: VoteRecord[]; // Track voting history

  // New Features
  roundInfo: RoundInfo;
  storytellerNotes: StorytellerNote[];
  skillDescriptionMode: 'simple' | 'detailed';
  aiMessages: ChatMessage[];
}

export interface User {
  id: string;
  name: string;
  isStoryteller: boolean;
  roomId: string | null;
  isSeated?: boolean; // New: Track if user has taken a seat
}

export interface ScriptDef {
  id: string;
  name: string;
  roles: string[]; // Role IDs
}