import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'fs';
import { dirname, isAbsolute, join, normalize, parse, relative, resolve } from 'path';

// Import pathSecurity utilities from the JavaScript file directly
const pathSecurity = require('../../../../utils/pathSecurity');
const { assertFilenameSafe, isPathSafe, resolvePathWithinWorkspace, sanitizePathInput } =
  pathSecurity;

interface ColumnDef {
  type: string;
  nullable?: boolean;
  is_array?: boolean;
  [k: string]: unknown;
}

interface TableDef {
  columns?: Record<string, ColumnDef>;
  [k: string]: unknown;
}

interface DbSchema {
  tables?: Record<string, TableDef>;
  [k: string]: unknown;
}

const WORKSPACE_MARKERS = ['nx.json', 'pnpm-workspace.yaml', '.git'];

WORKSPACE_MARKERS.forEach((marker) => {
  if (typeof marker !== 'string' || !marker.trim()) {
    throw new Error('Workspace marker entries must be non-empty strings');
  }

  if (marker.includes('/') || marker.includes('\\')) {
    throw new Error(`Workspace marker may not contain path separators: ${marker}`);
  }
});

function findWorkspaceRoot(startDir: string): string {
  const sanitizedStartDir = sanitizePathInput(startDir, 'workspace search path');
  const normalizedStartDir = normalize(sanitizedStartDir);
  const hasTraversal = normalizedStartDir
    .split(/[\\/]+/)
    .filter(Boolean)
    .some((segment) => segment === '..');

  if (hasTraversal) {
    throw new Error('workspace search path may not contain parent directory traversals');
  }

  const absoluteStartDir = resolve(sanitizedStartDir);

  let realStartDir: string;
  try {
    realStartDir = realpathSync(absoluteStartDir);
  } catch (error) {
    throw new Error(`Unable to resolve workspace search path: ${absoluteStartDir}`);
  }

  let startStats;
  try {
    startStats = lstatSync(realStartDir);
  } catch (error) {
    throw new Error(`Workspace search path does not exist: ${realStartDir}`);
  }

  if (!startStats.isDirectory()) {
    throw new Error(`Workspace search path must be a directory: ${realStartDir}`);
  }

  let currentDir = realStartDir;
  const { root } = parse(currentDir);
  const visited = new Set<string>();

  while (true) {
    if (visited.has(currentDir)) {
      throw new Error(
        `Cyclical directory resolution detected while locating workspace root from: ${realStartDir}`,
      );
    }
    visited.add(currentDir);

    const isWorkspaceRoot = WORKSPACE_MARKERS.some((marker) => {
      const markerPath = join(currentDir, marker);
      try {
        return existsSync(markerPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
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

    currentDir = dirname(currentDir);
  }
}

const WORKSPACE_ROOT = findWorkspaceRoot(process.cwd());

export class DbToTypeScript {
  private readonly workspaceRoot: string;

  constructor(workspaceRoot: string = WORKSPACE_ROOT) {
    const sanitizedRoot = sanitizePathInput(workspaceRoot, 'Workspace root');
    const normalizedRoot = normalize(sanitizedRoot);
    const hasTraversal = normalizedRoot
      .split(/[\\/]+/)
      .filter(Boolean)
      .some((segment) => segment === '..');

    if (hasTraversal) {
      throw new Error('Workspace root may not contain parent directory traversals');
    }

    const absoluteRoot = resolve(sanitizedRoot);
    let canonicalRoot: string;
    try {
      canonicalRoot = realpathSync(absoluteRoot);
    } catch (error) {
      throw new Error(`Workspace root path does not exist or is inaccessible: ${absoluteRoot}`);
    }

    if (!isAbsolute(canonicalRoot)) {
      throw new Error('Workspace root must resolve to an absolute path');
    }

    const stats = lstatSync(canonicalRoot);
    if (!stats.isDirectory()) {
      throw new Error(`Workspace root must be a directory: ${canonicalRoot}`);
    }

    const { root } = parse(canonicalRoot);
    if (canonicalRoot === root) {
      throw new Error('Workspace root cannot be the filesystem root directory.');
    }

    this.workspaceRoot = canonicalRoot;
  }

  generate(schemaPath: string, outputDir?: string): Record<string, Record<string, string>> {
    const sanitizedSchemaPath = sanitizePathInput(schemaPath, 'Schema path');
    if (!isPathSafe(sanitizedSchemaPath)) {
      throw new Error(`Schema path contains invalid path characters: ${schemaPath}`);
    }

    const schema = this._parseSchema(sanitizedSchemaPath);
    const types = this._generateTypes(schema);

    if (outputDir) {
      const sanitizedOutputDir = sanitizePathInput(outputDir, 'Output directory');
      if (!isPathSafe(sanitizedOutputDir)) {
        throw new Error(`Output directory contains invalid path characters: ${outputDir}`);
      }

      const resolvedOutputDir = this._resolveWorkspacePath(sanitizedOutputDir, 'Output directory');
      this._writeTypesToFiles(types, resolvedOutputDir);
    }

    return types;
  }

  private _parseSchema(schemaPath: string): DbSchema {
    const resolvedSchemaPath = this._resolveWorkspacePath(schemaPath, 'Schema path');

    if (!existsSync(resolvedSchemaPath)) {
      throw new Error(`Schema file not found: ${resolvedSchemaPath}`);
    }
    const realSchemaPath = realpathSync(resolvedSchemaPath);
    const relativePath = relative(this.workspaceRoot, realSchemaPath);
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new Error(`Schema path resolves to a location outside the workspace: ${schemaPath}`);
    }

    // Check file size to prevent reading extremely large files
    const stats = statSync(realSchemaPath);
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (stats.size > maxSize) {
      throw new Error(
        `Schema file is too large (${stats.size} bytes). Maximum allowed size is ${maxSize} bytes: ${realSchemaPath}`,
      );
    }

    const content = readFileSync(realSchemaPath, 'utf-8');
    try {
      return JSON.parse(content) as DbSchema;
    } catch (error) {
      throw new Error(
        `Failed to parse schema JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private _resolveWorkspacePath(targetPath: string, description: string): string {
    const sanitized = sanitizePathInput(targetPath, description);
    if (!isPathSafe(sanitized)) {
      throw new Error(`${description} contains invalid path characters: ${targetPath}`);
    }

    return resolvePathWithinWorkspace(sanitized, this.workspaceRoot, description);
  }

  private _generateTypes(schema: DbSchema): Record<string, Record<string, string>> {
    const types: Record<string, Record<string, string>> = {};

    // Utility function to convert table names to PascalCase
    function toPascalCase(name: string): string {
      return name
        .replace(/[_-]+/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    }

    if (!schema.tables || typeof schema.tables !== 'object') return types;

    for (const [tableName, tableDefRaw] of Object.entries(schema.tables)) {
      const className = toPascalCase(tableName);
      const fields: Record<string, string> = {};

      const tableDef = (tableDefRaw as TableDef) || {};
      const columns = tableDef.columns ?? {};

      for (const [colName, colDefRaw] of Object.entries(columns)) {
        const columnDef = colDefRaw as ColumnDef;
        const tsType = this.mapPostgresToTypeScript(
          columnDef.type,
          columnDef.nullable || false,
          columnDef.is_array || false,
        );
        fields[colName] = tsType;
      }

      types[className] = fields;
    }

    return types;
  }

  private _writeTypesToFiles(
    types: Record<string, Record<string, string>>,
    outputDir: string,
  ): void {
    // Validate output directory
    if (!outputDir || typeof outputDir !== 'string') {
      throw new Error('Output directory must be a non-empty string');
    }

    const resolvedOutputDir = this._resolveWorkspacePath(outputDir, 'Output directory');

    if (!existsSync(resolvedOutputDir)) {
      mkdirSync(resolvedOutputDir, { recursive: true });
    }

    const stats = lstatSync(resolvedOutputDir);
    let effectiveStats = stats;
    let canonicalOutputDir = resolvedOutputDir;

    if (stats.isSymbolicLink()) {
      const realPath = realpathSync(resolvedOutputDir);
      const relativeRealPath = relative(this.workspaceRoot, realPath);
      if (relativeRealPath.startsWith('..') || isAbsolute(relativeRealPath)) {
        throw new Error(
          `Output directory is a symlink pointing outside the workspace: ${resolvedOutputDir}`,
        );
      }

      effectiveStats = statSync(realPath);
      canonicalOutputDir = realPath;
      if (!effectiveStats.isDirectory()) {
        throw new Error(
          `Output directory symlink does not resolve to a directory: ${resolvedOutputDir}`,
        );
      }
    } else {
      if (!stats.isDirectory()) {
        throw new Error(`Output path is not a directory: ${resolvedOutputDir}`);
      }

      canonicalOutputDir = realpathSync(resolvedOutputDir);
      const relativeCanonicalPath = relative(this.workspaceRoot, canonicalOutputDir);
      if (relativeCanonicalPath.startsWith('..') || isAbsolute(relativeCanonicalPath)) {
        throw new Error(`Output directory resolves outside the workspace: ${resolvedOutputDir}`);
      }
    }

    // Validate types structure
    if (!types || typeof types !== 'object') {
      throw new Error('Invalid types structure');
    }

    for (const [className, fields] of Object.entries(types)) {
      // Validate class name
      if (!className || typeof className !== 'string' || className.length === 0) {
        throw new Error(`Invalid class name: ${className}`);
      }

      // Validate field names and types
      if (!fields || typeof fields !== 'object') {
        throw new Error(`Invalid fields for class ${className}`);
      }

      // Validate each field
      for (const [fieldName, fieldType] of Object.entries(fields)) {
        if (!fieldName || typeof fieldName !== 'string' || fieldName.length === 0) {
          throw new Error(`Invalid field name for class ${className}: ${fieldName}`);
        }
        if (!fieldType || typeof fieldType !== 'string' || fieldType.length === 0) {
          throw new Error(`Invalid field type for class ${className}.${fieldName}: ${fieldType}`);
        }
      }

      const filename = `${className.toLowerCase()}.ts`;

      assertFilenameSafe(filename, `${className} type file name`);

      const filepath = this._resolveWorkspacePath(
        join(canonicalOutputDir, filename),
        `${className} type file`,
      );

      let content = `// Auto-generated TypeScript types for ${className}\n`;
      content += `export interface ${className} {\n`;

      for (const [fieldName, fieldType] of Object.entries(fields)) {
        content += `  ${fieldName}: ${fieldType};\n`;
      }

      content += '}\n\n';

      // Check file size before writing
      const contentSize = Buffer.byteLength(content, 'utf8');
      const maxSize = 1024 * 1024; // 1MB per file
      if (contentSize > maxSize) {
        throw new Error(
          `Generated type file is too large (${contentSize} bytes). Maximum allowed size is ${maxSize} bytes: ${filepath}`,
        );
      }

      writeFileSync(filepath, content, 'utf-8');
    }
  }

  mapPostgresToTypeScript(
    postgresType: string,
    nullable: boolean = false,
    isArray: boolean = false,
  ): string {
    const typeMap: Record<string, string> = {
      uuid: 'string',
      bigint: 'string',
      timestamptz: 'string',
      timestamp: 'string',
      date: 'string',
      time: 'string',
      integer: 'number',
      smallint: 'number',
      bigserial: 'string',
      serial: 'number',
      boolean: 'boolean',
      text: 'string',
      varchar: 'string',
      char: 'string',
      numeric: 'number',
      decimal: 'number',
      double: 'number',
      real: 'number',
      json: 'unknown',
      jsonb: 'unknown',
      bytea: 'string',
    };

    const lowerType = postgresType.toLowerCase();
    let baseType = typeMap[lowerType];
    if (!baseType) {
      baseType = 'unknown';
      console.warn(
        `[db-to-typescript] Unmapped Postgres type encountered: '${postgresType}'. Defaulting to 'unknown'.`,
      );
    }

    if (isArray) {
      baseType = `${baseType}[]`;
    }

    if (nullable) {
      baseType = `${baseType} | null`;
    }

    return baseType;
  }
}
