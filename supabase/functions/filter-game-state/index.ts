/**
 * Supabase Edge Function: filter-game-state
 *
 * 服务端数据过滤 - 根据用户身份返回过滤后的游戏状态
 * 解决客户端过滤的安全隐患，防止恶意用户查看他人角色信息
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Types (Mirror from src/types.ts) ---

interface Reminder {
    id: string;
    text: string;
    sourceRole: string;
    seatId: number;
    icon?: string;
    color?: string;
}

type SeatStatus = 'POISONED' | 'DRUNK' | 'PROTECTED' | 'MADNESS';

interface Seat {
    id: number;
    userId: string | null;
    userName: string;
    isDead: boolean;
    hasGhostVote: boolean;
    roleId: string | null;
    realRoleId: string | null;
    seenRoleId: string | null;
    reminders: Reminder[];
    isHandRaised: boolean;
    isNominated: boolean;
    hasUsedAbility: boolean;
    statuses: SeatStatus[];
    isVirtual?: boolean;
    voteLocked?: boolean;
    isReady?: boolean;
}

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    recipientId: string | null;
    content: string;
    timestamp: number;
    type: 'chat' | 'system';
    role?: 'user' | 'assistant' | 'system';
    isPrivate?: boolean;
}

interface NightActionRequest {
    id: string;
    seatId: number;
    roleId: string;
    status: 'pending' | 'resolved';
    timestamp: number;
}

interface SecretSeat {
    id: number;
    realRoleId?: string | null;
    seenRoleId?: string | null;
    reminders?: Reminder[];
    statuses?: SeatStatus[];
    hasUsedAbility?: boolean;
}

interface SecretState {
    seats?: SecretSeat[];
    storytellerNotes?: unknown[];
    nightActionRequests?: NightActionRequest[];
    aiMessages?: ChatMessage[];
}

interface GameState {
    roomId: string;
    seats: Seat[];
    messages: ChatMessage[];
    nightActionRequests: NightActionRequest[];
    [key: string]: unknown;
}

// --- Filter Logic (Mirror from src/store/utils.ts) ---

const GRIMOIRE_VIEWING_ROLES = ['spy'];

function filterSeatForUser(
    seat: Seat,
    currentUserId: string,
    isStoryteller: boolean,
    userRoleId?: string | null
): Seat {
    // ST sees everything
    if (isStoryteller) {
        return seat;
    }

    // Spy can see everyone's roles
    if (userRoleId && GRIMOIRE_VIEWING_ROLES.includes(userRoleId)) {
        return {
            ...seat,
            roleId: seat.seenRoleId,
            realRoleId: seat.realRoleId,
        };
    }

    // Player sees their own full info
    if (seat.userId === currentUserId) {
        return {
            ...seat,
            roleId: seat.seenRoleId,
            realRoleId: null, // Hide real role
        };
    }

    // Other players: hide sensitive info
    return {
        ...seat,
        roleId: null,
        realRoleId: null,
        seenRoleId: null,
        statuses: [],
        reminders: seat.reminders.filter(r => r.sourceRole === 'public'),
        hasUsedAbility: false,
    };
}

function filterGameStateForUser(
    gameState: GameState,
    currentUserId: string,
    isStoryteller: boolean
): GameState {
    const userSeat = gameState.seats.find(s => s.userId === currentUserId);
    const userRoleId = userSeat?.realRoleId ?? userSeat?.seenRoleId;

    return {
        ...gameState,
        seats: gameState.seats.map(seat =>
            filterSeatForUser(seat, currentUserId, isStoryteller, userRoleId)
        ),
        messages: gameState.messages.filter(msg => {
            if (msg.isPrivate) {
                return isStoryteller ||
                    msg.senderId === currentUserId ||
                    msg.recipientId === currentUserId;
            }
            if (msg.type === 'system') return true;
            if (!msg.recipientId) return true;
            return true;
        }),
        nightActionRequests: gameState.nightActionRequests.filter(req => {
            if (isStoryteller) return true;
            return req.seatId === userSeat?.id;
        }),
    };
}

function mergeSecretState(gameState: GameState, secretState: SecretState | null | undefined): GameState {
    if (!secretState) return gameState;

    const mergedState = JSON.parse(JSON.stringify(gameState)) as GameState;

    if (secretState.seats && Array.isArray(secretState.seats)) {
        secretState.seats.forEach((secretSeat) => {
            const targetSeat = mergedState.seats.find(s => s.id === secretSeat.id);
            if (targetSeat) {
                targetSeat.realRoleId = secretSeat.realRoleId ?? null;
                targetSeat.seenRoleId = secretSeat.seenRoleId ?? null;
                // Backward compatibility
                targetSeat.roleId = secretSeat.seenRoleId ?? null;
                targetSeat.reminders = secretSeat.reminders ?? [];
                targetSeat.statuses = secretSeat.statuses ?? [];
                targetSeat.hasUsedAbility = secretSeat.hasUsedAbility ?? false;
            }
        });
    }

    if (secretState.storytellerNotes) {
        mergedState.storytellerNotes = secretState.storytellerNotes;
    }

    if (secretState.nightActionRequests) {
        mergedState.nightActionRequests = secretState.nightActionRequests;
    }

    if (secretState.aiMessages) {
        mergedState.aiMessages = secretState.aiMessages;
    }

    return mergedState;
}

// --- Main Handler ---

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const payload = await req.json().catch(() => ({}));
        const roomCode = typeof payload?.roomCode === 'string' ? payload.roomCode.trim() : '';
        if (!roomCode) throw new Error('Missing roomCode');

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
            throw new Error('Missing Supabase configuration');
        }

        const authClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: authHeader } },
        });

        const { data: authData, error: authError } = await authClient.auth.getUser();
        if (authError || !authData?.user) throw new Error('Unauthorized');

        const currentUserId = authData.user.id;

        const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: roomData, error: roomError } = await serviceClient
            .from('game_rooms')
            .select('id, room_code, storyteller_id, data')
            .eq('room_code', roomCode)
            .single();

        if (roomError || !roomData) throw new Error('Room not found');

        const isStoryteller = roomData.storyteller_id === currentUserId;

        let memberSeenRoleId: string | null = null;
        if (!isStoryteller) {
            const { data: memberData, error: memberError } = await serviceClient
                .from('room_members')
                .select('role, seen_role_id')
                .eq('room_id', roomData.id)
                .eq('user_id', currentUserId)
                .maybeSingle();

            if (memberError) throw new Error('Failed to verify room membership');
            if (!memberData) throw new Error('Not a room member');

            memberSeenRoleId = (memberData as { seen_role_id?: string | null } | null)?.seen_role_id ?? null;
        }

        let gameState = roomData.data as GameState;
        if (!gameState.seats) gameState.seats = [];
        if (!gameState.messages) gameState.messages = [];
        if (!gameState.nightActionRequests) gameState.nightActionRequests = [];

        if (memberSeenRoleId) {
            const userSeat = gameState.seats.find(seat => seat.userId === currentUserId);
            if (userSeat) {
                userSeat.seenRoleId = memberSeenRoleId;
                // Backward compatibility
                userSeat.roleId = memberSeenRoleId;
            }
        }

        if (isStoryteller) {
            const { data: secretData, error: secretError } = await serviceClient
                .from('game_secrets')
                .select('data')
                .eq('room_code', roomCode)
                .maybeSingle();

            if (!secretError && secretData?.data) {
                gameState = mergeSecretState(gameState, secretData.data as SecretState);
            }
        }

        const filteredState = filterGameStateForUser(gameState, currentUserId, isStoryteller);

        return new Response(JSON.stringify({ gameState: filteredState }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error:', message);
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
