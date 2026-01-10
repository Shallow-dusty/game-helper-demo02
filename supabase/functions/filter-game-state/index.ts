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

// --- Main Handler ---

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verify Authorization
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        // 2. Parse Request Body
        const { roomCode, userId, isStoryteller } = await req.json();

        if (!roomCode) throw new Error('Missing roomCode');
        if (!userId) throw new Error('Missing userId');

        // 3. Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 4. Fetch Public Game State
        const { data: roomData, error: roomError } = await supabase
            .from('game_rooms')
            .select('data')
            .eq('room_code', roomCode)
            .single();

        if (roomError || !roomData) {
            throw new Error('Room not found');
        }

        let gameState = roomData.data as GameState;

        // 5. If Storyteller, also fetch secrets and merge
        if (isStoryteller) {
            const { data: secretData } = await supabase
                .from('game_secrets')
                .select('data')
                .eq('room_code', roomCode)
                .single();

            if (secretData?.data) {
                // Merge secrets into game state
                const secretState = secretData.data as { seats?: { id: number; realRoleId: string | null }[] };
                if (secretState.seats) {
                    secretState.seats.forEach(secretSeat => {
                        const targetSeat = gameState.seats.find(s => s.id === secretSeat.id);
                        if (targetSeat) {
                            targetSeat.realRoleId = secretSeat.realRoleId ?? null;
                        }
                    });
                }
            }
        }

        // 6. Filter for User
        const filteredState = filterGameStateForUser(gameState, userId, isStoryteller);

        // 7. Return filtered state
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
