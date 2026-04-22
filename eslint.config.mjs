// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  eslintPluginPrettierRecommended,
  eslintPluginUnicorn.configs.all,
  {
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'prettier/prettier': 'error',
      'unicorn/better-regex': 'warn',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/no-null': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      curly: ['error', 'all'],
      'no-console': 'off',
    },
  },
  {
    // The CLI is allowed to log; it's its entire job.
    files: ['src/cli.ts', 'src/adapters/print.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
