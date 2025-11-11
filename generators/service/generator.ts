import { Tree, generateFiles, installPackagesTask, names } from '@nx/devkit';
import * as path from 'path';
import { withIdempotency } from '../../src/generators/utils/idempotency';
import { loadResolvedStack } from '../_utils/stack';
import { deriveServiceDefaults } from '../_utils/stack_defaults';

interface ServiceSchema {
  name: string;
  language?: 'python' | 'typescript';
  directory?: string;
}

function normalizeOptions(schema: unknown): ServiceSchema {
  // Narrow the incoming schema to the expected shape at runtime
  const s = schema && typeof schema === 'object' ? (schema as Record<string, unknown>) : {};
  const rawName = typeof s.name === 'string' ? s.name : 'untitled';
  const name = names(rawName).fileName;

  return {
    name,
    language:
      s.language === 'python' || s.language === 'typescript'
        ? (s.language as 'python' | 'typescript')
        : undefined,
  };
}

async function addHexagonalStructure(tree: Tree, projectRoot: string): Promise<void> {
  const dirs = [
    `${projectRoot}/domain/entities`,
    `${projectRoot}/domain/value_objects`,
    `${projectRoot}/application/ports`,
    `${projectRoot}/application/use_cases`,
    `${projectRoot}/infrastructure/adapters/in_memory`,
    `${projectRoot}/infrastructure/adapters/supabase`,
  ];

  dirs.forEach((dir) => {
    const gitkeepPath = `${dir}/.gitkeep`;
    if (!tree.exists(gitkeepPath)) {
      tree.write(gitkeepPath, '');
    }
  });

  // Add port example (Repository protocol)
  const portPath = `${projectRoot}/application/ports/repository.py`;
  if (!tree.exists(portPath)) {
    tree.write(
      portPath,
      `"""Repository port for domain entities"""
from typing import Protocol, TypeVar

T = TypeVar('T')


class Repository(Protocol[T]):
    """Base repository protocol for data persistence"""

    async def find_by_id(self, id: str) -> T | None:
        """Find entity by ID"""
        ...

    async def save(self, entity: T) -> None:
        """Save entity"""
        ...
`,
    );
  }
}

async function generatePythonService(tree: Tree, options: ServiceSchema): Promise<void> {
  const serviceRoot = `apps/${options.name}`;

  // Template-based generation with FastAPI structure
  // TODO: Integrate @nxlv/python:uv-project when running in full Nx workspace
  // This requires externalSchematic() which isn't available in the current setup
  generateFiles(tree, path.join(__dirname, 'files', 'python'), serviceRoot, {
    ...options,
    serviceName: options.name,
  });

  // Add hexagonal architecture directories
  await addHexagonalStructure(tree, serviceRoot);
}

export default withIdempotency(async function (tree: Tree, schema: unknown) {
  const options = normalizeOptions(schema);

  // Optional: seed defaults from resolved tech stack (if present)
  try {
    const root = tree.root;
    const stack = loadResolvedStack(root);
    // Feature flag: only use derived defaults when explicitly enabled
    if (process.env.VIBEPDK_USE_STACK_DEFAULTS === '1') {
      const defaults = deriveServiceDefaults(stack);
      options.language = options.language ?? defaults.language;
    }
  } catch (e) {
    // Best-effort only; never fail generator on missing stack, but log a warning.
    if (e instanceof Error) {
      console.warn(`Could not derive defaults from tech stack: ${e.message}`);
    } else {
      console.warn(`Could not derive defaults from tech stack: ${String(e)}`);
    }
  }

  // Ensure language has a default value to satisfy TypeScript
  const language = options.language ?? 'python';

  if (language === 'python') {
    await generatePythonService(tree, options);
  } else {
    // TypeScript service generation (existing template-based approach)
    const serviceRoot = `apps/${options.name}`;
    generateFiles(tree, path.join(__dirname, 'files', language), serviceRoot, {
      ...options,
      serviceName: options.name,
    });
  }

  return () => {
    installPackagesTask(tree);
  };
});
