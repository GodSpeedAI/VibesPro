import { Tree, formatFiles, installPackagesTask, generateFiles, names } from '@nx/devkit';
import * as path from 'path';
import { getCategory, loadResolvedStack } from '../_utils/stack';
import { deriveServiceDefaults } from '../_utils/stack_defaults';

interface ServiceSchema {
  name: string;
  language?: 'python' | 'typescript';
}

function normalizeOptions(schema: any): ServiceSchema {
  const name = names(schema.name).fileName;
  return {
    ...schema,
    name,
  };
}

export default async function (tree: Tree, schema: any) {
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
    console.warn(`Could not derive defaults from tech stack: ${e.message}`);
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
