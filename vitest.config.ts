import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Allow splitting the suite into smaller chunks to avoid OOM during large runs
const scope = process.env.VITEST_SCOPE;
const include = scope === 'src'
  ? ['src/**/*.{test,spec}.{ts,tsx}']
  : scope === 'src-logic'
    ? ['src/**/*.{test,spec}.{ts,tsx}']
    : scope === 'src-ui'
      ? ['src/components/**/*.{test,spec}.{ts,tsx}']
      : scope === 'tests'
        ? ['tests/**/*.{test,spec}.{ts,tsx}']
        : ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'];

const extraExcludes = scope === 'src-logic'
  ? ['src/components/**/*.{test,spec}.{ts,tsx}']
  : [];

const threadOptions = scope === 'src-ui'
  ? { minThreads: 1, maxThreads: 2, execArgv: workerExecArgs }
  : { singleThread: true, execArgv: workerExecArgs };

const workerExecArgs = ['--max-old-space-size=6144', '--expose-gc'];

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include,
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', ...extraExcludes],
    // Use single threaded worker pool to avoid extra process overhead and keep memory stable
    pool: 'threads',
    poolOptions: {
      threads: threadOptions,
    },
    reuseWorkers: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // 按优先级覆盖：核心逻辑 > 交互组件 > 展示组件
      include: [
        'src/lib/**/*.ts',           // 🔴 核心逻辑层 (目标 90%+)
        'src/store/**/*.ts',         // 🔴 状态管理层 (目标 90%+)
        'src/hooks/**/*.ts',         // 🟡 交互 hooks (目标 70%)
        'src/components/game/*.tsx', // 🟡 游戏组件 (目标 50-70%)
      ],
      exclude: [
        'src/components/ui/**',      // ⚪ 纯展示组件 (不测)
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
