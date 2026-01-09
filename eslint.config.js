import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // ✅ Week 1强化：类型安全核心规则 (warn → error)
      '@typescript-eslint/no-explicit-any': 'error',  // 已消除所有 as any
      '@typescript-eslint/no-floating-promises': 'error',  // 防止未处理的Promise
      '@typescript-eslint/require-await': 'error',  // async函数必须有await

      // Week 2-3 逐步强化（暂时保持warn）
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // deprecated 警告降级（roleId 迁移中）
      '@typescript-eslint/no-deprecated': 'warn',

      // 非空断言在确定场景下允许
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',

      // 条件判断优化建议
      '@typescript-eslint/no-unnecessary-condition': 'warn',

      // React 相关规则调整
      '@typescript-eslint/no-misused-promises': ['error', {
        checksVoidReturn: {
          attributes: false  // 允许在 JSX 属性中使用 async 函数
        }
      }],

      // 代码风格
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // 其他规则
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/restrict-plus-operands': 'warn',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'warn',
      '@typescript-eslint/no-dynamic-delete': 'warn',
    },
  },
  // 分层规则：由严到松
  {
    files: ['src/lib/**/*.ts'],
    ignores: ['**/*.test.ts', '**/*.spec.ts'],  // 排除测试文件
    rules: {
      // 核心逻辑库：严格执行类型安全
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      // UI组件：事件处理允许any，但保留其他规则
      '@typescript-eslint/no-explicit-any': 'warn',  // 降级为warn
    },
  },
  {
    files: ['src/store/slices/**/*.ts', 'src/store/types.ts'],
    ignores: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      // Store slices: Supabase channel等外部API交互允许any
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/require-await': 'warn',  // 某些async方法可能条件性await
      '@typescript-eslint/consistent-type-definitions': 'off',  // types.ts允许使用type
    },
  },
  // 测试文件规则（最后应用，优先级最高）
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      // 测试文件中放宽所有类型相关规则
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',  // 允许使用type
      '@typescript-eslint/require-await': 'off',  // 测试async函数可能不await
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'vite.config.ts',
      'eslint.config.js',
      '*.cjs',
      'supabase/**',
      'scripts/**',
    ],
  }
);
