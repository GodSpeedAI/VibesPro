#!/usr/bin/env bash
# cleanup-branches.sh
# Safely delete all local and/or remote branches EXCEPT the keep list (defaults: main, stage, dev)
# Usage:
#   ./scripts/cleanup-branches.sh           # Preview (dry-run) what will be deleted
#   ./scripts/cleanup-branches.sh --dry-run
#   ./scripts/cleanup-branches.sh --local  # Delete local branches matching preview
#   ./scripts/cleanup-branches.sh --remote # Delete remote branches on origin matching preview
#   ./scripts/cleanup-branches.sh --all    # Delete both local and remote branches
#   ./scripts/cleanup-branches.sh --force  # Non-interactive; perform deletes
# IMPORTANT: This is destructive. Use with caution and ensure you have backups if needed.

KEEP=('main' 'stage' 'dev')
DRY_RUN=true
DELETE_LOCAL=false
DELETE_REMOTE=false
FORCE=false

usage() {
  cat <<EOF
Usage: $0 [--dry-run|--local|--remote|--all] [--force]
  --dry-run: Default. Show what will be deleted and do nothing.
  --local:   Delete local branches (those in refs/heads/) except the keep list.
  --remote:  Delete remote branches on origin except the keep list.
  --all:     Delete both local and remote branches.
  --force:   Non-interactive; don't prompt before deleting.
EOF
}

# parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift;;
    --local) DELETE_LOCAL=true; DRY_RUN=false; shift;;
    --remote) DELETE_REMOTE=true; DRY_RUN=false; shift;;
    --all) DELETE_LOCAL=true; DELETE_REMOTE=true; DRY_RUN=false; shift;;
    --force) FORCE=true; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 2;;
  esac
done

# fetch latest and prune
echo "Fetching all remotes and pruning stale refs..."
git fetch --all --prune

current_branch=$(git rev-parse --abbrev-ref HEAD)

# gather local branches to delete
local_branches=()
while IFS= read -r b; do
  skip=false
  for k in "${KEEP[@]}"; do
    if [[ "${b}" == "${k}" ]]; then skip=true; break; fi
  done
  if [[ "${b}" == "${current_branch}" ]]; then skip=true; fi
  if [[ "${skip}" == false ]]; then local_branches+=("${b}"); fi
done < <(git for-each-ref --format='%(refname:short)' refs/heads/) || true

# gather remote branches to delete (origin/*)
remote_branches=()
while IFS= read -r r; do
  # r looks like origin/feature/foo and we want the branch name after origin/
  branch=${r#origin/}
  # skip HEAD refs that render as origin/HEAD
  if [[ "${branch}" == "HEAD" ]]; then continue; fi
  skip=false
  for k in "${KEEP[@]}"; do
    if [[ "${branch}" == "${k}" ]]; then skip=true; break; fi
  done
  if [[ "${skip}" == false ]]; then remote_branches+=("${branch}"); fi
done < <(git for-each-ref --format='%(refname:short)' refs/remotes/origin/) || true

# deduplicate and sort
if [[ ${#local_branches[@]} -gt 0 ]]; then
  mapfile -t local_branches < <(printf "%s\n" "${local_branches[@]}" | sort -u) || true
fi
if [[ ${#remote_branches[@]} -gt 0 ]]; then
  mapfile -t remote_branches < <(printf "%s\n" "${remote_branches[@]}" | sort -u) || true
fi

# show summary
printf '\nKeep list: %s\n' "${KEEP[@]}"
if [[ ${#local_branches[@]} -gt 0 ]]; then
  printf '\nLocal branches that will be deleted:\n'
  for b in "${local_branches[@]}"; do
    printf '  - %s\n' "${b}"
  done
else
  printf '\nNo local branches to delete.\n'
fi

if [[ ${#remote_branches[@]} -gt 0 ]]; then
  printf '\nRemote branches on origin that will be deleted:\n'
  for b in "${remote_branches[@]}"; do
    printf '  - %s\n' "${b}"
  done
else
  printf '\nNo remote branches to delete.\n'
fi

if [[ "${DRY_RUN}" == true ]]; then
  printf '\nDry run — nothing deleted. Re-run with --local/--remote/--all to actually delete.\n'
  exit 0
fi

# confirm
if [[ "${FORCE}" != true ]]; then
  printf '\nAre you sure you want to proceed? Type YES to confirm:\n'
  read -r ans
  if [[ "${ans}" != "YES" ]]; then
    echo "Aborting (not confirmed)."
    exit 0
  fi
fi

# delete local branches
if [[ "${DELETE_LOCAL}" == true && ${#local_branches[@]} -gt 0 ]]; then
  printf '\nDeleting local branches...\n'
  for b in "${local_branches[@]}"; do
    printf 'Deleting local branch: %s\n' "${b}"
    git branch -D "${b}" || echo "Failed to delete local branch: ${b}"
  done
else
  printf '\nSkipping local deletions.\n'
fi

# delete remote branches
if [[ "${DELETE_REMOTE}" == true && ${#remote_branches[@]} -gt 0 ]]; then
  printf '\nDeleting remote branches on origin...\n'
  for b in "${remote_branches[@]}"; do
    printf 'Deleting remote branch: %s\n' "${b}"
    git push origin --delete "${b}" || echo "Failed to delete remote branch: ${b}";
  done
else
  printf '\nSkipping remote deletions.\n'
fi

# final prune
printf '\nPruning remote-tracking refs locally...\n'
git fetch --all --prune

echo "Done."
