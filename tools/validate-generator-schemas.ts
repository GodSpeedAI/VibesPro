import Ajv from 'ajv';
import { glob } from 'glob';
import { readFile } from 'fs/promises';

async function validate() {
  const ajv = new Ajv({ strict: true, validateSchema: true });
  const schemas = await glob('generators/**/schema.json');

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

validate();
