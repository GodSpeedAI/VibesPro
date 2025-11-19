# Pre-commit Hook Secret Scanner Enhancement

**Date**: October 13, 2025
**File**: `.githooks/pre-commit`
**Spec IDs**: Security best practices, DEV-SPEC-006 (CI/security posture)

## Summary

Replaced the fragile regex-based secret detection in the pre-commit hook with a robust multi-tier approach using dedicated secret scanners as primary detectors and improved heuristics as fallback.

## Changes Made

### Previous Implementation Issues

The original implementation had several critical weaknesses:

1. **Limited pattern matching**: Only detected quoted `key=value` patterns
2. **Missed formats**: Ignored JSON (`"key": "value"`), YAML (`key: value`), and unquoted assignments
3. **Length assumptions**: Required 8+ character values, missing shorter secrets
4. **False negatives**: Many real secrets would pass undetected
5. **No industry-standard tools**: Relied solely on basic regex

### New Implementation

Implemented a three-tier detection strategy:

#### Tier 1: Gitleaks (Primary)

- Industry-standard secret scanner
- Detects 100+ secret types
- Uses entropy analysis and pattern matching
- Command: `gitleaks protect --staged --verbose --redact`
- Auto-detects if installed

#### Tier 2: detect-secrets (Secondary)

- Python-based secret scanner from Yelp
- Scans staged files only
- Uses baseline methodology
- Command: `detect-secrets scan --all-files --baseline <temp>`
- Falls back if gitleaks not available

#### Tier 3: Enhanced Heuristics (Fallback)

When no dedicated scanner is available, uses improved regex patterns:

**Patterns Detected**:

- Quoted assignments: `key="value"` or `key='value'`
- JSON style: `"key": "value"`
- YAML style: `key: value`
- Unquoted assignments: `key=value`

**Sensitive Keys**:

- `api_key`, `api-key`
- `secret_key`, `secret-key`
- `password`
- `token`
- `private_key`, `private-key`
- `client_secret`, `client-secret`
- `auth_token`, `auth-token`
- `access_key`, `access-key`
- `bearer`

**False Positive Filtering**:
Excludes common non-secret patterns:

- `example`, `sample`, `test`, `dummy`, `placeholder`
- `your_`, `<`, `>`, `${`, `{{`
- `TODO`, `FIXME`, `xxx+`

**Improvements over original**:

- ✅ Detects JSON/YAML formats
- ✅ Detects unquoted assignments
- ✅ No minimum length requirement (more flexible)
- ✅ Better false positive filtering
- ✅ Shows helpful installation instructions

### Code Quality

- **Shellcheck compliance**: All style warnings resolved
- **Bash best practices**: Uses `[[ ]]` tests and `${var}` bracing
- **Error handling**: Proper exit codes and cleanup (trap for temp files)
- **User feedback**: Clear messages for each detection tier

## Installation Guidance

The hook now provides helpful installation instructions when dedicated scanners are missing:

```bash
⚠️  Install gitleaks or detect-secrets for more accurate detection:
   brew install gitleaks           # macOS
   pip install detect-secrets      # Python
```

## Testing Recommendations

1. **Test gitleaks path**: Stage a file with a real secret and verify gitleaks detects it
2. **Test detect-secrets path**: Uninstall gitleaks temporarily and test with detect-secrets
3. **Test fallback heuristics**: Test without either scanner installed
4. **Test various formats**:
    - JSON: `{"api_key": "sk-1234567890abcdef"}`
    - YAML: `api_key: sk-1234567890abcdef`
    - Unquoted: `API_KEY=sk-1234567890abcdef`
    - Quoted: `PASSWORD="MySecretPass123"`

## Security Impact

**Risk Level**: 🟢 Low (Security improvement)
**Change Type**: Enhancement

**Benefits**:

- ✅ Significantly reduces false negatives
- ✅ Industry-standard detection when available
- ✅ Better coverage of secret formats (JSON/YAML/unquoted)
- ✅ Graceful degradation when tools unavailable
- ✅ Encourages installation of professional tools

**Mitigation**:

- Maintains backward compatibility
- Provides clear error messages
- Includes bypass instructions (emergency use only)

## References

- **Gitleaks**: https://github.com/gitleaks/gitleaks
- **detect-secrets**: https://github.com/Yelp/detect-secrets
- **Security guidelines**: `.github/instructions/security.instructions.md`
- **Original issue**: .githooks/pre-commit line 23 fragile regex detection - the original regex pattern at this line only detected quoted `key=value` assignments and missed JSON/YAML formats, unquoted assignments, and shorter secret values

## Future Enhancements

Consider adding:

1. Configuration file (`.gitleaks.toml` or `.secrets.baseline`) for customization
2. Integration with CI/CD pipeline for double-check
3. Pre-push hook for additional safety layer
4. Automated scanner installation in `just setup` command
5. Support for additional scanners (trufflehog, tartufo)
