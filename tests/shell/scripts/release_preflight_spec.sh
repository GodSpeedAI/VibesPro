#shellcheck shell=bash
#
# ShellSpec for scripts/release/release-preflight.sh

Describe 'release-preflight.sh'

It 'continues when gh run list fails while CI is pending'
tmp_dir=$(mktemp -d)
mock_bin="${tmp_dir}/bin"
mkdir -p "${mock_bin}"

# Mock git to satisfy preflight invariants without depending on repo state.
cat >"${mock_bin}/git" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

case "${1:-}" in
  status)
    # git status --porcelain
    exit 0
    ;;
  branch)
    # git branch --show-current
    if [[ "${2:-}" == "--show-current" ]]; then
      echo "dev"
      exit 0
    fi
    ;;
  fetch)
    # git fetch origin dev --quiet
    exit 0
    ;;
  rev-parse)
    # git rev-parse dev|origin/dev|HEAD
    echo "0123456789abcdef0123456789abcdef01234567"
    exit 0
    ;;
  describe)
    # git describe --tags --abbrev=0
    echo "v0.0.0"
    exit 0
    ;;
  diff)
    # git diff <tag>...HEAD --name-only
    # Return nothing (warn-only path should proceed)
    exit 0
    ;;
  *)
    echo "unexpected git invocation: $*" >&2
    exit 2
    ;;
esac
EOF
chmod +x "${mock_bin}/git"

# Mock gh:
# - gh api ...status returns pending
# - gh run list used for RUNNING_COUNT fails (simulating auth/network)
# - gh issue list returns 0
cat >"${mock_bin}/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "api" ]]; then
  # CI status query
  echo "pending"
  exit 0
fi

if [[ "${1:-}" == "run" && "${2:-}" == "list" ]]; then
  # Simulate failure (e.g., auth error / API down)
  exit 1
fi

if [[ "${1:-}" == "issue" && "${2:-}" == "list" ]]; then
  echo "0"
  exit 0
fi

echo "unexpected gh invocation: $*" >&2
exit 2
EOF
chmod +x "${mock_bin}/gh"

When run env PATH="${mock_bin}:$PATH" bash scripts/release/release-preflight.sh
The status should be success
The stderr should include 'WARN:'

rm -rf "${tmp_dir}"
End

End
