import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      // 代码分割策略
      rollupOptions: {
        output: {
          manualChunks: {
            // React 核心
            'react-vendor': ['react', 'react-dom'],
            // 状态管理
            'state': ['zustand', 'immer'],
            // UI 库
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-context-menu',
              '@radix-ui/react-slot',
              'framer-motion',
              'lucide-react',
            ],
            // 画布渲染
            'canvas': ['react-konva', 'konva'],
            // 图表
            'charts': ['recharts'],
            // 物理引擎
            'physics': ['matter-js'],
            // AI 服务
            'ai': ['@google/generative-ai', 'openai'],
            // 后端服务
            'backend': ['@supabase/supabase-js'],
          },
        },
      },
      // 压缩优化 - 使用 esbuild (更快)
      minify: 'esbuild',
      // 生产环境移除 console
      esbuildOptions: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
      // 资源内联阈值
      assetsInlineLimit: 4096,
      // 源码映射 (生产环境关闭)
      sourcemap: mode !== 'production',
      // chunk 大小警告阈值
      chunkSizeWarningLimit: 300,
    },
    // 依赖预构建优化
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'zustand',
        'immer',
        'framer-motion',
        'lucide-react',
      ],
    },
  };
});
