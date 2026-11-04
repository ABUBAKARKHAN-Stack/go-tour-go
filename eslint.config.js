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
      // Vendored gluestack-ui alpha components that the app does not use and that
      // do not type-check or lint against React Native 0.88 / React Compiler rules.
      // They are also excluded in tsconfig.json; importing one re-enables checking.
      'components/ui/chat-ai/**',
      'components/ui/image-viewer/**',
      'components/ui/date-time-picker/**',
      'components/ui/bottomsheet/**',
      'components/ui/table/**',
      'components/ui/checkbox/**',
      'components/ui/switch/**',
      'components/ui/calendar/**',
      'components/ui/tabs/**',
    ],
  },
]);
