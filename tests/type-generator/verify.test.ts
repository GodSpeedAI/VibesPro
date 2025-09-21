import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const workspaceRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const cliPath = path.join(
  workspaceRoot,
  'templates/{{project_slug}}/tools/type-generator/cli.js',
);
const fixturesRoot = path.join(
  workspaceRoot,
  'templates/{{project_slug}}/tools/type-generator/test-fixtures',
);
const tempRootBase = path.join(workspaceRoot, 'tests', '.tmp-typegen');

async function createTempDir(prefix: string): Promise<string> {
  await fs.mkdir(tempRootBase, { recursive: true });
  return fs.mkdtemp(path.join(tempRootBase, `${prefix}-`));
}

async function copyFixtureDirectory(source: string, target: string): Promise<void> {
  await fs.mkdir(target, { recursive: true });
  await fs.cp(source, target, { recursive: true });
}

describe('type-generator verify command', () => {
  it('validates fixture parity successfully', async () => {
    const tempDir = await createTempDir('verify-success');
    const tsDir = path.join(tempDir, 'ts');
    const pyDir = path.join(tempDir, 'py');

    await copyFixtureDirectory(path.join(fixturesRoot, 'ts'), tsDir);
    await copyFixtureDirectory(path.join(fixturesRoot, 'py'), pyDir);

    try {
      const { stdout, stderr } = await execFileAsync('node', [cliPath, 'verify', tsDir, pyDir], {
        cwd: workspaceRoot,
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
        encoding: 'utf-8',
      });

      expect(stderr).toBe('');
      expect(stdout).toContain('✅ All types are structurally compatible');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('auto-fixes snake_case fields when --fix is provided', async () => {
    const tempDir = await createTempDir('verify-fix');
    const tsDir = path.join(tempDir, 'ts');
    const pyDir = path.join(tempDir, 'py');

    await copyFixtureDirectory(path.join(fixturesRoot, 'ts'), tsDir);
    await copyFixtureDirectory(path.join(fixturesRoot, 'py'), pyDir);

    try {
      const { stdout } = await execFileAsync(
        'node',
        [cliPath, 'verify', tsDir, pyDir, '--fix'],
        {
          cwd: workspaceRoot,
          env: {
            ...process.env,
            NODE_ENV: 'test',
          },
          encoding: 'utf-8',
        },
      );

      expect(stdout).toContain('✅ All types are structurally compatible');

      const pythonFixturePath = path.join(pyDir, 'User.py');
      const updatedPython = await fs.readFile(pythonFixturePath, 'utf-8');
      expect(updatedPython).toContain('isActive: bool');
      expect(updatedPython).toContain('createdAt: Optional[str]');
      expect(updatedPython).not.toContain('is_active');
      expect(updatedPython).not.toContain('created_at');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('detects type mismatches and reports them', async () => {
    const tempDir = await createTempDir('verify-mismatch');
    const tsDir = path.join(tempDir, 'ts');
    const pyDir = path.join(tempDir, 'py');

    await copyFixtureDirectory(path.join(fixturesRoot, 'ts'), tsDir);
    await copyFixtureDirectory(path.join(fixturesRoot, 'py'), pyDir);

    // Introduce a type mismatch by changing the Python age type
    const pythonFixturePath = path.join(pyDir, 'User.py');
    const pythonContent = await fs.readFile(pythonFixturePath, 'utf-8');
    const modifiedPython = pythonContent.replace('age: int', 'age: str');
    await fs.writeFile(pythonFixturePath, modifiedPython);

    try {
      const { stdout, stderr } = await execFileAsync('node', [cliPath, 'verify', tsDir, pyDir], {
        cwd: workspaceRoot,
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
        encoding: 'utf-8',
      });

      expect(stdout).toContain('❌ Type mismatch detected');
      expect(stdout).toContain('User.age');
      expect(stdout).toContain('TypeScript: number');
      expect(stdout).toContain('Python: str');
      expect(stdout).toContain('❌ Type parity check failed');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('handles missing files gracefully', async () => {
    const tempDir = await createTempDir('verify-missing');
    const tsDir = path.join(tempDir, 'ts');
    const pyDir = path.join(tempDir, 'py');

    await copyFixtureDirectory(path.join(fixturesRoot, 'ts'), tsDir);
    await copyFixtureDirectory(path.join(fixturesRoot, 'py'), pyDir);

    // Remove the Python file
    const pythonFixturePath = path.join(pyDir, 'User.py');
    await fs.unlink(pythonFixturePath);

    try {
      const { stdout, stderr } = await execFileAsync('node', [cliPath, 'verify', tsDir, pyDir], {
        cwd: workspaceRoot,
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
        encoding: 'utf-8',
      });

      expect(stdout).toContain('❌ Missing file');
      expect(stdout).toContain('User.py');
      expect(stdout).toContain('❌ Type parity check failed');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('handles empty directories gracefully', async () => {
    const tempDir = await createTempDir('verify-empty');
    const tsDir = path.join(tempDir, 'ts');
    const pyDir = path.join(tempDir, 'py');

    // Create empty directories
    await fs.mkdir(tsDir, { recursive: true });
    await fs.mkdir(pyDir, { recursive: true });

    try {
      const { stdout, stderr } = await execFileAsync('node', [cliPath, 'verify', tsDir, pyDir], {
        cwd: workspaceRoot,
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
        encoding: 'utf-8',
      });

      expect(stdout).toContain('❌ No TypeScript files found');
      expect(stdout).toContain('❌ Type parity check failed');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('validates multiple files with complex types', async () => {
    const tempDir = await createTempDir('verify-multiple');
    const tsDir = path.join(tempDir, 'ts');
    const pyDir = path.join(tempDir, 'py');

    await copyFixtureDirectory(path.join(fixturesRoot, 'ts'), tsDir);
    await copyFixtureDirectory(path.join(fixturesRoot, 'py'), pyDir);

    // Create additional test files
    const tsProductPath = path.join(tsDir, 'Product.ts');
    const pyProductPath = path.join(pyDir, 'Product.py');

    const tsProductContent = `
export interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  tags: string[];
  metadata: Record<string, any>;
}
`;
    const pyProductContent = `
from typing import List, Dict, Any, Optional

class Product:
    """Product model"""
    id: str
    name: str
    price: float
    in_stock: bool
    tags: List[str]
    metadata: Dict[str, Any]
`;

    await fs.writeFile(tsProductContent, tsProductContent);
    await fs.writeFile(pyProductContent, pyProductContent);

    try {
      const { stdout, stderr } = await execFileAsync('node', [cliPath, 'verify', tsDir, pyDir], {
        cwd: workspaceRoot,
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
        encoding: 'utf-8',
      });

      expect(stderr).toBe('');
      expect(stdout).toContain('✅ All types are structurally compatible');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('reports detailed differences for complex type mismatches', async () => {
    const tempDir = await createTempDir('verify-complex-mismatch');
    const tsDir = path.join(tempDir, 'ts');
    const pyDir = path.join(tempDir, 'py');

    await copyFixtureDirectory(path.join(fixturesRoot, 'ts'), tsDir);
    await copyFixtureDirectory(path.join(fixturesRoot, 'py'), pyDir);

    // Create a complex type mismatch
    const tsProductPath = path.join(tsDir, 'Product.ts');
    const pyProductPath = path.join(pyDir, 'Product.py');

    const tsProductContent = `
export interface Product {
  id: string;
  name: string;
  price: number;
  tags: string[];
}
`;
    const pyProductContent = `
from typing import List, Optional

class Product:
    """Product model"""
    id: str
    name: str
    price: str  # Type mismatch: number vs str
    tags: List[str]
    missing_field: Optional[str]  # Extra field in Python
`;

    await fs.writeFile(tsProductPath, tsProductContent);
    await fs.writeFile(pyProductPath, pyProductContent);

    try {
      const { stdout, stderr } = await execFileAsync('node', [cliPath, 'verify', tsDir, pyDir], {
        cwd: workspaceRoot,
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
        encoding: 'utf-8',
      });

      expect(stdout).toContain('❌ Type mismatch detected');
      expect(stdout).toContain('Product.price');
      expect(stdout).toContain('TypeScript: number');
      expect(stdout).toContain('Python: str');
      expect(stdout).toContain('❌ Extra field in Python: missing_field');
      expect(stdout).toContain('❌ Missing field in TypeScript: missing_field');
      expect(stdout).toContain('❌ Type parity check failed');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('handles union type validation correctly', async () => {
    const tempDir = await createTempDir('verify-union');
    const tsDir = path.join(tempDir, 'ts');
    const pyDir = path.join(tempDir, 'py');

    await copyFixtureDirectory(path.join(fixturesRoot, 'ts'), tsDir);
    await copyFixtureDirectory(path.join(fixturesRoot, 'py'), pyDir);

    // Create union type test files
    const tsUnionPath = path.join(tsDir, 'UnionTypes.ts');
    const pyUnionPath = path.join(pyDir, 'UnionTypes.py');

    const tsUnionContent = `
export interface UnionTypes {
  id: string;
  value: string | number;
  optionalValue?: string | null;
  complexValue: { type: string; data: any } | null;
}
`;
    const pyUnionContent = `
from typing import Union, Optional, Dict, Any

class UnionTypes:
    """Union types test model"""
    id: str
    value: Union[str, int]
    optional_value: Optional[Union[str, None]]
    complex_value: Optional[Dict[str, Any]]
`;

    await fs.writeFile(tsUnionPath, tsUnionContent);
    await fs.writeFile(pyUnionPath, pyUnionContent);

    try {
      const { stdout, stderr } = await execFileAsync('node', [cliPath, 'verify', tsDir, pyDir], {
        cwd: workspaceRoot,
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
        encoding: 'utf-8',
      });

      expect(stderr).toBe('');
      expect(stdout).toContain('✅ All types are structurally compatible');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
