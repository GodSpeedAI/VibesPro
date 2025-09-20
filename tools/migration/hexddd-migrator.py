#!/usr/bin/env python3
"""HexDDD to Merged Project Migration Tool"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import typer

app = typer.Typer(help="Migrate existing HexDDD projects into the merged platform structure.")


@app.command()
def migrate(
    source_path: Path = typer.Argument(..., help="Path to the HexDDD project to migrate"),
    target_path: Path = typer.Option(Path("./migrated"), help="Directory where the migrated project will be created"),
    dry_run: bool = typer.Option(False, help="If true, only display the actions that would be taken"),
    include_history: bool = typer.Option(
        False,
        "--include-history/--no-include-history",
        help="Include git history when migrating (requires additional tooling)",
    ),
) -> None:
    """Migrate a HexDDD project into the unified generator-first layout."""
    source_path = source_path.resolve()
    target_path = target_path.resolve()

    typer.echo(f"🔄 Starting HexDDD migration: {source_path} → {target_path}")
    typer.echo(f"   • Dry run: {'yes' if dry_run else 'no'}")
    typer.echo(f"   • Include history: {'yes' if include_history else 'no'}")

    if not source_path.exists():
        typer.echo(f"❌ Source path does not exist: {source_path}")
        raise typer.Exit(code=1)

    if dry_run:
        typer.echo("ℹ️ Dry run mode – no files will be copied. Implementation TBD in MERGE-TASK-010.")
        return

    # Placeholder for the real migration logic to be implemented in MERGE-TASK-010.
    typer.echo("⚠️ Migration logic not implemented yet. See MERGE-TASK-010 in the implementation plan.")


if __name__ == "__main__":
    app()
