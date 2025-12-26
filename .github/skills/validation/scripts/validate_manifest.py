#!/usr/bin/env python3
"""
validate_manifest.py

This script verifies that a `ce.manifest.jsonc` file conforms to the expected schema and that
all referenced files and artifacts exist. It is intended to be run via the VS Code task
"Context Kit: Validate". The script prints descriptive error messages and exits with a
non‑zero status if validation fails.
"""

import json
import os
import sys


def remove_jsonc_comments(content: str) -> str:
    """Remove `//` comments from JSONC content for JSON parsing."""
    cleaned = []
    for line in content.splitlines():
        # Remove inline comments
        if "//" in line:
            line = line.split("//", 1)[0]
        cleaned.append(line)
    return "\n".join(cleaned)


def load_manifest(path: str):
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        raise SystemExit(f"Manifest file not found: {path}")
    cleaned = remove_jsonc_comments(content)
    try:
        manifest = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Manifest JSON parse error: {exc}")
    return manifest


def check_file_exists(base_dir: str, file_path: str) -> bool:
    """Check if a file exists relative to the manifest directory. Handles anchor (#) syntax."""
    if "#" in file_path:
        base, _anchor = file_path.split("#", 1)
    else:
        base = file_path
    full_path = os.path.normpath(os.path.join(base_dir, base))
    return os.path.exists(full_path)


def load_tasks(tasks_path: str):
    with open(tasks_path, encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError as exc:
            raise SystemExit(f"Failed to parse tasks file {tasks_path}: {exc}")


def validate_manifest(manifest_path: str) -> int:
    errors = []
    manifest = load_manifest(manifest_path)
    base_dir = os.path.dirname(manifest_path)

    # Check top-level keys
    for key in ["version", "mode", "artifacts"]:
        if key not in manifest:
            errors.append(f"Missing top-level field: {key}")
    vocab_kinds = []
    vocab_tags = []
    if "vocab" in manifest:
        vocab_kinds = manifest["vocab"].get("kinds", [])
        vocab_tags = manifest["vocab"].get("tags", [])

    artifacts = manifest.get("artifacts", [])
    ids_seen = set()

    for idx, art in enumerate(artifacts):
        context = f"Artifact {idx} ({art.get('id', '<no id>')})"

        # Required fields
        for field in ["id", "kind", "path", "tags", "inputs", "outputs", "dependsOn", "related"]:
            if field not in art:
                errors.append(f"{context}: missing required field '{field}'")

        art_id = art.get("id")
        art_kind = art.get("kind")
        art_path = art.get("path")
        art_tags = art.get("tags", [])
        inputs = art.get("inputs", {})
        outputs = art.get("outputs", {})
        depends_on = art.get("dependsOn", {})

        # ID uniqueness
        if art_id in ids_seen:
            errors.append(f"Duplicate artifact id: {art_id}")
        ids_seen.add(art_id)

        # Kind validity
        if vocab_kinds and art_kind not in vocab_kinds:
            errors.append(f"{context}: invalid kind '{art_kind}'. Allowed kinds: {vocab_kinds}")

        # Tags validity
        invalid_tags = [t for t in art_tags if vocab_tags and t not in vocab_tags]
        if invalid_tags:
            errors.append(f"{context}: invalid tags {invalid_tags}. Allowed tags: {vocab_tags}")

        # Check file exists
        if art_path and not check_file_exists(base_dir, art_path):
            errors.append(f"{context}: path does not exist: {art_path}")

        # If path has anchor, verify task label exists
        if art_kind == "task" or ("#" in art_path):
            if "#" in art_path:
                base, anchor = art_path.split("#", 1)
            else:
                base = art_path
                anchor = None
            tasks_file = os.path.normpath(os.path.join(base_dir, base))
            try:
                tasks_json = load_tasks(tasks_file)
            except Exception as exc:
                errors.append(f"{context}: could not load tasks file {base}: {exc}")
                continue
            if anchor:
                labels = [task.get("label") for task in tasks_json.get("tasks", [])]
                if anchor not in labels:
                    errors.append(f"{context}: task label '{anchor}' not found in {base}")

        # Check dependsOn.artifacts exist
        for dep_id in depends_on.get("artifacts", []):
            if dep_id not in ids_seen and not any(a["id"] == dep_id for a in artifacts):
                errors.append(f"{context}: dependsOn artifact '{dep_id}' not defined in manifest")

        # Check dependsOn.files exist
        for dep_file in depends_on.get("files", []):
            if not check_file_exists(base_dir, dep_file):
                errors.append(f"{context}: dependsOn file does not exist: {dep_file}")

        # Minimal structure for inputs/outputs
        for section_name, section in [("inputs", inputs), ("outputs", outputs)]:
            if not isinstance(section, dict):
                errors.append(f"{context}: {section_name} must be an object")

    # Print summary
    if errors:
        sys.stderr.write("Manifest validation failed with the following issues:\n")
        for err in errors:
            sys.stderr.write(" - " + err + "\n")
        return 1
    else:
        print("Manifest validation succeeded.")
        return 0


def main() -> None:
    manifest_path = "ce.manifest.jsonc"
    exit_code = validate_manifest(manifest_path)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
