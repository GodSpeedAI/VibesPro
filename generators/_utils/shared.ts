/**
 * @file Shared utilities for Nx generators in the VibesPro platform.
 * @description
 * This module provides common functions and types that are shared across
 * all VibesPro generators, reducing code duplication and ensuring consistency.
 *
 * @module generators/_utils/shared
 * @traceability DEV-PRD-019
 */

import { Tree, joinPathFragments, logger, names } from '@nx/devkit';

/**
 * Common options that all generators share.
 */
export interface BaseGeneratorOptions {
  /** Name of the item being generated (kebab-case) */
  name: string;
  /** Optional directory to place the generated files */
  directory?: string;
  /** Tags for the generated project */
  tags?: string;
}

/**
 * Extended options for normalized generator schemas.
 */
export interface NormalizedBaseOptions extends BaseGeneratorOptions {
  /** Transformed name variants */
  className: string;
  propertyName: string;
  fileName: string;
  constantName: string;
  /** Parsed tags as array */
  parsedTags: string[];
  /** Root path where files will be generated */
  projectRoot: string;
}

/**
 * Validates that a name is kebab-case.
 *
 * @param name - The name to validate
 * @throws Error if the name is not valid kebab-case
 */
export function validateKebabCase(name: string): void {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`Name "${name}" must be kebab-case (e.g., "my-feature", "order-item")`);
  }
}

/**
 * Normalizes base options that most generators need.
 *
 * @param rawOptions - Raw options from generator schema
 * @param scope - Target scope ('apps', 'libs', 'tools', 'generators')
 * @returns Normalized options with computed properties
 */
export function normalizeBaseOptions<T extends BaseGeneratorOptions>(
  rawOptions: T,
  scope: 'apps' | 'libs' | 'tools' | 'generators' = 'libs',
): T & NormalizedBaseOptions {
  const generatorNames = names(rawOptions.name);
  const directory = rawOptions.directory ? names(rawOptions.directory).fileName : '';

  let projectRoot: string;
  if (directory) {
    projectRoot = joinPathFragments(scope, directory, generatorNames.fileName);
  } else {
    projectRoot = joinPathFragments(scope, generatorNames.fileName);
  }

  const parsedTags = rawOptions.tags
    ? rawOptions.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return {
    ...rawOptions,
    className: generatorNames.className,
    propertyName: generatorNames.propertyName,
    fileName: generatorNames.fileName,
    constantName: generatorNames.constantName.toUpperCase(),
    parsedTags,
    projectRoot,
  };
}

/**
 * Creates a .gitkeep file in a directory to ensure it's tracked by Git.
 *
 * @param tree - Nx virtual file system
 * @param dirPath - Directory path to add .gitkeep to
 */
export function ensureGitkeep(tree: Tree, dirPath: string): void {
  const gitkeepPath = joinPathFragments(dirPath, '.gitkeep');
  if (!tree.exists(gitkeepPath)) {
    tree.write(gitkeepPath, '');
  }
}

/**
 * Creates multiple directories with .gitkeep files.
 *
 * @param tree - Nx virtual file system
 * @param basePath - Base path for the directories
 * @param subdirs - Array of subdirectory paths relative to basePath
 */
export function createDirectoryStructure(tree: Tree, basePath: string, subdirs: string[]): void {
  for (const subdir of subdirs) {
    ensureGitkeep(tree, joinPathFragments(basePath, subdir));
  }
}

/**
 * Logs generator progress with consistent formatting.
 *
 * @param name - Name of what's being generated
 * @param type - Type of generator
 * @param location - Location where files are being generated
 */
export function logGeneratorStart(name: string, type: string, location: string): void {
  logger.info(`🔧 Creating ${type}: ${name}`);
  logger.info(`   Location: ${location}`);
}

/**
 * Logs generator completion with next steps.
 *
 * @param projectRoot - Root path of the generated project
 * @param additionalSteps - Additional next steps to show
 */
export function logGeneratorComplete(projectRoot: string, additionalSteps: string[] = []): void {
  logger.info('');
  logger.info('✅ Generation complete!');
  logger.info('');
  logger.info('Next steps:');
  logger.info(`  1. Review generated files in: ${projectRoot}`);

  let stepNum = 2;
  for (const step of additionalSteps) {
    logger.info(`  ${stepNum}. ${step}`);
    stepNum++;
  }
}

/**
 * Checks if a generator is being run idempotently (files already exist).
 *
 * @param tree - Nx virtual file system
 * @param projectRoot - Root path to check
 * @returns true if files already exist at the project root
 */
export function isIdempotentRun(tree: Tree, projectRoot: string): boolean {
  // Check for common marker files
  const markers = ['project.json', 'package.json', 'generator.ts', 'index.ts'];

  for (const marker of markers) {
    if (tree.exists(joinPathFragments(projectRoot, marker))) {
      return true;
    }
  }
  return false;
}

/**
 * Warns if an idempotent run is detected.
 *
 * @param tree - Nx virtual file system
 * @param projectRoot - Root path to check
 * @param name - Name of the item being generated
 * @returns true if idempotent run was detected
 */
export function warnIfIdempotent(tree: Tree, projectRoot: string, name: string): boolean {
  if (isIdempotentRun(tree, projectRoot)) {
    logger.warn(`"${name}" already exists at ${projectRoot}. Files will be updated idempotently.`);
    return true;
  }
  return false;
}

/**
 * Common hexagonal architecture directory structure.
 */
export const HEXAGONAL_DIRS = [
  'domain/entities',
  'domain/value-objects',
  'domain/events',
  'application/ports',
  'application/use-cases',
  'application/commands',
  'application/queries',
  'infrastructure/adapters',
  'infrastructure/repositories',
  'interface/rest',
  'interface/graphql',
];

/**
 * Creates a hexagonal architecture directory structure.
 *
 * @param tree - Nx virtual file system
 * @param projectRoot - Root path for the project
 * @param subset - Optional subset of directories to create
 */
export function createHexagonalStructure(tree: Tree, projectRoot: string, subset?: string[]): void {
  const dirs = subset ?? HEXAGONAL_DIRS;
  createDirectoryStructure(tree, projectRoot, dirs);
}
