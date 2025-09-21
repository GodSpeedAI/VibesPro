#!/usr/bin/env python3
"""Post-generation setup hook for Copier."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def run(cmd: list[str], cwd: Path) -> None:
    """Run a subprocess, printing the command for visibility."""
    print(f"   → {' '.join(cmd)} (cwd={cwd})")
    subprocess.run(cmd, check=True, cwd=cwd)


def generate_types(target: Path) -> None:
    """Generate cross-language types from a central schema."""
    print("🧬 Generating cross-language types...")
    type_generator_dir = target / "tools" / "type-generator"
    schema_path = target / "temporal_db" / "schema.json"
    ts_output_dir = target / "libs" / "shared" / "database-types"
    # Ensure a schema file exists to avoid errors
    if not schema_path.exists():
        print(f"   → Schema file not found at {schema_path}, creating a dummy file.")
        schema_path.parent.mkdir(parents=True, exist_ok=True)
        schema_path.write_text('{"tables": []}')

    cmd = [
        "node",
        "cli.js",
        "generate",
        str(schema_path),
        "--output-dir",
        str(ts_output_dir),
    ]

    # Note: The type-generator CLI produces TypeScript artifacts only.
    # It does not generate Python types — run the project's Python type-generation
    # step separately if Python artifacts are required (e.g. `just types-generate`).
    run(cmd, cwd=type_generator_dir)


def setup_generated_project(target: Path) -> None:
    """Run initial setup commands inside the generated project."""
    if os.environ.get("COPIER_SKIP_PROJECT_SETUP") == '1':
        print('⚠️ Skipping generated project setup (COPIER_SKIP_PROJECT_SETUP=1)')
        return

    print('🔧 Setting up generated project...')
    generate_types(target)
    run(["pnpm", "install"], cwd=target)
    run(["uv", "sync", "--dev"], cwd=target)
    run(["just", "build"], cwd=target)

    print("✅ Project setup completed successfully!")
    print()
    print("🚀 Next steps:")
    print("  1. cd into your project directory")
    print("  2. Run 'just dev' to start development")
    print("  3. Run 'just test' to execute the full test suite")
    print("  4. Review the generated README.md for more guidance")


def main() -> None:
    print("🎉 Project generated successfully!")
    target = Path.cwd()

    try:
        setup_generated_project(target)
    except subprocess.CalledProcessError as exc:
        print(f"❌ Setup failed: {exc}")
        sys.exit(exc.returncode or 1)
    except FileNotFoundError as exc:
        print(f"❌ Required tool not found: {exc}")
        print("Please ensure pnpm, uv, and just are installed in your environment.")
        sys.exit(1)


if __name__ == "__main__":
    main()
