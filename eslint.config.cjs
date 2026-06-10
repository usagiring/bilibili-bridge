const js = require('@eslint/js')
const globals = require('globals')
const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')

module.exports = [
  { ignores: ['dist/**', 'node_modules/**', 'bin/**', '.tsbuildinfo'] },

  // ── 基础推荐规则 ──
  js.configs.recommended,

  // ── TypeScript 文件 ──
  {
    files: ['**/*.ts', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,

      // ── 风格 ──
      semi: ['error', 'never'],
      indent: ['warn', 2, { SwitchCase: 1 }],
      curly: ['warn', 'multi-line'],
      'comma-spacing': ['warn', { before: false, after: true }],
      'prefer-const': 'warn',
      'no-var': 'error',

      // ── 质量 ──
      eqeqeq: ['warn', 'smart'],
      'no-console': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // ── 简写 / 简洁 ──
      'object-shorthand': ['warn', 'always'],
      'dot-notation': 'warn',

      // ── 格式 ──
      'no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 0 }],
      'comma-dangle': ['warn', 'always-multiline'],
      'array-bracket-spacing': ['warn', 'always'],
      'object-curly-spacing': ['warn', 'always'],

      // ── 项目宽松策略 ──
      'require-yield': 'off',
      'no-useless-assignment': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
]
