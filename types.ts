
export type GamePhase = 'SETUP' | 'NIGHT' | 'DAY' | 'NOMINATION' | 'VOTING';

export type Team = 'TOWNSFOLK' | 'OUTSIDER' | 'MINION' | 'DEMON' | 'TRAVELER';

export interface RoleDef {
  id: string;
  name: string;
  team: Team;
  description: string;
  firstNight?: boolean;
  otherNight?: boolean;
  icon?: string; // Visual indicator for the role (emoji)
  reminders?: string[]; // Default reminders for this role
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
}

export type SeatStatus = 'POISONED' | 'DRUNK' | 'PROTECTED';

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
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'system' for system messages
  senderName: string;
  recipientId: string | null; // null = Public, otherwise User ID
  content: string;
  timestamp: number;
  type: 'chat' | 'system';
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

export interface GameState {
  roomId: string;
  currentScriptId: string; // 'tb', 'bmr', 'sv'
  phase: GamePhase;
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
}

export interface User {
  id: string;
  name: string;
  isStoryteller: boolean;
  roomId: string | null;
}

export interface ScriptDef {
  id: string;
  name: string;
  roles: string[]; // Role IDs
}