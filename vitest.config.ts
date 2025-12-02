import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
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
