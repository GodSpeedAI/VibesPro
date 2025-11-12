/**
 * Single, coherent ESLint v9 flat config.
 *
 * Strategy:
 *  - Use @eslint/js recommended base.
 *  - Attempt to use typescript-eslint's flat helper (`typescript-eslint`.configs.recommended)
 *    if available at runtime (some distributions expose it). If not available,
 *    fall back to supplying the parser and plugin from @typescript-eslint packages.
 */
// Minimal flat config that explicitly wires TypeScript parser and plugin.
// This avoids nested helper exports which may contain entries with unexpected
// shapes during migration. We'll expand rules incrementally once this loads.
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

// Small helper: if @typescript-eslint provides an `eslintrc` helper package in
// the future (e.g. `@typescript-eslint/eslintrc` or a `typescript-eslint`
// monorepo export), we can optionally merge its recommended configs here.
// For now we keep the explicit parser/plugin approach to ensure predictable
// shapes for ESLint v9 flat configs.
function maybeApplyTsEslintHelper(configArray) {
  try {
    // Attempt to require the helper if it's installed; helpers usually
    // export `configs.recommended` or similar. If present, merge it into
    // our flat config. We guard the shape carefully to avoid introducing
    // objects that ESLint v9 can't consume.
    // Example helper: @typescript-eslint/eslintrc
    // As a fallback, @typescript-eslint/eslint-plugin exports flat configs
    // under the `configs` key (eg. 'flat/recommended'). If available, we
    // can append those entries directly.
    try {
      const plugin = require('@typescript-eslint/eslint-plugin');
      const flatRecommended = plugin && plugin.configs && plugin.configs['flat/recommended'];
      if (flatRecommended) {
        // `flatRecommended` may be an object or an array of flat entries.
        if (Array.isArray(flatRecommended)) {
          flatRecommended.forEach((entry) => {
            if (entry && (entry.files || entry.rules || entry.plugins || entry.languageOptions)) {
              configArray.push(entry);
            }
          });
        } else if (typeof flatRecommended === 'object') {
          if (
            flatRecommended.files ||
            flatRecommended.rules ||
            flatRecommended.plugins ||
            flatRecommended.languageOptions
          ) {
            configArray.push(flatRecommended);
          }
        }
      }
    } catch (inner) {
      // ignore
    }
  } catch (e) {
    // ignore — helper not installed or incompatible
  }
}

module.exports = (() => {
  const base = [
    // Global ignores - must be first
    {
      ignores: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '.nx/**',
        'tmp/**',
        'test-output/**',
        'tools/reference/**',
        '**/*.js',
        '**/*.d.ts',
        '**/*.sh',
        'apps/*/pages/_app.tsx',
        'tools/test/node-smoke.cjs',
      ],
    },

    // Apply TypeScript-aware parsing & plugin to TS file patterns
    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: tsParser,
        parserOptions: {
          project: ['./tsconfig.json'],
          tsconfigRootDir: __dirname,
        },
      },
      plugins: { '@typescript-eslint': tsPlugin },
      rules: {
        // PHASE-004: Strict Type Safety Rules
        // Ban 'any' types completely
        '@typescript-eslint/no-explicit-any': 'error',

        // Disable type-aware rules that need project references
        // We'll enable these incrementally after fixing violations
        // '@typescript-eslint/no-unsafe-assignment': 'error',
        // '@typescript-eslint/no-unsafe-call': 'error',
        // '@typescript-eslint/no-unsafe-member-access': 'error',
        // '@typescript-eslint/no-unsafe-return': 'error',
        // '@typescript-eslint/no-unsafe-argument': 'error',

        // Enforce explicit types
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
            allowHigherOrderFunctions: true,
          },
        ],

        // Async/Promise safety (disable for now)
        // '@typescript-eslint/no-floating-promises': 'error',
        // '@typescript-eslint/no-misused-promises': 'error',
        // '@typescript-eslint/await-thenable': 'error',
        // '@typescript-eslint/promise-function-async': 'error',

        // Prevent common errors
        '@typescript-eslint/no-unused-vars': [
          'error',
          { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/prefer-nullish-coalescing': 'warn',
        '@typescript-eslint/prefer-optional-chain': 'warn',
        '@typescript-eslint/no-require-imports': 'error',

        // Code quality
        'no-unused-vars': 'off',
        'no-console': 'off',
      },
    },

    // CommonJS scripts (eslint configs, etc)
    {
      files: ['**/*.cjs'],
      languageOptions: { sourceType: 'script' },
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
      },
    },

    // Tests - relax some rules
    {
      files: [
        'tests/**/*.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
      ],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },

    // Generated code and tools - more relaxed
    {
      files: ['tools/reference/**/*.ts', 'generators/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
  ];

  maybeApplyTsEslintHelper(base);
  return base;
})();
