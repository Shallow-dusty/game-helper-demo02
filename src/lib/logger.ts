/**
 * 统一日志系统
 *
 * 提供分级日志功能，支持开发/生产环境差异化行为
 * 替代散落的 console.log/error/warn 调用
 */

import { env } from '../config/env';

// ============================================================================
// 类型定义
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
  timestamp: Date;
}

interface LoggerConfig {
  /** 是否启用日志 */
  enabled: boolean;
  /** 最低日志级别 */
  minLevel: LogLevel;
  /** 是否在生产环境中也输出日志 */
  logInProduction: boolean;
  /** 是否包含时间戳 */
  includeTimestamp: boolean;
}

// ============================================================================
// 配置
// ============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const defaultConfig: LoggerConfig = {
  enabled: true,
  minLevel: env.IS_DEV ? 'debug' : 'warn', // 开发环境显示所有，生产只显示警告和错误
  logInProduction: true,
  includeTimestamp: env.IS_DEV,
};

let currentConfig: LoggerConfig = { ...defaultConfig };

// ============================================================================
// 格式化函数
// ============================================================================

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
};

const LEVEL_ICONS: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

const RESET_COLOR = '\x1b[0m';

function formatLogMessage(entry: LogEntry): string {
  const parts: string[] = [];

  // 时间戳
  if (currentConfig.includeTimestamp) {
    const time = entry.timestamp.toISOString().split('T')[1]?.slice(0, 12) ?? '';
    parts.push(`[${time}]`);
  }

  // 级别图标
  parts.push(LEVEL_ICONS[entry.level]);

  // 模块名
  parts.push(`[${entry.module}]`);

  // 消息
  parts.push(entry.message);

  return parts.join(' ');
}

// ============================================================================
// 核心日志函数
// ============================================================================

function shouldLog(level: LogLevel): boolean {
  if (!currentConfig.enabled) return false;
  if (!env.IS_DEV && !currentConfig.logInProduction) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[currentConfig.minLevel];
}

function log(level: LogLevel, module: string, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    module,
    message,
    data,
    timestamp: new Date(),
  };

  const formattedMessage = formatLogMessage(entry);

  // 选择合适的 console 方法
  const consoleFn = level === 'error' ? console.error
    : level === 'warn' ? console.warn
    : level === 'info' ? console.info
    : console.debug;

  if (data !== undefined) {
    consoleFn(formattedMessage, data);
  } else {
    consoleFn(formattedMessage);
  }
}

// ============================================================================
// 创建模块 Logger
// ============================================================================

export interface Logger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
}

/**
 * 创建一个带模块名前缀的 Logger 实例
 *
 * @example
 * const logger = createLogger('Connection');
 * logger.info('Connected to room', { roomCode: '1234' });
 * // 输出: [12:34:56.789] ℹ️ [Connection] Connected to room { roomCode: '1234' }
 */
export function createLogger(module: string): Logger {
  return {
    debug: (message: string, data?: unknown) => log('debug', module, message, data),
    info: (message: string, data?: unknown) => log('info', module, message, data),
    warn: (message: string, data?: unknown) => log('warn', module, message, data),
    error: (message: string, data?: unknown) => log('error', module, message, data),
  };
}

// ============================================================================
// 预定义的模块 Logger
// ============================================================================

/** 连接相关日志 */
export const connectionLogger = createLogger('Connection');

/** 游戏逻辑日志 */
export const gameLogger = createLogger('Game');

/** Supabase 服务日志 */
export const supabaseLogger = createLogger('Supabase');

/** 投票系统日志 */
export const votingLogger = createLogger('Voting');

/** 夜间行动日志 */
export const nightLogger = createLogger('Night');

/** UI 组件日志 */
export const uiLogger = createLogger('UI');

/** 音频系统日志 */
export const audioLogger = createLogger('Audio');

// ============================================================================
// 配置 API
// ============================================================================

/**
 * 更新日志配置
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * 获取当前配置
 */
export function getLoggerConfig(): Readonly<LoggerConfig> {
  return { ...currentConfig };
}

/**
 * 重置为默认配置
 */
export function resetLoggerConfig(): void {
  currentConfig = { ...defaultConfig };
}

/**
 * 临时禁用日志（用于测试）
 */
export function disableLogging(): void {
  currentConfig.enabled = false;
}

/**
 * 启用日志
 */
export function enableLogging(): void {
  currentConfig.enabled = true;
}
