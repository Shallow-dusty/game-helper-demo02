#!/usr/bin/env node
/**
 * 批量修复路径别名脚本
 *
 * 将深层相对路径 (../../../...) 替换为路径别名 (@/)
 *
 * 使用方法: node scripts/fix-path-aliases.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, relative, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const srcDir = join(projectRoot, 'src');

// 需要处理的文件列表
const filesToFix = [
  'src/store/slices/game/night.ts',
  'src/store/slices/game/flow/voting.ts',
  'src/store/slices/game/phaseMachine.ts',
  'src/store/slices/game/flow/index.ts',
  'src/store/slices/game/flow/lifecycle.ts',
  'src/store/slices/game/phaseMachine.test.ts',
  'src/store/slices/game/flow/voting.test.ts',
  'src/store/slices/game/chat.extra.test.ts',
  'src/store/slices/game/utils.test.ts',
  'src/store/slices/game/roles.test.ts',
  'src/store/slices/game/roles.ts',
  'src/store/slices/game/core.ts',
  'src/lib/roleAutomation/troubleBrewing/demons.ts',
  'src/lib/roleAutomation/troubleBrewing/outsiders.ts',
  'src/lib/roleAutomation/troubleBrewing/minions.ts',
  'src/lib/roleAutomation/troubleBrewing/townsfolk.ts',
  'src/store/slices/game/utils.ts',
  'src/store/slices/game/flow/features.ts',
  'src/store/slices/game/chat.ts',
  'src/store/slices/game/flow/phase.ts',
  'src/store/slices/game/flow/utils.ts',
  'src/store/slices/game/core.test.ts',
  'src/lib/roleAutomation/troubleBrewing/index.ts',
  'src/store/slices/game/flow/night.ts',
  'src/store/slices/game/scripts.ts',
  'src/store/slices/game/audio.test.ts',
  'src/store/slices/game/chat.test.ts',
];

/**
 * 转换相对路径为路径别名
 * @param {string} importPath - 原始导入路径 (如 '../../../lib/utils')
 * @param {string} currentFile - 当前文件路径 (如 'src/store/slices/game/core.ts')
 * @returns {string} - 转换后的路径 (如 '@/lib/utils')
 */
function convertToAlias(importPath, currentFile) {
  // 只处理相对路径
  if (!importPath.startsWith('.')) {
    return importPath;
  }

  // 计算绝对路径
  const currentDir = dirname(join(projectRoot, currentFile));
  const absolutePath = resolve(currentDir, importPath);

  // 计算相对于 src 目录的路径
  const relativeToSrc = relative(srcDir, absolutePath);

  // 如果路径不在 src 目录下,不转换
  if (relativeToSrc.startsWith('..')) {
    return importPath;
  }

  // 返回使用 @ 别名的路径
  return '@/' + relativeToSrc.replace(/\\/g, '/');
}

/**
 * 处理单个文件
 */
function processFile(filePath) {
  const fullPath = join(projectRoot, filePath);

  try {
    let content = readFileSync(fullPath, 'utf-8');
    let modified = false;

    // 匹配所有 import/export from 语句
    // 支持单引号和双引号
    const importRegex = /(import|export)(\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)?\s*from\s+)(['"])([^'"]+)(['"])/g;

    const newContent = content.replace(importRegex, (match, keyword, middle, quote1, path, quote2) => {
      // 只处理包含 ../../.. 或更深的相对路径
      if (path.match(/\.\.[/\\]\.\.[/\\]\.\./)) {
        const newPath = convertToAlias(path, filePath);
        if (newPath !== path) {
          modified = true;
          console.log(`  ${path} → ${newPath}`);
          return `${keyword}${middle}${quote1}${newPath}${quote2}`;
        }
      }
      return match;
    });

    if (modified) {
      writeFileSync(fullPath, newContent, 'utf-8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ 处理文件失败: ${filePath}`);
    console.error(error);
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔧 开始批量修复路径别名...\n');

  let modifiedCount = 0;

  for (const file of filesToFix) {
    console.log(`📝 处理: ${file}`);
    if (processFile(file)) {
      modifiedCount++;
    } else {
      console.log('  (无需修改)');
    }
  }

  console.log(`\n✅ 完成! 共修改了 ${modifiedCount}/${filesToFix.length} 个文件`);
  console.log('\n📌 下一步:');
  console.log('  1. 运行 npm run build 检查 TypeScript 编译');
  console.log('  2. 运行 npm test 验证测试通过');
}

main();
