/**
 * 环境变量配置模块
 *
 * 提供类型安全的环境变量访问，带运行时校验
 * 所有环境变量应通过此模块访问，而非直接使用 import.meta.env
 */

// ============================================================================
// 环境变量定义
// ============================================================================

interface EnvConfig {
  // Supabase 配置（必需）
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;

  // 可选配置
  ADMIN_PASSWORD?: string;
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_TRACES_SAMPLE_RATE: number;
  ENABLE_GUEST_AUTH_FALLBACK: boolean;

  // 开发模式标志
  IS_DEV: boolean;
}

// ============================================================================
// 校验函数
// ============================================================================

/**
 * 校验必需的环境变量
 * @throws Error 如果必需的环境变量缺失
 */
function validateEnv(): EnvConfig {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const sentryEnvironment = import.meta.env.VITE_SENTRY_ENVIRONMENT;
  const sentryRateRaw = import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE;
  const enableGuestAuthFallbackRaw = import.meta.env.VITE_ENABLE_GUEST_AUTH_FALLBACK;
  const isDev = import.meta.env.DEV;

  const missingVars: string[] = [];

  if (!supabaseUrl || typeof supabaseUrl !== 'string') {
    missingVars.push('VITE_SUPABASE_URL');
  }

  if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string') {
    missingVars.push('VITE_SUPABASE_ANON_KEY');
  }

  if (missingVars.length > 0) {
    const errorMessage = `
╔════════════════════════════════════════════════════════════════╗
║                    环境变量配置错误                              ║
╠════════════════════════════════════════════════════════════════╣
║ 缺少以下必需的环境变量:                                          ║
║ ${missingVars.map(v => `  - ${v}`).join('\n║ ')}
║                                                                ║
║ 请在项目根目录创建 .env.local 文件并添加以下内容:                  ║
║                                                                ║
║   VITE_SUPABASE_URL=your_supabase_url                          ║
║   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key                ║
║                                                                ║
║ 参考 .env.example 获取更多配置选项                               ║
╚════════════════════════════════════════════════════════════════╝
`;
    throw new Error(errorMessage);
  }

  const parsedSentryRate = Number.parseFloat(sentryRateRaw ?? '');
  const sentryTracesSampleRate = Number.isFinite(parsedSentryRate)
    ? Math.min(1, Math.max(0, parsedSentryRate))
    : 0.1;

  const enableGuestAuthFallback = enableGuestAuthFallbackRaw !== 'false';

  return {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    ADMIN_PASSWORD: adminPassword,
    SENTRY_DSN: sentryDsn,
    SENTRY_ENVIRONMENT: sentryEnvironment,
    SENTRY_TRACES_SAMPLE_RATE: sentryTracesSampleRate,
    ENABLE_GUEST_AUTH_FALLBACK: enableGuestAuthFallback,
    IS_DEV: isDev,
  };
}

// ============================================================================
// 导出配置
// ============================================================================

/**
 * 经过校验的环境变量配置
 *
 * @example
 * import { env } from '@/config/env';
 *
 * const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
 */
export const env = validateEnv();

/**
 * 检查是否为开发环境
 */
export const isDevelopment = env.IS_DEV;

/**
 * 检查是否为生产环境
 */
export const isProduction = !env.IS_DEV;
