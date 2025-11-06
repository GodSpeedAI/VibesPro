# REPOSITORY_CONTEXT

Status: populated (snapshot)
Date: 2025-11-05

## Snapshot maintenance

-   Snapshot captured on **2025-11-05**.
-   Refresh cadence: **weekly** or immediately after large-scale workspace scaffolds/merges.
-   Triggers for ad-hoc refresh: new generators added, Nx upgrades, or structural changes to `libs/` / `tools/`.
-   Maintainer: HexDDD Orchestrator (owns keeping this context current).

## Purpose

Capture a current snapshot of the Nx workspace, available generators, and quick guidance for where to look for generator- or domain-related changes.

## Workspace snapshot (Nx)

I queried the Nx MCP server for the workspace. Highlights:

-   `nx.json` indicates the workspace uses the `@nx/js` plugin and sets `@nx/js:library` generator defaults to buildable, strict mode, and non-publishable by default.
-   `targetDefaults` enable caching for `build`, `test`, and `lint`, and `build` depends on `^build` (project graph aware).
-   The workspace contains multiple projects; examples returned by the MCP snapshot (abbreviated):
    -   `tools/type-generator` (lib) — tags: npm:public
    -   `libs/node-logging` (lib) — tags: npm:public,npm:logging,npm:observability
    -   `tools/ai` (lib) — tags: scope:tools,type:ai
    -   `libs/{{domain_name}}/application`, `libs/{{domain_name}}/domain`, `libs/{{domain_name}}/infrastructure` — placeholder domain templates present (templating artifacts)

This snapshot confirms a generator-first workspace with multiple libs and tooling projects that are candidates for HexDDD integration.

## Available generators (Nx)

The Nx generators list returned common Nx generators useful for this work. Notable generators available in the workspace environment:

-   `@nx/js:library` — create a TypeScript/JS library (has `strict` defaults in this workspace)
-   `@nx/node:library`, `@nx/node:application` — node app/library scaffolding
-   `@nx/react:application`, `@nx/react:library`, `@nx/react:component`, `@nx/react:hook` — React scaffolding (Next/Expo/host/remote patterns supported via generators)
-   `@nx/workspace:ci-workflow`, `@nx/workspace:move`, `@nx/workspace:infer-targets` — workspace-level utilities

These generators provide a strong baseline. For the HexDDD work we will primarily use `@nx/js:library` to scaffold domain/application/infrastructure libraries and `@nx/react:library`/`component` for UI feature libs.

## Nx plugins fetch note

An attempt to fetch the full Nx plugin manifest from the public URL failed (unexpected JSON error). This is non-blocking — we have the local generator list and workspace plugins from the MCP response.

## Next actions (repository context)

1. Run `nx_project_details` for candidate projects (for example, `tools/type-generator`, `tools/ai`, and a few existing domain libs) to collect targets and tags programmatically. Use that to build the MECE ownership matrix.
2. Run a GitHub search for recent PRs touching `generators/` or `libs/*/(domain|application|infrastructure)` to extract reviewer comments and failure modes.
3. Export the Nx project graph to a local HTML (`mkdir -p tmp && pnpm exec nx graph --file=tmp/graph.html`) and attach or reference it in `MECE_VALIDATION.md` and `CRITICAL_PATH.md`.

## Per-project details (quick snapshot)

I ran `nx_project_details` for three high-priority projects and captured the key metadata below. Use these to populate `MECE_VALIDATION.md` and ownership mappings.

-   tools/type-generator

    -   root: tools/type-generator
    -   name: @nx-ddd-hex-plugin/type-generator
    -   projectType: library
    -   sourceRoot: tools/type-generator/src
    -   tags: ["npm:public"]
    -   notable targets (compressed): build (tsc), test (jest), nx-release-publish
    -   external deps: commander, typescript

-   tools/ai

    -   root: tools/ai
    -   name: ai-context-tools (@vibespro/ai-context)
    -   projectType: library
    -   sourceRoot: tools/ai/src
    -   tags: ["npm:public","scope:tools","type:ai"]
    -   notable targets (compressed): build (tsc via run-commands), test (vitest), nx-release-publish
    -   external deps: vitest

-   libs/node-logging
    -   root: libs/node-logging
    -   name: @vibepro/node-logging
    -   projectType: library
    -   tags: ["npm:public","npm:logging","npm:observability","npm:pino"]
    -   notable targets (compressed): test (run-script), nx-release-publish
    -   external deps: pino

## GitHub PR snapshot (top finds)

I ran a repository-scoped PR search for "generator" and related terms; the search returned 29 matching PRs. Top relevant/merged PRs (recent) include:

-   #50 — "Feature/jit generators" — Adds generator spec ADR/PRD and automation for generator templates (merged). Important: establishes the GENERATOR_SPEC work and TDD validation.
-   #49 / #51 / #50 cluster — "generator-spec" and related PRs (DEV-PRD-019 / DEV-ADR-019) — multiple PRs completed the generator-spec template cycles and CI tests for spec validation.
-   #33 — "Feature/tdd generator" — Formalized Supabase-as-SOT, Hexagonal architecture docs and automated scaffolding guidance (merged).
-   #29 — "Add local copier shim and improve tooling for CI" — Introduced a mock copier and hardened the type-generator CLI for CI reliability (merged).
-   #1 — "Phase 2: MERGE-TASK-003 Domain Generator Template" — Large merged PR adding DDD domain generator templates and type-generator CLI integration (merged; foundational for HexDDD work).

These PRs show active work on generator specs, type-generator hardening, and CI improvements. Use the PR diffs and CI logs for failure patterns when drafting PATTERN_RESEARCH and RISK_ASSESSMENT.

## References

-   Source: `nx_workspace` MCP snapshot (2025-11-05)
-   Available generators: `nx_generators` MCP response (2025-11-05)

## Notes

This file now contains a live snapshot summary — further population should include per-project `nx_project_details` output and specific PR links from GitHub (next batch).

## Domain project details (templated domain: my-test-domain)

The workspace contains a templated domain set under `libs/my-test-domain/*`. I retrieved full project metadata for the three projects below.

-   my-test-domain-domain

    -   root: libs/{{domain_name}}/domain
    -   name: my-test-domain-domain
    -   projectType: library
    -   sourceRoot: libs/my-test-domain/domain/src
    -   tags: ["type:domain","domain:my-test-domain"]
    -   implicitDependencies: []

-   my-test-domain-application

    -   root: libs/{{domain_name}}/application
    -   name: my-test-domain-application
    -   projectType: library
    -   sourceRoot: libs/my-test-domain/application/src
    -   tags: ["type:application","domain:my-test-domain"]
    -   implicitDependencies: []

-   my-test-domain-infrastructure
    -   root: libs/{{domain_name}}/infrastructure
    -   name: my-test-domain-infrastructure
    -   projectType: library
    -   sourceRoot: libs/my-test-domain/infrastructure/src
    -   tags: ["type:infrastructure","domain:my-test-domain"]
    -   implicitDependencies: []
