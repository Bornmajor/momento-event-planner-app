// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'coverage/*', 'src/core/api/schema.d.ts'],
  },
  {
    rules: {
      // Release builds must print nothing; use src/core/logger.ts (spec §9.2).
      'no-console': 'error',
    },
  },
  {
    files: ['scripts/**', 'jest.setup.ts', '**/__tests__/**'],
    rules: { 'no-console': 'off' },
  },
]);
