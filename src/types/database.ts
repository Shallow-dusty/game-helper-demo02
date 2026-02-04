/**
 * Supabase 数据库类型定义
 *
 * 为 Supabase 响应提供类型安全，减少类型断言的使用
 */

import type { GameState, Seat } from '../types';

// ============================================================================
// 数据库表结构类型
// ============================================================================

/**
 * game_rooms 表结构
 */
export interface GameRoomRow {
  id: number;
  room_code: string;
  data: GameState;
  storyteller_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * game_secrets 表结构（ST 私密数据）
 */
export interface GameSecretRow {
  room_code: string;
  data: SecretState;
  created_at: string;
  updated_at: string;
}

/**
 * room_members 表结构
 */
export interface RoomMemberRow {
  id: number;
  room_id: number;
  user_id: string;
  display_name: string | null;
  role: 'storyteller' | 'player' | 'observer';
  seat_id: number | null;
  seen_role_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * game_messages 表结构
 */
export interface GameMessageRow {
  id: number;
  room_id: number;
  sender_seat_id: number | null;
  sender_name: string | null;
  content: string;
  recipient_seat_id: number | null;
  message_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * game_history 表结构
 */
export interface GameHistoryRow {
  id: number;
  room_code: string;
  winner: 'GOOD' | 'EVIL' | null;
  reason: string | null;
  script_name: string | null;
  players: GameHistoryPlayer[];
  messages: unknown[];
  state: GameState;
  created_at: string;
}

/**
 * interaction_logs 表结构
 */
export interface InteractionLogRow {
  id: string;
  room_id: number;
  game_day: number;
  phase: 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN';
  actor_seat: number | null;
  actor_role: string | null;
  actor_team: 'GOOD' | 'EVIL' | 'NEUTRAL' | null;
  target_seat: number | null;
  target_role: string | null;
  action_type: string;
  payload: Record<string, unknown>;
  result: 'SUCCESS' | 'BLOCKED' | 'REDIRECTED' | 'FAILED' | 'PENDING';
  result_details: string | null;
  created_at: string;
}

/**
 * nominations 表结构
 */
export interface NominationRow {
  id: string;
  room_id: number;
  game_day: number;
  nominator_seat: number;
  nominee_seat: number;
  was_seconded: boolean;
  vote_count: number;
  was_executed: boolean;
  created_at: string;
}

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * 私密状态（ST 可见）
 */
export interface SecretState {
  seats: Pick<Seat, 'id' | 'realRoleId' | 'seenRoleId' | 'reminders' | 'statuses' | 'hasUsedAbility'>[];
  storytellerNotes?: GameState['storytellerNotes'];
  nightActionRequests?: GameState['nightActionRequests'];
  aiMessages?: GameState['aiMessages'];
}

/**
 * 历史记录中的玩家信息
 */
export interface GameHistoryPlayer {
  name: string;
  role: string | null;
  team: string | null;
  isDead: boolean;
}

// ============================================================================
// RPC 函数响应类型
// ============================================================================

/**
 * log_interaction RPC 响应
 */
export type LogInteractionResponse = string;

/**
 * get_game_interactions RPC 响应
 */
export type GetGameInteractionsResponse = InteractionLogRow[];

/**
 * check_nomination_eligibility RPC 响应
 */
export interface CheckNominationEligibilityResponse {
  canNominate: boolean;
  reason: string | null;
  previousNominee: number | null;
}

/**
 * record_nomination RPC 响应
 */
export interface RecordNominationResponse {
  success: boolean;
  error: string | null;
  nominationId: string | null;
}

/**
 * update_nomination_result RPC 响应
 */
export type UpdateNominationResultResponse = boolean;

/**
 * get_nomination_history RPC 响应
 */
export type GetNominationHistoryResponse = NominationRow[];

/**
 * toggle_hand RPC 响应
 */
export interface ToggleHandResponse {
  success: boolean;
  error?: string;
  isHandRaised: boolean;
}

// ============================================================================
// 类型守卫函数
// ============================================================================

/**
 * 检查值是否为有效的 GameState
 */
export function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.roomId === 'string' &&
    typeof obj.phase === 'string' &&
    Array.isArray(obj.seats)
  );
}

/**
 * 检查值是否为有效的 SecretState
 */
export function isSecretState(value: unknown): value is SecretState {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return Array.isArray(obj.seats);
}

/**
 * 安全地解析 Supabase 响应数据
 */
export function parseSupabaseResponse<T>(
  data: unknown,
  validator: (value: unknown) => value is T
): T | null {
  if (validator(data)) {
    return data;
  }
  return null;
}
