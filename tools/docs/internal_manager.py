#!/usr/bin/env python3
"""Manage internal documentation exclusion with stub generation."""

import argparse
import re
import shutil
import sys
from pathlib import Path

# Markers for Spec Guard or other tools
SPEC_GUARD_MARKER = "<!-- vibePDK-spec-guard:summary -->"


def get_frontmatter_and_summary(content: str) -> tuple[str, str]:
    """
    Extracts frontmatter and a summary from the markdown content.
    Returns (frontmatter_block, summary_text)
    """
    lines = content.split("\n")
    frontmatter: list[str] = []

    if lines and lines[0].strip() == "---":
        frontmatter.append(lines[0])
        for line in lines[1:]:
            frontmatter.append(line)
            if line.strip() == "---":
                break

    # Simple summary extraction: First non-empty lines after headers
    # Or look for specific Summary section
    body = lines[len(frontmatter) :] if frontmatter else lines

    # Try to find a "Summary" or "Context" header
    capture = False
    captured_lines: list[str] = []
    for line in body:
        if re.match(r"^#+\s*(Summary|Context|Abstract|Overview)", line, re.IGNORECASE):
            capture = True
            continue
        if re.match(r"^#+\s*", line) and capture:
            capture = False  # Stop at next header
            break

        if capture and line.strip():
            captured_lines.append(line.strip())
            if len(captured_lines) >= 3:  # Limit summary lines
                break

    if not captured_lines:
        # Fallback: grab first few non-header text lines
        for line in body:
            if not line.strip().startswith("#") and line.strip():
                captured_lines.append(line.strip())
                if len(captured_lines) >= 3:
                    break

    summary_text = " ".join(captured_lines)
    if len(summary_text) > 300:
        summary_text = summary_text[:297] + "..."

    return "\n".join(frontmatter), summary_text


def create_stub_content(original_path: Path, internal_path: Path, content: str) -> str:
    """
    Generates the content for the stub file.
    Uses a 'Stealth' template to prevent information leakage.
    """
    # Suppress unused parameter warnings - kept for API compatibility
    _ = original_path
    _ = internal_path

    frontmatter, _ = get_frontmatter_and_summary(content)

    # Check if there is an explicit Public Summary in the internal file
    # We look for a header specifically named "Summary (Public)"
    public_summary = "Content not included in this distribution."
    if "## Summary (Public)" in content:
        # Extract the manual public summary if present
        parts = content.split("## Summary (Public)")
        if len(parts) > 1:
            # take text until next header
            summary_part = parts[1].split("\n#")[0].strip()
            if summary_part:
                public_summary = summary_part

    stub = f"""{frontmatter}

# Specification

> **Note**: This document is reserved for the internal development environment.

## Overview

{public_summary}

{SPEC_GUARD_MARKER}

## Reference

Available in the internal repository context.
"""
    return stub


def migrate_file(filepath: str) -> bool:
    """
    Moves a file to .internal/ and creates a stub.
    """
    file_path = Path(filepath)
    if not file_path.exists():
        print(f"Skipping missing file: {filepath}")
        return False

    # Check if already migrated
    if ".internal" in str(file_path):
        print(f"Skipping already internal file: {filepath}")
        return False

    parent_dir = file_path.parent
    internal_dir = parent_dir / ".internal"
    internal_dir.mkdir(parents=True, exist_ok=True)

    dest_path = internal_dir / file_path.name

    print(f"Migrating {file_path} -> {dest_path}")

    # Read original content
    with open(file_path, encoding="utf-8") as f:
        content = f.read()

    # Move file
    shutil.move(str(file_path), str(dest_path))

    # Create Stub
    stub_content = create_stub_content(file_path, dest_path, content)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(stub_content)

    return True


def restore_file(filepath: str) -> bool:
    """
    Restores an internal file to its original location (Undo migrate).
    filepath should be the STUB path or the INTERNAL path.
    """
    path_obj = Path(filepath)

    # Identify stub vs internal
    if ".internal" in str(path_obj):
        internal_path = path_obj
        # deduce stub path: .../docs/specs/.internal/foo.md -> .../docs/specs/foo.md
        stub_path = internal_path.parent.parent / internal_path.name
    else:
        stub_path = path_obj
        internal_path = stub_path.parent / ".internal" / stub_path.name

    if not internal_path.exists():
        print(f"Internal file not found for restore: {internal_path}")
        return False

    print(f"Restoring {internal_path} -> {stub_path}")
    shutil.move(str(internal_path), str(stub_path))

    # Clean up .internal if empty
    try:
        internal_path.parent.rmdir()
    except OSError:
        pass  # Directory not empty

    return True


def sync_stubs(root_dir: str) -> None:
    """
    Walks the directory tree, finds .internal files, and updates their corresponding stubs.
    """
    root = Path(root_dir)
    count = 0
    for internal_file in root.glob("**/.internal/*.md"):
        stub_path = internal_file.parent.parent / internal_file.name

        if stub_path.exists():
            with open(internal_file, encoding="utf-8") as f:
                content = f.read()

            new_stub = create_stub_content(stub_path, internal_file, content)

            # Read existing stub to check for changes
            with open(stub_path, encoding="utf-8") as f:
                current_stub = f.read()

            if new_stub != current_stub:
                print(f"Syncing stub: {stub_path}")
                with open(stub_path, "w", encoding="utf-8") as f:
                    f.write(new_stub)
                count += 1
    print(f"Synced {count} stubs.")


def validate_integrity(root_dir: str) -> None:
    """
    Checks for drift and broken links.
    """
    root = Path(root_dir)
    errors: list[str] = []

    for internal_file in root.glob("**/.internal/*.md"):
        stub_path = internal_file.parent.parent / internal_file.name

        if not stub_path.exists():
            errors.append(f"Orphaned internal file (no stub): {internal_file}")
            continue

        with open(internal_file, encoding="utf-8") as f:
            content = f.read()

        expected_stub = create_stub_content(stub_path, internal_file, content)

        with open(stub_path, encoding="utf-8") as f:
            current_stub = f.read()

        # Normalize line endings just in case
        if expected_stub.strip() != current_stub.strip():
            # Allow some leeway? No, strict sync.
            errors.append(f"Stub drift detected: {stub_path}. Run 'just docs-sync'.")

    if errors:
        print("Validation Failures:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("All internal docs validated successfully.")


def main() -> None:
    """CLI entrypoint for internal documentation management."""
    parser = argparse.ArgumentParser(description="Manage internal documentation exclusion.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Migrate
    migrate_parser = subparsers.add_parser("migrate", help="Move files to .internal")
    migrate_parser.add_argument("files", nargs="+", help="List of files to migrate")

    # Restore
    restore_parser = subparsers.add_parser("restore", help="Restore files from .internal")
    restore_parser.add_argument("files", nargs="+", help="List of files (stubs) to restore")

    # Sync
    sync_parser = subparsers.add_parser("sync", help="Sync stubs with internal content")
    sync_parser.add_argument("--root", default="docs", help="Root directory to scan")

    # Validate
    validate_parser = subparsers.add_parser("validate", help="Validate stubs and links")
    validate_parser.add_argument("--root", default="docs", help="Root directory to scan")

    args = parser.parse_args()

    command: str = str(args.command)  # type: ignore[misc]
    if command == "migrate":
        files: list[str] = [str(f) for f in args.files]  # type: ignore[misc]
        for filepath in files:
            migrate_file(filepath)
    elif command == "restore":
        files = [str(f) for f in args.files]  # type: ignore[misc]
        for filepath in files:
            restore_file(filepath)
    elif command == "sync":
        root: str = str(args.root)  # type: ignore[misc]
        sync_stubs(root)
    elif command == "validate":
        root = str(args.root)  # type: ignore[misc]
        validate_integrity(root)


if __name__ == "__main__":
    main()
