# DOCUMENTATION_BASELINE

## Summary

This file records the authoritative documentation sources we used while performing PHASE-000 intelligence: Context7 (Nx generator docs), local repository artifacts (PR diffs #49/#50/#51), and Exa web search results on idempotency and generator best practices.

## Key references collected

- Context7 / Nx: generator schema, generateFiles, formatFiles, and plugin scaffolding examples (used to validate how templates and schema should be authored).
- Exa search results: articles on idempotent code generation, deterministic file writes, and examples of generator test harnesses.
- Local PR artifacts: `templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md`, tests in `tests/generators/`, and `.github/workflows/ai-guidance.yml` updates found in PRs #49/#50/#51.

## What to fetch next (priority list)

1. Context7 deep fetch: generator schema examples for TypeScript + Python generator templates (resolve-library-id + get-library-docs).
2. Exa: three real-world repo examples that show idempotent generator test harnesses and how they compare file manifests between runs.
3. GitHub PR reviews and Actions logs for PRs #49/#50/#51 (download artifacts and grep for failing tests/tracebacks).

## Notes for implementers

- When adding authoritative docs links to intelligence files, include the exact Context7 library ID or source URL for traceability.
- Store downloaded CI logs under `docs/plans/hexddd_integration/intelligence/artifacts/` with a `run-<id>/` layout so the evidence is versioned alongside the intelligence.
- Keep a short JSON index `ci-log-index.json` mapping PR→runIDs→paths so analysts can re-run extraction quickly.

## Status

Status: draft
Date: 2025-11-05

## Goal

Record authoritative documentation references and versions for frameworks and libraries relevant to HexDDD integration.

## Target list

- Nx (current workspace version) — generator docs
- Next.js (v14+) — App Router patterns
- Remix (v2.15+) — data loaders and routing
- Expo (~v54+) — asset handling in monorepos
- FastAPI (latest) — async patterns and dependency injection
- Supabase — type generation and CLI automation
- Zod / Pydantic — runtime validation patterns

## Next steps

1. Use Context7 / microsoft-docs to fetch exact URLs and short excerpts.
2. Save each doc reference with short notes and recommended patterns.
3. Highlight any breaking changes or version mismatches with our `.mise.toml` / package.json.

## Notes

This file will be used to ground design choices in upstream guidance. Leaving as draft pending automated doc fetches.
