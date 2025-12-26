# Manifest Schema

The `ce.manifest.jsonc` file enumerates all routable artifacts in the repository. Each entry describes the artifact's identity, kind, path, tags, inputs, outputs, dependencies and related artifacts. Strict mode requires that every file used for routing be present in the manifest.

## Top‑Level Fields

- **`version`**: The manifest schema version.
- **`mode`**: The routing mode; `strict` means unregistered files are ignored.
- **`defaults`**: Global settings such as maximum files to load and preferred routing behaviour.
- **`vocab`**: Controlled vocabularies for artifact kinds and tags.
- **`artifacts`**: An array of artifact definitions.

## Artifact Fields

Each object in `artifacts` must include:

- **`id`**: A unique stable identifier in the format `ce.<kind>.<slug>`.
- **`kind`**: One of the allowed kinds defined in `vocab.kinds` (`doc`, `agent`, `prompt`, `instruction`, `skill`, `toolset`, `task`).
- **`path`**: Relative path to the file or, for tasks, the path followed by the task label after a `#`.
- **`tags`**: An array of zero or more tags defined in `vocab.tags`.
- **`inputs`**: Describes what this artifact consumes: `files`, `concepts` and `tools`.
- **`outputs`**: Describes what this artifact produces or influences: `artifacts`, `files` and `actions`.
- **`dependsOn`**: Hard dependencies; these must be included when the artifact is loaded.
- **`related`**: Soft links; helpful but not required.

### Inputs and Outputs

The `inputs` section lists the files, conceptual tokens and tools required by the artifact. The `outputs` section lists new artifacts, files or actions that are produced. Using these fields, the orchestrator can determine which context to load without reading the file body.

### Dependencies

- **`dependsOn.artifacts`**: Other artifacts that must be loaded whenever this artifact is used.
- **`dependsOn.files`**: Files that must exist for the artifact to function. The validation task checks these paths.
- **`related.artifacts`** and **`related.files`**: Additional context that may be useful but is not mandatory.

## Adding a New Artifact

To add a new artifact:

1. Use the `artifact-registry` skill to scaffold the file and update the manifest. This ensures that the file name, ID and metadata are consistent.
2. Populate the frontmatter in the new file with an informative description, relevant tags and accurate input/output declarations.
3. Run the `Context Kit: Validate` task. This script checks that IDs are unique, tags are valid, paths exist, and dependencies are satisfied.

By adhering to this schema, the manifest remains easy to read, diff and audit, and routing decisions become deterministic.
