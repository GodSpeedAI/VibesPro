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
                    if (flatRecommended.files || flatRecommended.rules || flatRecommended.plugins || flatRecommended.languageOptions) {
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
        // Apply TypeScript-aware parsing & plugin to JS/TS file patterns
        {
            files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
            languageOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                parser: tsParser,
            },
            plugins: { '@typescript-eslint': tsPlugin },
            rules: {
                // conservative baseline
                // disable base rule in favor of the TypeScript-aware version
                'no-unused-vars': 'off',
                '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
                'no-console': 'off'
            }
        },

        // Keep a small override for CommonJS scripts
        {
            files: ['**/*.cjs'],
            languageOptions: { sourceType: 'script' }
        },

        // Silence unused-vars in type declaration files — these often contain
        // exported types where local names are intentionally unused.
        {
            files: ['**/*.d.ts'],
            rules: {
                '@typescript-eslint/no-unused-vars': 'off',
                'no-unused-vars': 'off'
            }
        },

        // Tests and fixtures frequently define variables that are intentionally
        // unused (setup, placeholders). Relax unused-vars for tests.
        {
            files: ['tests/**', 'tests/*', '**/*.spec.ts', '**/*.test.ts', '**/*.spec.js', '**/*.test.js'],
            rules: {
                '@typescript-eslint/no-unused-vars': 'off'
            }
        },

        // Generated templates and tooling often have scaffolding with unused
        // variables; relax unused-vars there to avoid noisy warnings.
        {
            files: ['templates/**', 'tools/**', 'generators/**'],
            rules: {
                '@typescript-eslint/no-unused-vars': 'off',
                'no-unused-vars': 'off'
            }
        },

        // Global ignores instead of .eslintignore
        { ignores: ['node_modules/**', 'dist/**', 'coverage/**'] }
    ];

    maybeApplyTsEslintHelper(base);
    return base;
})();
