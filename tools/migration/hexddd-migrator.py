#!/usr/bin/env python3
"""HexDDD to Merged Project Migration Tool"""

from __future__ import annotations

from pathlib import Path

import typer

from tools.migration.hexddd_migrator import HexDDDMigrator

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

    try:
        # Initialize migrator and perform migration
        migrator = HexDDDMigrator(source_path)
        result = migrator.migrate(target_path, dry_run=dry_run)

        if result.success:
            typer.echo("✅ Migration completed successfully!")

            if dry_run:
                typer.echo("\n📋 Migration Plan:")
                for step in result.migration_plan:
                    typer.echo(f"   {step}")
            else:
                typer.echo(f"\n📁 Migrated to: {result.target_path}")
                typer.echo(f"📄 Files migrated: {len(result.migrated_files)}")
                typer.echo(f"⚙️  Configs preserved: {len(result.preserved_config)}")

                if result.migrated_files:
                    typer.echo("\n📝 Key migrated files:")
                    for file_name in result.migrated_files[:10]:  # Show first 10
                        typer.echo(f"   • {file_name}")
                    if len(result.migrated_files) > 10:
                        typer.echo(f"   ... and {len(result.migrated_files) - 10} more")

                typer.echo(f"\n📖 See {result.target_path}/MIGRATION-GUIDE.md for next steps")
        else:
            typer.echo("❌ Migration failed!")
            for error in result.errors:
                typer.echo(f"   • {error}")
            raise typer.Exit(code=1)

    except Exception as e:
        typer.echo(f"❌ Unexpected error during migration: {str(e)}")
        raise typer.Exit(code=1)


if __name__ == "__main__":
    app()
