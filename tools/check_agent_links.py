#!/usr/bin/env python3
"""
Link checker for AGENT.md files.

Features:
- Verifies local markdown links point to existing files in the repo.
- Optional `--check-externals` to validate http(s) links (simple HEAD/GET with retries).

Usage:
  python tools/check_agent_links.py [--check-externals] [--max-external N]
"""

import argparse
import re
import time
from pathlib import Path

try:
    import requests
except ImportError:
    requests = None  # type: ignore[assignment]

REPO_ROOT = Path(__file__).resolve().parents[1]

link_re = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def check_local_links(agent_files: list[Path]) -> list[tuple[str, str, str]]:
    errors: list[tuple[str, str, str]] = []
    for f in agent_files:
        rel = f.relative_to(REPO_ROOT)
        text = f.read_text(encoding="utf-8")
        for m in link_re.finditer(text):
            _label, target = m.group(1), m.group(2)  # label unused, prefixed with _
            # ignore absolute URLs for local check
            if target.startswith("http://") or target.startswith("https://"):
                continue
            # strip anchors and query
            target_path = target.split("#")[0].split("?")[0]
            # handle leading slash (repo root)
            if target_path.startswith("/"):
                target_path = target_path[1:]
            candidate = REPO_ROOT / target_path
            if not candidate.exists():
                errors.append((str(rel), target, str(candidate)))
    return errors


def check_external_links(
    agent_files: list[Path], max_check: int = 50, timeout: int = 5, retries: int = 2
) -> tuple[list[tuple[str, str]], bool]:
    if requests is None:
        raise RuntimeError("requests library is required for external link checking")

    seen: set[str] = set()
    errors: list[tuple[str, str]] = []
    count = 0
    for f in agent_files:
        text = f.read_text(encoding="utf-8")
        for m in link_re.finditer(text):
            target = m.group(2)
            if not (target.startswith("http://") or target.startswith("https://")):
                continue
            if target in seen:
                continue
            seen.add(target)
            count += 1
            if count > max_check:
                return errors, False  # partial check

            ok = False
            last_err = None
            for attempt in range(1, retries + 1):
                try:
                    # Use HEAD first, fallback to GET if not allowed
                    resp = requests.head(target, allow_redirects=True, timeout=timeout)
                    if resp.status_code >= 200 and resp.status_code < 400:
                        ok = True
                        break
                    # Some servers don't respond to HEAD properly
                    resp = requests.get(target, allow_redirects=True, timeout=timeout)
                    if resp.status_code >= 200 and resp.status_code < 400:
                        ok = True
                        break
                except Exception as e:
                    last_err = e
                    time.sleep(0.5 * attempt)

            if not ok:
                errors.append((target, str(last_err)))
    return errors, True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check-externals", action="store_true", help="Validate external HTTP/HTTPS links (slow)"
    )
    parser.add_argument(
        "--max-external", type=int, default=50, help="Maximum number of external links to check"
    )
    args = parser.parse_args()

    agent_files = list(REPO_ROOT.rglob("**/AGENT.md"))

    local_errors = check_local_links(agent_files)
    if local_errors:
        print("Broken local links found:")
        for src, target, resolved in local_errors:
            print(f"- In {src}: {target} -> {resolved} (MISSING)")
        raise SystemExit(2)

    print("All local links in AGENT.md files resolved successfully.")

    if args.check_externals:
        print("Checking external links (this may take a while) ...")
        try:
            external_errors, complete = check_external_links(
                agent_files, max_check=args.max_external
            )
        except RuntimeError as e:
            print("External check skipped:", e)
            return

        if not complete:
            print("External check was partial (limit reached). Some links were not checked.")

        if external_errors:
            print("External link errors:")
            for url, err in external_errors:
                print(f"- {url} -> {err}")
            raise SystemExit(3)

        print("All checked external links responded with 2xx-3xx status codes.")


if __name__ == "__main__":
    main()
