#!/usr/bin/env python3
"""VibePDK to Merged Project Migration Tool"""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import typer
import yaml

app = typer.Typer(
    help="Convert a VibePDK Cookiecutter template into a Copier-compatible format."
)


TEMPLATE_VARIABLE_PATTERN = re.compile(r"{{\s*cookiecutter.\s*([^}\s]+)\s*}}")


def convert_cookiecutter_json_to_copier_yml(
    cookiecutter_data: dict,
) -> str:
    """Converts cookiecutter.json data to a copier.yml string."""
    copier_data = {}
    for key, value in cookiecutter_data.items():
        if key.startswith("_"):
            copier_data[key] = value
            continue

        question = {
            "type": "str",
            "help": f"What is the value for {key}?",
        }
        if isinstance(value, list):
            question["type"] = "str"
            question["choices"] = value
            question["default"] = value[0]
        elif isinstance(value, bool):
            question["type"] = "bool"
            question["default"] = value
        elif isinstance(value, str):
            question["default"] = value
        elif isinstance(value, dict):
            # Handle more complex cookiecutter variables if necessary
            question.update(value)
        else:
            question["default"] = str(value)

        copier_data[key] = question

    return yaml.dump(copier_data, sort_keys=False)

def process_template_file(
    source_path: Path, target_path: Path, dry_run: bool = False
) -> None:
    """Reads a file, converts syntax, and writes to the target."""
    try:
        content = source_path.read_text("utf-8")
    except UnicodeDecodeError:
        if not dry_run:
            shutil.copy2(source_path, target_path)
        typer.echo(f"      - Copied binary file: {target_path.name}")
        return

    # Convert {{ cookiecutter.var }} to {{ var }}
    new_content = TEMPLATE_VARIABLE_PATTERN.sub(r"{{ \1 }}", content)

    # Add .j2 suffix if it contains Jinja syntax
    final_target_path = target_path
    if (
        "{{" in new_content
        or "{%" in new_content
        or "{#" in new_content
    ) and ".j2" not in target_path.suffixes:
        final_target_path = target_path.with_suffix(target_path.suffix + ".j2")

    if not dry_run:
        final_target_path.parent.mkdir(parents=True, exist_ok=True)
        final_target_path.write_text(new_content, "utf-8")

    typer.echo(f"      - Processed: {source_path.name} -> {final_target_path.name}")


@app.command()
def migrate(
    template_path: Path = typer.Argument(..., help="Path to the VibePDK template root"),
    target_path: Path = typer.Option(
        Path("./migrated-vibepdk"),
        help="Directory for the converted template",
    ),
    dry_run: bool = typer.Option(
        False, help="If true, only display planned actions without writing output"
    ),
) -> None:
    """Convert a VibePDK Cookiecutter template into a Copier-compatible structure."""
    template_path = template_path.resolve()
    target_path = target_path.resolve()

    typer.echo(f"🔄 Starting VibePDK migration: {template_path} -> {target_path}")
    typer.echo(f"   • Dry run: {'yes' if dry_run else 'no'}")

    cookiecutter_json_path = template_path / "cookiecutter.json"
    if not cookiecutter_json_path.exists():
        typer.echo(f"❌ 'cookiecutter.json' not found in {template_path}")
        raise typer.Exit(code=1)

    if not dry_run:
        if target_path.exists():
            shutil.rmtree(target_path)
        target_path.mkdir(parents=True)

    # 1. Convert cookiecutter.json to copier.yml
    typer.echo("\n📄 Converting cookiecutter.json to copier.yml...")
    cookiecutter_data = json.loads(cookiecutter_json_path.read_text())
    copier_yml_content = convert_cookiecutter_json_to_copier_yml(cookiecutter_data)
    if not dry_run:
        (target_path / "copier.yml").write_text(copier_yml_content)
    typer.echo("   ✅ Done.")

    # 2. Find and process the template directory
    source_template_dir = None
    for item in template_path.iterdir():
        if item.is_dir() and "{{" in item.name and "cookiecutter" in item.name and "}}" in item.name:
            source_template_dir = item
            break

    if not source_template_dir:
        typer.echo(f"❌ Could not find a template directory (e.g., '{{{{cookiecutter.project_slug}}}}') in {template_path}")
        raise typer.Exit(code=1)

    template_dir_name = source_template_dir.name

    target_template_dir = target_path / "templates"
    if not dry_run:
        # We don't create the {{project_slug}} directory, copier does that.
        # We create a generic `templates` directory to hold the content.
        target_template_dir_resolved = target_path / template_dir_name.replace("cookiecutter.", "").replace(" ", "")
        shutil.copytree(source_template_dir, target_template_dir_resolved)
        
        # Now rename it to a generic name that copier can use.
        # A better approach might be to copy contents directly.
        # Let's copy contents directly.
        shutil.rmtree(target_template_dir_resolved)

    typer.echo(f"\n📂 Processing template files from {source_template_dir}...")
    
    # Let's fix the target directory logic.
    # The content of {{cookiecutter.project_slug}} should go into `target_path/{{project_slug}}`
    # Copier expects the template folder to be named `{{_copier_conf.dst_path}}` or similar,
    # or just be in the root of the template.
    # The standard is to have a `{% raw %}{{ project_name }}{% endraw %}` folder.
    # Let's assume the destination is just the root of the target path for now.
    # The user can then point copier to this directory.
    
    # Let's re-evaluate. Copier templates often have a `templates/` subfolder if they are complex.
    # Or they have a `{{project_name}}/` folder.
    # The VibePDK template has a `{{cookiecutter.project_slug}}` folder.
    # The converted template should have a `{{project_slug}}` folder.
    
    final_target_template_dir_name = TEMPLATE_VARIABLE_PATTERN.sub(r"{{ \1 }}", template_dir_name)
    final_target_template_dir = target_path / final_target_template_dir_name
    if not dry_run:
        final_target_template_dir.mkdir(parents=True, exist_ok=True)

    for path in source_template_dir.rglob("*"):
        relative_path_str = str(path.relative_to(source_template_dir))
        
        # also process directory and file names
        new_relative_path_str = TEMPLATE_VARIABLE_PATTERN.sub(r"{{ \1 }}", relative_path_str)
        
        target_file_path = final_target_template_dir / new_relative_path_str
        
        if not dry_run:
            target_file_path.parent.mkdir(parents=True, exist_ok=True)

        if path.is_file():
            process_template_file(path, target_file_path, dry_run)
        elif path.is_dir() and not dry_run:
            target_file_path.mkdir(parents=True, exist_ok=True)

    typer.echo("   ✅ Done.")

    # 3. Copy hooks
    source_hooks_dir = template_path / "hooks"
    if source_hooks_dir.exists():
        target_hooks_dir = target_path / "hooks"
        typer.echo("\n🎣 Copying hooks...")
        if not dry_run:
            shutil.copytree(source_hooks_dir, target_hooks_dir)
        typer.echo("   ✅ Done.")

    typer.echo("\n🎉 Migration complete!")
    if dry_run:
        typer.echo("   (Dry run mode, no files were actually changed)")


if __name__ == "__main__":
    app()