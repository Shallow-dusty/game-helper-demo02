import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildJsonHeaders, getGameOperationEndpoint, getPushSubscriptionEndpoint } from './apiEndpoints';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('apiEndpoints', () => {
  it('prefers configured API base URL when provided', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/');

    const gameEndpoint = getGameOperationEndpoint();
    const pushEndpoint = getPushSubscriptionEndpoint();

    expect(gameEndpoint).toEqual({
      url: 'https://api.example.com/api/game/operation',
      useSupabaseHeaders: false,
    });
    expect(pushEndpoint).toEqual({
      url: 'https://api.example.com/api/push-subscription',
      useSupabaseHeaders: false,
    });
  });

  it('falls back to Supabase edge function URLs when API base URL is missing', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://demo.supabase.co/');

    const gameEndpoint = getGameOperationEndpoint();
    const pushEndpoint = getPushSubscriptionEndpoint();

    expect(gameEndpoint).toEqual({
      url: 'https://demo.supabase.co/functions/v1/game-operation',
      useSupabaseHeaders: true,
    });
    expect(pushEndpoint).toEqual({
      url: 'https://demo.supabase.co/functions/v1/push-subscription',
      useSupabaseHeaders: true,
    });
  });

  it('builds JSON headers with auth and Supabase apikey only when needed', () => {
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');

    const customHeaders = buildJsonHeaders({
      url: 'https://api.example.com/api/game/operation',
      useSupabaseHeaders: false,
    }, 'token-1');

    expect(customHeaders).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-1',
    });

    const supabaseHeaders = buildJsonHeaders({
      url: 'https://demo.supabase.co/functions/v1/game-operation',
      useSupabaseHeaders: true,
    }, 'token-2');

    expect(supabaseHeaders).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-2',
      apikey: 'anon-key',
    });
  });
});
