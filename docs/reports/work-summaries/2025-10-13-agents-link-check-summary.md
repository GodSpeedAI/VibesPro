# AGENT.md Link Check & Map Update — 2025-10-13

Summary

-   Updated `AGENT-MAP.md` to include Phase 3 context `hooks/AGENT.md`.
-   Ran an automated link checker across all `AGENT.md` files and fixed malformed local links.
    -   Fixed occurrences of `/. github/` → `/.github/` in `.github/AGENT.md`.
    -   Updated a relative spec link in `docs/AGENT.md` from `../dev_prd.md#042` to `/docs/dev_prd.md#042`.
-   Re-ran the link checker; all local links in `AGENT.md` files now resolve successfully.

Files changed

-   `AGENT-MAP.md` — added Phase 3 `hooks/AGENT.md` entry.
-   `.github/AGENT.md` — fixed malformed internal links.
-   `docs/AGENT.md` — fixed DEV-PRD link target.
-   `tools/check_agent_links.py` — new script to validate local links in `AGENT.md` files.

Notes

-   Phase 3 AGENT files (`temporal_db`, `architecture`, `ops`, `hooks`) already include a footer with `_Last updated: 2025-10-13_` so no additional footer changes were required.
-   The link checker verifies only local links (relative or repo-root links). External links (https://) are ignored.

Follow-ups (optional)

-   Add the link checker to CI (e.g., `just ai-validate`) to automatically detect future broken links.
-   Add a small pre-commit hook to run the checker on changed `AGENT.md` files.

Maintained by: VibesPro Project Team
Date: 2025-10-13
