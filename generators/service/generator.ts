import { Tree, formatFiles, generateFiles, installPackagesTask, names } from '@nx/devkit';
import * as path from 'path';
import { loadResolvedStack } from '../_utils/stack';
import { deriveServiceDefaults } from '../_utils/stack_defaults';

interface ServiceSchema {
  name: string;
  language?: 'python' | 'typescript';
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

export default async function (tree: Tree, schema: unknown) {
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

  const serviceRoot = `apps/${options.name}`;

  generateFiles(tree, path.join(__dirname, 'files', language), serviceRoot, {
    ...options,
    // properties to use in template files
    serviceName: options.name,
  });

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}
