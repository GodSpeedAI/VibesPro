# AI-Assisted Integration Technical Specifications

## AI_TS-001 — Technology stack alignment

- **References:** AI_ADR-001, AI_ADR-004, AI_PRD-003, AI_SDS-001, AI_SDS-003
- **Details:**
    - **Languages & Tooling:** TypeScript (Nx + pnpm), Python (uv), Bash/POSIX shell scripts for automation.
    - **Template Rendering:** Copier handles Jinja2 templates; generated projects rely on Nx 21.5.3 and pnpm 9.x.
    - **Dependencies:** Maintain parity with VibePDK versions for prompt lint tooling, spec matrix scripts, and generator utilities.
    - **Configuration Artifacts:** `package.json.j2`, `nx.json.j2`, and `justfile.j2` declare commands surfaced to end users.
- **Assumptions:**
    - Developers have access to Node ≥ 18, pnpm ≥ 8, Python 3.12, and GitHub Actions or equivalent CI workers.
    - Copier generation occurs on trusted machines to avoid tampering with template assets.

## AI_TS-002 — Integration requirements

- **References:** AI_ADR-002, AI_ADR-003, AI_PRD-001, AI_PRD-004, AI_SDS-001, AI_SDS-002, AI_SDS-003
- **Details:**
    - **`.github` Integration:** Generated repositories include instructions, prompts, chat modes, workflows, and `models.yaml`, preserving frontmatter precedence.
    - **Documentation Integration:** Maintainer docs stay in `docs/aiassist/`; generated docs live under `templates/{{project_slug}}/docs/**` and README templates.
    - **MCP Integration:** `mcp/tool_index.md` documents descriptors; `.vscode/mcp.json` guidance instructs users to configure environment variables for authentication.
    - **Generator Integration:** Stack-aware Nx generators read from `tools/transformers/.derived/techstack.resolved.json` if present, handling absent files gracefully.
- **Assumptions:**
    - Environment variables for MCP tools are provided securely by users.
    - Tech stack resolution scripts execute before generator commands when defaults are required.

## AI_TS-003 — Security considerations

- **References:** AI_ADR-002, AI_ADR-005, AI_PRD-001, AI_PRD-005, AI_SDS-001, AI_SDS-004
- **Details:**
    - **Secrets Management:** MCP descriptors must reference environment variables; no secrets committed to the template or generated repositories.
    - **Instruction Governance:** Security instructions from VibePDK remain authoritative; mergers ensure no auto-approve settings are enabled.
    - **CI Hardening:** Workflows run with least privilege credentials and validate file integrity (e.g., ensure `.github` assets aren’t modified unexpectedly).
    - **Dependency Hygiene:** Prompt lint scripts and generators should pin versions; CI includes dependency audit steps where feasible.
- **Assumptions:**
    - Generated project maintainers configure secret scopes within their CI providers.
    - Developers follow repository trust settings before running scripts.

## AI_TS-004 — Performance and reliability considerations

- **References:** AI_ADR-004, AI_ADR-005, AI_PRD-003, AI_PRD-005, AI_SDS-003, AI_SDS-004
- **Details:**
    - **Command Performance:** `just` recipes and scripts should complete within 2 minutes on standard developer laptops; long-running steps (e.g., Nx build) run asynchronously with progress output.
    - **CI Runtime Targets:** Prompt lint + spec matrix checks complete under 5 minutes; generation smoke test under 10 minutes.
    - **Caching:** Nx cloud or local caching is leveraged where available; scripts avoid redundant work (e.g., skip rebuilding context bundle if no inputs changed).
    - **Resilience:** Scripts handle missing optional dependencies (like pnpm) with clear guidance; CI retries flaky steps up to two times before failing.
- **Assumptions:**
    - Developers have stable internet connections for dependency installs.
    - CI environments can allocate at least 4 vCPU / 8 GB RAM to satisfy Nx caching benefits.

## AI_TS-005 — Observability and traceability

- **References:** AI_ADR-003, AI_ADR-005, AI_PRD-002, AI_PRD-005, AI_SDS-002, AI_SDS-004
- **Details:**
    - **Logging:** Scripts emit structured logs indicating guardrail names (e.g., `prompt-lint`, `spec-matrix`) to simplify debugging.
    - **Traceability:** Generated projects include updated `traceability_matrix.md` and spec indexes, regenerated via `pnpm spec:matrix`.
    - **Telemetry (Optional):** Teams may integrate metrics collection into CI (e.g., workflow timing) while respecting security guidance.
    - **Documentation Links:** Maintainer docs cross-reference PRDs, SDSs, and TS items to maintain traceability.
- **Assumptions:**
    - Teams will update traceability artifacts as part of their TDD/spec workflow.
    - Optional telemetry hooks will be disabled by default to avoid leaking data.
