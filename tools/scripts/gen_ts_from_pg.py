#!/usr/bin/env python3
"""
Generate TypeScript types from a PostgreSQL database schema.

This script introspects the public schema of a running PostgreSQL database
and generates TypeScript interface definitions that match the table structures.

Usage:
    python gen_ts_from_pg.py [--host HOST] [--port PORT] [--user USER] [--password PASSWORD] [--database DATABASE] [--output OUTPUT]

Environment Variables:
    POSTGRES_HOST: Database host (default: localhost)
    POSTGRES_PORT: Database port (default: 54322)
    POSTGRES_USER: Database user (default: postgres)
    POSTGRES_PASSWORD: Database password (default: postgres)
    POSTGRES_DB: Database name (default: postgres)

DEV-SDS-020: End-to-End Type Safety Pipeline
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ColumnInfo:
    """Represents a database column."""

    name: str
    data_type: str
    is_nullable: bool
    is_array: bool
    column_default: str | None


@dataclass
class TableInfo:
    """Represents a database table."""

    name: str
    columns: list[ColumnInfo]


# PostgreSQL to TypeScript type mapping
PG_TO_TS_TYPES: dict[str, str] = {
    # String types
    "character varying": "string",
    "varchar": "string",
    "text": "string",
    "char": "string",
    "character": "string",
    "citext": "string",
    "name": "string",
    # UUID
    "uuid": "string",
    # Numeric types
    "integer": "number",
    "int": "number",
    "int2": "number",
    "int4": "number",
    "int8": "number",
    "smallint": "number",
    "bigint": "number",
    "decimal": "number",
    "numeric": "number",
    "real": "number",
    "float4": "number",
    "float8": "number",
    "double precision": "number",
    "money": "number",
    # Boolean
    "boolean": "boolean",
    "bool": "boolean",
    # Date/Time types - kept as string for compatibility
    "date": "string",
    "time": "string",
    "timestamp": "string",
    "timestamptz": "string",
    "timestamp with time zone": "string",
    "timestamp without time zone": "string",
    "time with time zone": "string",
    "time without time zone": "string",
    "interval": "string",
    # JSON types
    "json": "Record<string, unknown>",
    "jsonb": "Record<string, unknown>",
    # Binary
    "bytea": "string",
    # Network types
    "inet": "string",
    "cidr": "string",
    "macaddr": "string",
    "macaddr8": "string",
    # Geometric types
    "point": "string",
    "line": "string",
    "lseg": "string",
    "box": "string",
    "path": "string",
    "polygon": "string",
    "circle": "string",
    # Other
    "xml": "string",
    "tsvector": "string",
    "tsquery": "string",
    "oid": "number",
}


def run_psql_query(
    query: str, host: str, port: int, user: str, password: str, database: str
) -> list[tuple[str, ...]]:
    """Execute a psql query and return results."""
    env = os.environ.copy()
    env["PGPASSWORD"] = password

    cmd = [
        "psql",
        "-h",
        host,
        "-p",
        str(port),
        "-U",
        user,
        "-d",
        database,
        "-t",  # Tuples only
        "-A",  # Unaligned output
        "-F",
        "|",  # Field separator
        "-c",
        query,
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, env=env, check=True)
        lines = [line.strip() for line in result.stdout.strip().split("\n") if line.strip()]
        return [tuple(line.split("|")) for line in lines]
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to execute query: {e.stderr}", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print("❌ psql command not found. Please install PostgreSQL client.", file=sys.stderr)
        sys.exit(1)


def get_table_list(host: str, port: int, user: str, password: str, database: str) -> list[str]:
    """Get list of tables in the public schema."""
    query = """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """
    results = run_psql_query(query, host, port, user, password, database)
    return [row[0] for row in results if row and row[0]]


def validate_identifier(name: str) -> str:
    """Validate and sanitize a SQL identifier (table/column name).

    Only allows alphanumeric characters and underscores.
    Raises ValueError if invalid.
    """
    import re

    if not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", name):
        raise ValueError(f"Invalid SQL identifier: {name}")
    return name


def get_table_columns(
    table_name: str, host: str, port: int, user: str, password: str, database: str
) -> list[ColumnInfo]:
    """Get columns for a specific table."""
    # Validate table name to prevent SQL injection
    safe_table_name = validate_identifier(table_name)

    query = f"""
        SELECT
            column_name,
            udt_name,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '{safe_table_name}'
        ORDER BY ordinal_position;
    """  # noqa: S608
    results = run_psql_query(query, host, port, user, password, database)
    columns = []
    for row in results:
        if len(row) >= 3:
            name = row[0]
            data_type = row[1]
            is_nullable = row[2].upper() == "YES"
            column_default = row[3] if len(row) > 3 and row[3] else None

            # Check if it's an array type (PostgreSQL arrays start with _)
            is_array = data_type.startswith("_")
            if is_array:
                data_type = data_type[1:]  # Remove leading underscore

            columns.append(
                ColumnInfo(
                    name=name,
                    data_type=data_type,
                    is_nullable=is_nullable,
                    is_array=is_array,
                    column_default=column_default,
                )
            )
    return columns


def pg_type_to_ts(pg_type: str, is_array: bool, is_nullable: bool) -> str:
    """Convert PostgreSQL type to TypeScript type."""
    # Get base TypeScript type
    ts_type = PG_TO_TS_TYPES.get(pg_type.lower(), "unknown")

    # Handle arrays
    if is_array:
        ts_type = f"{ts_type}[]"

    # Handle nullability
    if is_nullable:
        ts_type = f"{ts_type} | null"

    return ts_type


def snake_to_pascal(name: str) -> str:
    """Convert snake_case to PascalCase."""
    return "".join(word.capitalize() for word in name.split("_"))


def generate_typescript_interface(table: TableInfo) -> str:
    """Generate TypeScript interface for a table."""
    interface_name = snake_to_pascal(table.name)
    lines = [
        "/**",
        f" * Database table: {table.name}",
        " * Auto-generated from PostgreSQL schema",
        " */",
        f"export interface {interface_name} {{",
    ]

    for col in table.columns:
        ts_type = pg_type_to_ts(col.data_type, col.is_array, col.is_nullable)
        # Use camelCase for field names
        field_name = col.name
        lines.append(f"  {field_name}: {ts_type};")

    lines.append("}")
    return "\n".join(lines)


def generate_database_types(tables: list[TableInfo]) -> str:
    """Generate complete TypeScript types file."""
    header = [
        "/**",
        " * Auto-generated TypeScript types from PostgreSQL database schema",
        " * Generated by: tools/scripts/gen_ts_from_pg.py",
        " * Source: Supabase local development database",
        " *",
        " * DO NOT EDIT MANUALLY - Regenerate with: just gen-types-ts",
        " * DEV-SDS-020: End-to-End Type Safety Pipeline",
        " */",
        "",
        "/* eslint-disable @typescript-eslint/no-explicit-any */",
        "",
    ]

    interfaces = [generate_typescript_interface(table) for table in tables]

    # Add Database namespace for compatibility with Supabase patterns
    db_namespace = [
        "",
        "/**",
        " * Database type namespace for Supabase-style type access",
        " */",
        "export interface Database {",
        "  public: {",
        "    Tables: {",
    ]

    for table in tables:
        interface_name = snake_to_pascal(table.name)
        db_namespace.extend(
            [
                f"      {table.name}: {{",
                f"        Row: {interface_name};",
                f"        Insert: Partial<{interface_name}>;",
                f"        Update: Partial<{interface_name}>;",
                "      };",
            ]
        )

    db_namespace.extend(
        [
            "    };",
            "    Views: Record<string, never>;",
            "    Functions: Record<string, never>;",
            "  };",
            "}",
        ]
    )

    return "\n".join(header + interfaces + db_namespace) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate TypeScript types from PostgreSQL database schema"
    )
    parser.add_argument(
        "--host",
        default=os.environ.get("POSTGRES_HOST", "localhost"),
        help="Database host (default: localhost)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("POSTGRES_PORT", "54322")),
        help="Database port (default: 54322)",
    )
    parser.add_argument(
        "--user",
        default=os.environ.get("POSTGRES_USER", "postgres"),
        help="Database user (default: postgres)",
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("POSTGRES_PASSWORD", "postgres"),
        help="Database password (default: postgres)",
    )
    parser.add_argument(
        "--database",
        default=os.environ.get("POSTGRES_DB", "postgres"),
        help="Database name (default: postgres)",
    )
    parser.add_argument(
        "--output",
        "-o",
        default="libs/shared/types/src/database.types.ts",
        help="Output file path",
    )

    args = parser.parse_args()

    print(f"🔍 Connecting to PostgreSQL at {args.host}:{args.port}...")

    # Get list of tables
    table_names = get_table_list(args.host, args.port, args.user, args.password, args.database)

    if not table_names:
        print("⚠️  No tables found in the public schema")
        return 1

    print(f"📋 Found {len(table_names)} tables: {', '.join(table_names)}")

    # Collect table information
    tables: list[TableInfo] = []
    for table_name in table_names:
        columns = get_table_columns(
            table_name, args.host, args.port, args.user, args.password, args.database
        )
        tables.append(TableInfo(name=table_name, columns=columns))
        print(f"   - {table_name}: {len(columns)} columns")

    # Generate TypeScript
    typescript_content = generate_database_types(tables)

    # Write output
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(typescript_content, encoding="utf-8")

    print(f"✅ Generated TypeScript types to {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
