import { readFile } from 'fs/promises';

function isModuleMissing(error: unknown, moduleName: string): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    (error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND' ||
    error.message.includes(`Cannot find module '${moduleName}'`) ||
    error.message.includes(`Cannot find package '${moduleName}'`)
  );
}

async function loadAjv() {
  try {
    const mod = await import('ajv');
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

async function loadGlob() {
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

async function validate() {
  const AjvCtor = await loadAjv();
  const globFn = await loadGlob();

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

validate().catch((error) => {
  console.error(error);
  process.exit(1);
});
