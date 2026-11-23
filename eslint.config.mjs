import js from '@eslint/js';
import cypress from 'eslint-plugin-cypress/flat';
import globals from 'globals';

const cypressRecommended = cypress.configs.recommended;

export default [
  { ignores: ['node_modules/**', 'reports/**', 'jira-export/**'] },
  js.configs.recommended,
  {
    // Cypress specs, page objects and commands (ES modules)
    ...cypressRecommended,
    files: ['cypress/**/*.js'],
    languageOptions: {
      ...cypressRecommended.languageOptions,
      sourceType: 'module',
      globals: {
        ...cypressRecommended.languageOptions?.globals,
        ...globals.browser,
        ...globals.mocha,
      },
    },
  },
  {
    // Node scripts (CommonJS)
    files: ['cypress.config.js', 'postman/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
];
