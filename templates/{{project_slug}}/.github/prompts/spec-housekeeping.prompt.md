---
kind: prompt
domain: spec
task: housekeeping
thread: spec-housekeeping
matrix_ids: []
budget: S
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search"]
description: "Update spec indexes and traceability matrix with minimal context load."
---

# Spec Housekeeping — Index & Traceability Updater (Lean)

## Goal

Keep indexes and the traceability matrix current after spec extraction/changes,
without loading entire specs unless gaps are detected.

## Inputs

- Product spec files (if present): `docs/PRD.md`, `docs/ADR.md`, `docs/SDS.md`, `docs/technical_specifications.md`
- Developer spec files (if present): `docs/dev_prd.md`, `docs/dev_adr.md`, `docs/dev_sds.md`, `docs/dev_technical-specifications.md`
- Index files (to update): `docs/spec_index.md`, `docs/dev_spec_index.md`
- Traceability file (to update): `docs/traceability_matrix.md`

## ID Patterns

- Product: `PRD-\d+`, `ADR-\d+`, `SDS-\d+`, `TS-\d+`
- Developer: `DEV-PRD-\d+`, `DEV-ADR-\d+`, `DEV-SDS-\d+`, `DEV-TS-\d+`

## Task

1. Collect IDs + Anchors (Selective)

   - Quickly scan headings of each spec file for IDs following the patterns above.
   - For each ID, capture the exact Markdown heading text and the generated anchor.
   - Do not ingest full bodies unless an anchor cannot be inferred.

2. Update Product Index (`docs/spec_index.md`)

   - For each Product ID found, write/update a concise line (≤ 140 chars):
     - `- <ID> — <short title>. See docs/<FILE>.md#<anchor>`.
   - Preserve existing lines; update titles/anchors if they changed.
   - Keep alphabetical by prefix, then numeric.

3. Update Developer Index (`docs/dev_spec_index.md`)

   - Same approach for all `DEV-*` IDs.

4. Update Traceability Matrix (`docs/traceability_matrix.md`)

   - Ensure there is a section with columns:
     - Spec ID | Artifact (file/class/API/test) | Status | PR/Commit | Notes
   - Append new rows for any IDs that lack entries.
   - Mark `Status=Planned` if no artifact is detected yet.
   - If artifacts exist, link to them and set `Status=In-Progress` or `Done`.

5. Report Gaps
   - List any IDs missing acceptance criteria (PRD) or interface contracts (SDS/TS).
   - List any orphan artifacts with no spec ID.
   - If anchor inference failed, escalate to a wide spec load.

## Output

- Direct edits to: `docs/spec_index.md`, `docs/dev_spec_index.md`, and `docs/traceability_matrix.md`.
- A short summary noting counts of IDs scanned, new index entries, and matrix updates.

## Acceptance Criteria

- Index lines ≤ 140 chars; all entries are linkable via anchors.
- No duplicate IDs across indexes.
- Every new/changed spec ID appears in the matrix with a Status.
