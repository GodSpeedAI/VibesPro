import type { Dirent } from 'fs';

jest.mock('fs/promises', () => {
  const actual = jest.requireActual<typeof import('fs/promises')>('fs/promises');
  return {
    ...actual,
    rm: jest.fn(actual.rm),
    writeFile: jest.fn(actual.writeFile),
    mkdir: jest.fn(actual.mkdir),
    readdir: jest.fn(actual.readdir),
  };
});

import * as fs from 'fs/promises';
const realFs = jest.requireActual<typeof import('fs/promises')>('fs/promises');
import {
  buildYaml,
  cleanupGeneratorOutputs,
  resetGeneratorTracking,
  runGenerator,
  serializeValue,
} from './utils';

describe('serializeValue', () => {
  it('serializes string values with quotes', () => {
    expect(serializeValue('name', 'John')).toBe('name: "John"');
  });

  it('serializes numeric values without quotes', () => {
    expect(serializeValue('age', 30)).toBe('age: 30');
  });

  it('serializes boolean values without quotes', () => {
    expect(serializeValue('active', true)).toBe('active: true');
  });

  it('serializes null as literal null', () => {
    expect(serializeValue('metadata', null)).toBe('metadata: null');
  });

  it('serializes undefined as null to maintain stable YAML keys', () => {
    expect(serializeValue('missing', undefined)).toBe('missing: null');
  });

  it('serializes empty arrays inline', () => {
    expect(serializeValue('items', [])).toBe('items: []');
  });

  it('serializes array of primitives on multiple lines', () => {
    expect(serializeValue('tags', ['a', 'b'])).toBe('tags:\n  - "a"\n  - "b"');
  });

  it('serializes objects with nested key-value pairs', () => {
    expect(serializeValue('config', { enabled: true })).toBe('config:\n  enabled: true');
  });
});

describe('buildYaml', () => {
  it('builds YAML from heterogeneous data', () => {
    const yaml = buildYaml({
      name: 'Test',
      age: 42,
      active: false,
      tags: ['x', 'y'],
      empty: [],
      optional: undefined,
      metadata: null,
      config: { retries: 3 },
    });

    expect(yaml).toContain('name: "Test"');
    expect(yaml).toContain('age: 42');
    expect(yaml).toContain('active: false');
    expect(yaml).toContain('tags:\n  - "x"\n  - "y"');
    expect(yaml).toContain('empty: []');
    expect(yaml).toContain('optional: null');
    expect(yaml).toContain('metadata: null');
    expect(yaml).toContain('config:\n  retries: 3');
  });
});

describe('runGenerator Error Handling', () => {
  beforeEach(async () => {
    // Clean up any existing test outputs before each test
    await cleanupGeneratorOutputs();
    resetGeneratorTracking();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupGeneratorOutputs();
    resetGeneratorTracking();
    delete process.env.COPIER_COMMAND;
  });

  it('should handle copier command not found', async () => {
    // Set an invalid copier command to simulate command not found
    process.env.COPIER_COMMAND = 'invalid-copier-command-that-does-not-exist';

    const result = await runGenerator('app', {
      name: 'test-app',
      framework: 'next',
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.files).toEqual([]);
    expect(result.errorMessage).toContain('Command failed');
  });

  it('should handle invalid generator type', async () => {
    const result = await runGenerator('invalid-generator-type', {
      name: 'test-app',
      framework: 'next',
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.files).toEqual([]);
    expect(result.errorMessage).toContain('Command failed');
  });

  it('should handle missing required parameters', async () => {
    const result = await runGenerator('app', {});

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.files).toEqual([]);
    expect(result.errorMessage).toContain('Command failed');
  });

  it('should handle invalid framework parameter', async () => {
    const result = await runGenerator('app', {
      name: 'test-app',
      framework: 'invalid-framework',
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.files).toEqual([]);
    expect(result.errorMessage).toContain('Command failed');
  });

  it('should handle file system errors during cleanup', async () => {
    const rmMock = jest.mocked(fs.rm);
    rmMock.mockRejectedValueOnce(new Error('Permission denied'));

    try {
      const result = await runGenerator('app', {
        name: 'test-app',
        framework: 'next',
      });

      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      expect(result.files.length).toBeGreaterThan(0);
    } finally {
      rmMock.mockImplementation(realFs.rm);
    }
  });

  it('should handle YAML file creation errors', async () => {
    const writeMock = jest.mocked(fs.writeFile);
    writeMock.mockRejectedValueOnce(new Error('Disk full'));

    try {
      const result = await runGenerator('app', {
        name: 'test-app',
        framework: 'next',
      });

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBeDefined();
      expect(result.files).toEqual([]);
      expect(result.errorMessage).toContain('Disk full');
    } finally {
      writeMock.mockImplementation(realFs.writeFile);
    }
  });

  it('should handle directory creation errors', async () => {
    const mkdirMock = jest.mocked(fs.mkdir);
    mkdirMock.mockRejectedValueOnce(new Error('Permission denied'));

    try {
      const result = await runGenerator('app', {
        name: 'test-app',
        framework: 'next',
      });

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBeDefined();
      expect(result.files).toEqual([]);
      expect(result.errorMessage).toContain('Permission denied');
    } finally {
      mkdirMock.mockImplementation(realFs.mkdir);
    }
  });

  it('should handle file collection errors', async () => {
    const readdirMock = jest.mocked(fs.readdir);
    readdirMock.mockResolvedValueOnce([
      {
        name: 'temp-directory',
        isDirectory: () => true,
        isFile: () => false,
        isSymbolicLink: () => false,
      } as unknown as Dirent,
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);
    readdirMock.mockRejectedValueOnce(new Error('Permission denied'));

    try {
      const result = await runGenerator('app', {
        name: 'test-app',
        framework: 'next',
      });

      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
    } finally {
      readdirMock.mockImplementation(realFs.readdir);
    }
  });
});
