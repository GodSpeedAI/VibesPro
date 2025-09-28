#!/usr/bin/env node
/* Small runner for documentation generator
   Usage: node run_generator.js <contextFile> <outputDir> <action>
   action: generate | templates | validate
*/

const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error(JSON.stringify({ success: false, error: 'insufficient args' }));
    process.exit(2);
  }

  const [contextFile, outputDir, action] = args;
  let context = {};
  try {
    context = JSON.parse(fs.readFileSync(contextFile, 'utf8'));
  } catch (e) {
    console.error(JSON.stringify({ success: false, error: 'failed to read context file: ' + String(e) }));
    process.exit(2);
  }

  // Load generator module; support both CJS and ESM shapes
  let mod;
  try {
    mod = require('./generator.js');
  } catch (e) {
    // Try dynamic import for ESM
    try {
      // eslint-disable-next-line no-undef
      mod = await import(path.resolve(__dirname, 'generator.js'));
    } catch (err) {
      console.error(JSON.stringify({ success: false, error: 'failed to load generator module: ' + String(err) }));
      process.exit(1);
    }
  }

  const DocumentationGenerator = (
    mod.DocumentationGenerator || (mod.default && mod.default.DocumentationGenerator) || mod.default
  );

  if (!DocumentationGenerator) {
    console.error(JSON.stringify({ success: false, error: 'DocumentationGenerator not found in module' }));
    process.exit(1);
  }

  try {
    const generator = new DocumentationGenerator(outputDir);

    if (action === 'generate') {
      const docs = await generator.generateDocumentation(context);
      console.log(JSON.stringify({ success: true, docs }));
      process.exit(0);
    }

    if (action === 'templates') {
      await generator.generateAndSaveTemplates(context);
      console.log(JSON.stringify({ success: true }));
      process.exit(0);
    }

    if (action === 'validate') {
      const validation = await generator.validateDocumentation(context.docs || {});
      console.log(JSON.stringify(validation));
      process.exit(0);
    }

    console.error(JSON.stringify({ success: false, error: 'unknown action: ' + action }));
    process.exit(2);
  } catch (err) {
    console.error(JSON.stringify({ success: false, error: String(err) }));
    process.exit(1);
  }
}

main();
