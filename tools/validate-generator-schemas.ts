/**
 * @file Validates all Nx generator schemas (`generators/**/schema.json`) against the JSON Schema standard.
 * @author Jules
 *
 * @description
 * This script is a development tool designed to ensure the quality and correctness of Nx generator schemas.
 * It uses the 'glob' package to discover all `schema.json` files within the `generators/` directory
 * and the 'ajv' package to perform strict validation against the JSON Schema specification.
 *
 * The script is designed to be resilient; if 'ajv' or 'glob' are not installed (e.g., in a CI
 * environment with pruned dependencies), it will print a warning and exit gracefully rather
 * than crashing. This allows it to be used as a non-critical pre-commit or CI check.
 *
 * It exits with code 0 if all schemas are valid, and code 1 if any schema is invalid, unreadable,
 * or if no schemas are found.
 *
 * @example
 * // To run this script:
 * // npx ts-node tools/validate-generator-schemas.ts
 */

import { readFile } from 'fs/promises';

/**
 * Checks if a given error object indicates that a specific Node.js module is missing.
 *
 * This utility function helps differentiate between a module not being found (which can be
 * handled gracefully) and other unexpected errors during dynamic imports.
 *
 * @param {unknown} error - The error object caught during the import attempt.
 * @param {string} moduleName - The name of the module (e.g., 'ajv') to check for.
 * @returns {boolean} `true` if the error is a 'MODULE_NOT_FOUND' error for the specified module, otherwise `false`.
 */
function isModuleMissing(error: unknown, moduleName: string): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  // Check for the standard Node.js error code and common error message formats.
  return (
    (error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND' ||
    error.message.includes(`Cannot find module '${moduleName}'`) ||
    error.message.includes(`Cannot find package '${moduleName}'`)
  );
}

/**
 * Asynchronously and safely imports the 'ajv' library.
 *
 * If 'ajv' is not installed, it returns null and logs a warning to the console instead of
 * throwing an error. This allows the script to run without crashing in environments
* where dev dependencies might be missing.
 *
 * @returns {Promise<typeof import('ajv').default | null>} A promise that resolves to the `Ajv`
 *   constructor if the import is successful, or `null` if the module is not found.
 * @throws Will re-throw any import errors that are not related to the module being missing.
 */
async function loadAjv(): Promise<typeof import('ajv').default | null> {
  try {
    const mod = await import('ajv');
    // Handles both CJS and ESM module interop.
    return mod.default ?? (mod as unknown as typeof import('ajv').default);
  } catch (error) {
    if (isModuleMissing(error, 'ajv')) {
      console.warn(
        "⚠️  Could not load 'ajv'. Skipping generator schema validation. Run 'pnpm install' to enable full checks.",
      );
      return null;
    }
    throw error;
  }
}

/**
 * Asynchronously and safely imports the 'glob' library's main function.
 *
 * If 'glob' is not installed, it returns null and logs a warning. This prevents the script
 * from crashing if dependencies are not fully installed.
 *
 * @returns {Promise<typeof import('glob').glob | null>} A promise that resolves to the `glob`
 *   function if the import is successful, or `null` if the module is not found.
 * @throws Will re-throw any import errors that are not related to the module being missing.
 */
async function loadGlob(): Promise<typeof import('glob').glob | null> {
  try {
    const mod = await import('glob');
    return mod.glob;
  } catch (error) {
    if (isModuleMissing(error, 'glob')) {
      console.warn(
        "⚠️  Could not load 'glob'. Skipping generator schema validation. Run 'pnpm install' to enable full checks.",
      );
      return null;
    }
    throw error;
  }
}

/**
 * The main validation function for the script.
 *
 * It orchestrates the process of loading dependencies, finding all generator schemas,
 * parsing them, and validating them. It tracks whether any errors occurred and exits
 * the process with an appropriate status code.
 *
 * @returns {Promise<void>} A promise that resolves when the validation process is complete.
 */
async function validate(): Promise<void> {
  const AjvCtor = await loadAjv();
  const globFn = await loadGlob();

  // If essential dependencies are missing, exit gracefully.
  if (!AjvCtor || !globFn) {
    return;
  }

  const ajv = new AjvCtor({ strict: true, validateSchema: true });
  const schemas = await globFn('generators/**/schema.json');

  if (schemas.length === 0) {
    console.error('❌ No generator schemas found with pattern "generators/**/schema.json".');
    console.error(`Current working directory: ${process.cwd()}`);
    process.exit(1);
  }

  let hasErrors = false;
  for (const schemaPath of schemas) {
    try {
      const schemaContent = JSON.parse(await readFile(schemaPath, 'utf-8'));
      const isValid = ajv.validateSchema(schemaContent);

      if (!isValid) {
        console.error(`❌ Invalid schema: ${schemaPath}`);
        console.error(ajv.errorsText(ajv.errors));
        hasErrors = true;
      } else {
        console.log(`✅ Valid: ${schemaPath}`);
      }
    } catch (error) {
      console.error(`❌ Error reading or parsing schema: ${schemaPath}`);
      console.error(error);
      hasErrors = true;
    }
  }

  process.exit(hasErrors ? 1 : 0);
}

// Script entry point.
validate().catch((error) => {
  console.error('An unexpected error occurred during schema validation:');
  console.error(error);
  process.exit(1);
});
