/**
 * Authentication helpers for Supabase connection.
 *
 * Handles anonymous auth, guest credential fallback, and session management.
 * Extracted from connection.ts to reduce file size and isolate auth concerns.
 */

import { supabase } from './connection';
import { env } from '../../config/env';
import { connectionLogger as logger } from '../../lib/logger';

// ---------------------------------------------------------------------------
// Guest Credential Management
// ---------------------------------------------------------------------------

interface GuestCredentials {
    email: string;
    password: string;
}

const GUEST_EMAIL_KEY = 'grimoire_guest_email';
const GUEST_PASSWORD_KEY = 'grimoire_guest_password';

const hasLocalStorage = (): boolean => {
    try {
        return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
        return false;
    }
};

const getStoredGuestCredentials = (): GuestCredentials | null => {
    if (!hasLocalStorage()) return null;
    const email = window.localStorage.getItem(GUEST_EMAIL_KEY);
    const password = window.localStorage.getItem(GUEST_PASSWORD_KEY);
    if (!email || !password) return null;
    return { email, password };
};

const saveGuestCredentials = (credentials: GuestCredentials): void => {
    if (!hasLocalStorage()) return;
    window.localStorage.setItem(GUEST_EMAIL_KEY, credentials.email);
    window.localStorage.setItem(GUEST_PASSWORD_KEY, credentials.password);
};

const clearGuestCredentials = (): void => {
    if (!hasLocalStorage()) return;
    window.localStorage.removeItem(GUEST_EMAIL_KEY);
    window.localStorage.removeItem(GUEST_PASSWORD_KEY);
};

const createGuestCredentials = (): GuestCredentials => {
    const randomPart = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '')
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    const normalized = randomPart.slice(0, 24).padEnd(24, 'x');
    return {
        email: `guest_${normalized}@grimoire.local`,
        password: `Grimoire#${normalized}Aa1`,
    };
};

const isAnonymousDisabledError = (message: string): boolean => {
    const normalized = message.toLowerCase();
    return (
        normalized.includes('anonymous sign-ins are disabled') ||
        normalized.includes('anonymous providers are disabled') ||
        normalized.includes('anonymous sign-in is disabled')
    );
};

const signInWithGuestCredentials = async (credentials: GuestCredentials): Promise<{ id: string } | null> => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error) {
        logger.warn('访客账号登录失败:', error.message);
        return null;
    }
    if (data.session?.user) {
        return { id: data.session.user.id };
    }
    if (data.user) {
        logger.warn('访客账号登录未建立有效会话');
    }
    return null;
};

const ensureGuestAccountSession = async (): Promise<{ id: string } | null> => {
    const storedCredentials = getStoredGuestCredentials();
    if (storedCredentials) {
        const storedUser = await signInWithGuestCredentials(storedCredentials);
        if (storedUser) {
            return storedUser;
        }
        clearGuestCredentials();
    }

    const freshCredentials = createGuestCredentials();
    const { data, error } = await supabase.auth.signUp({
        email: freshCredentials.email,
        password: freshCredentials.password,
    });

    if (error) {
        logger.warn('访客账号注册失败:', error.message);
        return null;
    }

    const signedInUser = data.session?.user
        ? { id: data.session.user.id }
        : (data.user ? await signInWithGuestCredentials(freshCredentials) : null);

    const resolvedUserId = data.session?.user?.id ?? signedInUser?.id;
    if (!resolvedUserId) {
        logger.warn('访客账号注册后未获取到有效用户会话');
        return null;
    }

    saveGuestCredentials(freshCredentials);
    return { id: resolvedUserId };
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Ensure an authenticated Supabase user session exists.
 * Tries anonymous auth first, falls back to guest credentials if enabled.
 */
export const ensureAuthenticatedUser = async (): Promise<{ id: string } | null> => {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
            return { id: sessionData.session.user.id };
        }

        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
            logger.warn('匿名登录失败:', error.message);
            if (env.ENABLE_GUEST_AUTH_FALLBACK) {
                if (isAnonymousDisabledError(error.message)) {
                    logger.info('检测到匿名登录被禁用，切换访客账号登录流程');
                } else {
                    logger.info('匿名登录异常，尝试访客账号登录兜底');
                }
                return await ensureGuestAccountSession();
            }
            return null;
        }
        if (data?.user) {
            return { id: data.user.id };
        }

        if (env.ENABLE_GUEST_AUTH_FALLBACK) {
            return await ensureGuestAccountSession();
        }
    } catch (err) {
        logger.warn('匿名登录异常:', err);
        if (env.ENABLE_GUEST_AUTH_FALLBACK) {
            return await ensureGuestAccountSession();
        }
    }
    return null;
};
