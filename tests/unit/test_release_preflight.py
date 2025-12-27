from __future__ import annotations

import os
import subprocess
from pathlib import Path


def test_release_preflight_continues_when_gh_run_list_fails(tmp_path: Path):
    """Regression: gh run list failure must not abort under set -euo pipefail.

    We mock git/gh so the script can run deterministically without relying on
    network or local repo state.
    """

    mock_bin = tmp_path / "bin"
    mock_bin.mkdir()

    git_mock = mock_bin / "git"
    git_mock.write_text(
        """#!/usr/bin/env bash
set -euo pipefail

case "${1:-}" in
  status)
    exit 0
    ;;
  branch)
    if [[ "${2:-}" == "--show-current" ]]; then
      echo "dev"
      exit 0
    fi
    ;;
  fetch)
    exit 0
    ;;
  rev-parse)
    echo "0123456789abcdef0123456789abcdef01234567"
    exit 0
    ;;
  describe)
    echo "v0.0.0"
    exit 0
    ;;
  diff)
    exit 0
    ;;
  *)
    echo "unexpected git invocation: $*" >&2
    exit 2
    ;;
esac
""",
        encoding="utf-8",
    )
    git_mock.chmod(0o755)

    gh_mock = mock_bin / "gh"
    gh_mock.write_text(
        """#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "api" ]]; then
  echo "pending"
  exit 0
fi

if [[ "${1:-}" == "run" && "${2:-}" == "list" ]]; then
  # Simulate auth/network failure
  exit 1
fi

if [[ "${1:-}" == "issue" && "${2:-}" == "list" ]]; then
  echo "0"
  exit 0
fi

echo "unexpected gh invocation: $*" >&2
exit 2
""",
        encoding="utf-8",
    )
    gh_mock.chmod(0o755)

    env = os.environ.copy()
    env["PATH"] = f"{mock_bin}:{env['PATH']}"

    script = Path("scripts/release/release-preflight.sh")
    result = subprocess.run(
        ["bash", str(script)],
        capture_output=True,
        text=True,
        env=env,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert "WARN:" in result.stderr
