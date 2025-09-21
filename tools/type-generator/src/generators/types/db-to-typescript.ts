import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface ColumnDef {
  type: string;
  nullable?: boolean;
  is_array?: boolean;
  [k: string]: unknown;
}

export interface TableDef {
  columns: Record<string, ColumnDef>;
  [k: string]: unknown;
}

export interface Schema {
  tables: Record<string, TableDef>;
  [k: string]: unknown;
}

export class DbToTypeScript {
  generate(schemaPath: string, outputDir?: string): Record<string, Record<string, string>> {
    const schema = this._parseSchema(schemaPath);
    const types = this._generateTypes(schema);

    if (outputDir) {
      this._writeTypesToFiles(types, outputDir);
    }

    return types;
  }

  private _parseSchema(schemaPath: string): Schema {
    const content = readFileSync(schemaPath, 'utf-8');
    const parsed = JSON.parse(content);

    // Basic runtime validation to ensure we have the expected shape.
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`Invalid schema file: expected an object at root (${schemaPath})`);
    }

    const root = parsed as Record<string, unknown>;
    const tables = root.tables;
    if (!tables || typeof tables !== 'object' || Array.isArray(tables)) {
      throw new Error(`Invalid schema file: missing or malformed 'tables' object (${schemaPath})`);
    }

    return parsed as Schema;
  }

  private _generateTypes(schema: Schema): Record<string, Record<string, string>> {
    const types: Record<string, Record<string, string>> = {};

    // Guard in case schema.tables is missing or not an object
    const tables = schema && typeof schema === 'object' ? (schema as Schema).tables : {} as Record<string, TableDef>;
    for (const [tableName, tableDef] of Object.entries(tables || {})) {
      const className = tableName.charAt(0).toUpperCase() + tableName.slice(1);
      const fields: Record<string, string> = {};

      const columns = tableDef && typeof tableDef === 'object' ? (tableDef as TableDef).columns : {} as Record<string, ColumnDef>;
      for (const [colName, colDef] of Object.entries(columns || {})) {
        const columnDef = colDef as ColumnDef;
        const tsType = this.mapPostgresToTypeScript(
          String(columnDef.type ?? ''),
          Boolean(columnDef.nullable),
          Boolean(columnDef.is_array)
        );
        fields[colName] = tsType;
      }

      types[className] = fields;
    }

    return types;
  }

  private _writeTypesToFiles(types: Record<string, Record<string, string>>, outputDir: string): void {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    for (const [className, fields] of Object.entries(types)) {
      const filename = `${className.toLowerCase()}.ts`;
      const filepath = join(outputDir, filename);

      let content = `// Auto-generated TypeScript types for ${className}\n`;
      content += `export interface ${className} {\n`;

      for (const [fieldName, fieldType] of Object.entries(fields)) {
        content += `  ${fieldName}: ${fieldType};\n`;
      }

      content += '}\n\n';

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

    let baseType = typeMap[postgresType.toLowerCase()] || 'unknown';

    if (isArray) {
      baseType = `${baseType}[]`;
    }

    if (nullable) {
      baseType = `${baseType} | null`;
    }

    return baseType;
  }
}
