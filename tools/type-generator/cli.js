#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const ts = require('typescript');

const { DbToTypeScript } = require('./dist/generators/types/db-to-typescript');
const { verifyTypeParity } = require('./dist/generators/verify');

const WORKSPACE_ROOT = path.resolve(process.cwd());
const PY_PARSER_PATH = path.join(os.tmpdir(), 'vibespro_py_class_parser.py');
const PY_PARSER_SOURCE = `
import ast
import json
import os
import sys

def parse_file(path: str) -> dict[str, dict[str, str]]:
    with open(path, "r", encoding="utf-8") as file:
        tree = ast.parse(file.read(), filename=path)
    classes: dict[str, dict[str, str]] = {}
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            fields: dict[str, str] = {}
            for stmt in node.body:
                if isinstance(stmt, ast.AnnAssign) and isinstance(stmt.target, ast.Name):
                    annotation = stmt.annotation
                    if hasattr(ast, "unparse"):
                        field_type = ast.unparse(annotation)
                    elif isinstance(annotation, ast.Name):
                        field_type = annotation.id
                    else:
                        field_type = "Any"
                    fields[stmt.target.id] = field_type
            classes[node.name] = fields
    return classes

def main() -> None:
    result: dict[str, dict[str, dict[str, str]]] = {}
    for file_path in sys.argv[1:]:
        abs_path = os.path.abspath(file_path)
        result[abs_path] = parse_file(abs_path)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
`;

function ensurePyParserScript() {
  if (!fs.existsSync(PY_PARSER_PATH)) {
    fs.writeFileSync(PY_PARSER_PATH, PY_PARSER_SOURCE, 'utf-8');
  }
  return PY_PARSER_PATH;
}

function assertWorkspacePath(input, label) {
  const inputStr = String(input);

  // Basic input validation - prevent empty or malicious strings
  if (!inputStr || inputStr.trim() === '') {
    throw new Error(`${label} cannot be empty`);
  }

  // Check for path traversal attempts
  if (inputStr.includes('..') || inputStr.includes('~') || inputStr.startsWith('/')) {
    throw new Error(`${label} contains invalid path characters: ${inputStr}`);
  }

  const resolved = path.resolve(inputStr);
  const relative = path.relative(WORKSPACE_ROOT, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must be inside the workspace: ${resolved}`);
  }

  return resolved;
}

function ensureDirectoryExists(dirPath, label) {
  const resolved = assertWorkspacePath(dirPath, label);
  try {
    if (!fs.existsSync(resolved)) {
      throw new Error(`${label} does not exist: ${resolved}`);
    }
    const stats = fs.statSync(resolved);
    if (!stats.isDirectory()) {
      throw new Error(`${label} is not a directory: ${resolved}`);
    }
    // Additional security check - ensure it's not a symlink to outside workspace
    if (stats.isSymbolicLink()) {
      const realPath = fs.realpathSync(resolved);
      const relativeRealPath = path.relative(WORKSPACE_ROOT, realPath);
      if (relativeRealPath.startsWith('..') || path.isAbsolute(relativeRealPath)) {
        throw new Error(`${label} is a symlink pointing outside the workspace: ${resolved}`);
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`${label} does not exist: ${resolved}`);
    }
    throw error;
  }
  return resolved;
}

function ensureFileExists(filePath, label) {
  const resolved = assertWorkspacePath(filePath, label);
  try {
    if (!fs.existsSync(resolved)) {
      throw new Error(`${label} does not exist: ${resolved}`);
    }
    const stats = fs.statSync(resolved);
    if (!stats.isFile()) {
      throw new Error(`${label} is not a file: ${resolved}`);
    }
    // Additional security check - ensure it's not a symlink to outside workspace
    if (stats.isSymbolicLink()) {
      const realPath = fs.realpathSync(resolved);
      const relativeRealPath = path.relative(WORKSPACE_ROOT, realPath);
      if (relativeRealPath.startsWith('..') || path.isAbsolute(relativeRealPath)) {
        throw new Error(`${label} is a symlink pointing outside the workspace: ${resolved}`);
      }
    }
    // Check file size to prevent reading extremely large files
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (stats.size > maxSize) {
      throw new Error(`${label} is too large (${stats.size} bytes). Maximum allowed size is ${maxSize} bytes: ${resolved}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`${label} does not exist: ${resolved}`);
    }
    throw error;
  }
  return resolved;
}

function safeReadFileSync(filePath, encoding = 'utf-8') {
  const resolved = ensureFileExists(filePath, 'file');
  try {
    return fs.readFileSync(resolved, encoding);
  } catch (error) {
    throw new Error(`Failed to read file "${resolved}": ${error.message}`);
  }
}

function safeWriteFileSync(filePath, content, encoding = 'utf-8') {
  const resolved = assertWorkspacePath(filePath, 'file path');
  const parentDir = path.dirname(resolved);
  ensureDirectoryExists(parentDir, 'parent directory');
  try {
    fs.writeFileSync(resolved, content, encoding);
  } catch (error) {
    throw new Error(`Failed to write file "${resolved}": ${error.message}`);
  }
  return resolved;
}

function camelToSnake(value) {
  return value.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function snakeToCamel(value) {
  return value.replace(/_([a-zA-Z0-9])/g, (_, letter) => letter.toUpperCase());
}

function parseTypeScriptTypes(tsDir) {
  const resolvedDir = ensureDirectoryExists(tsDir, 'TypeScript directory');
  const entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
  const tsTypes = {};

  entries.forEach(entry => {
    if (!entry.isFile() || !entry.name.endsWith('.ts')) {
      return;
    }

    const filePath = assertWorkspacePath(path.join(resolvedDir, entry.name), 'TypeScript file');
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

  return tsTypes;
}

function parsePythonTypes(pyDir) {
  const resolvedDir = ensureDirectoryExists(pyDir, 'Python directory');
  const entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
  const pythonFiles = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.py'))
    .map(entry => assertWorkspacePath(path.join(resolvedDir, entry.name), 'Python file'));

  const pyTypes = {};
  const classFileMap = {};
  const fileContents = {};

  if (pythonFiles.length === 0) {
    return { pyTypes, classFileMap, fileContents };
  }

  const parserPath = ensurePyParserScript();
  const result = spawnSync('python3', [parserPath, ...pythonFiles], { encoding: 'utf-8' });

  if (result.error) {
    throw new Error(`Failed to execute Python parser: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || 'Python parser exited with a non-zero status');
  }

  let parsed = {};
  try {
    parsed = JSON.parse(result.stdout || '{}');
  } catch (error) {
    throw new Error(`Failed to parse Python parser output: ${error.message}`);
  }

  for (const [filePath, classes] of Object.entries(parsed)) {
    const resolvedFile = assertWorkspacePath(filePath, 'Python file');
    const content = safeReadFileSync(resolvedFile);
    fileContents[resolvedFile] = content;

    for (const [className, fields] of Object.entries(classes || {})) {
      pyTypes[className] = fields || {};
      classFileMap[className] = resolvedFile;
    }
  }

  return { pyTypes, classFileMap, fileContents };
}

function renamePythonField(className, fromName, toName, pyFilePath, pyClassFields, fileContents) {
  const fieldType = pyClassFields[fromName];
  if (!fieldType) {
    return false;
  }

  const existingContent = fileContents[pyFilePath] ?? safeReadFileSync(pyFilePath);
  const fieldDefRegex = new RegExp(`(^|\\n)(\\s*)${fromName}:\\s*[^\\n]+`);

  if (!fieldDefRegex.test(existingContent)) {
    return false;
  }

  const updatedContent = existingContent.replace(
    fieldDefRegex,
    (match, prefix, indent) => `${prefix}${indent}${toName}: ${fieldType}`
  );

  safeWriteFileSync(pyFilePath, updatedContent);
  fileContents[pyFilePath] = updatedContent;
  delete pyClassFields[fromName];
  pyClassFields[toName] = fieldType;
  console.log(`🛠  Auto-fixed field name in ${className}: ${fromName} -> ${toName}`);
  return true;
}

program
  .name('typegen')
  .description('TypeScript and Python type generator from database schema')
  .version('0.0.1')
  .configureOutput({
    outputError: (str, write) => {
      write(`❌ Error: ${str}`);
    },
  })
  .exitOverride(err => {
    if (err.code === 'commander.unknownCommand') {
      console.error(`❌ Unknown command. Use --help to see available commands.`);
      process.exit(1);
    }
    if (err.code === 'commander.missingArgument') {
      console.error(`❌ Missing required argument: ${err.message}`);
      process.exit(1);
    }
    throw err;
  });

program
  .command('generate')
  .description('Generate TypeScript types from database schema')
  .argument('<schema-path>', 'path to the database schema JSON file')
  .option('-o, --output-dir <dir>', 'output directory for generated types')
  .action((schemaPath, options) => {
    try {
      const generator = new DbToTypeScript();
      const resolvedSchema = assertWorkspacePath(schemaPath, 'schema path');
      const resolvedOutputDir = options.outputDir
        ? assertWorkspacePath(options.outputDir, 'output directory')
        : undefined;

      generator.generate(resolvedSchema, resolvedOutputDir);
      console.log('✅ TypeScript types generated successfully');
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('verify')
  .description('Verify structural parity between TypeScript and Python types')
  .argument('<ts-dir>', 'directory containing TypeScript type files')
  .argument('<py-dir>', 'directory containing Python type files')
  .option('-f, --fix', 'auto-fix simple naming mismatches by renaming Python fields to match TypeScript')
  .action((tsDir, pyDir, options) => {
    try {
      const tsTypes = parseTypeScriptTypes(tsDir);
      const { pyTypes, classFileMap, fileContents } = parsePythonTypes(pyDir);

      let hasErrors = false;

      for (const [className, tsClass] of Object.entries(tsTypes)) {
        const pyClass = pyTypes[className];
        if (!pyClass) {
          console.error(`❌ Missing Python class: ${className}`);
          hasErrors = true;
          continue;
        }

        for (const [fieldName, tsType] of Object.entries(tsClass)) {
          const pythonCandidateNames = [camelToSnake(fieldName), fieldName];
          const matchedName = pythonCandidateNames.find(name => Object.prototype.hasOwnProperty.call(pyClass, name));

          if (!matchedName) {
            console.error(`❌ Missing field in Python ${className}: ${fieldName}`);
            hasErrors = true;
            continue;
          }

          const pyType = pyClass[matchedName];
          if (!verifyTypeParity(tsType, pyType)) {
            console.error(`❌ Type mismatch in ${className}.${fieldName}: TS=${tsType}, Python=${pyType}`);
            hasErrors = true;
          }

          if (options.fix && matchedName !== fieldName) {
            const pyFilePath = classFileMap[className];
            if (!pyFilePath) {
              console.error(`❌ Unable to locate Python file for class ${className} to auto-fix field ${matchedName}`);
              hasErrors = true;
              continue;
            }

            const renamed = renamePythonField(
              className,
              matchedName,
              fieldName,
              pyFilePath,
              pyClass,
              fileContents
            );

            if (!renamed) {
              console.error(`❌ Failed to auto-fix field ${className}.${matchedName}`);
              hasErrors = true;
            }
          }
        }

        for (const [pyFieldName] of Object.entries(pyClass)) {
          const camelCaseName = snakeToCamel(pyFieldName);
          const existsInTs = Object.prototype.hasOwnProperty.call(tsClass, camelCaseName) ||
            Object.prototype.hasOwnProperty.call(tsClass, pyFieldName);

          if (!existsInTs) {
            console.error(`❌ Extra field in Python ${className}: ${pyFieldName}`);
            hasErrors = true;
            continue;
          }

          if (
            options.fix &&
            pyFieldName !== camelCaseName &&
            Object.prototype.hasOwnProperty.call(tsClass, camelCaseName)
          ) {
            const pyFilePath = classFileMap[className];
            if (!pyFilePath) {
              console.error(`❌ Unable to locate Python file for class ${className} to auto-fix field ${pyFieldName}`);
              hasErrors = true;
              continue;
            }

            const renamed = renamePythonField(
              className,
              pyFieldName,
              camelCaseName,
              pyFilePath,
              pyClass,
              fileContents
            );

            if (!renamed) {
              console.error(`❌ Failed to auto-fix field ${className}.${pyFieldName}`);
              hasErrors = true;
            }
          }
        }
      }

      for (const className of Object.keys(pyTypes)) {
        if (!Object.prototype.hasOwnProperty.call(tsTypes, className)) {
          console.error(`❌ Missing TypeScript class: ${className}`);
          hasErrors = true;
        }
      }

      if (hasErrors) {
        process.exit(1);
      }

      console.log('✅ All types are structurally compatible');
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
