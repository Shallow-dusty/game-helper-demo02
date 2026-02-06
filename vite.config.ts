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
      // Default to localhost for test runners; override with VITE_DEV_HOST if needed.
      host: env.VITE_DEV_HOST || '127.0.0.1',
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
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return undefined;

            // React 基础
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'react-vendor';
            }

            // 状态管理
            if (id.includes('/zustand/') || id.includes('/immer/')) {
              return 'state';
            }

            // UI 与动效分离，避免单个超大 chunk
            if (id.includes('/@radix-ui/')) {
              return 'radix';
            }
            if (id.includes('/framer-motion/')) {
              return 'motion';
            }
            if (id.includes('/recharts/') || id.includes('/d3-')) {
              return 'charts';
            }

            // 画布渲染
            if (id.includes('/react-konva/') || id.includes('/konva/')) {
              return 'canvas';
            }

            // 物理引擎
            if (id.includes('/matter-js/')) {
              return 'physics';
            }

            // AI 服务
            if (id.includes('/@google/generative-ai/') || id.includes('/openai/')) {
              return 'ai';
            }

            // 后端服务
            if (id.includes('/@supabase/supabase-js/')) {
              return 'backend';
            }

            return undefined;
          },
        },
        // 增强 tree-shaking
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
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
      chunkSizeWarningLimit: 400,
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
