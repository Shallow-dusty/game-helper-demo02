import * as Sentry from '@sentry/react';
import { env } from '../config/env';

let initialized = false;

const shouldEnableSentry = (): boolean => {
  if (!env.SENTRY_DSN) return false;
  if (env.IS_DEV) return false;
  return true;
};

export const initMonitoring = (): void => {
  if (initialized || !shouldEnableSentry()) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? (env.IS_DEV ? 'development' : 'production'),
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
  });

  initialized = true;
};

export const captureException = (error: unknown, context?: Record<string, unknown>): void => {
  if (!shouldEnableSentry()) return;
  Sentry.captureException(error, {
    contexts: context ? { app: context } : undefined,
  });
};

export const captureMessage = (message: string, context?: Record<string, unknown>): void => {
  if (!shouldEnableSentry()) return;
  Sentry.captureMessage(message, {
    contexts: context ? { app: context } : undefined,
  });
};
