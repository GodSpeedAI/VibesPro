/**
 * @file Meta-generator for scaffolding new Nx generators.
 * @description
 * This is the "generator that creates generators" - enabling JIT (Just-In-Time)
 * creation of bespoke Nx generators for the VibesPro platform.
 *
 * When an AI agent or developer needs a new generator that doesn't exist,
 * they can scaffold it using this meta-generator, then customize the templates.
 *
 * @example
 * ```bash
 * # Create a basic custom generator
 * pnpm exec nx g @vibepro/generator:generator my-feature
 *
 * # Create a domain generator with hexagonal patterns
 * pnpm exec nx g @vibepro/generator:generator order-aggregate \
 *   --type=domain --withHexagonal=true
 *
 * # Create a composed generator that wraps official Nx generators
 * pnpm exec nx g @vibepro/generator:generator web-feature \
 *   --type=component --withComposition=true \
 *   --compositionGenerators="@nx/react:lib,@nx/react:component"
 * ```
 *
 * @traceability DEV-PRD-019, DEV-ADR-019
 */

import {
  GeneratorCallback,
  Tree,
  formatFiles,
  generateFiles,
  joinPathFragments,
  logger,
  names,
} from '@nx/devkit';
import * as fs from 'fs';
import * as path from 'path';
import { GeneratorGeneratorOptions } from './schema.d';

/**
 * Normalized options with computed properties.
 */
interface NormalizedSchema extends GeneratorGeneratorOptions {
  generatorRoot: string;
  className: string;
  propertyName: string;
  fileName: string;
  constantName: string;
  parsedTags: string[];
  parsedCompositionGenerators: string[];
}

/**
 * Normalize raw schema options into computed properties.
 */
function normalizeOptions(options: GeneratorGeneratorOptions): NormalizedSchema {
  const generatorNames = names(options.name);
  const directory = options.directory ? names(options.directory).fileName : '';
  const generatorRoot = directory
    ? joinPathFragments('generators', directory, generatorNames.fileName)
    : joinPathFragments('generators', generatorNames.fileName);

  // Parse comma-separated values
  const parsedTags = options.tags
    ? options.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const parsedCompositionGenerators = options.compositionGenerators
    ? options.compositionGenerators
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean)
    : [];

  return {
    ...options,
    type: options.type ?? 'custom',
    description: options.description ?? `Generator for ${options.name}`,
    targetScope: options.targetScope ?? 'libs',
    withComposition: options.withComposition ?? false,
    withHexagonal: options.withHexagonal ?? false,
    withTests: options.withTests ?? true,
    withSpec: options.withSpec ?? true,
    generatorRoot,
    className: generatorNames.className,
    propertyName: generatorNames.propertyName,
    fileName: generatorNames.fileName,
    constantName: generatorNames.constantName.toUpperCase(),
    parsedTags,
    parsedCompositionGenerators,
  };
}

/**
 * Validate the generator options.
 */
function validateOptions(options: NormalizedSchema): void {
  // Validate name is kebab-case
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(options.name)) {
    throw new Error(
      `Generator name "${options.name}" must be kebab-case (e.g., "my-feature", "order-item")`,
    );
  }

  // Validate composition generators if composition is enabled
  if (options.withComposition && options.parsedCompositionGenerators.length === 0) {
    throw new Error('When --withComposition is true, you must provide --compositionGenerators');
  }

  // Validate directory doesn't escape
  if (options.directory) {
    const normalized = path.normalize(options.directory);
    if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
      throw new Error('Directory cannot be absolute or contain ".." segments that escape root');
    }
  }
}

/**
 * Check if generator already exists and handle accordingly.
 */
function checkExisting(tree: Tree, options: NormalizedSchema): void {
  const generatorFile = joinPathFragments(options.generatorRoot, 'generator.ts');
  if (tree.exists(generatorFile)) {
    logger.warn(
      `Generator "${options.name}" already exists at ${options.generatorRoot}. ` +
        `Files will be updated idempotently.`,
    );
  }
}

/**
 * Get template variables based on generator type.
 */
function getTypeSpecificVariables(options: NormalizedSchema): Record<string, unknown> {
  const typeDefaults: Record<string, Record<string, unknown>> = {
    custom: {
      defaultTargetPath: 'libs/<name>',
      exampleOptions: [],
    },
    domain: {
      defaultTargetPath: 'libs/<scope>/<name>',
      exampleOptions: [
        { name: 'entity', type: 'string', description: 'Domain entity name' },
        {
          name: 'aggregate',
          type: 'boolean',
          description: 'Is this an aggregate root?',
          default: false,
        },
      ],
      layerStructure: ['domain/entities', 'domain/value-objects', 'domain/events'],
    },
    service: {
      defaultTargetPath: 'apps/<name>',
      exampleOptions: [
        { name: 'language', type: 'enum', values: ['python', 'typescript'], default: 'python' },
        { name: 'port', type: 'number', description: 'Service port', default: 3000 },
      ],
      includeInfrastructure: true,
    },
    component: {
      defaultTargetPath: 'libs/<scope>/ui/<name>',
      exampleOptions: [
        {
          name: 'style',
          type: 'enum',
          values: ['css', 'scss', 'styled-components'],
          default: 'css',
        },
        { name: 'withStories', type: 'boolean', default: true },
      ],
      frontendFocused: true,
    },
    adapter: {
      defaultTargetPath: 'libs/<scope>/infrastructure/<name>',
      exampleOptions: [
        {
          name: 'backend',
          type: 'enum',
          values: ['postgres', 'http', 'memory'],
          default: 'memory',
        },
        { name: 'entity', type: 'string', description: 'Entity this adapter serves' },
      ],
      requiresPort: true,
    },
    utility: {
      defaultTargetPath: 'libs/shared/<name>',
      exampleOptions: [{ name: 'publishable', type: 'boolean', default: false }],
      simpleStructure: true,
    },
  };

  const typeKey = options.type ?? 'custom';
  const defaultFallback: Record<string, unknown> = {
    defaultTargetPath: 'libs/<name>',
    exampleOptions: [],
  };
  return typeDefaults[typeKey] ?? defaultFallback;
}

/**
 * Generate the core generator files from templates.
 */
function generateCoreFiles(tree: Tree, options: NormalizedSchema): void {
  const templatePath = path.join(__dirname, 'files', 'core');
  const typeVariables = getTypeSpecificVariables(options);

  generateFiles(tree, templatePath, options.generatorRoot, {
    ...options,
    ...typeVariables,
    template: '', // Removes __template__ suffix
    dot: '.', // For .gitkeep files
    tmpl: '', // Removes .template suffix
  });

  // Create nested output templates programmatically to avoid EJS processing issues
  createOutputTemplates(tree, options);
}

/**
 * Create the files/ directory templates that the generated generator will use.
 * These are written directly to avoid EJS processing of nested template syntax.
 */
function createOutputTemplates(tree: Tree, options: NormalizedSchema): void {
  const filesDir = joinPathFragments(options.generatorRoot, 'files');

  // src/index.ts template
  tree.write(
    joinPathFragments(filesDir, 'src', 'index.ts.template'),
    `// <%= className %> - Generated by @vibespro/${options.fileName}
export {};
`,
  );

  // project.json template
  tree.write(
    joinPathFragments(filesDir, 'project.json.template'),
    `{
  "name": "<%= projectName %>",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "sourceRoot": "<%= projectRoot %>/src",
  "tags": [],
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/<%= projectRoot %>",
        "main": "<%= projectRoot %>/src/index.ts",
        "tsConfig": "<%= projectRoot %>/tsconfig.lib.json"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    }
  }
}
`,
  );

  // README.md template
  tree.write(
    joinPathFragments(filesDir, 'README.md.template'),
    `# <%= className %>
> Generated by @vibespro/${options.fileName}

## Overview

TODO: Add description

## Usage

\`\`\`typescript
import { } from '<%= projectName %>';
\`\`\`

## API

TODO: Document the public API
`,
  );
}

/**
 * Generate hexagonal structure templates if requested.
 */
function generateHexagonalFiles(tree: Tree, options: NormalizedSchema): void {
  if (!options.withHexagonal) return;

  const templatePath = path.join(__dirname, 'files', 'hexagonal');

  // If hexagonal templates don't exist yet, skip with a warning
  if (!fs.existsSync(templatePath)) {
    logger.warn(`Hexagonal templates not found at ${templatePath}. Skipping hexagonal generation.`);
    return;
  }

  generateFiles(tree, templatePath, joinPathFragments(options.generatorRoot, 'files'), {
    ...options,
    template: '',
    tmpl: '',
  });
}

/**
 * Generate composition patterns if requested.
 */
function generateCompositionFiles(tree: Tree, options: NormalizedSchema): void {
  if (!options.withComposition) return;

  const templatePath = path.join(__dirname, 'files', 'composition');
  if (!fs.existsSync(templatePath)) {
    // Composition templates are embedded in core
    return;
  }

  generateFiles(tree, templatePath, options.generatorRoot, {
    ...options,
    template: '',
    tmpl: '',
  });
}

/**
 * Generate test files if requested.
 */
function generateTestFiles(tree: Tree, options: NormalizedSchema): void {
  if (!options.withTests) return;

  const templatePath = path.join(__dirname, 'files', 'tests');

  generateFiles(tree, templatePath, options.generatorRoot, {
    ...options,
    template: '',
    tmpl: '',
  });
}

/**
 * Generate spec documentation if requested.
 */
function generateSpecFile(tree: Tree, options: NormalizedSchema): void {
  if (!options.withSpec) return;

  const templatePath = path.join(__dirname, 'files', 'spec');
  const specTarget = 'docs/specs/generators';

  generateFiles(tree, templatePath, specTarget, {
    ...options,
    template: '',
    tmpl: '',
  });
}

/**
 * Create a generator-specific generators.json inside the new generator directory if it doesn't exist.
 */
function updateGeneratorsCollection(tree: Tree, options: NormalizedSchema): void {
  // This generator has its own generators.json, so we just ensure it's valid
  const collectionPath = joinPathFragments(options.generatorRoot, 'generators.json');

  if (!tree.exists(collectionPath)) {
    const collection = {
      $schema: 'https://json.schemastore.org/nx-collection',
      name: options.fileName,
      version: '1.0.0',
      generators: {
        [options.fileName]: {
          factory: './generator',
          schema: './schema.json',
          description: options.description,
        },
      },
    };
    tree.write(collectionPath, JSON.stringify(collection, null, 2));
  }
}

/**
 * Main generator function.
 */
export async function generatorGenerator(
  tree: Tree,
  schema: GeneratorGeneratorOptions,
): Promise<GeneratorCallback> {
  const options = normalizeOptions(schema);

  logger.info(`🔧 Creating generator: ${options.name}`);
  logger.info(`   Type: ${options.type}`);
  logger.info(`   Location: ${options.generatorRoot}`);

  // Validate
  validateOptions(options);

  // Check existing
  checkExisting(tree, options);

  // Generate files
  generateCoreFiles(tree, options);
  generateHexagonalFiles(tree, options);
  generateCompositionFiles(tree, options);
  generateTestFiles(tree, options);
  generateSpecFile(tree, options);

  // Update collection
  updateGeneratorsCollection(tree, options);

  // Format
  await formatFiles(tree);

  return () => {
    logger.info('');
    logger.info('✅ Generator created successfully!');
    logger.info('');
    logger.info('Next steps:');
    logger.info(`  1. Customize templates in: ${options.generatorRoot}/files/`);
    logger.info(`  2. Update schema options in: ${options.generatorRoot}/schema.json`);
    logger.info(
      `  3. Run your generator: pnpm exec nx g @vibespro/${options.fileName}:${options.fileName} test`,
    );
    if (options.withSpec) {
      logger.info(
        `  4. Review/update spec: docs/specs/generators/${options.fileName}.generator.spec.md`,
      );
    }
    if (options.withTests) {
      logger.info(
        `  5. Run tests: pnpm exec vitest run ${options.generatorRoot}/generator.spec.ts`,
      );
    }
  };
}

export default generatorGenerator;
