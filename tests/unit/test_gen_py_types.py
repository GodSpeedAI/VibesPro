import subprocess
from pathlib import Path


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
    # Optional nickname should be Optional[str] and default None so Pydantic accepts missing
    assert "nickname: typing.Optional[str] = None" in content
