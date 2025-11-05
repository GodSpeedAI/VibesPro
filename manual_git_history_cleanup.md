# Manual Git History Cleanup - Critical Security Remediation

## 🚨 EXPOSED TOKENS FOUND IN GIT HISTORY

Three plaintext tokens were discovered in repository commits and must be removed from ALL branches, tags, and refs:

### Tokens to Remove:

1. `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`

    - Found in: Commit `8535e15f07ae902fa5fe2aca1d91874e6f0c2383` (2025-11-04)

2. `pylf_v1_us_zV12zVVMgpt9LBY3kLtT5BxSJ2hxw26FRGhLXZy8VJkc`

    - Found in: Commit `1da0c7e014e28257e07b8a3f1890f1a5a73cfc66` (2025-10-30)

3. `ydc-sk-7cbc7ed99180856f-HUlV2s5trvh5aFsyWEVOId6gtOnHgTuC-80f185d4<__>1SO1GYETU8N2v5f4eSqwukpq`
    - Found in: Commit `2ebcd1f9a84aacc7fb2474d8b53957bb1606c389` (2025-10-31)

## Manual Cleanup Steps:

### Option 1: Using git filter-repo (Recommended)

```bash
# Install git filter-repo
sudo apt install git-filter-repo

# Create replacement file
cat > /tmp/replacements.txt << 'EOF'
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==>TOKENS_REMOVED_SECURITY_INCIDENT
pylf_v1_us_zV12zVVMgpt9LBY3kLtT5BxSJ2hxw26FRGhLXZy8VJkc==>TOKENS_REMOVED_SECURITY_INCIDENT
ydc-sk-7cbc7ed99180856f-HUlV2s5trvh5aFsyWEVOId6gtOnHgTuC-80f185d4<__>1SO1GYETU8N2v5f4eSqwukpq==>TOKENS_REMOVED_SECURITY_INCIDENT
EOF

# Backup repository first
cp -r . ../VibesPro-backup-$(date +%Y%m%d-%H%M%S)

# Clean history
git filter-repo --force --replace-text /tmp/replacements.txt

# Force push to remove from remote (WARNING: DESTRUCTIVE)
git push origin --force --all
git push origin --force --tags
```

### Option 2: Using git BFG (Alternative)

```bash
# Download git-bfg
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Create replacements file for BFG (same content as above)
# Use BFG to clean history
java -jar bfg-1.14.0.jar --replace-text /tmp/replacements.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## Verification Steps:

```bash
# Search for any remaining tokens (should return no results)
git log --all --source --full-history -S "github_pat_11ABDA3WI0W8YkvfCcujr8"
git log --all --source --full-history -S "pylf_v1_us_zV12zVVMgpt9LBY3kLtT5BxSJ2hxw26FRGhLXZy8VJkc"
git log --all --source --full-history -S "ydc-sk-7cbc7ed99180856f"

# Check all branches and tags
git branch -r | xargs -I {} git log --all --source --full-history -S "GITHUB_TOKEN" {}
```

## Critical Security Notes:

-   This operation will REWRITE git history
-   All collaborators must reclone the repository
-   Force push required to update remote
-   Backup repository before proceeding
-   Notify all team members of forced rebase

## Timeline:

-   GitHub Token: Exposed TODAY (2025-11-04)
-   Logfire Token: Exposed since 2025-10-30 (6 days)
-   You.com Token: Exposed since 2025-10-31 (5 days)

**IMMEDIATE ACTION REQUIRED: Complete git history cleanup within 24 hours**
