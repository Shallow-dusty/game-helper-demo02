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
  });
});
