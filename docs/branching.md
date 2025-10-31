## Branching strategy for VibesPro

This document describes the recommended branching model for the VibesPro template repository and typical generated projects. It covers feature work from `dev`, practices for `stage`, `main`, and examples for release and hotfix flows.

### Goals

- Keep `main` deployable and stable.
- Use `dev` as the integration branch for ongoing feature work and QA.
- Provide a `stage` (staging) flow for pre-production verification when needed.
- Make PR and CI rules clear and predictable.

### Branch types

- `main` — production-ready branch. Protected; only merged via PRs. Tags/releases are created from `main`.
- `dev` — integration branch. Features merge here after review and CI. `dev` accumulates work destined for the next release.
- `stage` — optional staging branch or deployment target. Can be a long-lived branch (e.g., `stage`) or ephemeral release branches used to push to a staging environment for QA.
- `feature/*` — short-lived branches created from `dev` for new work (e.g., `feature/logfire`).
- `release/*` — optional branch created from `dev` when preparing a release (e.g., `release/v1.2.0`).
- `hotfix/*` — branches created from `main` to fix critical production issues.

### High-level workflow

1. Create a feature branch from `dev`:

```zsh
# ensure you start from an up-to-date dev
git checkout dev
git pull origin dev

git checkout -b feature/my-change
```

2. Work locally and push the feature branch to origin:

```zsh
git add .
git commit -m "feat(scope): short description [SPEC-ID]"
git push -u origin feature/my-change
```

3. Open a Pull Request targeting `dev`. Wait for CI and reviews. When approvals and checks pass, merge into `dev` (squash/merge or merge commit depends on repo policy).

4. Keep your feature branch up-to-date with `dev` while you work. Two common approaches:

- Merge `dev` into your feature branch periodically (safe, non-destructive):

```zsh
git fetch origin
git checkout feature/my-change
git merge origin/dev
# resolve conflicts, commit, push
git push
```

- Rebase your branch onto `dev` for a cleaner history (careful: avoid rebasing shared branches):

```zsh
git fetch origin
git checkout feature/my-change
git rebase origin/dev
# resolve conflicts, continue, then force-push safely
git push --force-with-lease
```

5. Release process (two options):

- Simple: when `dev` is ready, create a PR `dev -> main` and merge. Tag `main` with the release version.

```zsh
git checkout dev
git pull origin dev
# create PR dev -> main in GitHub UI and merge, or locally:
git checkout main
git pull origin main
git merge --no-ff dev
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin main --follow-tags
```

- Safer (recommended for non-trivial releases): create a `release/*` branch from `dev`, test on `release/*` (and optionally deploy to `stage`), then merge `release/*` into `main` and back into `dev`.

```zsh
git checkout dev
git pull origin dev
git checkout -b release/v1.2.0
git push -u origin release/v1.2.0
# QA and fixes on release/v1.2.0
git checkout main
git merge --no-ff release/v1.2.0
git tag -a v1.2.0 -m "v1.2.0"
git push origin main --follow-tags
# merge release back into dev
git checkout dev
git merge --no-ff release/v1.2.0
git push origin dev
```

6. Hotfix process (production emergency):

```zsh
git checkout main
git pull origin main
git checkout -b hotfix/urgent-fix
# implement fix, commit, push
git push -u origin hotfix/urgent-fix
# PR: hotfix -> main, merge and tag
# then merge main back to dev to keep branches in sync
git checkout dev
git pull origin dev
git merge --no-ff main
git push origin dev
```

### Stage environment scenarios

There are two common patterns for `stage` (staging):

1. Long-lived `stage` branch
   - `stage` receives merges from `dev` or `release/*` to create a deployable staging snapshot.
   - Teams test on the `stage` environment. After verification, merge the release into `main`.

Example flow: `dev -> release/v1.x -> stage -> main` or simply `dev -> stage` then `dev -> main`.

2. Ephemeral staging from `release/*` branches
   - Create `release/*` from `dev`, deploy that branch to staging for QA, iterate on `release/*` until ready, then merge into `main`.
   - This avoids a long-lived `stage` branch and keeps staging environment tied to explicit release candidates.

Choose the pattern that matches your deployment process and CI tooling. If you have automated deployment per-branch (e.g., Netlify, Vercel, or your CI), map the branch name(s) to the correct environment in CI/CD settings.

### PR and CI policy (recommended)

- All feature PRs target `dev`.
- Require passing CI checks before merging to `dev` or `main`.
- Require at least one reviewer (or more, per project rules).
- Protect `main` (required checks, required reviewers). Consider protecting `dev` if you want enforced integration checks.
- Use PR templates that ask for spec IDs and testing steps.

### Merge strategy and history

- Squash and merge for small/feature PRs to keep history readable.
- Use merge commits for larger integration merges (`dev -> main` or `release -> main`) to keep a clear release boundary.
- Rebase only on personal branches when you need a linear history; avoid rebasing branches that others share.

### Checklist before merging `dev` into `main` (release)

- CI green across the suite.
- Release notes / changelog updated.
- Any database/migration changes are reviewed and roll-back plan exists.
- Tag/version bump applied on `main`.
- Stakeholder/QA sign-off completed.

### Practical tips and commands

- Delete remote branches only when you are sure they are no longer needed:

```zsh
# safe prune of remote-tracking refs
git fetch origin --prune
# delete remote branch
git push origin --delete feature/old-branch
```

- If you accidentally create a new local branch and want to rename it (example from earlier):

```zsh
# rename current local branch
git branch -m new-name
# push and set upstream
git push origin -u new-name
# delete old remote (if it exists)
git push origin --delete old-name
```

### Example recommended policy for VibesPro (opinionated)

- Branch naming: `feature/*`, `hotfix/*`, `release/*`, `stage` (optional long-lived), `dev`, `main`.
- PR targets: feature -> dev, release -> main, hotfix -> main.
- Merge policy: require CI, require reviewers, prefer squash for feature PRs.

---

## Next Steps

To implement this branching strategy:

1. Create a PR that adds this file and links it from `docs/dev_tdd.md` or `docs/README.md`.
2. Update `CONTRIBUTING.md` to summarize these branching rules.
3. Create a condensed `docs/branching-quickstart.md` containing only the essential commands.

- Add a PR that creates this file and links into `docs/dev_tdd.md` or `docs/README.md`.
- Modify `CONTRIBUTING.md` to summarize these rules.
- Produce a small `docs/branching-quickstart.md` with only the commands.
