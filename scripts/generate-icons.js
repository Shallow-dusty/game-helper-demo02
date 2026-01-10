// scripts/generate-icons.js
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceImage = path.join(__dirname, '../source-icon.svg');
const outputDir = path.join(__dirname, '../public/img');

const sizes = [
  { name: 'icon-192.png', size: 192, purpose: 'any' },
  { name: 'icon-512.png', size: 512, purpose: 'any' },
  { name: 'icon-144.png', size: 144, purpose: 'any' },
  { name: 'badge-72.png', size: 72, purpose: 'any' },
  { name: 'apple-touch-icon.png', size: 180, purpose: 'any' },
  { name: 'icon-192-maskable.png', size: 192, purpose: 'maskable' }
];

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎨 开始生成 PWA 图标...\n');

// 生成各种尺寸
Promise.all(
  sizes.map(({ name, size, purpose }) => {
    console.log(`⏳ 生成 ${name} (${size}x${size}, purpose: ${purpose})...`);

    const isCircle = purpose === 'maskable';

    return sharp(sourceImage, { density: 300 })
      .resize(size, size, {
        fit: 'contain',
        background: isCircle ? { r: 10, g: 10, b: 15, alpha: 1 } : { r: 10, g: 10, b: 15, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, name))
      .then(() => {
        console.log(`✅ ${name} 生成成功`);
        return { name, size, purpose };
      })
      .catch(err => {
        console.error(`❌ ${name} 生成失败:`, err.message);
        throw err;
      });
  })
).then(results => {
  console.log('\n🎉 所有图标生成完成！\n');
  console.log('📊 生成的文件：');
  results.forEach(({ name, size, purpose }) => {
    const filePath = path.join(outputDir, name);
    const stats = fs.statSync(filePath);
    console.log(`  • ${name} (${size}x${size}, ${purpose}) - ${(stats.size / 1024).toFixed(1)}KB`);
  });

  console.log('\n✨ 下一步：');
  console.log('  1. 图标已保存到 public/img/');
  console.log('  2. 更新 public/manifest.json 配置');
  console.log('  3. 在浏览器中验证图标加载');
}).catch(err => {
  console.error('\n❌ 生成失败:', err.message);
  process.exit(1);
});
