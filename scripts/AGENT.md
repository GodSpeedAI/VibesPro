# scripts/ Agent Instructions

## 📍 Context

> **Purpose**: Orchestration Scripts - Shell automation, build helpers, and justfile integration for development workflows.
> **When to use**: When working with bash scripts, shell automation, CI/CD orchestration, or justfile recipes.

## 🔗 Parent Context

See [root copilot-instructions.md](/.github/copilot-instructions.md) for comprehensive project guidance and [AGENT-MAP.md](/AGENT-MAP.md) for navigation across contexts.

## 🎯 Local Scope

**This directory handles:**

-   Shell scripts for automation and orchestration
-   Justfile integration and task runners
-   Build and deployment scripts
-   Token measurement and AI context scripts
-   Template and configuration scripts
-   Development environment setup
-   CI/CD helper scripts

**Architecture Layer**: N/A (Infrastructure/Automation)

## 📁 Key Files & Patterns

### Directory Structure

```
scripts/
├── bundle-context.sh              # Bundle AI context files
├── copier                         # Copier wrapper script
├── copier.mjs                     # Node.js Copier integration
├── doctor.sh                      # Environment health check
├── just                           # Just wrapper script
├── measure_tokens.sh              # Token measurement (shell)
├── measure_tokens_enhanced.py    # Token measurement (Python)
├── run_prompt.sh                  # Execute prompts with context
├── spec_feature.sh                # Feature specification workflow
├── sync_techstack.sh.j2           # Sync techstack (template)
├── template-cleanup.sh            # Clean template artifacts
├── track-binary-size.sh           # Monitor binary sizes
├── verify-node.sh                 # Verify Node.js environment
├── check_all_chatmodes.mjs       # Validate chat modes
├── check_model_lint.mjs          # Lint model references
├── lint_chatmodes.cjs            # Chat mode linter
└── normalize_chatmodes.{js,mjs}  # Normalize chat mode format
```

### File Naming Conventions

| File Type          | Pattern          | Example                      |
| ------------------ | ---------------- | ---------------------------- |
| **Shell Scripts**  | `*.sh`           | `run_prompt.sh`              |
| **Node Scripts**   | `*.mjs`, `*.cjs` | `copier.mjs`                 |
| **Python Scripts** | `*.py`           | `measure_tokens_enhanced.py` |
| **Templates**      | `*.sh.j2`        | `sync_techstack.sh.j2`       |
| **Wrappers**       | No extension     | `just`, `copier`             |

### Script Categories

| Category          | Purpose                             | Primary Language |
| ----------------- | ----------------------------------- | ---------------- |
| **AI Scripts**    | Context bundling, token measurement | Shell, Python    |
| **Development**   | Environment setup, health checks    | Shell            |
| **Validation**    | Chat mode checking, model linting   | Node.js          |
| **Orchestration** | Justfile integration, task runners  | Shell            |
| **Templates**     | Template generation, cleanup        | Shell, Jinja2    |

## 🧭 Routing Rules

### Use This Context When:

-   [ ] Writing shell scripts for automation
-   [ ] Creating justfile recipes
-   [ ] Building CI/CD orchestration scripts
-   [ ] Working with prompt execution scripts
-   [ ] Implementing token measurement
-   [ ] Creating environment setup scripts
-   [ ] Writing validation or health check scripts

### Refer to Other Contexts When:

| Context                                   | When to Use                                  |
| ----------------------------------------- | -------------------------------------------- |
| [tools/AGENT.md](/tools/AGENT.md)         | Building development utilities (not scripts) |
| [.github/AGENT.md](/.github/AGENT.md)     | Working with GitHub workflows or actions     |
| [tests/AGENT.md](/tests/AGENT.md)         | Writing ShellSpec tests for scripts          |
| [templates/AGENT.md](/templates/AGENT.md) | Creating Jinja2 templates                    |

## 🔧 Local Conventions

### Shell Script Standards

**POSIX compliance where possible:**

```bash
#!/usr/bin/env bash
# Script: script_name.sh
# Purpose: Brief description
# Usage: ./script_name.sh [options] <args>

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Constants
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Functions
usage() {
    cat <<EOF
Usage: $0 [OPTIONS] <argument>

Options:
    -h, --help      Show this help message
    -v, --verbose   Enable verbose output
    -d, --dry-run   Dry run mode

Examples:
    $0 --verbose input.txt
    $0 --dry-run input.txt
EOF
    exit 1
}

main() {
    local verbose=false
    local dry_run=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help) usage ;;
            -v|--verbose) verbose=true; shift ;;
            -d|--dry-run) dry_run=true; shift ;;
            *) break ;;
        esac
    done

    # Script logic here
}

# Run main if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

### Error Handling

**Robust error handling:**

```bash
# Trap errors and cleanup
cleanup() {
    local exit_code=$?
    # Cleanup temporary files
    rm -rf "$TEMP_DIR" 2>/dev/null || true
    exit $exit_code
}
trap cleanup EXIT INT TERM

# Error reporting
error() {
    echo "ERROR: $*" >&2
    exit 1
}

warn() {
    echo "WARNING: $*" >&2
}

info() {
    echo "INFO: $*"
}

# Validation
[[ -f "$input_file" ]] || error "File not found: $input_file"
[[ -n "${API_KEY:-}" ]] || error "API_KEY environment variable not set"
```

### ShellCheck Compliance

**All scripts must pass ShellCheck:**

```bash
# Run ShellCheck on all scripts
shellcheck scripts/*.sh

# Strict mode with all checks
shellcheck -S style -o all scripts/*.sh

# Suppress specific warnings (with justification)
# shellcheck disable=SC2016  # Variable expansion in single quotes is intentional
```

**Common ShellCheck rules:**

-   SC2086: Quote variables to prevent word splitting
-   SC2046: Quote command substitution to prevent word splitting
-   SC2155: Separate declaration and assignment
-   SC2164: Use `cd ... || exit` for robust directory changes

### Testing with ShellSpec

**All scripts must have ShellSpec tests:**

Location: `tests/shell/scripts/script_name_spec.sh`

```bash
# tests/shell/scripts/run_prompt_spec.sh
Describe 'run_prompt.sh'
  Include scripts/run_prompt.sh

  It 'shows usage when no args provided'
    When run script scripts/run_prompt.sh
    The status should be failure
    The stderr should include 'Usage'
  End

  It 'executes prompt file successfully'
    prompt_file='.github/prompts/test.prompt.md'
    When run script scripts/run_prompt.sh "$prompt_file"
    The status should be success
    The output should include 'tokens'
  End

  It 'handles missing file gracefully'
    When run script scripts/run_prompt.sh 'nonexistent.md'
    The status should be failure
    The stderr should include 'not found'
  End
End
```

### Node.js Script Standards

**For scripts requiring Node.js features:**

```javascript
#!/usr/bin/env node
// Script: script_name.mjs
// Purpose: Brief description

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Exit codes
const EXIT_SUCCESS = 0;
const EXIT_ERROR = 1;
const EXIT_USAGE = 2;

function main(args) {
    try {
        // Script logic
        console.log("✅ Success");
        process.exit(EXIT_SUCCESS);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(EXIT_ERROR);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main(process.argv.slice(2));
}
```

### Python Script Standards

**For Python automation scripts:**

```python
#!/usr/bin/env python3
"""
Script: script_name.py
Purpose: Brief description

Usage:
    python script_name.py [OPTIONS] <args>

Example:
    python script_name.py --verbose input.txt
"""
import sys
from pathlib import Path
from typing import List, Optional
import argparse

# Exit codes
EXIT_SUCCESS = 0
EXIT_ERROR = 1
EXIT_USAGE = 2

def main(args: List[str]) -> int:
    """Main entry point.

    Args:
        args: Command-line arguments

    Returns:
        Exit code
    """
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path, help='Input file')
    parser.add_argument('-v', '--verbose', action='store_true')
    parser.add_argument('-d', '--dry-run', action='store_true')

    opts = parser.parse_args(args)

    try:
        # Script logic
        print("✅ Success")
        return EXIT_SUCCESS
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return EXIT_ERROR

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
```

## 📚 Related Instructions

**Modular instructions that apply here:**

-   [.github/instructions/testing.instructions.md](/.github/instructions/testing.instructions.md) - ShellSpec testing
-   [.github/instructions/security.instructions.md](/.github/instructions/security.instructions.md) - Script security
-   [.github/instructions/ai-workflows.instructions.md](/.github/instructions/ai-workflows.instructions.md) - AI script patterns

**Related contexts:**

-   [tests/AGENT.md](/tests/AGENT.md) - Writing ShellSpec tests
-   [tools/AGENT.md](/tools/AGENT.md) - Development tools (not scripts)

## 💡 Examples

### Example 1: Robust Shell Script Template

```bash
#!/usr/bin/env bash
# Script: process_files.sh
# Purpose: Process multiple files with validation
# Usage: ./process_files.sh [OPTIONS] <input_dir>

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Logging functions
error() {
    echo -e "${RED}ERROR: $*${NC}" >&2
    exit 1
}

warn() {
    echo -e "${YELLOW}WARNING: $*${NC}" >&2
}

info() {
    echo -e "${GREEN}INFO: $*${NC}"
}

# Cleanup handler
cleanup() {
    local exit_code=$?
    [[ -d "${TEMP_DIR:-}" ]] && rm -rf "$TEMP_DIR"
    exit $exit_code
}
trap cleanup EXIT INT TERM

# Usage
usage() {
    cat <<EOF
Usage: $0 [OPTIONS] <input_dir>

Process files in the input directory.

OPTIONS:
    -h, --help       Show this help
    -v, --verbose    Verbose output
    -d, --dry-run    Dry run mode
    -o, --output     Output directory (default: ./output)

EXAMPLES:
    $0 /path/to/files
    $0 --verbose --output /tmp/out /path/to/files
EOF
    exit 0
}

# Main logic
process_directory() {
    local input_dir="$1"
    local output_dir="${2:-./output}"
    local verbose="${3:-false}"
    local dry_run="${4:-false}"

    # Validation
    [[ -d "$input_dir" ]] || error "Directory not found: $input_dir"

    # Create output directory
    if [[ "$dry_run" == "true" ]]; then
        info "DRY RUN: Would create $output_dir"
    else
        mkdir -p "$output_dir"
    fi

    # Process files
    local count=0
    while IFS= read -r -d '' file; do
        [[ "$verbose" == "true" ]] && info "Processing: $file"

        if [[ "$dry_run" == "true" ]]; then
            info "DRY RUN: Would process $file"
        else
            # Actual processing here
            ((count++))
        fi
    done < <(find "$input_dir" -type f -name "*.txt" -print0)

    info "Processed $count files"
}

# Parse arguments
main() {
    local verbose=false
    local dry_run=false
    local output_dir="./output"
    local input_dir=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help) usage ;;
            -v|--verbose) verbose=true; shift ;;
            -d|--dry-run) dry_run=true; shift ;;
            -o|--output) output_dir="$2"; shift 2 ;;
            -*) error "Unknown option: $1" ;;
            *) input_dir="$1"; shift ;;
        esac
    done

    [[ -n "$input_dir" ]] || error "Input directory required"

    process_directory "$input_dir" "$output_dir" "$verbose" "$dry_run"
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

### Example 2: Token Measurement Script

```bash
#!/usr/bin/env bash
# Script: measure_tokens.sh
# Purpose: Measure token count in files using tiktoken
# Usage: ./measure_tokens.sh <file>

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

measure_tokens() {
    local file="$1"
    local model="${2:-gpt-4}"

    [[ -f "$file" ]] || {
        echo "ERROR: File not found: $file" >&2
        return 1
    }

    # Use Python script for actual measurement
    python3 "$SCRIPT_DIR/measure_tokens_enhanced.py" \
        --file "$file" \
        --model "$model" \
        --format json
}

main() {
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 <file> [model]" >&2
        echo "Example: $0 prompt.md gpt-4" >&2
        exit 1
    fi

    measure_tokens "$@"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

### Example 3: Environment Doctor Script

```bash
#!/usr/bin/env bash
# Script: doctor.sh
# Purpose: Diagnose development environment health
# Usage: ./doctor.sh

set -euo pipefail

readonly REQUIRED_COMMANDS=(
    "node:18.0.0"
    "pnpm:8.0.0"
    "python:3.12.0"
    "just:1.0.0"
    "git:2.30.0"
)

check_command() {
    local cmd="$1"
    local min_version="$2"

    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "❌ $cmd: not found"
        return 1
    fi

    local version
    case "$cmd" in
        node) version=$(node --version | sed 's/v//') ;;
        pnpm) version=$(pnpm --version) ;;
        python) version=$(python --version | awk '{print $2}') ;;
        just) version=$(just --version | awk '{print $2}') ;;
        git) version=$(git --version | awk '{print $3}') ;;
        *) version="unknown" ;;
    esac

    echo "✅ $cmd: $version (required: >=$min_version)"
    return 0
}

check_environment() {
    echo "🔍 Checking development environment..."
    echo

    local failed=0
    for requirement in "${REQUIRED_COMMANDS[@]}"; do
        IFS=':' read -r cmd min_version <<< "$requirement"
        check_command "$cmd" "$min_version" || ((failed++))
    done

    echo
    if [[ $failed -eq 0 ]]; then
        echo "✅ All checks passed!"
        return 0
    else
        echo "❌ $failed check(s) failed"
        return 1
    fi
}

main() {
    check_environment
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

### Example 4: Justfile Integration

```makefile
# justfile recipe using scripts

# Bundle AI context
ai-context-bundle:
    @echo "📦 Bundling AI context..."
    bash scripts/bundle-context.sh docs/ai_context_bundle

# Measure tokens in prompt
token-measure file:
    @bash scripts/measure_tokens.sh {{file}}

# Run environment health check
doctor:
    @bash scripts/doctor.sh

# Validate chat modes
validate-chatmodes:
    @node scripts/check_all_chatmodes.mjs

# Clean template artifacts
template-clean:
    @bash scripts/template-cleanup.sh
```

## ✅ Checklist

### Before Creating a Shell Script:

-   [ ] Check if similar script exists
-   [ ] Determine if shell is appropriate (vs Node/Python)
-   [ ] Plan error handling strategy
-   [ ] Design for testability with ShellSpec
-   [ ] Consider portability (POSIX vs Bash-specific)

### While Writing Script:

-   [ ] Use `set -euo pipefail` at the top
-   [ ] Add usage function with examples
-   [ ] Implement proper error handling
-   [ ] Add logging (info/warn/error functions)
-   [ ] Quote all variables: `"$var"`
-   [ ] Use `readonly` for constants
-   [ ] Add cleanup trap handler

### After Writing Script:

-   [ ] Run ShellCheck: `shellcheck scripts/your_script.sh`
-   [ ] Write ShellSpec tests in `tests/shell/`
-   [ ] Run tests: `shellspec tests/shell/scripts/your_script_spec.sh`
-   [ ] Make executable: `chmod +x scripts/your_script.sh`
-   [ ] Add shebang: `#!/usr/bin/env bash`
-   [ ] Update this AGENT.md if new pattern emerges
-   [ ] Add to justfile if frequently used

## 🔍 Quick Reference

### Common Commands

```bash
# Run ShellCheck on all scripts
shellcheck scripts/*.sh

# Run ShellCheck with strict mode
shellcheck -S style -o all scripts/*.sh

# Run ShellSpec tests
shellspec
shellspec tests/shell/scripts/specific_spec.sh

# Make script executable
chmod +x scripts/your_script.sh

# Run script
bash scripts/your_script.sh
./scripts/your_script.sh  # if executable
```

### Exit Codes Convention

```bash
0   # Success
1   # General error
2   # Usage error (invalid arguments)
3   # Configuration error
126 # Command cannot execute
127 # Command not found
130 # Script terminated by Ctrl+C
```

### ShellCheck Directives

```bash
# Disable specific check (with justification)
# shellcheck disable=SC2016  # Variable expansion in single quotes is intentional

# Disable check for entire file
# shellcheck disable=SC2086

# Source external script
# shellcheck source=../lib/common.sh
source "$(dirname "$0")/../lib/common.sh"
```

### Key Scripts Reference

| Script                       | Purpose                      | Language |
| ---------------------------- | ---------------------------- | -------- |
| `run_prompt.sh`              | Execute prompts with context | Shell    |
| `measure_tokens.sh`          | Token measurement (wrapper)  | Shell    |
| `measure_tokens_enhanced.py` | Token measurement (impl)     | Python   |
| `bundle-context.sh`          | Bundle AI context files      | Shell    |
| `doctor.sh`                  | Environment health check     | Shell    |
| `check_all_chatmodes.mjs`    | Validate chat modes          | Node.js  |
| `lint_chatmodes.cjs`         | Lint chat mode files         | Node.js  |
| `template-cleanup.sh`        | Clean template artifacts     | Shell    |

## 🛡️ Security Considerations

**CRITICAL for scripts:**

-   ⚠️ **NEVER** execute arbitrary user input: `eval "$user_input"` ← DON'T
-   ⚠️ **ALWAYS** quote variables to prevent injection: `"$var"`
-   ⚠️ **NEVER** trust external input without validation
-   ⚠️ Use `readonly` for constants that shouldn't change
-   ⚠️ Validate file paths before operations (prevent traversal)
-   ⚠️ Use environment variables for secrets, never hardcode
-   ⚠️ Be cautious with `curl` or `wget` - validate URLs

**Example secure command execution:**

```bash
# BAD - Command injection vulnerability
file="$1"
cat $file  # If file="x.txt; rm -rf /"

# GOOD - Properly quoted
file="$1"
cat "$file"  # Safe even with special characters

# BAD - Eval of user input
eval "$user_command"  # NEVER do this

# GOOD - Whitelist allowed commands
case "$user_command" in
    build) just build ;;
    test) just test ;;
    *) error "Unknown command: $user_command" ;;
esac
```

**Reference**: [.github/instructions/security.instructions.md](/.github/instructions/security.instructions.md)

## 🎯 Integration Patterns

### With Justfile

Scripts are typically called from `justfile` recipes:

```makefile
# Call script directly
script-name:
    bash scripts/script_name.sh

# Pass arguments
script-with-args arg1 arg2:
    bash scripts/script_name.sh {{arg1}} {{arg2}}

# Conditional execution
conditional-script:
    #!/usr/bin/env bash
    set -euo pipefail
    if [[ -f "file.txt" ]]; then
        bash scripts/script_name.sh
    fi
```

### With CI/CD

Scripts run in GitHub Actions workflows:

```yaml
- name: Run doctor check
  run: bash scripts/doctor.sh

- name: Measure tokens
  run: |
      bash scripts/measure_tokens.sh .github/prompts/*.prompt.md
```

### With Nx

Scripts can be Nx targets:

```json
{
    "targets": {
        "doctor": {
            "executor": "nx:run-commands",
            "options": {
                "command": "bash scripts/doctor.sh"
            }
        }
    }
}
```

## 📊 Testing Strategy

**All scripts must have ShellSpec tests:**

1. **Happy path** - Normal execution
2. **Error cases** - Missing files, invalid input
3. **Edge cases** - Empty input, special characters
4. **Options** - Verify flags work correctly
5. **Output** - Check stdout/stderr format

**Test organization:**

```
tests/shell/
└── scripts/
    ├── run_prompt_spec.sh
    ├── measure_tokens_spec.sh
    └── doctor_spec.sh
```

## 🔄 Maintenance

### Regular Tasks

-   **Weekly**: Run ShellCheck on all scripts
-   **Monthly**: Update script dependencies
-   **Quarterly**: Review script usage and deprecate unused scripts
-   **As needed**: Refactor based on patterns

### When to Update This AGENT.md

-   New script patterns emerge
-   ShellCheck rules change
-   Testing conventions evolve
-   Integration patterns updated
-   Security best practices change

---

_Last updated: 2025-10-13 | Maintained by: VibesPro Project Team_
_Parent context: [copilot-instructions.md](/.github/copilot-instructions.md) | Navigation: [AGENT-MAP.md](/AGENT-MAP.md)_
