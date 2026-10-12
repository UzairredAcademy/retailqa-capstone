import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import cypress from 'eslint-plugin-cypress/flat';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules/**', 'reports/**', 'jira-export/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['cypress/**/*.ts'],
    ...cypress.configs.recommended,
  },
  {
    files: ['postman/**/*.js', 'cypress.config.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
