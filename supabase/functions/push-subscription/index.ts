import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionBody {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
  roomCode?: string;
}

const asString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseRequestBody = async (req: Request): Promise<SubscriptionBody> => {
  const body = await req.json().catch(() => ({}));

  const payload = (typeof body === 'object' && body !== null)
    ? (body as Record<string, unknown>)
    : {};

  const subscription = (typeof payload.subscription === 'object' && payload.subscription !== null)
    ? (payload.subscription as Record<string, unknown>)
    : payload;

  const keysRecord = (typeof subscription.keys === 'object' && subscription.keys !== null)
    ? (subscription.keys as Record<string, unknown>)
    : {};

  const endpoint = asString(subscription.endpoint);
  const auth = asString(keysRecord.auth);
  const p256dh = asString(keysRecord.p256dh);
  const roomCode = asString(payload.roomCode);

  if (!endpoint || !auth || !p256dh) {
    throw new Error('Invalid push subscription payload');
  }

  if (!endpoint.startsWith('https://')) {
    throw new Error('Invalid endpoint protocol');
  }

  if (endpoint.length > 2048 || auth.length > 512 || p256dh.length > 1024) {
    throw new Error('Push subscription payload too large');
  }

  return {
    endpoint,
    keys: { auth, p256dh },
    roomCode: roomCode ?? undefined,
  };
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

    const subscription = await parseRequestBody(req);

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

    const userId = authData.user.id;

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let normalizedRoomCode: string | null = null;
    if (subscription.roomCode) {
      normalizedRoomCode = subscription.roomCode.toUpperCase();
      const { data: roomData, error: roomError } = await serviceClient
        .from('game_rooms')
        .select('id, storyteller_id')
        .eq('room_code', normalizedRoomCode)
        .maybeSingle();

      if (roomError || !roomData) {
        throw new Error('Room not found');
      }

      const isStoryteller = roomData.storyteller_id === userId;
      if (!isStoryteller) {
        const { data: memberData, error: memberError } = await serviceClient
          .from('room_members')
          .select('id')
          .eq('room_id', roomData.id)
          .eq('user_id', userId)
          .maybeSingle();

        if (memberError || !memberData) {
          throw new Error('Not a room member');
        }
      }
    }

    const { data: upsertData, error: upsertError } = await serviceClient
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        room_code: normalizedRoomCode,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_agent: req.headers.get('user-agent') ?? null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,endpoint',
      })
      .select('id')
      .maybeSingle();

    if (upsertError) {
      throw new Error(`Failed to save subscription: ${upsertError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      subscriptionId: upsertData?.id ?? null,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
