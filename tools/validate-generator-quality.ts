/**
 * @file Enhanced validation for Nx generators beyond just JSON Schema compliance.
 * @description
 * This script performs quality checks on generators:
 * - Schema completeness (required fields, descriptions, examples)
 * - Naming conventions (@vibespro/* namespace)
 * - Template file existence and structure
 * - generators.json configuration
 * - README documentation
 * - Test file presence
 *
 * @example
 * pnpm exec tsx tools/validate-generator-quality.ts
 * pnpm exec tsx tools/validate-generator-quality.ts generators/my-gen
 */

import { existsSync } from 'fs';
import { access, readFile } from 'fs/promises';
import * as path from 'path';

interface ValidationIssue {
  generator: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
}

interface ValidationResult {
  generator: string;
  passed: boolean;
  issues: ValidationIssue[];
}

/**
 * Safely load the glob function
 */
async function loadGlob(): Promise<typeof import('glob').glob | null> {
  try {
    const mod = await import('glob');
    return mod.glob;
  } catch {
    console.warn('⚠️  glob not available, limiting validation scope');
    return null;
  }
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate schema.json completeness
 */
async function validateSchema(generatorPath: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const schemaPath = path.join(generatorPath, 'schema.json');

  if (!existsSync(schemaPath)) {
    issues.push({
      generator: generatorPath,
      severity: 'error',
      category: 'schema',
      message: 'Missing schema.json',
    });
    return issues;
  }

  try {
    const schemaContent = JSON.parse(await readFile(schemaPath, 'utf-8'));

    // Check for required top-level fields
    if (!schemaContent.$schema) {
      issues.push({
        generator: generatorPath,
        severity: 'warning',
        category: 'schema',
        message: 'Missing $schema reference',
      });
    }

    if (!schemaContent.title) {
      issues.push({
        generator: generatorPath,
        severity: 'warning',
        category: 'schema',
        message: 'Missing title field',
      });
    }

    if (!schemaContent.description) {
      issues.push({
        generator: generatorPath,
        severity: 'warning',
        category: 'schema',
        message: 'Missing description field',
      });
    }

    // Check that properties have descriptions
    if (schemaContent.properties) {
      for (const [propName, propDef] of Object.entries(schemaContent.properties)) {
        const prop = propDef as any;
        if (!prop.description) {
          issues.push({
            generator: generatorPath,
            severity: 'info',
            category: 'schema',
            message: `Property '${propName}' missing description`,
          });
        }
      }
    }

    // Check for x-prompt on key properties (improves UX)
    if (schemaContent.properties?.name && !schemaContent.properties.name['x-prompt']) {
      issues.push({
        generator: generatorPath,
        severity: 'info',
        category: 'schema-ux',
        message: "Property 'name' could benefit from x-prompt for interactive mode",
      });
    }
  } catch (error) {
    issues.push({
      generator: generatorPath,
      severity: 'error',
      category: 'schema',
      message: `Failed to parse schema.json: ${error}`,
    });
  }

  return issues;
}

/**
 * Validate package.json
 */
async function validatePackageJson(generatorPath: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const packagePath = path.join(generatorPath, 'package.json');

  if (!existsSync(packagePath)) {
    issues.push({
      generator: generatorPath,
      severity: 'error',
      category: 'package',
      message: 'Missing package.json',
    });
    return issues;
  }

  try {
    const packageContent = JSON.parse(await readFile(packagePath, 'utf-8'));

    // Check namespace
    if (!packageContent.name?.startsWith('@vibespro/')) {
      issues.push({
        generator: generatorPath,
        severity: 'error',
        category: 'package',
        message: `Package name must start with @vibespro/, got: ${packageContent.name}`,
      });
    }

    // Check generators field
    if (!packageContent.generators) {
      issues.push({
        generator: generatorPath,
        severity: 'error',
        category: 'package',
        message: 'Missing generators field pointing to generators.json',
      });
    }
  } catch (error) {
    issues.push({
      generator: generatorPath,
      severity: 'error',
      category: 'package',
      message: `Failed to parse package.json: ${error}`,
    });
  }

  return issues;
}

/**
 * Validate generators.json
 */
async function validateGeneratorsJson(generatorPath: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const generatorsPath = path.join(generatorPath, 'generators.json');

  if (!existsSync(generatorsPath)) {
    issues.push({
      generator: generatorPath,
      severity: 'error',
      category: 'config',
      message: 'Missing generators.json',
    });
    return issues;
  }

  try {
    const generatorsContent = JSON.parse(await readFile(generatorsPath, 'utf-8'));

    if (!generatorsContent.generators || Object.keys(generatorsContent.generators).length === 0) {
      issues.push({
        generator: generatorPath,
        severity: 'error',
        category: 'config',
        message: 'generators.json has no generator definitions',
      });
    }

    // Validate each generator entry
    for (const [genName, genConfig] of Object.entries(generatorsContent.generators || {})) {
      const config = genConfig as any;
      if (!config.factory) {
        issues.push({
          generator: generatorPath,
          severity: 'error',
          category: 'config',
          message: `Generator '${genName}' missing factory field`,
        });
      }
      if (!config.schema) {
        issues.push({
          generator: generatorPath,
          severity: 'error',
          category: 'config',
          message: `Generator '${genName}' missing schema field`,
        });
      }
      if (!config.description) {
        issues.push({
          generator: generatorPath,
          severity: 'warning',
          category: 'config',
          message: `Generator '${genName}' missing description`,
        });
      }
    }
  } catch (error) {
    issues.push({
      generator: generatorPath,
      severity: 'error',
      category: 'config',
      message: `Failed to parse generators.json: ${error}`,
    });
  }

  return issues;
}

/**
 * Validate generator files exist
 */
async function validateGeneratorFiles(generatorPath: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  // Check for main generator file
  const tsPath = path.join(generatorPath, 'generator.ts');
  if (!(await fileExists(tsPath))) {
    issues.push({
      generator: generatorPath,
      severity: 'error',
      category: 'files',
      message: 'Missing generator.ts',
    });
  }

  // Check for schema.d.ts (TypeScript types)
  const dtsPath = path.join(generatorPath, 'schema.d.ts');
  if (!(await fileExists(dtsPath))) {
    issues.push({
      generator: generatorPath,
      severity: 'warning',
      category: 'files',
      message: 'Missing schema.d.ts (run: just generator-types)',
    });
  }

  // Check for README
  const readmePath = path.join(generatorPath, 'README.md');
  if (!(await fileExists(readmePath))) {
    issues.push({
      generator: generatorPath,
      severity: 'warning',
      category: 'docs',
      message: 'Missing README.md',
    });
  }

  // Check for test file
  const testPath = path.join(generatorPath, 'generator.spec.ts');
  if (!(await fileExists(testPath))) {
    issues.push({
      generator: generatorPath,
      severity: 'warning',
      category: 'tests',
      message: 'Missing generator.spec.ts',
    });
  }

  // Check for files/ directory (templates)
  const filesPath = path.join(generatorPath, 'files');
  if (!existsSync(filesPath)) {
    issues.push({
      generator: generatorPath,
      severity: 'info',
      category: 'templates',
      message: 'No files/ directory (generator may use composition)',
    });
  }

  return issues;
}

/**
 * Validate a single generator
 */
async function validateGenerator(generatorPath: string): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  // Run all validations
  issues.push(...(await validateSchema(generatorPath)));
  issues.push(...(await validatePackageJson(generatorPath)));
  issues.push(...(await validateGeneratorsJson(generatorPath)));
  issues.push(...(await validateGeneratorFiles(generatorPath)));

  const hasErrors = issues.some((i) => i.severity === 'error');

  return {
    generator: generatorPath,
    passed: !hasErrors,
    issues,
  };
}

/**
 * Main validation function
 */
async function main() {
  const targetPath = process.argv[2];
  const globFn = await loadGlob();

  let generatorPaths: string[] = [];

  if (targetPath) {
    // Validate single generator
    generatorPaths = [targetPath];
  } else if (globFn) {
    // Find all generators
    const allPaths = await globFn('generators/*/', {
      ignore: ['**/node_modules/**', '**/files/**', '**/_utils/**'],
    });
    generatorPaths = allPaths.map((p) => p.replace(/\/$/, ''));
  } else {
    console.error('❌ Cannot discover generators without glob. Specify a path manually.');
    process.exit(1);
  }

  if (generatorPaths.length === 0) {
    console.log('ℹ️  No generators found to validate');
    return;
  }

  console.log(`🔍 Validating ${generatorPaths.length} generator(s)...\n`);

  const results: ValidationResult[] = [];
  for (const genPath of generatorPaths) {
    const result = await validateGenerator(genPath);
    results.push(result);
  }

  // Print results
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalInfo = 0;

  for (const result of results) {
    const errors = result.issues.filter((i) => i.severity === 'error');
    const warnings = result.issues.filter((i) => i.severity === 'warning');
    const infos = result.issues.filter((i) => i.severity === 'info');

    totalErrors += errors.length;
    totalWarnings += warnings.length;
    totalInfo += infos.length;

    if (result.passed) {
      console.log(`✅ ${result.generator}`);
    } else {
      console.log(`❌ ${result.generator}`);
    }

    // Print errors
    for (const issue of errors) {
      console.log(`   ❌ [${issue.category}] ${issue.message}`);
    }

    // Print warnings
    for (const issue of warnings) {
      console.log(`   ⚠️  [${issue.category}] ${issue.message}`);
    }

    // Print info
    for (const issue of infos) {
      console.log(`   ℹ️  [${issue.category}] ${issue.message}`);
    }

    if (result.issues.length > 0) {
      console.log('');
    }
  }

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log('─'.repeat(60));
  console.log(`Summary: ${passedCount}/${results.length} generators passed`);
  if (totalErrors > 0) console.log(`  Errors: ${totalErrors}`);
  if (totalWarnings > 0) console.log(`  Warnings: ${totalWarnings}`);
  if (totalInfo > 0) console.log(`  Info: ${totalInfo}`);

  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
