// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// Layer boundaries (spec §12.1). A feature reaches another feature only through its public index
// (`@/features/<name>`); its own files use relative imports.
const otherFeatureInternals = {
  group: ['@/features/*/**'],
  message: "Import another feature through its public index ('@/features/<name>'), not its internals (spec §12.1).",
};
// domain/ holds models, rules, ports and use cases: no data or presentation code, and no UI or state libraries.
const domainLeaks = {
  group: ['**/data', '**/data/**', '**/presentation', '**/presentation/**'],
  message: 'domain/ must not import data/ or presentation/: receive what you need through ports (spec §12.1).',
};
const domainLibraries = [
  'react',
  'react-native',
  'zustand',
  '@tanstack/react-query',
  'expo-router',
].map((name) => ({ name, message: 'domain/ is plain TypeScript: no React, state or navigation libraries (spec §12.1).' }));

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
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: [otherFeatureInternals] }] },
  },
  {
    files: ['src/features/*/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: domainLibraries, patterns: [otherFeatureInternals, domainLeaks] }],
    },
  },
  {
    files: ['src/core/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@/features', '@/features/**'], message: 'core/ and components/ never import features (spec §12.1).' }] },
      ],
    },
  },
  {
    files: ['scripts/**', 'jest.setup.ts', '**/__tests__/**'],
    rules: { 'no-console': 'off' },
  },
]);
