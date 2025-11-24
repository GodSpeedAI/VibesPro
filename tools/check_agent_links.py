#!/usr/bin/env python3
# mypy: ignore-errors
# -*- coding: utf-8 -*-
"""
Link checker for AGENT.md files.

This script scans all files named `AGENT.md` within the repository to validate
the links found within them. It serves as a CI/CD tool to maintain the integrity
of documentation and prevent broken links.

Features:
- Verifies that local markdown links point to existing files in the repository.
- Ignores absolute paths (starting with '/') as they are considered out of scope
  for this template repository's context.
- Optionally validates external `http(s)://` links by making network requests.
  This check is slower and requires the `requests` library.

Usage:
  To check only local links:
    python tools/check_agent_links.py

  To include a check for external links:
    python tools/check_agent_links.py --check-externals

  To limit the number of external links checked:
    python tools/check_agent_links.py --check-externals --max-external 25
"""

import argparse
import re
import time
from pathlib import Path

try:
    import requests
except ImportError:
    requests = None

# Define the root of the repository as the parent directory of this script's location.
REPO_ROOT = Path(__file__).resolve().parents[1]

# Regex to find markdown-style links: [text](target)
link_re = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def check_local_links(agent_files: list[Path]) -> list[tuple[str, str, str]]:
    """
    Scans a list of files for broken local markdown links.

    This function iterates through each file, finds all markdown links, and checks
    if the targets that point to local files actually exist on the file system.
    It ignores external URLs, absolute paths, and link anchors.

    Args:
        agent_files (list[Path]): A list of `pathlib.Path` objects representing the
                                  `AGENT.md` files to be checked.

    Returns:
        list[tuple[str, str, str]]: A list of errors. Each error is a tuple containing
                                     the source file path (relative to the repo root),
                                     the broken link target, and the resolved,
                                     non-existent path. An empty list means no
                                     broken links were found.
    """
    errors: list[tuple[str, str, str]] = []
    for f in agent_files:
        rel_path = f.relative_to(REPO_ROOT)
        text = f.read_text(encoding="utf-8")
        for match in link_re.finditer(text):
            _label, target = match.groups()  # label is unused

            if target.startswith(("http://", "https://")):
                continue  # Skip external links

            target_path_str = target.split("#")[0].split("?")[0]
            if not target_path_str or target_path_str.startswith("/"):
                # Skip empty targets or absolute paths
                continue

            # Resolve the target relative to the repo root.
            candidate = (f.parent / target_path_str).resolve()
            if not candidate.exists():
                errors.append((str(rel_path), target, str(candidate)))
    return errors


def check_external_links(
    agent_files: list[Path], max_check: int = 50, timeout: int = 5, retries: int = 2
) -> tuple[list[tuple[str, str]], bool]:
    """
    Validates external HTTP/HTTPS links found in the given files.

    This function requires the `requests` library. It extracts all external URLs,
    deduplicates them, and sends a HEAD request to each. If HEAD fails or is
    disallowed, it falls back to a GET request. It includes retry logic with
    a simple backoff for transient network issues.

    Args:
        agent_files (list[Path]): A list of `AGENT.md` files to scan.
        max_check (int): The maximum number of unique external links to check.
                         This prevents excessively long run times. Defaults to 50.
        timeout (int): The timeout in seconds for each HTTP request. Defaults to 5.
        retries (int): The number of retries for a failed request. Defaults to 2.

    Returns:
        tuple[list[tuple[str, str]], bool]: A tuple where the first element is a
                                            list of errors (each error is a tuple
                                            of the URL and the error message), and
                                            the second element is a boolean indicating
                                            if the check was completed for all found
                                            links (`True`) or was partial due to the
                                            `max_check` limit (`False`).

    Raises:
        RuntimeError: If the `requests` library is not installed.
    """
    if requests is None:
        raise RuntimeError("'requests' library is required for external link checking. Please `pip install requests`.")

    seen: set[str] = set()
    errors: list[tuple[str, str]] = []
    count = 0
    for f in agent_files:
        text = f.read_text(encoding="utf-8")
        for match in link_re.finditer(text):
            target = match.group(2)
            if not target.startswith(("http://", "https://")) or target in seen:
                continue

            seen.add(target)
            count += 1
            if count > max_check:
                return errors, False  # Partial check completed

            is_ok = False
            last_error = "No response"
            for attempt in range(1, retries + 2):
                try:
                    # Prefer HEAD request for efficiency, but fallback to GET.
                    resp = requests.head(target, allow_redirects=True, timeout=timeout)
                    if 200 <= resp.status_code < 400:
                        is_ok = True
                        break
                    resp = requests.get(target, allow_redirects=True, timeout=timeout)
                    if 200 <= resp.status_code < 400:
                        is_ok = True
                        break
                    last_error = f"HTTP status {resp.status_code}"
                except requests.RequestException as e:
                    last_error = str(e)
                    time.sleep(0.5 * attempt)

            if not is_ok:
                errors.append((target, last_error))
    return errors, True


def main() -> None:
    """
    Main entry point for the AGENT.md link checker script.

    Parses command-line arguments, finds all AGENT.md files, and orchestrates
    the execution of local and (optional) external link checks. Exits with a
    non-zero status code if any broken links are found.
    """
    parser = argparse.ArgumentParser(description="Link checker for AGENT.md files.")
    parser.add_argument(
        "--check-externals", action="store_true", help="Validate external HTTP/HTTPS links (slow)."
    )
    parser.add_argument(
        "--max-external", type=int, default=50, help="Maximum number of external links to check."
    )
    args = parser.parse_args()

    agent_files = list(REPO_ROOT.rglob("AGENT.md"))

    print(f"Found {len(agent_files)} AGENT.md files to check...")

    local_errors = check_local_links(agent_files)
    if local_errors:
        print("\n❌ Broken local links found:")
        for src, target, resolved in local_errors:
            print(f"- In {src}: link `[{target}]` resolves to `{resolved}` which is MISSING.")
        raise SystemExit(2)

    print("✅ All local links in AGENT.md files resolved successfully.")

    if args.check_externals:
        print("\nChecking external links (this may take a while)...")
        try:
            external_errors, complete = check_external_links(
                agent_files, max_check=args.max_external
            )
        except RuntimeError as e:
            print(f"⚠️  External check skipped: {e}")
            return

        if not complete:
            print(f"⚠️  External link check was partial (limit of {args.max_external} reached).")

        if external_errors:
            print("\n❌ External link errors found:")
            for url, err in external_errors:
                print(f"- {url} -> {err}")
            raise SystemExit(3)

        print("✅ All checked external links responded successfully.")


if __name__ == "__main__":
    main()
