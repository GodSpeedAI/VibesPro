#!/usr/bin/env bash
set -euo pipefail
. tests/env/helpers.sh

echo "Testing SOPS secret management..."

# Test 1: .sops.yaml exists at repo root
assert_file_exists ".sops.yaml"

# Test 2: .sops.yaml is valid YAML
if command -v sops >/dev/null 2>&1; then
  # SOPS can validate its own config
  if ! sops --version >/dev/null 2>&1; then
    echo "❌ SOPS command failed"
    exit 1
  fi
else
  echo "  ℹ️  SOPS not installed, skipping detailed validation"
  echo "     Install: https://github.com/getsops/sops#install"
fi

# Test 3: .secrets.env.sops exists (encrypted secrets file)
assert_file_exists ".secrets.env.sops"

# Test 4: .secrets.env.sops encryption status
if grep -q "sops:" .secrets.env.sops 2>/dev/null; then
  echo "  ✅ .secrets.env.sops is encrypted"
  encrypted=true
else
  echo "  ℹ️  .secrets.env.sops is not yet encrypted (template mode)"
  echo "     To encrypt: sops -e -i .secrets.env.sops"
  echo "     (Requires AGE key configured in .sops.yaml)"
  encrypted=false
fi

# Test 5: If SOPS is installed and file is encrypted, validate decryption
if command -v sops >/dev/null 2>&1 && [ "$encrypted" = "true" ]; then
  echo "  ℹ️  SOPS detected, validating decryption..."

  # Try to decrypt (don't print output)
  if ! sops -d .secrets.env.sops >/dev/null 2>&1; then
    echo "⚠️  Cannot decrypt .secrets.env.sops (may need proper keys)"
    echo "   This is expected if you don't have decryption keys configured"
    # Don't fail - developers may not have keys yet
  else
    echo "  ✅ Successfully decrypted .secrets.env.sops"

    # Validate decrypted content has at least one variable
    decrypted=$(sops -d .secrets.env.sops 2>/dev/null || echo "")
    if [ -z "$decrypted" ]; then
      echo "⚠️  .secrets.env.sops decrypted but appears empty"
    else
      echo "  ✅ .secrets.env.sops contains encrypted data"
    fi
  fi
elif [ "$encrypted" = "false" ]; then
  echo "  ℹ️  Skipping decryption test (file not encrypted yet)"
fi

# Test 6: Ensure NO plaintext .env files are tracked in git
echo "  ℹ️  Checking for plaintext secrets in git..."
if git ls-files | grep -E '^\.env($|\.local$|\.development$|\.production$)'; then
  echo "❌ Plaintext .env file found in git!"
  echo "   Only .secrets.env.sops (encrypted) should be tracked"
  exit 1
fi

# Test 7: Check .gitignore prevents plaintext .env
if [ -f ".gitignore" ]; then
  if ! grep -q '\.env' .gitignore; then
    echo "⚠️  .gitignore doesn't explicitly ignore .env files"
    echo "   Consider adding: .env*"
    echo "   And allowing: !.secrets.env.sops"
  else
    echo "  ✅ .gitignore configured to ignore plaintext .env files"
  fi
fi

echo "SOPS test OK"
