/**
 * @file Nx generator for scaffolding a new backend service with a hexagonal architecture.
 * @author Jules
 *
 * @description
 * This generator creates a new service in the `apps/` directory, pre-configured with a
 * folder structure that adheres to the principles of Hexagonal Architecture (also known as
 * Ports and Adapters). It supports generating services in either Python (with FastAPI) or
 * TypeScript.
 *
 * The generator can intelligently derive default settings, such as the programming language,
 * from the project's resolved tech stack, but this feature is behind a feature flag
 * (`VIBEPDK_USE_STACK_DEFAULTS`).
 *
 * The entire generator is wrapped with `withIdempotency` to ensure that it can be run
 * multiple times without causing unintended side effects.
 */

import { Tree, generateFiles, installPackagesTask, names } from '@nx/devkit';
import * as path from 'path';
import { withIdempotency } from '../../src/generators/utils/idempotency';
import { loadResolvedStack } from '../_utils/stack';
import { deriveServiceDefaults } from '../_utils/stack_defaults';

/**
 * @interface ServiceSchema
 * @description Defines the schema of options that can be passed to the service generator.
 */
interface ServiceSchema {
  /**
   * @property {string} name - The name of the service to be created. This will be used for
   *   the directory name and for various placeholders in the generated files.
   */
  name: string;

  /**
   * @property {'python' | 'typescript'} [language] - The programming language for the new
   *   service. If not provided, it may be derived from the tech stack or a default will be used.
   */
  language?: 'python' | 'typescript';

  /**
   * @property {string} [directory] - An optional directory path where the service should be
   *   created. This is not currently used in the generator logic but is part of the schema.
   */
  directory?: string;
}

/**
 * Normalizes the raw generator schema into a structured and sanitized format.
 *
 * This function handles potentially malformed or incomplete input from the Nx CLI
 * or other sources. It ensures that the `name` is a valid file name and that the
 * `language` option, if present, is one of the allowed values.
 *
 * @param {unknown} schema - The raw options object passed to the generator.
 * @returns {ServiceSchema} A normalized and type-safe schema object.
 */
function normalizeOptions(schema: unknown): ServiceSchema {
  const s = schema && typeof schema === 'object' ? (schema as Record<string, unknown>) : {};
  const rawName = typeof s.name === 'string' ? s.name : 'untitled';
  // Use Nx's `names` utility to convert the raw name into a kebab-case file name.
  const name = names(rawName).fileName;

  return {
    name,
    language:
      s.language === 'python' || s.language === 'typescript'
        ? (s.language as 'python' | 'typescript')
        : undefined,
  };
}

/**
 * Creates the directory structure for a hexagonal architecture.
 *
 * This function generates the standard folders for domain, application, and infrastructure
 * layers, and places a `.gitkeep` file in each to ensure they are tracked by Git even
 * when empty. It also creates an example of a port (`Repository.py`).
 *
 * @param {Tree} tree - The Nx `Tree` object representing the file system.
 * @param {string} projectRoot - The root path of the service where the structure should be created.
 * @returns {Promise<void>}
 */
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

  // Add a placeholder example of a repository port for Python services.
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

/**
 * Scaffolds a new Python service using FastAPI and a hexagonal architecture.
 *
 * @param {Tree} tree - The Nx `Tree` object.
 * @param {ServiceSchema} options - The normalized generator options.
 * @returns {Promise<void>}
 */
async function generatePythonService(tree: Tree, options: ServiceSchema): Promise<void> {
  const serviceRoot = `apps/${options.name}`;

  // Generate files from the Python-specific templates.
  generateFiles(tree, path.join(__dirname, 'files', 'python'), serviceRoot, {
    ...options,
    serviceName: options.name,
  });

  // Add the hexagonal directory structure.
  await addHexagonalStructure(tree, serviceRoot);
}

/**
 * The main entry point for the service generator.
 *
 * This function is wrapped with `withIdempotency` to ensure it can be safely re-run.
 * It normalizes options, optionally derives defaults from the tech stack, and then
 * delegates to the appropriate language-specific generation function.
 *
 * @param {Tree} tree - The Nx `Tree` object.
 * @param {unknown} schema - The raw options for the generator.
 * @returns {Function} A function that, when executed, will install package dependencies.
 */
export default withIdempotency(async function (tree: Tree, schema: unknown) {
  const options = normalizeOptions(schema);

  // Attempt to derive default options from the tech stack if the feature is enabled.
  try {
    const root = tree.root;
    const stack = loadResolvedStack(root);
    if (process.env.VIBEPDK_USE_STACK_DEFAULTS === '1') {
      const defaults = deriveServiceDefaults(stack);
      // Only apply the derived language if one wasn't explicitly provided.
      options.language = options.language ?? defaults.language;
    }
  } catch (e) {
    // This is a best-effort process; never fail the generator if the stack can't be read.
    const message = e instanceof Error ? e.message : String(e);
    console.warn(`Could not derive defaults from tech stack: ${message}`);
  }

  // Fallback to a default language if none is provided or derived.
  const language = options.language ?? 'python';

  if (language === 'python') {
    await generatePythonService(tree, options);
  } else {
    // The default case handles TypeScript service generation.
    const serviceRoot = `apps/${options.name}`;
    generateFiles(tree, path.join(__dirname, 'files', language), serviceRoot, {
      ...options,
      serviceName: options.name,
    });
  }

  // Return a callback to run `pnpm install` after the files are generated.
  return () => {
    installPackagesTask(tree);
  };
});
