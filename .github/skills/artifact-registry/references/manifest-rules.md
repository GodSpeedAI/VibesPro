# Manifest Entry Rules

Each artifact registered in `ce.manifest.jsonc` must follow a strict schema to enable deterministic
routing and validation. Key rules include:

1. **Required fields**. Every entry must define `id`, `kind`, `path`, `tags`, `inputs`, `outputs`,
   `dependsOn` and `related`. Omit optional fields only if there is nothing to declare.

2. **Tags**. Tags must be drawn from the controlled vocabulary defined in `.github/ce/vocab.md`.
   Use between 1–5 tags that capture the primary concerns of the artifact.

3. **Inputs and outputs**. Declare which files, concepts and tools the artifact reads from
   (`inputs`) and which artifacts, files or actions it produces (`outputs`). Accurate IO
   declarations ensure correct routing.

4. **Dependencies**. Use `dependsOn` to list hard dependencies that must be loaded alongside
   this artifact. Use `related` for soft links that are useful to load but not strictly required.

5. **Paths**. Paths are relative to the project root. For tasks defined in `.vscode/tasks.json`,
   append `#<label>` to reference the task label.

Registering artifacts in accordance with these rules prevents drift, enforces strict mode and
simplifies validation.
