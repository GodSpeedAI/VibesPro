import jestPreset from '../../jest.preset.mjs';

export default {
  ...jestPreset,
  displayName: 'type-generator',
  testMatch: [
    '<rootDir>/tests/type-generator/**/*.{test,spec}.{ts,js}',
    '<rootDir>/tools/type-generator/**/*.{test,spec}.{ts,js}',
  ],
  collectCoverageFrom: [
    '<rootDir>/tools/type-generator/**/*.{ts,js}',
    '!<rootDir>/tools/type-generator/**/*.d.ts',
    '!<rootDir>/tools/type-generator/dist/**',
    '!<rootDir>/tools/type-generator/node_modules/**',
  ],
  coverageDirectory: '<rootDir>/coverage/tools/type-generator',
  roots: ['<rootDir>'],
  moduleNameMapping: {
    ...jestPreset.moduleNameMapping,
    '^@type-generator/(.*)$': '<rootDir>/tools/type-generator/$1',
  },
};
