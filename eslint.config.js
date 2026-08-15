import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Require explicit block bodies for all control flow statements; auto-fixes one-liners.
      curly: ['error', 'all'],
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
    rules: {
      'svelte/require-each-key': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '.svelte-kit/', 'dev-dist/'],
  },
);
