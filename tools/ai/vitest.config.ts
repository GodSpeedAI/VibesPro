import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/**/*.{test,spec}.ts',
      'generators/**/*.{test,spec}.ts',
      'tools/**/*.{test,spec}.ts',
      'libs/**/*.{test,spec}.ts',
    ],
    setupFiles: ['tests/setup/vitest.setup.ts'],
  },
  server: {
    deps: {
      inline: ['@nx/devkit'],
    },
  },
});
