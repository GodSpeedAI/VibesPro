#!/usr/bin/env python3
"""VibePDK to Merged Project Migration Tool"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import typer

app = typer.Typer(help="Convert the VibePDK Cookiecutter template into Copier format.")


@app.command()
def migrate(
    template_path: Path = typer.Argument(..., help="Path to the VibePDK template root"),
    target_path: Path = typer.Option(Path("./migrated"), help="Directory where the converted template will be written"),
    dry_run: bool = typer.Option(False, help="If true, only display planned actions without writing output"),
) -> None:
    """Convert a VibePDK Cookiecutter template into a Copier-compatible structure."""
    template_path = template_path.resolve()
    target_path = target_path.resolve()

    typer.echo(f"🔄 Starting VibePDK migration: {template_path} → {target_path}")
    typer.echo(f"   • Dry run: {'yes' if dry_run else 'no'}")

    if not template_path.exists():
        typer.echo(f"❌ Template path does not exist: {template_path}")
        raise typer.Exit(code=1)

    if dry_run:
        typer.echo("ℹ️ Dry run mode – no files will be copied. Implementation TBD in MERGE-TASK-009.")
        return

    # Placeholder for real migration implementation.
    typer.echo("⚠️ Copier conversion logic not implemented yet. See MERGE-TASK-009 in the implementation plan.")


if __name__ == "__main__":
    app()
