// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      // Supabase Edge Functions run on Deno, not in the app bundle.
      'supabase/functions/**',
    ],
  },
  {
    // Unit tests run with Bun's built-in test runner.
    files: ['**/*.test.ts', 'test/**/*.ts'],
    rules: { 'import/no-unresolved': ['error', { ignore: ['^bun:'] }] },
  },
]);
