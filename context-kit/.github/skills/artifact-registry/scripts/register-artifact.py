#!/usr/bin/env python3
"""
register-artifact.py

This script registers a new artifact in the context engineering manifest. It reads the YAML
front matter from the specified artifact file, constructs a manifest entry and appends it to
`ce.manifest.jsonc`. It will refuse to register an artifact whose ID is already present. The
script preserves existing top‑level keys in the manifest and sorts artifacts by ID.
"""

import argparse
import json
import sys

try:
    import yaml  # PyYAML is required
except ImportError:
    sys.stderr.write("PyYAML is required to run this script. Install with `pip install pyyaml`.\n")
    raise


def remove_jsonc_comments(content: str) -> str:
    """Remove // comments from JSONC content so it can be parsed by json.loads."""
    cleaned_lines = []
    for line in content.splitlines():
        # Strip trailing comments
        if "//" in line:
            line = line.split("//", 1)[0]
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)


def load_manifest(path: str):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    cleaned = remove_jsonc_comments(content)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Failed to parse manifest {path}: {exc}")


def save_manifest(obj, path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)
        f.write("\n")


def parse_frontmatter(file_path: str):
    """Extract YAML front matter from a markdown file and return it as a Python dict."""
    with open(file_path, encoding="utf-8") as f:
        lines = f.readlines()
    start = None
    end = None
    for idx, line in enumerate(lines):
        if line.strip() == "---":
            if start is None:
                start = idx
            elif end is None:
                end = idx
                break
    if start is None or end is None or end <= start + 1:
        raise SystemExit(f"No YAML front matter found in {file_path}")
    yaml_content = "".join(lines[start + 1 : end])
    try:
        return yaml.safe_load(yaml_content) or {}
    except yaml.YAMLError as exc:
        raise SystemExit(f"Failed to parse YAML front matter in {file_path}: {exc}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Register a new artifact in the manifest.")
    parser.add_argument("--manifest", default="ce.manifest.jsonc", help="Path to the manifest file")
    parser.add_argument("--file", required=True, help="Path to the artifact file to register")
    args = parser.parse_args()

    artifact_path = args.file.replace("\\", "/")  # normalise path separators
    manifest_path = args.manifest

    front = parse_frontmatter(artifact_path)
    metadata = front.get("metadata", {})
    artifact_id = metadata.get("id")
    if not artifact_id:
        raise SystemExit(f"metadata.id missing in {artifact_path}")
    # Determine kind from id: ce.<kind>.<slug>
    parts = artifact_id.split(".")
    if len(parts) < 3:
        raise SystemExit(f"Invalid artifact id format: {artifact_id}")
    kind = parts[1]

    entry = {
        "id": artifact_id,
        "kind": kind,
        "path": artifact_path,
        "tags": metadata.get("tags", []),
        "inputs": metadata.get("inputs", {"files": [], "concepts": [], "tools": []}),
        "outputs": metadata.get("outputs", {"artifacts": [], "files": [], "actions": []}),
        "dependsOn": metadata.get("dependsOn", {"artifacts": [], "files": []}),
        "related": metadata.get("related", {"artifacts": [], "files": []}),
    }

    manifest = load_manifest(manifest_path)
    if "artifacts" not in manifest:
        manifest["artifacts"] = []

    # Check for duplicate IDs
    for art in manifest["artifacts"]:
        if art.get("id") == artifact_id:
            raise SystemExit(f"Artifact with id {artifact_id} is already registered.")

    manifest["artifacts"].append(entry)
    # Sort artifacts by id for consistency
    manifest["artifacts"] = sorted(manifest["artifacts"], key=lambda a: a["id"])

    save_manifest(manifest, manifest_path)
    print(f"Registered artifact {artifact_id} in {manifest_path}")


if __name__ == "__main__":
    main()
