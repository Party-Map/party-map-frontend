import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

const hooksRecommended = reactHooks.configs.flat?.recommended ?? reactHooks.configs['recommended-latest']

export default defineConfig([
  { ignores: ['dist', 'coverage', 'e2e/.results', 'e2e/.shots', 'playwright-report', 'node_modules', '.rsbuild'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  hooksRecommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
])
