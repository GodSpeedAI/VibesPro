import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

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

export class DbToTypeScript {
  generate(schemaPath: string, outputDir?: string): Record<string, Record<string, string>> {
    const schema = this._parseSchema(schemaPath);
    const types = this._generateTypes(schema);

    if (outputDir) {
      this._writeTypesToFiles(types, outputDir);
    }

    return types;
  }

  private _parseSchema(schemaPath: string): DbSchema {
    const content = readFileSync(schemaPath, 'utf-8');
    return JSON.parse(content) as DbSchema;
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
