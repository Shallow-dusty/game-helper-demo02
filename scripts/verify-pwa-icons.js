// scripts/verify-pwa-icons.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');
const imgDir = path.join(publicDir, 'img');
const manifestPath = path.join(publicDir, 'manifest.json');

console.log('🔍 验证 PWA 配置...\n');

// 验证清单
console.log('📋 检查清单文件...');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`✅ manifest.json 存在`);
  console.log(`   - 应用名: ${manifest.name}`);
  console.log(`   - 主题色: ${manifest.theme_color}`);
  console.log(`   - 背景色: ${manifest.background_color}`);
  console.log(`   - 显示模式: ${manifest.display}`);
  console.log(`   - 图标数量: ${manifest.icons?.length || 0}`);

  // 验证图标配置
  if (manifest.icons && manifest.icons.length > 0) {
    console.log('\n📦 清单中配置的图标：');
    manifest.icons.forEach((icon, index) => {
      console.log(`   ${index + 1}. ${icon.src} (${icon.sizes}, ${icon.purpose})`);
    });
  }
} else {
  console.log('❌ manifest.json 不存在');
}

// 验证图标文件
console.log('\n🖼️  检查图标文件...');
const requiredIcons = [
  'badge-72.png',
  'icon-144.png',
  'icon-192.png',
  'icon-192-maskable.png',
  'apple-touch-icon.png',
  'icon-512.png'
];

let allIconsFound = true;
let totalSize = 0;

requiredIcons.forEach(iconName => {
  const iconPath = path.join(imgDir, iconName);
  if (fs.existsSync(iconPath)) {
    const stats = fs.statSync(iconPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`✅ ${iconName} (${sizeKB}KB)`);
    totalSize += stats.size;
  } else {
    console.log(`❌ ${iconName} 缺失`);
    allIconsFound = false;
  }
});

console.log(`\n📊 总大小: ${(totalSize / 1024).toFixed(1)}KB`);

// 验证 Service Worker
console.log('\n⚙️  检查 Service Worker...');
const swPath = path.join(publicDir, 'service-worker.js');
if (fs.existsSync(swPath)) {
  console.log('✅ service-worker.js 存在');
  const stats = fs.statSync(swPath);
  console.log(`   - 大小: ${(stats.size / 1024).toFixed(1)}KB`);
} else {
  console.log('❌ service-worker.js 缺失');
}

// 检查 index.html 配置
console.log('\n📄 检查 HTML 配置...');
const htmlPath = path.join(__dirname, '../index.html');
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const hasManifest = html.includes('manifest.json');
  const hasThemeColor = html.includes('theme-color');
  const hasAppleTouchIcon = html.includes('apple-touch-icon');
  const hasAppCapable = html.includes('apple-mobile-web-app-capable');

  console.log(`${hasManifest ? '✅' : '❌'} manifest.json 链接`);
  console.log(`${hasThemeColor ? '✅' : '❌'} theme-color 标签`);
  console.log(`${hasAppleTouchIcon ? '✅' : '❌'} apple-touch-icon 链接`);
  console.log(`${hasAppCapable ? '✅' : '❌'} apple-mobile-web-app-capable 标签`);
} else {
  console.log('❌ index.html 不存在');
}

// 最终结果
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (allIconsFound) {
  console.log('✨ PWA 配置验证通过！');
  console.log('\n🚀 下一步：');
  console.log('   1. npm run build（构建项目）');
  console.log('   2. npm run preview（本地预览）');
  console.log('   3. 在 Chrome DevTools 中运行 Lighthouse 审计');
  console.log('   4. 验证 PWA 安装提示显示正常');
} else {
  console.log('⚠️  PWA 配置有问题，请检查缺失的文件');
  process.exit(1);
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
