#!/usr/bin/env python3
"""
scaffold-artifact.py

This script scaffolds a new context engineering artifact file with the correct front matter.
It is designed to be called by the artifact-registry skill. The script will create the
specified file (and any missing directories), write YAML front matter based on the provided
arguments and insert a placeholder body. It intentionally avoids interactive prompts; all
information must be supplied via command-line flags.

Usage example:
    python3 scaffold-artifact.py \
        --kind prompt \
        --id ce.prompt.my-feature \
        --path .github/prompts/my-feature.prompt.md \
        --description "Generate a feature plan" \
        --tags planning,product \
        --inputs '{"files":["PRODUCT.md"],"concepts":[],"tools":[]}' \
        --outputs '{"artifacts":[],"files":[],"actions":["produce-plan"]}'
        --dependsOn '{"artifacts":[],"files":["plan-template.md"]}'
        --related '{"artifacts":["ce.agent.planner"],"files":[]}'

The script will error if the target file already exists.
"""

import argparse
import json
import os
import sys

try:
    import yaml  # PyYAML is required
except ImportError:
    sys.stderr.write("PyYAML is required to run this script. Install with `pip install pyyaml`.\n")
    raise


def parse_list(csv: str):
    """Convert a comma-separated string into a list of trimmed strings."""
    return [item.strip() for item in csv.split(",") if item.strip()]


def parse_json_arg(value: str, default):
    """Parse a JSON string argument into a Python object, or return a default if None."""
    if not value:
        return default
    try:
        return json.loads(value)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON for argument: {value}\n{exc}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Scaffold a new context engineering artifact file."
    )
    parser.add_argument(
        "--kind",
        required=True,
        choices=["doc", "agent", "prompt", "instruction", "skill", "toolset", "task"],
        help="Artifact kind",
    )
    parser.add_argument("--id", required=True, help="Unique artifact id (e.g. ce.prompt.example)")
    parser.add_argument("--path", required=True, help="Relative path of the new file")
    parser.add_argument(
        "--description", required=True, help="Human-friendly description of the artifact"
    )
    parser.add_argument("--name", help="Skill name (required when kind=skill)")
    parser.add_argument(
        "--tags", required=True, help="Comma-separated tags from the controlled vocabulary"
    )
    parser.add_argument("--inputs", help="JSON string for metadata.inputs")
    parser.add_argument("--outputs", help="JSON string for metadata.outputs")
    parser.add_argument("--dependsOn", help="JSON string for metadata.dependsOn")
    parser.add_argument("--related", help="JSON string for metadata.related")
    args = parser.parse_args()

    # Prepare metadata fields
    tags_list = parse_list(args.tags)
    inputs = parse_json_arg(args.inputs, {"files": [], "concepts": [], "tools": []})
    outputs = parse_json_arg(args.outputs, {"artifacts": [], "files": [], "actions": []})
    depends_on = parse_json_arg(args.dependsOn, {"artifacts": [], "files": []})
    related = parse_json_arg(args.related, {"artifacts": [], "files": []})

    # Build front matter
    frontmatter = {}

    # Add common fields
    if args.kind == "skill":
        if not args.name:
            parser.error("--name is required when kind is 'skill'")
        frontmatter["name"] = args.name
        frontmatter["description"] = args.description
    else:
        frontmatter["description"] = args.description
        # Provide default keys for certain kinds
        if args.kind == "agent":
            frontmatter["tools"] = []
            frontmatter["model"] = "gpt-4o"
            # handoffs can be added by the author later
        elif args.kind == "prompt":
            frontmatter["agent"] = "agent"
            frontmatter["tools"] = []
            frontmatter["model"] = "gpt-4o"
        elif args.kind == "instruction":
            frontmatter["applyTo"] = ""  # to be filled by author

    # Metadata
    frontmatter["metadata"] = {
        "id": args.id,
        "tags": tags_list,
        "inputs": inputs,
        "outputs": outputs,
        "dependsOn": depends_on,
        "related": related,
    }

    # Render YAML
    yaml_str = yaml.safe_dump(frontmatter, sort_keys=False, allow_unicode=True)

    # Build file content
    title = args.id
    content_lines = [
        "---",
        yaml_str.strip(),
        "---",
        "",
        f"# {title}",
        "",
        "Provide detailed instructions or documentation here.",
        "",
    ]
    content = "\n".join(content_lines)

    # Ensure directory exists
    dir_name = os.path.dirname(args.path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

    # Check if file exists
    if os.path.exists(args.path):
        raise SystemExit(f"Error: file already exists: {args.path}")

    with open(args.path, "w", encoding="utf-8") as f:
        f.write(content)

    # For skills, create references and scripts subfolders
    if args.kind == "skill":
        base_dir = os.path.dirname(args.path)
        refs_dir = os.path.join(base_dir, "references")
        scripts_dir = os.path.join(base_dir, "scripts")
        os.makedirs(refs_dir, exist_ok=True)
        os.makedirs(scripts_dir, exist_ok=True)

    print(f"Scaffolded {args.kind} at {args.path}")


if __name__ == "__main__":
    main()
