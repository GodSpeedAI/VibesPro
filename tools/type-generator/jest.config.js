const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const workspaceConfig = require(path.join(ROOT_DIR, 'jest.config.json'));

const SHARED_KEYS = [
  'testEnvironment',
  'setupFilesAfterEnv',
  'moduleFileExtensions',
  'transformIgnorePatterns',
  'testPathIgnorePatterns',
  'clearMocks',
  'restoreMocks',
];

const sharedConfig = SHARED_KEYS.reduce((acc, key) => {
  if (workspaceConfig[key] !== undefined) {
    acc[key] = workspaceConfig[key];
  }
  return acc;
}, {});

module.exports = {
  ...sharedConfig,
  rootDir: ROOT_DIR,
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
  extensionsToTreatAsEsm: workspaceConfig.extensionsToTreatAsEsm ?? [],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: path.join(ROOT_DIR, 'tsconfig.spec.json'),
        useESM: false,
      },
    ],
  },
  moduleNameMapper: {
    ...(workspaceConfig.moduleNameMapper ?? {}),
    '^@type-generator/(.*)$': '<rootDir>/tools/type-generator/$1',
  },
};
