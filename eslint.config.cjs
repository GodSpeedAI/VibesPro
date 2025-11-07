const { FlatCompat } = require('@eslint/eslintrc');
const baseConfig = require('./eslint.base.config.cjs');
const js = require('@eslint/js');
const nxEslintPlugin = require('@nx/eslint-plugin');
const tseslint = require('typescript-eslint');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = tseslint.config({
  ...baseConfig,
  plugins: {
    '@nx': nxEslintPlugin,
  },
  extends: [
    ...compat.extends(
      'plugin:@nx/typescript',
    ),
  ],
  rules: {
    '@nx/enforce-module-boundaries': [
      'error',
      {
        enforceBuildableLibDependency: true,
        allow: [],
        depConstraints: [
          {
            sourceTag: 'type:domain',
            onlyDependOnLibsWithTags: ['type:domain'],
          },
          {
            sourceTag: 'type:application',
            onlyDependOnLibsWithTags: ['type:domain', 'type:application'],
          },
          {
            sourceTag: 'type:infrastructure',
            onlyDependOnLibsWithTags: [
              'type:domain',
              'type:application',
              'type:infrastructure',
            ],
          },
        ],
      },
    ],
  },
});
