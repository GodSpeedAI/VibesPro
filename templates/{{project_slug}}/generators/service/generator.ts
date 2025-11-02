/**
 * Service Generator - Stack-Aware Nx Generator
 *
 * Generates a new service application with language-specific scaffolding.
 * Can automatically derive defaults from techstack.yaml when VIBEPRO_USE_STACK_DEFAULTS=1
 *
 * Traceability: AI_ADR-004, AI_PRD-004, AI_SDS-003, AI_TS-002
 *
 * @example
 * // Manual language selection
 * nx generate service my-api --language=typescript
 *
 * @example
 * // Auto-detect from tech stack
 * VIBEPRO_USE_STACK_DEFAULTS=1 nx generate service my-api
 */
import { formatFiles, generateFiles, installPackagesTask, names, Tree } from '@nx/devkit';
import * as path from 'path';
import { loadResolvedStack } from '../_utils/stack';
import { deriveServiceDefaults, ServiceDefaults } from '../_utils/stack_defaults';

/**
 * Schema for service generator options
 */
interface ServiceSchema {
  /** Name of the service (will be normalized to kebab-case) */
  name: string;
  /** Programming language for the service (python or typescript) */
  language?: 'python' | 'typescript';
}

/**
 * Normalized options with validated name
 */
interface NormalizedServiceSchema extends ServiceSchema {
  name: string;
  language: 'python' | 'typescript';
  serviceName: string;
}

/**
 * Normalize and validate generator options
 * @param schema - Raw schema from CLI or config
 * @returns Normalized schema with kebab-case name
 */
function normalizeOptions(schema: any): ServiceSchema {
  const name = names(schema.name).fileName;
  return {
    ...schema,
    name,
  };
}

/**
 * Main generator function - creates a new service application
 *
 * @param tree - Nx virtual file system tree
 * @param schema - Generator options from CLI or config
 * @returns Async function to install packages after generation
 */
export default async function serviceGenerator(tree: Tree, schema: any) {
  const options = normalizeOptions(schema);

  // Attempt to derive defaults from tech stack configuration
  let derivedDefaults: ServiceDefaults | null = null;
  const useStackDefaults = process.env.VIBEPRO_USE_STACK_DEFAULTS === '1';

  if (useStackDefaults) {
    try {
      const root = tree.root;
      const stack = loadResolvedStack(root);

      if (stack) {
        derivedDefaults = deriveServiceDefaults(stack);
        options.language = options.language ?? derivedDefaults.language;
        console.log(`✓ Derived service defaults from tech stack: ${derivedDefaults.language}`);
      } else {
        console.warn('⚠ Tech stack configuration not found, using default language: python');
      }
    } catch (e) {
      // Best-effort only; never fail generator on missing/invalid stack
      const error = e as Error;
      console.warn(
        `⚠ Could not derive defaults from tech stack: ${error.message || 'unknown error'}`,
      );
      console.warn('  Falling back to default language: python');
    }
  }

  // Ensure language has a default value
  const language = options.language ?? 'python';

  // Validate language selection
  if (language !== 'python' && language !== 'typescript') {
    throw new Error(`Invalid language: ${language}. Must be 'python' or 'typescript'.`);
  }

  const serviceRoot = `apps/${options.name}`;

  // Generate service files from templates
  const templateOptions: NormalizedServiceSchema = {
    ...options,
    language,
    serviceName: options.name,
  };

  generateFiles(tree, path.join(__dirname, 'files', language), serviceRoot, templateOptions);

  // Format all generated files
  await formatFiles(tree);

  // Return post-generation task to install packages
  return () => {
    installPackagesTask(tree);
  };
}
