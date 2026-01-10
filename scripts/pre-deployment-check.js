#!/usr/bin/env node

/**
 * 部署前检查清单 - 血染钟楼魔典 v0.9.0
 *
 * 这个脚本验证所有部署必需的配置和文件
 * 使用: node scripts/pre-deployment-check.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 部署前检查清单\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let allChecksPass = true;

// ============================================================================
// 检查项
// ============================================================================

const checks = [
  {
    category: '📋 环境配置',
    items: [
      {
        name: 'VAPID 公钥',
        check: () => {
          const envPath = path.join(projectRoot, '.env.local');
          if (!fs.existsSync(envPath)) return false;
          const content = fs.readFileSync(envPath, 'utf-8');
          return content.includes('VITE_VAPID_PUBLIC_KEY=');
        }
      },
      {
        name: 'VAPID 私钥',
        check: () => {
          const envPath = path.join(projectRoot, '.env.local');
          if (!fs.existsSync(envPath)) return false;
          const content = fs.readFileSync(envPath, 'utf-8');
          return content.includes('VAPID_PRIVATE_KEY=');
        }
      },
      {
        name: 'Supabase 连接',
        check: () => {
          const envPath = path.join(projectRoot, '.env.local');
          if (!fs.existsSync(envPath)) return false;
          const content = fs.readFileSync(envPath, 'utf-8');
          return content.includes('VITE_SUPABASE_URL=');
        }
      }
    ]
  },
  {
    category: '🖼️  PWA 资源',
    items: [
      { name: 'icon-192.png', check: () => fs.existsSync(path.join(projectRoot, 'public/img/icon-192.png')) },
      { name: 'icon-512.png', check: () => fs.existsSync(path.join(projectRoot, 'public/img/icon-512.png')) },
      { name: 'icon-144.png', check: () => fs.existsSync(path.join(projectRoot, 'public/img/icon-144.png')) },
      { name: 'badge-72.png', check: () => fs.existsSync(path.join(projectRoot, 'public/img/badge-72.png')) },
      { name: 'icon-192-maskable.png', check: () => fs.existsSync(path.join(projectRoot, 'public/img/icon-192-maskable.png')) },
      { name: 'apple-touch-icon.png', check: () => fs.existsSync(path.join(projectRoot, 'public/img/apple-touch-icon.png')) },
    ]
  },
  {
    category: '⚙️  配置文件',
    items: [
      { name: 'manifest.json', check: () => fs.existsSync(path.join(projectRoot, 'public/manifest.json')) },
      { name: 'service-worker.js', check: () => fs.existsSync(path.join(projectRoot, 'public/service-worker.js')) },
      { name: 'index.html', check: () => fs.existsSync(path.join(projectRoot, 'index.html')) },
      { name: 'vite.config.ts', check: () => fs.existsSync(path.join(projectRoot, 'vite.config.ts')) },
    ]
  },
  {
    category: '📦 构建产物',
    items: [
      { name: 'dist/ 目录', check: () => fs.existsSync(path.join(projectRoot, 'dist')) },
      { name: 'dist/index.html', check: () => fs.existsSync(path.join(projectRoot, 'dist/index.html')) },
      { name: 'dist/assets/', check: () => fs.existsSync(path.join(projectRoot, 'dist/assets')) },
      { name: 'dist/img/', check: () => fs.existsSync(path.join(projectRoot, 'dist/img')) },
    ]
  },
  {
    category: '📚 部署文档',
    items: [
      { name: 'DEPLOYMENT_GUIDE_v0.9.0.md', check: () => fs.existsSync(path.join(projectRoot, 'DEPLOYMENT_GUIDE_v0.9.0.md')) },
      { name: 'SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md', check: () => fs.existsSync(path.join(projectRoot, 'SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md')) },
      { name: 'VAPID_KEY_GENERATION_GUIDE.md', check: () => fs.existsSync(path.join(projectRoot, 'VAPID_KEY_GENERATION_GUIDE.md')) },
      { name: 'TEST_OFFLINE_OPERATIONS.md', check: () => fs.existsSync(path.join(projectRoot, 'TEST_OFFLINE_OPERATIONS.md')) },
      { name: 'TEST_PUSH_NOTIFICATIONS.md', check: () => fs.existsSync(path.join(projectRoot, 'TEST_PUSH_NOTIFICATIONS.md')) },
      { name: 'LIGHTHOUSE_OPTIMIZATION_GUIDE.md', check: () => fs.existsSync(path.join(projectRoot, 'LIGHTHOUSE_OPTIMIZATION_GUIDE.md')) },
    ]
  },
  {
    category: '🔧 实现文件',
    items: [
      { name: 'src/services/pushNotificationService.ts', check: () => fs.existsSync(path.join(projectRoot, 'src/services/pushNotificationService.ts')) },
      { name: 'src/services/offlineOperationQueue.ts', check: () => fs.existsSync(path.join(projectRoot, 'src/services/offlineOperationQueue.ts')) },
      { name: 'src/hooks/useGameStateSelectors.ts', check: () => fs.existsSync(path.join(projectRoot, 'src/hooks/useGameStateSelectors.ts')) },
      { name: 'supabase/functions/filter-game-state/', check: () => fs.existsSync(path.join(projectRoot, 'supabase/functions/filter-game-state')) },
      { name: 'backend/routes/gameOperations.ts', check: () => fs.existsSync(path.join(projectRoot, 'backend/routes/gameOperations.ts')) },
    ]
  }
];

// 执行检查
let passCount = 0;
let totalCount = 0;

checks.forEach(section => {
  console.log(`${section.category}\n`);

  section.items.forEach(item => {
    totalCount++;
    const passed = item.check();
    if (passed) {
      passCount++;
      console.log(`  ✅ ${item.name}`);
    } else {
      allChecksPass = false;
      console.log(`  ❌ ${item.name}`);
    }
  });

  console.log();
});

// ============================================================================
// 总结
// ============================================================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const percentage = Math.round((passCount / totalCount) * 100);
console.log(`📊 检查结果: ${passCount}/${totalCount} 项通过 (${percentage}%)\n`);

if (allChecksPass) {
  console.log('✨ 所有检查通过！项目已准备就绪可以部署。\n');
  console.log('📚 下一步：\n');
  console.log('  1. 部署 Supabase Edge Function');
  console.log('     → 参考: SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md\n');
  console.log('  2. 实现后端 API 端点');
  console.log('     → 参考: backend/routes/gameOperations.ts\n');
  console.log('  3. 上传到服务器/CDN');
  console.log('     → 使用: npm run build && npm run preview\n');
  console.log('  4. 验证 PWA 功能');
  console.log('     → Chrome DevTools → Lighthouse → PWA\n');
  console.log('  5. 监控性能指标');
  console.log('     → 参考: LIGHTHOUSE_OPTIMIZATION_GUIDE.md\n');
} else {
  console.log('⚠️  还有 ' + (totalCount - passCount) + ' 项检查未通过。\n');
  console.log('💡 建议：\n');
  console.log('  1. 检查缺失的文件是否已创建');
  console.log('  2. 运行: npm run build');
  console.log('  3. 检查 .env.local 配置是否正确');
  console.log('  4. 重新运行此检查脚本\n');
}

// 性能提示
console.log('📈 性能指标：\n');

try {
  const distPath = path.join(projectRoot, 'dist');
  if (fs.existsSync(distPath)) {
    const getDirSize = (dir) => {
      let size = 0;
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          size += getDirSize(filePath);
        } else {
          size += stat.size;
        }
      });
      return size;
    };

    const totalSize = getDirSize(distPath);
    console.log(`  📦 总大小: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);

    const assetPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetPath)) {
      const assetSize = getDirSize(assetPath);
      console.log(`  📁 JavaScript 大小: ${(assetSize / 1024).toFixed(1)}KB`);
    }

    const imgPath = path.join(distPath, 'img');
    if (fs.existsSync(imgPath)) {
      const imgSize = getDirSize(imgPath);
      console.log(`  🖼️  图像大小: ${(imgSize / 1024).toFixed(1)}KB`);
    }
  }
} catch (error) {
  console.log('  ⚠️  无法获取包大小信息');
}

console.log();

process.exit(allChecksPass ? 0 : 1);
