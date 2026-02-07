import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_OPERATIONS_PER_REQUEST = 50;
const MAX_MESSAGE_LENGTH = 500;
const MAX_UPDATE_RETRIES = 3;

type OperationType = 'raise_hand' | 'lower_hand' | 'night_action' | 'send_message' | 'update_reminder';

interface ParsedOperation {
  operationId: string;
  type: OperationType;
  seatId?: number;
  roleId?: string;
  payload?: Record<string, unknown>;
  content?: string;
  recipientId?: number;
  reminderId?: string;
  icon?: string;
  text?: string;
}

interface OperationResult {
  operationId: string;
  type: OperationType;
  success: boolean;
  deduplicated?: boolean;
  error?: string;
}

interface RoomSeat {
  id: number;
  userId?: string | null;
  userName?: string;
  isDead?: boolean;
  isHandRaised?: boolean;
  reminders?: Array<{ id: string; icon: string; text: string; sourceRole?: string; seatId?: number }>;
}

interface RoomState {
  phase?: string;
  seats?: RoomSeat[];
  voting?: {
    isOpen?: boolean;
  } | null;
  nightActionRequests?: Array<Record<string, unknown>>;
  messages?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

interface RequestPayload {
  userId: string;
  roomId: string;
  operations: ParsedOperation[];
}

const asString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asInteger = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  return value;
};

const stableHash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
};

const parseOperations = (value: unknown): ParsedOperation[] => {
  if (!Array.isArray(value)) {
    throw new Error('operations must be an array');
  }

  if (value.length === 0) {
    throw new Error('operations cannot be empty');
  }

  if (value.length > MAX_OPERATIONS_PER_REQUEST) {
    throw new Error(`operations exceeds limit (${MAX_OPERATIONS_PER_REQUEST})`);
  }

  return value.map((item, index) => {
    const record = (typeof item === 'object' && item !== null)
      ? (item as Record<string, unknown>)
      : {};

    const type = asString(record.type) as OperationType | null;
    if (!type || !['raise_hand', 'lower_hand', 'night_action', 'send_message', 'update_reminder'].includes(type)) {
      throw new Error(`invalid operation type at index ${index}`);
    }

    const fallbackId = `legacy_${index}_${type}_${stableHash(JSON.stringify(record))}`;

    const parsed: ParsedOperation = {
      operationId: asString(record.operationId) ?? fallbackId,
      type,
    };

    const seatId = asInteger(record.seatId);
    if (seatId !== null) parsed.seatId = seatId;

    const roleId = asString(record.roleId);
    if (roleId) parsed.roleId = roleId;

    const content = asString(record.content);
    if (content) parsed.content = content;

    const reminderId = asString(record.reminderId);
    if (reminderId) parsed.reminderId = reminderId;

    const icon = asString(record.icon);
    if (icon) parsed.icon = icon;

    const text = asString(record.text);
    if (text) parsed.text = text;

    const recipientId = asInteger(record.recipientId);
    if (recipientId !== null) parsed.recipientId = recipientId;

    if (typeof record.payload === 'object' && record.payload !== null && !Array.isArray(record.payload)) {
      parsed.payload = record.payload as Record<string, unknown>;
    }

    return parsed;
  });
};

const parsePayload = async (req: Request): Promise<RequestPayload> => {
  const body = await req.json().catch(() => ({}));
  const payload = (typeof body === 'object' && body !== null)
    ? (body as Record<string, unknown>)
    : {};

  const userId = asString(payload.userId);
  const roomId = asString(payload.roomId);
  const operations = parseOperations(payload.operations);

  if (!userId || !roomId) {
    throw new Error('Missing userId or roomId');
  }

  return {
    userId,
    roomId: roomId.toUpperCase(),
    operations,
  };
};

const ensureMutableState = (data: unknown): RoomState => {
  const source = (typeof data === 'object' && data !== null)
    ? (data as Record<string, unknown>)
    : {};

  const state: RoomState = JSON.parse(JSON.stringify(source));

  if (!Array.isArray(state.seats)) state.seats = [];
  if (!Array.isArray(state.messages)) state.messages = [];
  if (!Array.isArray(state.nightActionRequests)) state.nightActionRequests = [];

  return state;
};

const findUserSeat = (seats: RoomSeat[], userId: string, memberSeatId: number | null): RoomSeat | null => {
  if (memberSeatId !== null) {
    const fromMember = seats.find((seat) => seat.id === memberSeatId && seat.userId === userId);
    if (fromMember) return fromMember;
  }

  return seats.find((seat) => seat.userId === userId) ?? null;
};

const applyOperation = (
  state: RoomState,
  operation: ParsedOperation,
  userSeat: RoomSeat | null,
  userId: string,
  userNameFallback: string
): OperationResult => {
  const seats = state.seats ?? [];

  const getTargetSeat = (): RoomSeat | null => {
    if (typeof operation.seatId === 'number') {
      return seats.find((seat) => seat.id === operation.seatId) ?? null;
    }
    return userSeat;
  };

  const targetSeat = getTargetSeat();

  if ((operation.type === 'raise_hand' || operation.type === 'lower_hand' || operation.type === 'update_reminder') && !targetSeat) {
    return {
      operationId: operation.operationId,
      type: operation.type,
      success: false,
      error: 'Seat not found',
    };
  }

  if (targetSeat && targetSeat.userId !== userId) {
    return {
      operationId: operation.operationId,
      type: operation.type,
      success: false,
      error: 'Seat does not belong to user',
    };
  }

  switch (operation.type) {
    case 'raise_hand': {
      const isVotingOpen = state.voting?.isOpen ?? false;
      if (!isVotingOpen) {
        return {
          operationId: operation.operationId,
          type: operation.type,
          success: false,
          error: 'Voting is not open',
        };
      }

      if (targetSeat?.isDead) {
        return {
          operationId: operation.operationId,
          type: operation.type,
          success: false,
          error: 'Seat is dead',
        };
      }

      if (targetSeat) {
        targetSeat.isHandRaised = true;
      }
      return { operationId: operation.operationId, type: operation.type, success: true };
    }

    case 'lower_hand': {
      if (targetSeat) {
        targetSeat.isHandRaised = false;
      }
      return { operationId: operation.operationId, type: operation.type, success: true };
    }

    case 'night_action': {
      if (state.phase !== 'NIGHT') {
        return {
          operationId: operation.operationId,
          type: operation.type,
          success: false,
          error: 'Not in night phase',
        };
      }

      state.nightActionRequests?.push({
        id: crypto.randomUUID(),
        seatId: targetSeat?.id ?? operation.seatId ?? -1,
        roleId: operation.roleId ?? null,
        payload: operation.payload ?? {},
        status: 'pending',
        timestamp: Date.now(),
        source: 'offline_queue',
      });

      return { operationId: operation.operationId, type: operation.type, success: true };
    }

    case 'send_message': {
      const content = operation.content?.trim();
      if (!content) {
        return {
          operationId: operation.operationId,
          type: operation.type,
          success: false,
          error: 'Empty message',
        };
      }

      if (content.length > MAX_MESSAGE_LENGTH) {
        return {
          operationId: operation.operationId,
          type: operation.type,
          success: false,
          error: `Message too long (max ${MAX_MESSAGE_LENGTH})`,
        };
      }

      state.messages?.push({
        id: crypto.randomUUID(),
        senderId: userId,
        senderName: targetSeat?.userName ?? userNameFallback,
        recipientId: operation.recipientId ?? null,
        content,
        timestamp: Date.now(),
        type: 'chat',
      });

      return { operationId: operation.operationId, type: operation.type, success: true };
    }

    case 'update_reminder': {
      if (!targetSeat) {
        return {
          operationId: operation.operationId,
          type: operation.type,
          success: false,
          error: 'Seat not found',
        };
      }

      if (!Array.isArray(targetSeat.reminders)) {
        targetSeat.reminders = [];
      }

      const reminderId = operation.reminderId ?? crypto.randomUUID();
      const nextReminder = {
        id: reminderId,
        icon: operation.icon ?? '📝',
        text: operation.text ?? '',
        sourceRole: 'manual',
        seatId: targetSeat.id,
      };

      const existingIndex = targetSeat.reminders.findIndex((reminder) => reminder.id === reminderId);
      if (existingIndex >= 0) {
        targetSeat.reminders[existingIndex] = nextReminder;
      } else {
        targetSeat.reminders.push(nextReminder);
      }

      return { operationId: operation.operationId, type: operation.type, success: true };
    }

    default:
      return {
        operationId: operation.operationId,
        type: operation.type,
        success: false,
        error: 'Unsupported operation type',
      };
  }
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const payload = await parsePayload(req);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData?.user) {
      throw new Error('Unauthorized');
    }

    const currentUser = authData.user;
    if (currentUser.id !== payload.userId) {
      throw new Error('User mismatch');
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: roomData, error: roomError } = await serviceClient
      .from('game_rooms')
      .select('id, room_code, data, updated_at')
      .eq('room_code', payload.roomId)
      .maybeSingle();

    if (roomError || !roomData) {
      throw new Error('Room not found');
    }

    const { data: memberData, error: memberError } = await serviceClient
      .from('room_members')
      .select('id, seat_id, display_name')
      .eq('room_id', roomData.id)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (memberError || !memberData) {
      throw new Error('Not a room member');
    }

    const operationIds = payload.operations.map((operation) => operation.operationId);
    const deduplicatedIds = new Set<string>();

    if (operationIds.length > 0) {
      const { data: processedRows, error: processedError } = await serviceClient
        .from('offline_operation_events')
        .select('operation_id, status')
        .eq('room_code', payload.roomId)
        .eq('user_id', currentUser.id)
        .in('operation_id', operationIds);

      if (!processedError && Array.isArray(processedRows)) {
        for (const row of processedRows) {
          if (row.status === 'success' || row.status === 'deduplicated') {
            deduplicatedIds.add(row.operation_id as string);
          }
        }
      }
    }

    let currentRoomData = roomData;
    let finalState = ensureMutableState(roomData.data);
    let finalResults: OperationResult[] = [];

    for (let attempt = 0; attempt < MAX_UPDATE_RETRIES; attempt++) {
      const mutableState = ensureMutableState(currentRoomData.data);
      const seats = mutableState.seats ?? [];
      const userSeat = findUserSeat(seats, currentUser.id, asInteger(memberData.seat_id));

      const results: OperationResult[] = payload.operations.map((operation) => {
        if (deduplicatedIds.has(operation.operationId)) {
          return {
            operationId: operation.operationId,
            type: operation.type,
            success: true,
            deduplicated: true,
          };
        }

        return applyOperation(
          mutableState,
          operation,
          userSeat,
          currentUser.id,
          memberData.display_name ?? currentUser.email ?? 'Player'
        );
      });

      const requiresUpdate = results.some((result) => !result.deduplicated);

      if (!requiresUpdate) {
        finalState = mutableState;
        finalResults = results;
        break;
      }

      const { data: updatedRoom, error: updateError } = await serviceClient
        .from('game_rooms')
        .update({
          data: mutableState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentRoomData.id)
        .eq('updated_at', currentRoomData.updated_at)
        .select('id, room_code, data, updated_at')
        .maybeSingle();

      if (updateError) {
        throw new Error(`Failed to update room state: ${updateError.message}`);
      }

      if (updatedRoom) {
        finalState = mutableState;
        finalResults = results;
        break;
      }

      if (attempt === MAX_UPDATE_RETRIES - 1) {
        throw new Error('Room state conflict, please retry');
      }

      const { data: refreshedRoom, error: refreshError } = await serviceClient
        .from('game_rooms')
        .select('id, room_code, data, updated_at')
        .eq('id', currentRoomData.id)
        .maybeSingle();

      if (refreshError || !refreshedRoom) {
        throw new Error('Failed to refresh room state during retry');
      }

      currentRoomData = refreshedRoom;
    }

    if (finalResults.length === 0) {
      finalResults = payload.operations.map((operation) => ({
        operationId: operation.operationId,
        type: operation.type,
        success: false,
        error: 'Operation processing failed',
      }));
    }

    const auditRecords = finalResults.map((result) => {
      const sourceOperation = payload.operations.find((operation) => operation.operationId === result.operationId);
      return {
        room_code: payload.roomId,
        user_id: currentUser.id,
        operation_id: result.operationId,
        operation_type: result.type,
        status: result.success
          ? (result.deduplicated ? 'deduplicated' : 'success')
          : 'failed',
        error_message: result.error ?? null,
        operation_payload: sourceOperation ?? {},
        processed_at: new Date().toISOString(),
      };
    });

    const { error: auditError } = await serviceClient
      .from('offline_operation_events')
      .upsert(auditRecords, {
        onConflict: 'room_code,user_id,operation_id',
      });

    if (auditError) {
      console.error('offline_operation_events upsert failed:', auditError.message);
    }

    const success = finalResults.every((result) => result.success);

    return new Response(JSON.stringify({
      success,
      processed: finalResults.length,
      results: finalResults,
      timestamp: Date.now(),
      stateVersion: finalState.updated_at ?? null,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: message,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
