import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { isAbsolute, join, relative, resolve } from 'path';

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

const WORKSPACE_ROOT = process.cwd();

export class DbToTypeScript {
  constructor(private readonly workspaceRoot: string = WORKSPACE_ROOT) {}

  generate(schemaPath: string, outputDir?: string): Record<string, Record<string, string>> {
    const schema = this._parseSchema(schemaPath);
    const types = this._generateTypes(schema);

    if (outputDir) {
      const resolvedOutputDir = this._resolveWorkspacePath(outputDir, 'Output directory');
      this._writeTypesToFiles(types, resolvedOutputDir);
    }

    return types;
  }

  private _parseSchema(schemaPath: string): DbSchema {
    const resolvedSchemaPath = this._resolveWorkspacePath(schemaPath, 'Schema path');

    // Basic input validation
    if (!schemaPath || typeof schemaPath !== 'string') {
      throw new Error('Schema path must be a non-empty string');
    }

    // Check file size to prevent reading extremely large files
    const stats = require('fs').statSync(resolvedSchemaPath);
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (stats.size > maxSize) {
      throw new Error(`Schema file is too large (${stats.size} bytes). Maximum allowed size is ${maxSize} bytes: ${resolvedSchemaPath}`);
    }

    const content = readFileSync(resolvedSchemaPath, 'utf-8');
    try {
      return JSON.parse(content) as DbSchema;
    } catch (error) {
      throw new Error(`Failed to parse schema JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private _resolveWorkspacePath(targetPath: string, description: string): string {
    const resolvedPath = resolve(targetPath);
    const relativePath = relative(this.workspaceRoot, resolvedPath);

    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new Error(`${description} must be inside the workspace: ${resolvedPath}`);
    }

    return resolvedPath;
  }

  private _generateTypes(schema: DbSchema): Record<string, Record<string, string>> {
    const types: Record<string, Record<string, string>> = {};

    // Utility function to convert table names to PascalCase
    function toPascalCase(name: string): string {
      return name
        .replace(/[_-]+/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
          columnDef.is_array || false
        );
        fields[colName] = tsType;
      }

      types[className] = fields;
    }

    return types;
  }

  private _writeTypesToFiles(types: Record<string, Record<string, string>>, outputDir: string): void {
    // Validate output directory
    if (!outputDir || typeof outputDir !== 'string') {
      throw new Error('Output directory must be a non-empty string');
    }

    const resolvedOutputDir = this._resolveWorkspacePath(outputDir, 'Output directory');

    // Check if output directory exists and is a directory
    if (!existsSync(resolvedOutputDir)) {
      mkdirSync(resolvedOutputDir, { recursive: true });
    }

    const stats = require('fs').statSync(resolvedOutputDir);
    if (!stats.isDirectory()) {
      throw new Error(`Output path is not a directory: ${resolvedOutputDir}`);
    }

    // Additional security check - ensure it's not a symlink to outside workspace
    if (stats.isSymbolicLink()) {
      const realPath = require('fs').realpathSync(resolvedOutputDir);
      const relativeRealPath = relative(this.workspaceRoot, realPath);
      if (relativeRealPath.startsWith('..') || isAbsolute(relativeRealPath)) {
        throw new Error(`Output directory is a symlink pointing outside the workspace: ${resolvedOutputDir}`);
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
      const filepath = this._resolveWorkspacePath(join(outputDir, filename), `${className} type file`);

      // Validate filename to prevent path traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error(`Invalid filename for class ${className}: ${filename}`);
      }

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
        throw new Error(`Generated type file is too large (${contentSize} bytes). Maximum allowed size is ${maxSize} bytes: ${filepath}`);
      }

      writeFileSync(filepath, content, 'utf-8');
    }
  }

  mapPostgresToTypeScript(
    postgresType: string,
    nullable: boolean = false,
    isArray: boolean = false
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
      console.warn(`[db-to-typescript] Unmapped Postgres type encountered: '${postgresType}'. Defaulting to 'unknown'.`);
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
