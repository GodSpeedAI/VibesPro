#!/usr/bin/env python3
"""Post-generation setup hook for Copier."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def run(cmd: list[str], cwd: Path) -> None:
    """Run a subprocess, printing the command for visibility."""
    print(f"   → {' '.join(cmd)} (cwd={cwd})")
    subprocess.run(cmd, check=True, cwd=cwd)


def setup_generated_project(target: Path) -> None:
    """Run initial setup commands inside the generated project."""
    print("🔧 Setting up generated project...")
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
