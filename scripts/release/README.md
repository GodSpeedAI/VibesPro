# Release Engineering

This directory contains scripts for the VibesPro release workflow.

## Quick Start

```bash
# Run the full interactive release workflow
just release

# Or run individual steps:
just release-preflight      # Validate before release
just release-bump           # Determine version bump
just release-execute        # Create release branch and PR
just release-finalize       # After PR merge: tag and publish
```

## Release Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Release Workflow                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PREFLIGHT                                                    │
│     ├── Clean working directory?                                 │
│     ├── On dev branch?                                           │
│     ├── In sync with origin/dev?                                 │
│     ├── CI passing?                                              │
│     ├── No blocking issues?                                      │
│     └── Version manifests in sync?                               │
│                                                                  │
│  2. VERSION DETERMINATION                                        │
│     ├── Analyze conventional commits since last tag              │
│     ├── Breaking changes → MAJOR                                 │
│     ├── Features → MINOR                                         │
│     └── Fixes → PATCH                                            │
│                                                                  │
│  3. RELEASE EXECUTION                                            │
│     ├── Create release/vX.Y.Z branch from dev                    │
│     ├── Update versions in:                                      │
│     │   • package.json                                           │
│     │   • pyproject.toml                                         │
│     │   • Cargo.toml (if exists)                                 │
│     │   • README badges                                          │
│     ├── Generate CHANGELOG.md entry                              │
│     ├── Commit changes                                           │
│     └── Create PR to main                                        │
│                                                                  │
│  4. MANUAL REVIEW                                                │
│     ├── Review PR                                                │
│     ├── Approve and merge (use merge commit, NOT squash)         │
│                                                                  │
│  5. FINALIZATION                                                 │
│     ├── Create git tag vX.Y.Z on main                            │
│     ├── Push tag to origin                                       │
│     ├── Sync main back to dev                                    │
│     ├── Delete release branch                                    │
│     └── Create GitHub release with changelog                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Scripts

| Script                      | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `release.sh`                | Main orchestrator - runs full workflow interactively |
| `release-preflight.sh`      | Validates clean state before release                 |
| `determine-version-bump.sh` | Analyzes commits for semantic version bump           |
| `update-versions.sh`        | Updates version in all manifest files                |
| `generate-changelog.sh`     | Generates changelog from conventional commits        |
| `execute-release.sh`        | Creates release branch and PR                        |
| `finalize-release.sh`       | Tags, syncs branches, creates GitHub release         |

## Conventional Commits

The release workflow uses [Conventional Commits](https://www.conventionalcommits.org/) to determine version bumps:

| Commit Prefix                  | Version Bump | Example                             |
| ------------------------------ | ------------ | ----------------------------------- |
| `feat:`                        | MINOR        | `feat: add user authentication`     |
| `fix:`                         | PATCH        | `fix: correct login error handling` |
| `perf:`                        | PATCH        | `perf: optimize database queries`   |
| `feat!:` or `BREAKING CHANGE:` | MAJOR        | `feat!: redesign API endpoints`     |

## Temporary Files

During the release process, these temporary files are created in the repo root:

- `.next-version` - The calculated next version
- `.bump-type` - The bump type (major/minor/patch)

These are automatically cleaned up after `finalize-release.sh` completes.

## Troubleshooting

### "Release branch already exists"

The release branch for this version already exists. Either:

1. Delete the existing branch: `git branch -D release/vX.Y.Z && git push origin --delete release/vX.Y.Z`
2. Or continue from where you left off

### "CI checks not passing"

Wait for CI to complete or fix failing tests before releasing.

### "Version mismatch between manifests"

Run `just release-update-versions` after setting `.next-version` manually, or ensure all version bumps happen through the release workflow.

### "Release not found in main branch"

The release PR hasn't been merged yet. Merge it first, then run `just release-finalize`.

## Branch Protection (Recommended)

Configure branch protection for `main`:

```bash
# Via GitHub CLI
gh api -X PUT repos/{owner}/{repo}/branches/main/protection \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["CI", "Type Safety CI"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```
