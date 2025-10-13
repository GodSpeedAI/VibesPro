#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const ts = require('typescript');

let DbToTypeScript;
try {
  ({ DbToTypeScript } = require('./dist/src/generators/types/db-to-typescript'));
} catch (error) {
  DbToTypeScript = class {
    constructor() {}
    generate() {
      throw new Error('Database generation support is not available in this environment.');
    }
  };
}

const normalizeWhitespace = value => value.replace(/\s+/g, '').toLowerCase();

function normalizeTsType(type) {
  const raw = (type ?? '').trim();
  if (!raw) {
    return '';
  }

  const lowered = raw.toLowerCase();
  if (['string', 'number', 'boolean', 'any'].includes(lowered)) {
    return lowered;
  }

  if (lowered === 'int' || lowered === 'float') {
    return 'number';
  }

  if (raw.endsWith('[]')) {
    return `list<${normalizeTsType(raw.slice(0, -2))}>`;
  }

  const arrayMatch = raw.match(/^Array<(.+)>$/i);
  if (arrayMatch) {
    return `list<${normalizeTsType(arrayMatch[1])}>`;
  }

  const recordMatch = raw.match(/^Record<\s*string\s*,\s*(.+)>$/i);
  if (recordMatch) {
    return `dict<string, ${normalizeTsType(recordMatch[1])}>`;
  }

  if (/^\{[\s\S]*\}$/.test(raw)) {
    return 'dict<string, any>';
  }

  const unionParts = raw.split('|').map(part => part.trim()).filter(Boolean);
  if (unionParts.length > 1) {
    const nonNullable = unionParts.filter(part => !['null', 'undefined', 'void'].includes(part.toLowerCase()));
    const normalizedParts = nonNullable.map(normalizeTsType).sort();

    if (nonNullable.length === 1 && nonNullable.length !== unionParts.length) {
      return `optional<${normalizedParts[0]}>`;
    }

    if (normalizedParts.length > 1) {
      return `union<${normalizedParts.join('|')}>`;
    }
  }

  return normalizeWhitespace(raw);
}

function normalizePyType(type) {
  const raw = (type ?? '').trim();
  if (!raw) {
    return '';
  }

  const lowered = raw.toLowerCase();
  if (lowered === 'str') {
    return 'string';
  }
  if (lowered === 'int' || lowered === 'float') {
    return 'number';
  }
  if (lowered === 'bool') {
    return 'boolean';
  }
  if (lowered === 'any') {
    return 'any';
  }

  const optionalMatch = raw.match(/^Optional\[(.+)\]$/i);
  if (optionalMatch) {
    const inner = normalizePyType(optionalMatch[1]);
    const innerValue = inner.startsWith('optional<') ? inner.slice(9, -1) : inner;
    return `optional<${innerValue}>`;
  }

  const listMatch = raw.match(/^List\[(.+)\]$/i);
  if (listMatch) {
    return `list<${normalizePyType(listMatch[1])}>`;
  }

  const dictMatch = raw.match(/^Dict\[/i);
  if (dictMatch) {
    return 'dict<string, any>';
  }

  const unionMatch = raw.match(/^Union\[(.+)\]$/i);
  if (unionMatch) {
    const parts = unionMatch[1]
      .split(',')
      .map(part => part.trim())
      .filter(Boolean);

    const nonNone = parts.filter(part => part.toLowerCase() !== 'none');
    const normalizedParts = nonNone.map(normalizePyType).sort();

    if (nonNone.length === 1 && nonNone.length !== parts.length) {
      return `optional<${normalizedParts[0]}>`;
    }

    if (normalizedParts.length > 1) {
      return `union<${normalizedParts.join('|')}>`;
    }

    if (normalizedParts.length === 1) {
      return normalizedParts[0];
    }
  }

  const unionParts = raw.split('|').map(part => part.trim()).filter(Boolean);
  if (unionParts.length > 1) {
    const nonNone = unionParts.filter(part => part.toLowerCase() !== 'none');
    if (nonNone.length === 1 && nonNone.length !== unionParts.length) {
      return `optional<${normalizePyType(nonNone[0])}>`;
    }
  }

  return normalizeWhitespace(raw);
}

let verifyTypeParity;
try {
  ({ verifyTypeParity } = require('./dist/src/generators/verify'));
} catch (error) {
  verifyTypeParity = (tsType, pyType) => {
    const normalizedTs = normalizeTsType(tsType);
    const normalizedPy = normalizePyType(pyType);
    return normalizedTs === normalizedPy || normalizedTs === 'any' || normalizedPy === 'any';
  };
}
const {
  isPathSafe,
  resolvePathWithinWorkspace,
  sanitizePathInput,
} = require('./utils/pathSecurity');

const WORKSPACE_MARKERS = ['nx.json', 'pnpm-workspace.yaml', '.git'];
WORKSPACE_MARKERS.forEach(marker => {
  if (typeof marker !== 'string' || !marker.trim()) {
    throw new Error('Workspace marker entries must be non-empty strings');
  }
  if (marker.includes('/') || marker.includes('\\')) {
    throw new Error(`Workspace marker may not contain path separators: ${marker}`);
  }
});

function findWorkspaceRoot(startDir) {
  const sanitizedStartDir = sanitizePathInput(startDir, 'workspace search path');
  const normalizedStartDir = path.normalize(sanitizedStartDir);
  const hasTraversal = normalizedStartDir
    .split(/[\\/]+/)
    .filter(Boolean)
    .some(segment => segment === '..');

  if (hasTraversal) {
    throw new Error('Workspace search path may not contain parent directory traversals');
  }

  const absoluteStartDir = path.resolve(sanitizedStartDir);
  let realStartDir;

  try {
    realStartDir = fs.realpathSync(absoluteStartDir);
  } catch (error) {
    throw new Error(`Unable to resolve workspace search path: ${absoluteStartDir}`);
  }

  let startStats;
  try {
    startStats = fs.lstatSync(realStartDir);
  } catch (error) {
    throw new Error(`Workspace search path does not exist: ${realStartDir}`);
  }

  if (!startStats.isDirectory()) {
    throw new Error(`Workspace search path must be a directory: ${realStartDir}`);
  }

  let currentDir = realStartDir;
  const { root } = path.parse(currentDir);
  const visited = new Set();

  while (true) {
    if (visited.has(currentDir)) {
      throw new Error(`Cyclical directory resolution detected while locating workspace root from: ${realStartDir}`);
    }
    visited.add(currentDir);

    const isWorkspaceRoot = WORKSPACE_MARKERS.some(marker => {
      const markerPath = path.join(currentDir, marker);
      try {
        return fs.existsSync(markerPath);
      } catch (error) {
        if (error && error.code === 'ENOENT') {
          return false;
        }
        throw error;
      }
    });
    if (isWorkspaceRoot) {
      return currentDir;
    }

    if (currentDir === root) {
      return realStartDir;
    }

    currentDir = path.dirname(currentDir);
  }
}

const WORKSPACE_ROOT = findWorkspaceRoot(process.cwd());
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

function assertWorkspacePath(inputPath, label) {
  const sanitized = sanitizePathInput(inputPath, label);

  if (!isPathSafe(sanitized)) {
    throw new Error(`${label} contains invalid path characters: ${inputPath}`);
  }

  return resolvePathWithinWorkspace(sanitized, WORKSPACE_ROOT, label);
}

function ensureDirectoryExists(dirPath, label) {
  const resolved = assertWorkspacePath(dirPath, label);
  try {
    if (!fs.existsSync(resolved)) {
      throw new Error(`${label} does not exist: ${resolved}`);
    }

    const stats = fs.lstatSync(resolved);
    let effectiveStats = stats;

    if (stats.isSymbolicLink()) {
      const realPath = fs.realpathSync(resolved);
      const relativeRealPath = path.relative(WORKSPACE_ROOT, realPath);
      if (relativeRealPath.startsWith('..') || path.isAbsolute(relativeRealPath)) {
        throw new Error(`${label} is a symlink pointing outside the workspace: ${resolved}`);
      }

      effectiveStats = fs.statSync(realPath);
      if (!effectiveStats.isDirectory()) {
        throw new Error(`${label} symlink does not resolve to a directory: ${resolved}`);
      }
    } else if (!stats.isDirectory()) {
      throw new Error(`${label} is not a directory: ${resolved}`);
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
    const stats = fs.lstatSync(resolved);
    let effectiveStats = stats;

    if (stats.isSymbolicLink()) {
      const realPath = fs.realpathSync(resolved);
      const relativeRealPath = path.relative(WORKSPACE_ROOT, realPath);
      if (relativeRealPath.startsWith('..') || path.isAbsolute(relativeRealPath)) {
        throw new Error(`${label} is a symlink pointing outside the workspace: ${resolved}`);
      }

      effectiveStats = fs.statSync(realPath);
      if (!effectiveStats.isFile()) {
        throw new Error(`${label} symlink does not resolve to a file: ${resolved}`);
      }
    } else if (!stats.isFile()) {
      throw new Error(`${label} is not a file: ${resolved}`);
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (effectiveStats.size > maxSize) {
      throw new Error(`${label} is too large (${effectiveStats.size} bytes). Maximum allowed size is ${maxSize} bytes: ${resolved}`);
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
  const resolved = ensureFileExists(filePath, 'file path');
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
  let processedFiles = 0;

  entries.forEach(entry => {
    if (!entry.isFile() || !entry.name.endsWith('.ts')) {
      return;
    }

    processedFiles += 1;

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

  return { tsTypes, processedFiles };
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
    return { pyTypes, classFileMap, fileContents, processedFiles: 0 };
  }

  const parserPath = ensurePyParserScript();
  const parseWithNode = () => {
    for (const filePath of pythonFiles) {
      const resolvedFile = assertWorkspacePath(filePath, 'Python file');
      const content = safeReadFileSync(resolvedFile);
      fileContents[resolvedFile] = content;

      const lines = content.split(/\r?\n/);
      let currentClass = undefined;
      let classIndent = Infinity;

      for (const line of lines) {
        const matchClass = line.match(/^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)/);
        if (matchClass) {
          currentClass = matchClass[1];
          classIndent = line.search(/\S|$/);
          pyTypes[currentClass] = pyTypes[currentClass] ?? {};
          classFileMap[currentClass] = resolvedFile;
          continue;
        }

        if (!currentClass) {
          continue;
        }

        const indent = line.search(/\S|$/);
        if (indent !== -1 && indent <= classIndent && line.trim().length > 0) {
          currentClass = undefined;
          classIndent = Infinity;
          continue;
        }

        const matchField = line.match(/^\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^#]+)/);
        if (matchField && currentClass) {
          const [, fieldName, annotation] = matchField;
          pyTypes[currentClass][fieldName] = annotation.trim();
        }
      }
    }

    return { pyTypes, classFileMap, fileContents, processedFiles: pythonFiles.length };
  };

  const result = spawnSync('python3', [parserPath, ...pythonFiles], { encoding: 'utf-8' });

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      return parseWithNode();
    }
    throw new Error(`Failed to execute Python parser: ${result.error.message}`);
  }

  if (result.status !== 0) {
    return parseWithNode();
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

  return { pyTypes, classFileMap, fileContents, processedFiles: pythonFiles.length };
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
  .version('0.1.0')
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
      const generator = new DbToTypeScript(WORKSPACE_ROOT);
      const normalizedSchema = sanitizePathInput(schemaPath, 'schema path');
      if (!isPathSafe(normalizedSchema)) {
        throw new Error(`schema path contains invalid path characters: ${schemaPath}`);
      }

      const resolvedSchema = resolvePathWithinWorkspace(normalizedSchema, WORKSPACE_ROOT, 'schema path');

      const resolvedOutputDir = options.outputDir
        ? resolvePathWithinWorkspace(
            sanitizePathInput(options.outputDir, 'output directory'),
            WORKSPACE_ROOT,
            'output directory'
          )
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
      const sanitizedTsDir = resolvePathWithinWorkspace(
        sanitizePathInput(tsDir, 'TypeScript directory'),
        WORKSPACE_ROOT,
        'TypeScript directory'
      );
      const sanitizedPyDir = resolvePathWithinWorkspace(
        sanitizePathInput(pyDir, 'Python directory'),
        WORKSPACE_ROOT,
        'Python directory'
      );

      const { tsTypes, processedFiles: tsFileCount } = parseTypeScriptTypes(sanitizedTsDir);
      const { pyTypes, classFileMap, fileContents, processedFiles: pyFileCount } = parsePythonTypes(sanitizedPyDir);

      let hasErrors = false;

      if (tsFileCount === 0) {
        console.error('❌ No TypeScript files found');
        hasErrors = true;
      }

      if (pyFileCount === 0) {
        console.error('❌ No Python files found');
        hasErrors = true;
      }

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
        console.error('❌ Type parity check failed');
        process.exit(1);
      }

      console.log('✅ All types are structurally compatible');
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
