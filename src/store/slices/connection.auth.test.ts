import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureAuthenticatedUser, supabase } from './connection';

interface MockAuthClient {
  getSession: ReturnType<typeof vi.fn>;
  signInAnonymously: ReturnType<typeof vi.fn>;
  signInWithPassword: ReturnType<typeof vi.fn>;
  signUp: ReturnType<typeof vi.fn>;
}

const getMockAuth = (): MockAuthClient => supabase.auth as unknown as MockAuthClient;

describe('ensureAuthenticatedUser', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // =========================================================================
  // Existing session
  // =========================================================================
  it('returns existing session user without calling signIn', async () => {
    const auth = getMockAuth();
    auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'existing-user' } } },
    });

    const result = await ensureAuthenticatedUser();

    expect(result).toEqual({ id: 'existing-user' });
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  // =========================================================================
  // Anonymous auth success
  // =========================================================================
  it('returns user from anonymous sign-in when successful', async () => {
    const auth = getMockAuth();
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signInAnonymously.mockResolvedValue({
      data: { user: { id: 'anon-user' } },
      error: null,
    });

    const result = await ensureAuthenticatedUser();

    expect(result).toEqual({ id: 'anon-user' });
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  // =========================================================================
  // Guest credential flow — stored credentials found → login success
  // =========================================================================
  it('reuses stored guest credentials before creating a new guest account', async () => {
    const auth = getMockAuth();
    localStorage.setItem('grimoire_guest_email', 'guest_saved@grimoire.local');
    localStorage.setItem('grimoire_guest_password', 'SavedPasswordAa1#');

    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signInAnonymously.mockResolvedValue({
      data: null,
      error: { message: 'Anonymous sign-ins are disabled' },
    });
    auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'guest-restored' }, session: { user: { id: 'guest-restored' } } },
      error: null,
    });

    const result = await ensureAuthenticatedUser();

    expect(result).toEqual({ id: 'guest-restored' });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'guest_saved@grimoire.local',
      password: 'SavedPasswordAa1#',
    });
    expect(auth.signUp).not.toHaveBeenCalled();
    // Stored credentials should remain intact
    expect(localStorage.getItem('grimoire_guest_email')).toBe('guest_saved@grimoire.local');
  });

  // =========================================================================
  // Guest credential flow — stored credentials invalid → clear + create new
  // =========================================================================
  it('clears invalid stored credentials and creates a new guest account', async () => {
    const auth = getMockAuth();
    localStorage.setItem('grimoire_guest_email', 'old_guest@grimoire.local');
    localStorage.setItem('grimoire_guest_password', 'OldPassword#Aa1');

    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signInAnonymously.mockResolvedValue({
      data: null,
      error: { message: 'Anonymous sign-ins are disabled' },
    });
    // Stored credentials fail
    auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });
    // After signUp, secondary signIn succeeds (no session from signUp)
    auth.signUp.mockResolvedValue({
      data: { user: { id: 'new-guest' }, session: { user: { id: 'new-guest' } } },
      error: null,
    });

    const result = await ensureAuthenticatedUser();

    expect(result).toEqual({ id: 'new-guest' });
    // Old credentials should be cleared
    // New credentials should be saved
    expect(localStorage.getItem('grimoire_guest_email')).toContain('@grimoire.local');
    expect(localStorage.getItem('grimoire_guest_email')).not.toBe('old_guest@grimoire.local');
    expect(auth.signUp).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // signUp flow — email confirmation required → secondary login
  // =========================================================================
  it('falls back to signInWithPassword after signUp returns user but no session', async () => {
    const auth = getMockAuth();

    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signInAnonymously.mockResolvedValue({
      data: null,
      error: { message: 'Anonymous sign-ins are disabled' },
    });
    // signUp returns user but NO session (email confirmation scenario)
    auth.signUp.mockResolvedValue({
      data: { user: { id: 'signup-user' }, session: null },
      error: null,
    });
    // Secondary signInWithPassword succeeds
    auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'signup-user' }, session: { user: { id: 'signup-user' } } },
      error: null,
    });

    const result = await ensureAuthenticatedUser();

    expect(result).toEqual({ id: 'signup-user' });
    // signUp was called first, then signInWithPassword for the fresh credentials
    expect(auth.signUp).toHaveBeenCalledTimes(1);
    expect(auth.signInWithPassword).toHaveBeenCalledTimes(1);
    // Credentials should be saved
    expect(localStorage.getItem('grimoire_guest_email')).toContain('@grimoire.local');
  });

  // =========================================================================
  // Guest signup from anonymous disabled
  // =========================================================================
  it('falls back to guest signup when anonymous login is disabled', async () => {
    const auth = getMockAuth();
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signInAnonymously.mockResolvedValue({
      data: null,
      error: { message: 'Anonymous sign-ins are disabled' },
    });
    auth.signUp.mockResolvedValue({
      data: { user: { id: 'guest-user' }, session: { user: { id: 'guest-user' } } },
      error: null,
    });

    const result = await ensureAuthenticatedUser();

    expect(result).toEqual({ id: 'guest-user' });
    expect(auth.signUp).toHaveBeenCalledTimes(1);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(localStorage.getItem('grimoire_guest_email')).toContain('@grimoire.local');
    expect(localStorage.getItem('grimoire_guest_password')).toContain('Grimoire#');
  });

  // =========================================================================
  // Anonymous auth error (non-disabled) with guest fallback
  // =========================================================================
  it('falls back to guest flow on generic anonymous auth error', async () => {
    const auth = getMockAuth();
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signInAnonymously.mockResolvedValue({
      data: null,
      error: { message: 'Internal server error' },
    });
    auth.signUp.mockResolvedValue({
      data: { user: { id: 'fallback-guest' }, session: { user: { id: 'fallback-guest' } } },
      error: null,
    });

    const result = await ensureAuthenticatedUser();

    expect(result).toEqual({ id: 'fallback-guest' });
    expect(auth.signUp).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // Anonymous auth returns no user → guest fallback
  // =========================================================================
  it('falls back to guest when anonymous signIn returns no user', async () => {
    const auth = getMockAuth();
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signInAnonymously.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    auth.signUp.mockResolvedValue({
      data: { user: { id: 'null-fallback' }, session: { user: { id: 'null-fallback' } } },
      error: null,
    });

    const result = await ensureAuthenticatedUser();

    expect(result).toEqual({ id: 'null-fallback' });
  });

  // =========================================================================
  // Exception in auth flow → guest fallback
  // =========================================================================
  it('catches thrown exceptions and falls back to guest flow', async () => {
    const auth = getMockAuth();
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signInAnonymously.mockRejectedValue(new Error('Network failure'));
    auth.signUp.mockResolvedValue({
      data: { user: { id: 'exception-guest' }, session: { user: { id: 'exception-guest' } } },
      error: null,
    });

    const result = await ensureAuthenticatedUser();

    expect(result).toEqual({ id: 'exception-guest' });
  });

  // =========================================================================
  // signUp failure → returns null
  // =========================================================================
  it('returns null when guest signUp also fails', async () => {
    const auth = getMockAuth();
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signInAnonymously.mockResolvedValue({
      data: null,
      error: { message: 'Anonymous sign-ins are disabled' },
    });
    auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Signup rate limit exceeded' },
    });

    const result = await ensureAuthenticatedUser();

    expect(result).toBeNull();
    // Credentials should NOT be saved on failure
    expect(localStorage.getItem('grimoire_guest_email')).toBeNull();
  });

  // =========================================================================
  // signUp returns no user and no session → returns null
  // =========================================================================
  it('returns null when signUp succeeds but yields no user/session', async () => {
    const auth = getMockAuth();
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signInAnonymously.mockResolvedValue({
      data: null,
      error: { message: 'Anonymous providers are disabled' },
    });
    auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    const result = await ensureAuthenticatedUser();

    expect(result).toBeNull();
  });
});
