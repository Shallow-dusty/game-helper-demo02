#!/usr/bin/env node

/**
 * 资源优化脚本
 *
 * 功能：
 * 1. 压缩图像 (PNG, JPG)
 * 2. 转换为 WebP 格式
 * 3. 移除 console 日志
 * 4. 分析包体积
 *
 * 使用: node scripts/optimize-assets.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const imgDir = path.join(projectRoot, 'public/img');

console.log('🚀 开始资源优化...\n');

// ============================================================================
// 1. 图像压缩
// ============================================================================

async function optimizeImages() {
  console.log('📷 优化图像...');

  const imageExtensions = ['.png', '.jpg', '.jpeg'];
  const files = fs.readdirSync(imgDir)
    .filter(file => imageExtensions.some(ext => file.endsWith(ext)));

  let totalSavings = 0;

  for (const file of files) {
    const filePath = path.join(imgDir, file);
    const stats = fs.statSync(filePath);
    const originalSize = stats.size;

    try {
      const ext = path.extname(file);

      if (ext === '.png') {
        // PNG 压缩（无损）
        await sharp(filePath)
          .png({ quality: 80, compressionLevel: 9 })
          .toFile(filePath);
      } else if (['.jpg', '.jpeg'].includes(ext)) {
        // JPG 压缩（有损但保持质量）
        await sharp(filePath)
          .jpeg({ quality: 80, progressive: true })
          .toFile(filePath);
      }

      const newStats = fs.statSync(filePath);
      const newSize = newStats.size;
      const savings = originalSize - newSize;
      const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

      if (savings > 0) {
        totalSavings += savings;
        console.log(`  ✓ ${file}`);
        console.log(`    原始: ${(originalSize / 1024).toFixed(1)}KB → 压缩后: ${(newSize / 1024).toFixed(1)}KB (节省 ${savingsPercent}%)`);
      }
    } catch (error) {
      console.warn(`  ⚠️ ${file} 压缩失败:`, error.message);
    }
  }

  console.log(`\n✅ 图像优化完成，总共节省 ${(totalSavings / 1024).toFixed(1)}KB\n`);
}

// ============================================================================
// 2. WebP 转换
// ============================================================================

async function convertToWebP() {
  console.log('🎨 转换为 WebP 格式...');

  const files = fs.readdirSync(imgDir)
    .filter(file => ['.png', '.jpg', '.jpeg'].some(ext => file.endsWith(ext)));

  let totalSize = 0;

  for (const file of files) {
    const filePath = path.join(imgDir, file);
    const filename = path.parse(file).name;
    const webpPath = path.join(imgDir, `${filename}.webp`);

    try {
      // 如果已存在 WebP，跳过
      if (fs.existsSync(webpPath)) {
        const stats = fs.statSync(webpPath);
        totalSize += stats.size;
        console.log(`  ✓ ${filename}.webp (已存在, ${(stats.size / 1024).toFixed(1)}KB)`);
        continue;
      }

      await sharp(filePath)
        .webp({ quality: 80 })
        .toFile(webpPath);

      const stats = fs.statSync(webpPath);
      const originalStats = fs.statSync(filePath);
      totalSize += stats.size;

      const savings = originalStats.size - stats.size;
      const savingsPercent = ((savings / originalStats.size) * 100).toFixed(1);

      console.log(`  ✓ ${filename}.webp`);
      console.log(`    原始: ${(originalStats.size / 1024).toFixed(1)}KB → WebP: ${(stats.size / 1024).toFixed(1)}KB (节省 ${savingsPercent}%)`);
    } catch (error) {
      console.warn(`  ⚠️ ${file} WebP 转换失败:`, error.message);
    }
  }

  console.log(`\n✅ WebP 转换完成，总体积 ${(totalSize / 1024).toFixed(1)}KB\n`);
}

// ============================================================================
// 3. 移除 console 日志
// ============================================================================

function removeConsoleLogs() {
  console.log('📝 检查 console 日志...');

  const jsFiles = fs.readdirSync(distDir)
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(distDir, file));

  let totalConsoles = 0;

  for (const file of jsFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(/console\.(log|warn|error|info|debug|trace)/g);

      if (matches) {
        totalConsoles += matches.length;
        console.log(`  ⚠️ ${path.basename(file)}: 发现 ${matches.length} 个 console 调用`);
      }
    } catch (error) {
      console.warn(`  错误读取 ${file}:`, error.message);
    }
  }

  if (totalConsoles === 0) {
    console.log('  ✅ 未发现 console 日志（可能已被 terser 移除）\n');
  } else {
    console.log(`  ⚠️ 生产环境应移除 console 日志（共 ${totalConsoles} 个）\n`);
  }
}

// ============================================================================
// 4. 包体积分析
// ============================================================================

function analyzeBundle() {
  console.log('📊 分析包体积...\n');

  try {
    const output = execSync('du -sh dist/', { encoding: 'utf-8' });
    console.log(`  📦 总大小: ${output.trim()}`);

    // 分析各文件夹
    const folders = ['assets', 'img'];
    for (const folder of folders) {
      const folderPath = path.join(distDir, folder);
      if (fs.existsSync(folderPath)) {
        const output = execSync(`du -sh "${folderPath}"`, { encoding: 'utf-8' });
        console.log(`  📁 ${folder}: ${output.trim()}`);
      }
    }

    // 分析最大文件
    console.log('\n  🔝 最大的 10 个文件：');
    const files = [];

    function walkDir(dir) {
      fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          files.push({ path: filePath, size: stat.size });
        }
      });
    }

    walkDir(distDir);
    files.sort((a, b) => b.size - a.size);

    files.slice(0, 10).forEach((file, index) => {
      const relativePath = path.relative(distDir, file.path);
      console.log(`    ${index + 1}. ${relativePath}: ${(file.size / 1024).toFixed(1)}KB`);
    });

    console.log();
  } catch (error) {
    console.warn('  ⚠️ 包体积分析失败:', error.message);
  }
}

// ============================================================================
// 5. 生成优化报告
// ============================================================================

function generateReport() {
  console.log('📋 优化建议：\n');

  const recommendations = [
    '✓ 启用 Gzip 压缩（在服务器配置中）',
    '✓ 使用 WebP 格式和后备方案',
    '✓ 配置 CDN 缓存（静态资源 7 天，动态内容 5 分钟）',
    '✓ 使用懒加载加载图像',
    '✓ 启用 HTTP/2 服务器推送',
    '✓ 配置 ETag 和缓存头',
  ];

  recommendations.forEach(rec => console.log(`  ${rec}`));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ 资源优化完成！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  try {
    // 检查必要的目录
    if (!fs.existsSync(imgDir)) {
      console.warn(`⚠️ 图像目录不存在: ${imgDir}\n`);
    }

    if (!fs.existsSync(distDir)) {
      console.warn(`⚠️ 构建目录不存在: ${distDir}`);
      console.warn('请先运行: npm run build\n');
      return;
    }

    await optimizeImages();
    await convertToWebP();
    removeConsoleLogs();
    analyzeBundle();
    generateReport();

  } catch (error) {
    console.error('❌ 优化失败:', error.message);
    process.exit(1);
  }
}

main();
