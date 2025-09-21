#!/usr/bin/env node

const { program } = require('commander');
const { DbToTypeScript } = require('./dist/generators/types/db-to-typescript');
const { verifyTypeParity } = require('./dist/generators/verify');
const { readFileSync } = require('fs');
const { join } = require('path');

program
  .name('typegen')
  .description('TypeScript and Python type generator from database schema')
  .version('0.0.1');

program
  .command('generate')
  .description('Generate TypeScript types from database schema')
  .argument('<schema-path>', 'path to the database schema JSON file')
  .option('-o, --output-dir <dir>', 'output directory for generated types')
  .action((schemaPath, options) => {
    const generator = new DbToTypeScript();
    generator.generate(schemaPath, options.outputDir);
    console.log('TypeScript types generated successfully');
  });

program
  .command('verify')
  .description('Verify structural parity between TypeScript and Python types')
  .argument('<ts-dir>', 'directory containing TypeScript type files')
  .argument('<py-dir>', 'directory containing Python type files')
  .option('-f, --fix', 'auto-fix simple naming mismatches by renaming Python fields to match TypeScript')
  .action((tsDir, pyDir, options) => {
    const fs = require('fs');
    const path = require('path');
    console.log('Verifying type parity between TypeScript and Python...');

    // Normalize and resolve provided directories to mitigate path traversal risks
    const safeTsDir = path.resolve(String(tsDir));
    const safePyDir = path.resolve(String(pyDir));

    // Helper: ensure path is inside workspace (simple allowlist check)
    function isPathInWorkspace(p) {
      const workspaceRoot = path.resolve(process.cwd());
      return p.startsWith(workspaceRoot);
    }

    // Ensure directories exist, are directories, and are inside workspace to avoid traversal
    if (!fs.existsSync(safeTsDir) || !fs.statSync(safeTsDir).isDirectory() || !isPathInWorkspace(safeTsDir)) {
      console.error(`Invalid or disallowed TypeScript directory: ${safeTsDir}`);
      process.exit(1);
    }
    if (!fs.existsSync(safePyDir) || !fs.statSync(safePyDir).isDirectory() || !isPathInWorkspace(safePyDir)) {
      console.error(`Invalid or disallowed Python directory: ${safePyDir}`);
      process.exit(1);
    }

    // Safe file helpers
    function safeReadFileSync(filePath) {
      const resolved = path.resolve(filePath);
      if (!isPathInWorkspace(resolved)) throw new Error(`Refusing to read outside workspace: ${resolved}`);
      return fs.readFileSync(resolved, 'utf-8');
    }

    function safeWriteFileSync(filePath, content) {
      const resolved = path.resolve(filePath);
      if (!isPathInWorkspace(resolved)) throw new Error(`Refusing to write outside workspace: ${resolved}`);
      return fs.writeFileSync(resolved, content, 'utf-8');
    }

    // Read TypeScript files (use basename from readdir to avoid any path tricks)
    const tsFiles = fs.readdirSync(safeTsDir).filter(file => file.endsWith('.ts'));
    const tsTypes = {};

    const ts = require('typescript');
    tsFiles.forEach(file => {
      const safeFileName = path.basename(file);
      const filePath = join(safeTsDir, safeFileName);
      const sourceFile = ts.createSourceFile(
        filePath,
        safeReadFileSync(filePath),
        ts.ScriptTarget.Latest,
        true
      );

      function visit(node) {
        if (
          ts.isInterfaceDeclaration(node) &&
          node.modifiers &&
          node.modifiers.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)
        ) {
          const className = node.name.text;
          const fields = {};
          node.members.forEach(member => {
            if (ts.isPropertySignature(member) && member.name && member.type) {
              const fieldName = member.name.getText(sourceFile);
              const fieldType = member.type.getText(sourceFile);
              fields[fieldName] = fieldType;
            }
          });
          tsTypes[className] = fields;
        }
        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
    });

    // Read Python files
    const pyFiles = fs.readdirSync(safePyDir).filter(file => file.endsWith('.py'));
    const pyTypes = {};
    const pyFileContents = {};

    pyFiles.forEach(file => {
      const safeFileName = path.basename(file);
      const filePath = join(safePyDir, safeFileName);
      const content = safeReadFileSync(filePath);
      pyFileContents[safeFileName] = content;
      const classMatch = content.match(/class (\w+):\s*""".*?"""\s*((?:\s*\w+:\s*[^\n]+\s*)*)/);
      if (classMatch) {
        const className = classMatch[1];
        const fields = {};
        const fieldLines = classMatch[2].trim().split('\n');
        fieldLines.forEach(line => {
          const fieldMatch = line.trim().match(/(\w+):\s*([^\n]+)/);
          if (fieldMatch) {
            fields[fieldMatch[1]] = fieldMatch[2].trim();
          }
        });
        pyTypes[className] = fields;
      }
    });

    // Helper function to convert snake_case to camelCase
    function snakeToCamel(str) {
      return str.replace(/(_\w)/g, match => match[1].toUpperCase());
    }

    // Compare structures
    let hasErrors = false;

    Object.keys(tsTypes).forEach(className => {
      if (!pyTypes[className]) {
        console.error(`❌ Missing Python class: ${className}`);
        hasErrors = true;
        return;
      }

      const tsClass = tsTypes[className];
      const pyClass = pyTypes[className];

      Object.keys(tsClass).forEach(fieldName => {
        // Convert Python field names from snake_case to camelCase for comparison
        const pythonFieldName = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();

        if (!pyClass[pythonFieldName]) {
          console.error(`❌ Missing field in Python ${className}: ${fieldName} (expected ${pythonFieldName} in Python)`);
          hasErrors = true;
          // Attempt auto-fix: if --fix and Python has the snake_case form, rename it to TS fieldName
          if (options.fix) {
            const pyFilePath = join(safePyDir, `${className.toLowerCase()}.py`);
            if (fs.existsSync(pyFilePath)) {
              const key = `${className.toLowerCase()}.py`;
              let content = pyFileContents[key];
              // Replace the field definition line preserving type
              const pyType = pyClass[pythonFieldName];
              if (pyType) {
                const fieldDefRegex = new RegExp(`(^|\n)(\s*)${pythonFieldName}:\s*[^\n]+`);
                if (fieldDefRegex.test(content)) {
                  content = content.replace(fieldDefRegex, (m, p1, indent) => `${p1}${indent}${fieldName}: ${pyType}`);
                  try {
                    safeWriteFileSync(pyFilePath, content);
                    // Reflect change in memory for subsequent checks
                    pyFileContents[key] = content;
                    pyClass[fieldName] = pyType;
                    delete pyClass[pythonFieldName];
                    console.log(`🛠  Auto-fixed field name in ${className}: ${pythonFieldName} -> ${fieldName}`);
                    hasErrors = false; // this specific error fixed
                  } catch (err) {
                    console.error(`❌ Failed to write file "${pyFilePath}": ${err.message}`);
                    process.exit(1);
                  }
                }
              }
            }
          }
          return;
        }

        const tsType = tsClass[fieldName];
        const pyType = pyClass[pythonFieldName];

        if (!verifyTypeParity(tsType, pyType)) {
          console.error(`❌ Type mismatch in ${className}.${fieldName}: TS=${tsType}, Python=${pyType}`);
          hasErrors = true;
        }
      });

      // Check for extra fields in Python
      Object.keys(pyClass).forEach(fieldName => {
        // Accept either exact snake_case or camelCase in TS
        const camelCaseName = snakeToCamel(fieldName);
        const existsInTs = tsClass[camelCaseName] || tsClass[fieldName];

        if (!existsInTs) {
          console.error(`❌ Extra field in Python ${className}: ${fieldName} (expected ${camelCaseName} or ${fieldName} in TypeScript)`);
          hasErrors = true;
        } else if (options.fix && tsClass[camelCaseName] && !tsClass[fieldName]) {
          // If TS prefers camelCase and Python has snake_case, rename Python field to camelCase
          const pyFilePath = join(safePyDir, `${className.toLowerCase()}.py`);
          if (fs.existsSync(pyFilePath)) {
            const key = `${className.toLowerCase()}.py`;
            let content = pyFileContents[key];
            const pyType = pyClass[fieldName];
            const fieldDefRegex = new RegExp(`(^|\\n)(\\s*)${fieldName}:\\s*[^\\n]+`);
            if (fieldDefRegex.test(content)) {
              content = content.replace(fieldDefRegex, (m, p1, indent) => `${p1}${indent}${camelCaseName}: ${pyType}`);
              fs.writeFileSync(pyFilePath, content, 'utf-8');
              pyFileContents[key] = content;
              pyClass[camelCaseName] = pyType;
              delete pyClass[fieldName];
              console.log(`🛠  Auto-fixed field name in ${className}: ${fieldName} -> ${camelCaseName}`);
            }
            try {
              fs.writeFileSync(pyFilePath, content, 'utf-8');
              pyFileContents[key] = content;
              pyClass[camelCaseName] = pyType;
              delete pyClass[fieldName];
              console.log(`🛠  Auto-fixed field name in ${className}: ${fieldName} -> ${camelCaseName}`);
              // This specific mismatch was auto-fixed
              hasErrors = false;
            } catch (err) {
              console.error(`❌ Failed to write file "${pyFilePath}": ${err.message}`);
              process.exit(1);
            }
          }
        }
      });
    });

    // Check for missing TypeScript classes
    Object.keys(pyTypes).forEach(className => {
      if (!tsTypes[className]) {
        console.error(`❌ Missing TypeScript class: ${className}`);
        hasErrors = true;
      }
    });

    if (!hasErrors) {
      console.log('✅ All types are structurally compatible');
    } else {
      process.exit(1);
    }
  });

program.parse();
