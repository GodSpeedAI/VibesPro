"""
Generate Pydantic models from TypeScript interface files that define database
schemas. The goal is to mirror the generated Supabase TypeScript types in
Python for downstream validation and runtime use.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

TS_TO_PY: dict[str, str] = {
    "string": "str",
    "number": "float",
    "boolean": "bool",
    "unknown": "JsonValue",
    "any": "JsonValue",
    "object": "dict",
    "uuid": "str",
}

INTERFACE_RE = re.compile(r"export interface\s+([A-Za-z0-9_]+)\s*{")
FIELD_RE = re.compile(r"^\s*([A-Za-z0-9_?]+)\s*:\s*([^;]+?);?\s*$")
ARRAY_RE = re.compile(r"^(.+)\[\]$")

SUPABASE_DATABASE_RE = re.compile(r"export\s+type\s+Database\s*=\s*{")


def map_ts_type_to_python(ts_type: str) -> str:
    """Translate a simple TypeScript type expression into a Python type hint."""
    ts_type = ts_type.strip()

    nullable = False
    if "| null" in ts_type or "| undefined" in ts_type:
        nullable = True
        ts_type = ts_type.replace("| null", "").replace("| undefined", "").strip()

    array_match = ARRAY_RE.match(ts_type)
    if array_match:
        inner = map_ts_type_to_python(array_match.group(1))
        py_type = f"list[{inner}]"
    elif ts_type.startswith("Array<") and ts_type.endswith(">"):
        inner = ts_type[len("Array<") : -1].strip()
        py_type = f"list[{map_ts_type_to_python(inner)}]"
    elif ts_type.lower().startswith("record<"):
        py_type = "dict[str, JsonValue]"
    else:
        base = ts_type.lower()
        py_type = TS_TO_PY.get(base, "JsonValue")

    if nullable:
        return f"{py_type} | None"
    return py_type


def parse_ts_file(path: Path) -> dict[str, dict[str, tuple[str, str]]]:
    """Parse exported interfaces and fields from a TypeScript definitions file."""
    text = path.read_text(encoding="utf-8")
    interfaces: dict[str, dict[str, str]] = {}

    for match in INTERFACE_RE.finditer(text):
        name = match.group(1)
        start = match.end()
        brace_count = 1
        pos = start
        while pos < len(text) and brace_count > 0:
            if text[pos] == "{":
                brace_count += 1
            elif text[pos] == "}":
                brace_count -= 1
            pos += 1
        block = text[start : pos - 1]

        # Map: field_name -> (python_type_str, default_assignment)
        fields: dict[str, tuple[str, str]] = {}
        for line in block.splitlines():
            field_match = FIELD_RE.match(line.strip())
            if not field_match:
                continue
            raw_name, raw_type = field_match.groups()

            # Track whether the field may be omitted entirely (`?` or `| undefined`)
            is_optional = raw_name.endswith("?") or "| undefined" in raw_type
            name_clean = raw_name.rstrip("?")

            # Map the TypeScript type to Python
            py_type = map_ts_type_to_python(raw_type.strip())

            # If the field was marked optional (via ? or | undefined), ensure it's Optional
            if is_optional and not py_type.endswith(" | None"):
                py_type = f"{py_type} | None"

            # If optional via ? or | undefined, provide a default None to make the
            # Pydantic model accept missing properties (omitted in JSON payloads).
            default = " = None" if is_optional else ""
            fields[name_clean] = (py_type, default)
        if fields:
            interfaces[name] = fields

    return interfaces


def _extract_braced_block(text: str, start: int) -> tuple[str, int]:
    """Extract a '{...}' block where `start` is the index immediately after '{'.

    Returns the block content (excluding the outer braces) and the index of the
    closing brace.
    """

    brace_count = 1
    pos = start
    while pos < len(text) and brace_count > 0:
        if text[pos] == "{":
            brace_count += 1
        elif text[pos] == "}":
            brace_count -= 1
        pos += 1

    # `pos` is one past the closing brace when brace_count hits 0
    end = pos - 1
    return text[start:end], end


def _extract_named_block(text: str, name: str, start_at: int = 0) -> tuple[str | None, int]:
    """Extract a named block like 'Name: { ... }' from `text`.

    Returns (block_content, end_index) or (None, start_at) if not found.
    """

    pattern = re.compile(rf"\b{re.escape(name)}\s*:\s*{{")
    match = pattern.search(text, start_at)
    if not match:
        return None, start_at

    block, end = _extract_braced_block(text, match.end())
    return block, end


def _pascal_case(name: str) -> str:
    return "".join(part.capitalize() for part in name.strip().split("_") if part)


def _parse_field_block(block: str) -> dict[str, tuple[str, str]]:
    """Parse a simple TS object field block into python types.

    Supports both interface-style fields ending with ';' and Supabase type-literal
    fields without semicolons.
    """

    fields: dict[str, tuple[str, str]] = {}
    for line in block.splitlines():
        field_match = FIELD_RE.match(line.strip())
        if not field_match:
            continue

        raw_name, raw_type = field_match.groups()
        is_optional = raw_name.endswith("?") or "| undefined" in raw_type
        name_clean = raw_name.rstrip("?")

        py_type = map_ts_type_to_python(raw_type.strip())
        if is_optional and not py_type.endswith(" | None"):
            py_type = f"{py_type} | None"
        default = " = None" if is_optional else ""
        fields[name_clean] = (py_type, default)

    return fields


def parse_supabase_database_types(path: Path) -> dict[str, dict[str, tuple[str, str]]]:
    """Parse Supabase-generated `export type Database = { ... }` tables into models.

    Supabase's official TS types represent table shapes as nested type literals:

      Database.public.Tables.<table>.Row / Insert / Update

    We generate:
      <TablePascal> (Row)
      <TablePascal>Insert
      <TablePascal>Update
    """

    text = path.read_text(encoding="utf-8")
    match = SUPABASE_DATABASE_RE.search(text)
    if not match:
        return {}

    db_block, _ = _extract_braced_block(text, match.end())
    public_block, _ = _extract_named_block(db_block, "public")
    if public_block is None:
        return {}

    tables_block, _ = _extract_named_block(public_block, "Tables")
    if tables_block is None:
        return {}

    table_def_re = re.compile(r'^\s*(?:"([^"]+)"|([A-Za-z0-9_]+))\s*:\s*{', re.MULTILINE)
    models: dict[str, dict[str, tuple[str, str]]] = {}
    pos = 0
    while True:
        m = table_def_re.search(tables_block, pos)
        if not m:
            break

        table_name = m.group(1) or m.group(2)
        table_body, end = _extract_braced_block(tables_block, m.end())
        pos = end

        # Extract Row/Insert/Update blocks and parse fields
        row_block, _ = _extract_named_block(table_body, "Row")
        insert_block, _ = _extract_named_block(table_body, "Insert")
        update_block, _ = _extract_named_block(table_body, "Update")

        base_name = _pascal_case(table_name)
        if row_block is not None:
            row_fields = _parse_field_block(row_block)
            if row_fields:
                models[base_name] = row_fields
        if insert_block is not None:
            insert_fields = _parse_field_block(insert_block)
            if insert_fields:
                models[f"{base_name}Insert"] = insert_fields
        if update_block is not None:
            update_fields = _parse_field_block(update_block)
            if update_fields:
                models[f"{base_name}Update"] = update_fields

    return models


def generate_python_models(ts_dir: Path, out_dir: Path) -> Path:
    """Generate a consolidated models.py file from TS interface definitions."""
    out_dir.mkdir(parents=True, exist_ok=True)
    imports = {"from pydantic import BaseModel, JsonValue"}
    models: list[str] = []

    # Skip the Database namespace as it's a TypeScript-specific pattern
    # that doesn't translate well to Python Pydantic models
    skip_classes = {"Database"}

    for path in sorted(ts_dir.glob("*.ts")):
        parsed = parse_ts_file(path)
        # Also support Supabase's official 'export type Database = { ... }' output.
        for model_name, fields in parse_supabase_database_types(path).items():
            parsed.setdefault(model_name, fields)
        for class_name, fields in parsed.items():
            # Skip utility interfaces that don't represent tables
            if class_name in skip_classes:
                continue

            py_fields: list[str] = []
            for fname, (py_type, default) in fields.items():
                py_fields.append(f"    {fname}: {py_type}{default}")
            class_lines = [f"class {class_name}(BaseModel):"]
            if py_fields:
                class_lines.extend(py_fields)
            else:
                class_lines.append("    pass")
            models.append("\n".join(class_lines))

    output_path = out_dir / "models.py"
    header = [
        "# Auto-generated by gen_py_types.py",
        "# DO NOT EDIT MANUALLY - Regenerate with: just gen-types-py",
        "#",
        "# These Pydantic models correspond to the TypeScript interfaces",
        "# generated from the PostgreSQL database schema.",
        "#",
        "# Note: The TypeScript Database namespace is not generated here",
        "# as it's a TypeScript-specific pattern for Supabase client typing.",
    ]
    # PEP 8: Use 2 blank lines between top-level class definitions
    combined_models = "\n\n\n".join(models) if models else ""
    # Join with double newlines: header, imports, then 2 blank lines before first class
    content_parts = ["\n".join(header), "\n".join(sorted(imports)), "", "", combined_models]
    output_path.write_text("\n".join(content_parts) + "\n", encoding="utf-8")
    return output_path


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("Usage: gen_py_types.py <ts_dir> <py_out_dir>")
        return 2

    ts_dir = Path(argv[1])
    out_dir = Path(argv[2])

    if not ts_dir.exists():
        print(f"TS directory does not exist: {ts_dir}")
        return 2

    output_path = generate_python_models(ts_dir, out_dir)
    print(f"Generated {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
