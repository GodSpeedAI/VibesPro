#!/usr/bin/env python3
"""Post-generation setup hook for Copier."""

from __future__ import annotations

import os
import shutil
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

    # Check if type generator exists in generated project
    if not type_generator_dir.exists():
        print(f"   → Type generator not found at {type_generator_dir}, skipping type generation.")
        return

    if not schema_path.parent.exists():
        print("   → Temporal database assets not found, skipping type generation.")
        return
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


def _is_hardening_enabled(target: Path) -> bool:
    """Check if security hardening is enabled via env var or answers file."""
    env_val = os.environ.get("COPIER_ENABLE_SECURITY_HARDENING")
    if env_val is not None:
        return str(env_val).lower() in ("1", "true", "yes")

    for fname in (".copier-answers.yml", "copier-answers.yml"):
        answers = target / fname
        if answers.exists():
            try:
                import yaml  # Lazy import to avoid dependency issues when skipping setup
                data = yaml.safe_load(answers.read_text()) or {}
                if isinstance(data, dict) and "enable_security_hardening" in data:
                    return bool(data.get("enable_security_hardening"))
            except ImportError:
                # PyYAML not available - this is expected in test environments
                # Default to False since we can't read the answers file
                return False
            except Exception:
                # Any other error reading/parsing the file
                return False

    return False


def cleanup_security_assets(target: Path) -> None:
    if _is_hardening_enabled(target):
        return

    sec_dir = target / "libs" / "security"
    if sec_dir.exists():
        print("   → Security hardening disabled: removing libs/security from generated project")
        shutil.rmtree(sec_dir, ignore_errors=True)


def setup_generated_project(target: Path) -> None:
    """Run initial setup commands inside the generated project."""
    skip_setup = os.environ.get("COPIER_SKIP_PROJECT_SETUP") == '1'

    if skip_setup:
        print('⚠️ Skipping install/build steps (COPIER_SKIP_PROJECT_SETUP=1)')
        cleanup_security_assets(target)
        return

    print('🔧 Setting up generated project...')
    generate_types(target)
    run(["pnpm", "install"], cwd=target)
    run(["uv", "sync", "--dev"], cwd=target)
    run(["just", "build"], cwd=target)

    cleanup_security_assets(target)

    if skip_setup:
        print("✅ Security assets reconciled (project setup skipped).")
        return

    print("✅ Project setup completed successfully!")
    print()
    print("🚀 Next steps:")
    print("  1. cd into your project directory")
    print("  2. Run 'just dev' to start development")
    print("  3. Run 'just test' to execute the full test suite")
    print("  4. Review the generated README.md for more guidance")
    print()
    print("📝 Optional: Refine Project Context for AI Copilot")
    print("   As your project evolves, update the AI context description:")
    print("   @workspace .github/prompts/project.describe-context.prompt.md")
    print("   This helps Copilot understand your specific business domain.")


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
