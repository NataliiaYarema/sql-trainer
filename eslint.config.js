import js from '@eslint/js';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

export default [
  { ignores: ['dist/**', 'tmp/**'] },

  js.configs.recommended,

  // src/ виконується в браузері через Vite
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: globals.browser,
    },
  },

  // tests/ виконується звичайним node, без DOM
  {
    files: ['tests/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: globals.node,
    },
  },

  // вимикає правила ESLint, які конфліктують з форматуванням Prettier
  prettierConfig,
];
