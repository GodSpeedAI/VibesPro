import importlib.machinery
import subprocess
import types
from pathlib import Path


def _pascal_case(name: str) -> str:
    return "".join(part.capitalize() for part in name.strip().split("_") if part)


def test_generate_python_models_from_ts(tmp_path: Path):
    ts_dir = tmp_path / "ts"
    py_out = tmp_path / "py"
    ts_dir.mkdir()
    py_out.mkdir()
    ts_file = ts_dir / "database.types.ts"
    ts_file.write_text(
        "// Auto-generated TypeScript types\nexport interface User {\n  id: string;\n  email: string;\n  created_at: string;\n  is_active: boolean;\n}\n",
        encoding="utf-8",
    )

    # Run generator
    script = Path("tools/scripts/gen_py_types.py")
    result = subprocess.run(
        ["python3", str(script), str(ts_dir), str(py_out)], capture_output=True, text=True
    )
    assert result.returncode == 0, result.stderr

    models_file = py_out / "models.py"
    assert models_file.exists()
    content = models_file.read_text(encoding="utf-8")
    assert "class User(BaseModel)" in content
    assert "email: str" in content


def test_generate_optional_field_becomes_optional_in_python(tmp_path: Path):
    ts_dir = tmp_path / "ts"
    py_out = tmp_path / "py"
    ts_dir.mkdir()
    py_out.mkdir()
    ts_file = ts_dir / "database.types.ts"
    ts_file.write_text(
        "// Auto-generated TypeScript types\nexport interface Actor {\n  id: string;\n  nickname?: string;\n}\n",
        encoding="utf-8",
    )

    script = Path("tools/scripts/gen_py_types.py")
    result = subprocess.run(
        ["python3", str(script), str(ts_dir), str(py_out)], capture_output=True, text=True
    )
    assert result.returncode == 0, result.stderr

    models_file = py_out / "models.py"
    content = models_file.read_text(encoding="utf-8")
    # Optional nickname should use modern Python union syntax and default None so Pydantic accepts missing
    assert "nickname: str | None = None" in content


def test_generated_model_accepts_missing_optional_field(tmp_path: Path):
    ts_dir = tmp_path / "ts"
    py_out = tmp_path / "py"
    ts_dir.mkdir()
    py_out.mkdir()
    ts_file = ts_dir / "database.types.ts"
    ts_file.write_text(
        "// Auto-generated TypeScript types\nexport interface Actor {\n  id: string;\n  nickname?: string;\n}\n",
        encoding="utf-8",
    )

    script = Path("tools/scripts/gen_py_types.py")
    result = subprocess.run(
        ["python3", str(script), str(ts_dir), str(py_out)], capture_output=True, text=True
    )
    assert result.returncode == 0, result.stderr

    models_file = py_out / "models.py"
    loader = importlib.machinery.SourceFileLoader("generated_models", str(models_file))
    generated = types.ModuleType("generated_models")
    loader.exec_module(generated)

    actor = generated.Actor(id="123")
    assert actor.nickname is None


def test_generate_models_from_supabase_database_type_alias(tmp_path: Path):
    """Generator supports Supabase 'export type Database = { ... }' format.

    Supabase's official type output represents tables as nested type literals under
    Database.public.Tables.<table>.Row/Insert/Update. We should generate Pydantic
    models for these shapes.
    """

    ts_dir = tmp_path / "ts"
    py_out = tmp_path / "py"
    ts_dir.mkdir()
    py_out.mkdir()

    ts_file = ts_dir / "database.types.ts"
    ts_file.write_text(
        """
export type Database = {
    public: {
        Tables: {
            journey_e_validation: {
                Row: {
                    created_at: string
                    id: string
                    name: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    name?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
    }
}
""".lstrip(),
        encoding="utf-8",
    )

    script = Path("tools/scripts/gen_py_types.py")
    result = subprocess.run(
        ["python3", str(script), str(ts_dir), str(py_out)], capture_output=True, text=True
    )
    assert result.returncode == 0, result.stderr

    models_file = py_out / "models.py"
    assert models_file.exists()
    content = models_file.read_text(encoding="utf-8")

    # Base table model represents the Row shape
    assert "class JourneyEValidation(BaseModel)" in content
    assert "name: str" in content

    # Insert / Update models are also generated and preserve optionality
    assert "class JourneyEValidationInsert(BaseModel)" in content
    assert "id: str | None = None" in content
    assert "class JourneyEValidationUpdate(BaseModel)" in content
    assert "name: str | None = None" in content


def test_generate_models_from_real_schema(tmp_path: Path):
    """Verify generator handles real Supabase schema with actual table types."""
    ts_file = Path("libs/shared/types/src/database.types.ts")
    if not ts_file.exists():
        import pytest

        pytest.skip("TypeScript types not generated - run 'just gen-types-ts' first")

    py_out = tmp_path / "py"
    py_out.mkdir()

    # Run generator with real types
    script = Path("tools/scripts/gen_py_types.py")
    result = subprocess.run(
        ["python3", str(script), str(ts_file.parent), str(py_out)],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr

    models_file = py_out / "models.py"
    assert models_file.exists()
    content = models_file.read_text(encoding="utf-8")

    # Avoid hard-coding specific tables (schema varies by environment). Instead:
    # - If the TS file uses 'export interface X', assert we generated X.
    # - If the TS file uses Supabase 'Database.public.Tables.<t>.Row', assert we generated <T>.
    ts_text = ts_file.read_text(encoding="utf-8")

    if "export interface" in ts_text:
        import re

        m = re.search(r"export interface\s+([A-Za-z0-9_]+)\s*{", ts_text)
        assert m, "Expected at least one exported interface"
        iface = m.group(1)
        assert f"class {iface}(BaseModel)" in content
    elif "Tables:" in ts_text:
        import re

        m = re.search(r"\bTables\s*:\s*{\s*([A-Za-z0-9_]+)\s*:\s*{", ts_text)
        assert m, "Expected at least one table under Database.public.Tables"
        table = m.group(1)
        model = _pascal_case(table)
        assert f"class {model}(BaseModel)" in content
    else:
        import pytest

        pytest.skip("No recognized schema patterns in TS types")
