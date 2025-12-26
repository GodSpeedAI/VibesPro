# hooks/ Agent Instructions

## 📍 Context

> **Purpose**: Pre-generation and post-generation hooks for Copier template workflows.
> **When to use**: When creating validation logic, setup automation, or post-processing for generated projects.

## 🔗 Parent Context

See [root copilot-instructions.md](/.github/copilot-instructions.md) for comprehensive project guidance and [AGENTS.md](/AGENTS.md) for navigation across contexts.

## 🎯 Local Scope

**This directory handles:**

- Pre-generation validation (pre_gen.py)
- Post-generation automation (post_gen.py)
- Input validation and sanitization
- Dependency installation automation
- Git initialization
- Project setup orchestration

**Related Context**: See [templates/AGENT.md](/templates/AGENT.md) for Copier template system overview.

## 📁 Key Files & Patterns

### Directory Structure

```
hooks/
├── pre_gen.py          # Runs BEFORE template generation
├── post_gen.py         # Runs AFTER template generation
├── __pycache__/        # Python cache (gitignored)
└── README.md           # Hook documentation
```

### Hook Execution Flow

```
User runs: pnpm generate
  ↓
Copier collects answers (copier.yml)
  ↓
PRE-GENERATION HOOK (hooks/pre_gen.py)
  • Validate inputs
  • Check prerequisites
  • Confirm overwrite if needed
  • Exit if validation fails
  ↓
GENERATION (Copier + Jinja2)
  • Process templates
  • Create directory structure
  • Generate files
  ↓
POST-GENERATION HOOK (hooks/post_gen.py)
  • Install dependencies (pnpm, uv)
  • Initialize git repository
  • Run formatters/linters
  • Display next steps
  ↓
Complete ✅
```

## 🧭 Routing Rules

### Use This Context When:

- [ ] Implementing pre-generation validation
- [ ] Adding post-generation automation
- [ ] Validating user inputs before generation
- [ ] Automating dependency installation
- [ ] Setting up git repositories
- [ ] Running post-generation formatters

### Refer to Other Contexts When:

| Context                                     | When to Use                                  |
| ------------------------------------------- | -------------------------------------------- |
| [templates/AGENT.md](/templates/AGENT.md)   | Understanding Copier templates and variables |
| [scripts/AGENT.md](/scripts/AGENT.md)       | Writing shell scripts for automation         |
| [generators/AGENT.md](/generators/AGENT.md) | Nx generators (different from Copier hooks)  |
| [.github/AGENT.md](/.github/AGENT.md)       | AI-assisted generation workflows             |

## 🔧 Local Conventions

### Pre-Generation Hook (pre_gen.py)

**Purpose**: Validate inputs, check prerequisites, prevent bad generations.

**Structure:**

```python
"""Pre-generation hook for Copier template.

Runs before Copier generates files.
Validates inputs and checks prerequisites.
"""
import re
import sys
from pathlib import Path


def validate_project_slug(slug: str) -> tuple[bool, str]:
    """Validate project slug format.

    Args:
        slug: Project slug to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not slug:
        return False, "Project slug cannot be empty"

    # Must be lowercase kebab-case
    pattern = r'^[a-z][a-z0-9-]*$'
    if not re.match(pattern, slug):
        return False, (
            "Project slug must be lowercase kebab-case "
            "(letters, numbers, hyphens, start with letter)"
        )

    # Cannot end with hyphen
    if slug.endswith('-'):
        return False, "Project slug cannot end with hyphen"

    return True, ""


def validate_author_email(email: str) -> tuple[bool, str]:
    """Validate author email format.

    Args:
        email: Email address to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not email:
        return False, "Author email cannot be empty"

    # Basic email validation
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "Invalid email format"

    return True, ""


def check_existing_directory(target_path: Path) -> bool:
    """Check if target directory exists.

    Args:
        target_path: Path to check

    Returns:
        True if should continue, False to abort
    """
    if not target_path.exists():
        return True

    print(f"⚠️  Warning: Directory '{target_path}' already exists")

    # List existing files
    files = list(target_path.iterdir())
    if files:
        print(f"   Contains {len(files)} items:")
        for item in files[:5]:  # Show first 5
            print(f"     - {item.name}")
        if len(files) > 5:
            print(f"     ... and {len(files) - 5} more")

    response = input("\n   Continue and overwrite? [y/N] ")
    return response.lower() == 'y'


def main() -> int:
    """Run pre-generation validation.

    Returns:
        0 for success, 1 for failure
    """
    print("🔍 Running pre-generation validation...")

    # Access Copier context variables
    # These come from copier.yml answers
    project_slug = "{{ project_slug }}"
    author_email = "{{ author_email }}"

    # Validate project slug
    valid, error = validate_project_slug(project_slug)
    if not valid:
        print(f"❌ Invalid project slug: {error}")
        return 1

    # Validate author email
    valid, error = validate_author_email(author_email)
    if not valid:
        print(f"❌ Invalid author email: {error}")
        return 1

    # Check for existing directory
    target_path = Path.cwd() / project_slug
    if not check_existing_directory(target_path):
        print("❌ Generation cancelled by user")
        return 1

    print("✅ Pre-generation validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

### Post-Generation Hook (post_gen.py)

**Purpose**: Automate setup after files are generated.

**Structure:**

```python
"""Post-generation hook for Copier template.

Runs after Copier generates files.
Installs dependencies and sets up project.
"""
import subprocess
import sys
from pathlib import Path
from typing import Optional


def run_command(
    cmd: list[str],
    cwd: Path,
    description: str,
    check: bool = True,
) -> tuple[bool, str]:
    """Run shell command and capture output.

    Args:
        cmd: Command and arguments
        cwd: Working directory
        description: Human-readable description
        check: Whether to raise on non-zero exit

    Returns:
        Tuple of (success, output/error)
    """
    print(f"  {description}...")

    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            check=check,
            capture_output=True,
            text=True,
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr
    except FileNotFoundError:
        return False, f"Command not found: {cmd[0]}"


def check_command_exists(command: str) -> bool:
    """Check if a command exists in PATH.

    Args:
        command: Command name to check

    Returns:
        True if command exists
    """
    try:
        subprocess.run(
            ["which", command],
            capture_output=True,
            check=True,
        )
        return True
    except subprocess.CalledProcessError:
        return False


def install_node_dependencies(project_path: Path) -> bool:
    """Install Node.js dependencies with pnpm.

    Args:
        project_path: Path to generated project

    Returns:
        True if successful
    """
    if not check_command_exists("pnpm"):
        print("  ⚠️  pnpm not found, skipping Node dependencies")
        return False

    success, output = run_command(
        ["pnpm", "install"],
        project_path,
        "Installing Node dependencies",
    )

    if not success:
        print(f"  ❌ Failed to install Node dependencies:\n{output}")
        return False

    return True


def install_python_dependencies(project_path: Path) -> bool:
    """Install Python dependencies with uv.

    Args:
        project_path: Path to generated project

    Returns:
        True if successful
    """
    # Check if Python is enabled
    use_python = "{{ use_python }}" == "true"
    if not use_python:
        return True

    if not check_command_exists("uv"):
        print("  ⚠️  uv not found, skipping Python dependencies")
        return False

    success, output = run_command(
        ["uv", "sync"],
        project_path,
        "Installing Python dependencies",
    )

    if not success:
        print(f"  ❌ Failed to install Python dependencies:\n{output}")
        return False

    return True


def initialize_git(project_path: Path) -> bool:
    """Initialize git repository.

    Args:
        project_path: Path to generated project

    Returns:
        True if successful
    """
    if not check_command_exists("git"):
        print("  ⚠️  git not found, skipping git initialization")
        return False

    # Initialize repo
    success, _ = run_command(
        ["git", "init"],
        project_path,
        "Initializing git repository",
    )
    if not success:
        return False

    # Add all files
    success, _ = run_command(
        ["git", "add", "."],
        project_path,
        "Staging files",
    )
    if not success:
        return False

    # Initial commit
    success, _ = run_command(
        ["git", "commit", "-m", "chore: initial commit from template"],
        project_path,
        "Creating initial commit",
    )

    return success


def run_formatters(project_path: Path) -> bool:
    """Run code formatters on generated files.

    Args:
        project_path: Path to generated project

    Returns:
        True if successful
    """
    use_typescript = "{{ use_typescript }}" == "true"

    if use_typescript and check_command_exists("pnpm"):
        success, _ = run_command(
            ["pnpm", "format"],
            project_path,
            "Formatting code",
            check=False,  # Don't fail on format errors
        )
        return success

    return True


def display_next_steps(project_slug: str) -> None:
    """Display next steps for user.

    Args:
        project_slug: Project directory name
    """
    print(f"""
✅ Project '{project_slug}' generated successfully!

📁 Next steps:

   cd {project_slug}

   # Start development server
   pnpm dev

   # Run tests
   pnpm test

   # Build for production
   pnpm build

📚 Documentation:
   - README.md - Project overview
   - docs/ - Additional documentation

🚀 Happy coding!
""")


def main() -> int:
    """Run post-generation setup.

    Returns:
        0 for success, 1 for failure
    """
    project_slug = "{{ project_slug }}"
    project_path = Path.cwd() / project_slug

    print(f"📦 Setting up project: {project_slug}")
    print()

    # Install dependencies
    print("📥 Installing dependencies...")
    node_success = install_node_dependencies(project_path)
    python_success = install_python_dependencies(project_path)

    if not node_success and not python_success:
        print("❌ Failed to install dependencies")
        return 1

    print()

    # Initialize git
    print("🔧 Initializing version control...")
    git_success = initialize_git(project_path)
    print()

    # Run formatters
    print("✨ Formatting code...")
    run_formatters(project_path)
    print()

    # Display next steps
    display_next_steps(project_slug)

    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## 📚 Related Instructions

**Modular instructions that apply here:**

- [.github/instructions/testing.instructions.md](/.github/instructions/testing.instructions.md) - Testing hooks
- [.github/instructions/security.instructions.md](/.github/instructions/security.instructions.md) - **Security in hooks**
- [.github/instructions/style.python.instructions.md](/.github/instructions/style.python.instructions.md) - Python style

**Relevant documentation:**

- [Copier hooks](https://copier.readthedocs.io/en/stable/creating/#the-tasks-key)
- [Python subprocess](https://docs.python.org/3/library/subprocess.html)

## 💡 Examples

### Example 1: Validate Multiple Inputs

```python
# pre_gen.py
def validate_inputs() -> list[str]:
    """Validate all inputs and return list of errors."""
    errors = []

    # Validate project name
    project_name = "{{ project_name }}"
    if len(project_name) < 3:
        errors.append("Project name must be at least 3 characters")

    # Validate project slug
    project_slug = "{{ project_slug }}"
    if not re.match(r'^[a-z][a-z0-9-]*$', project_slug):
        errors.append("Project slug must be lowercase kebab-case")

    # Validate description
    description = "{{ description }}"
    if len(description) > 200:
        errors.append("Description must be 200 characters or less")

    # Validate author email
    author_email = "{{ author_email }}"
    if '@' not in author_email:
        errors.append("Author email must be valid")

    return errors


def main() -> int:
    errors = validate_inputs()

    if errors:
        print("❌ Validation errors:")
        for error in errors:
            print(f"   - {error}")
        return 1

    print("✅ All inputs valid")
    return 0
```

### Example 2: Conditional Setup Based on Options

```python
# post_gen.py
def setup_based_on_options(project_path: Path) -> bool:
    """Run setup tasks based on selected options."""

    # Setup web app
    if "{{ include_web_app }}" == "true":
        print("  Setting up Next.js web app...")
        run_command(
            ["pnpm", "exec", "nx", "build", "web"],
            project_path,
            "Building web app",
        )

    # Setup API
    if "{{ include_api }}" == "true":
        print("  Setting up NestJS API...")
        run_command(
            ["pnpm", "exec", "nx", "build", "api"],
            project_path,
            "Building API",
        )

    # Setup database
    if "{{ database }}" != "none":
        print(f"  Setting up {{'{{ database }}'}} database...")
        run_command(
            ["pnpm", "run", "db:setup"],
            project_path,
            "Setting up database",
        )

    return True
```

### Example 3: Error Recovery

```python
# post_gen.py
def install_with_retry(
    cmd: list[str],
    cwd: Path,
    description: str,
    retries: int = 3,
) -> bool:
    """Install dependencies with retry logic."""

    for attempt in range(1, retries + 1):
        print(f"  {description} (attempt {attempt}/{retries})...")

        success, output = run_command(cmd, cwd, description, check=False)

        if success:
            return True

        if attempt < retries:
            print(f"  ⚠️  Failed, retrying...")
        else:
            print(f"  ❌ Failed after {retries} attempts:\n{output}")

    return False
```

### Example 4: Interactive Confirmation

```python
# pre_gen.py
def confirm_production_settings() -> bool:
    """Confirm if user understands production implications."""

    environment = "{{ environment }}"

    if environment == "production":
        print("⚠️  WARNING: You selected PRODUCTION environment")
        print("   This will:")
        print("   - Use production database")
        print("   - Enable strict security settings")
        print("   - Disable debug mode")
        print()
        response = input("   Are you sure? [y/N] ")

        return response.lower() == 'y'

    return True
```

## ✅ Checklist

### Before Writing Hooks:

- [ ] Review template variables in copier.yml
- [ ] Identify validation requirements
- [ ] Plan post-generation automation
- [ ] Consider error handling
- [ ] Test locally with sample data

### While Writing Hooks:

- [ ] Use type hints for function signatures
- [ ] Add docstrings to all functions
- [ ] Handle missing commands gracefully
- [ ] Provide clear error messages
- [ ] Log progress to user
- [ ] Don't fail silently

### After Writing Hooks:

- [ ] Test with valid inputs
- [ ] Test with invalid inputs
- [ ] Test with missing dependencies
- [ ] Test overwrite scenario
- [ ] Verify error messages are clear
- [ ] Document expected behavior

## 🔍 Quick Reference

### Common Commands

```bash
# Test pre-generation hook manually
cd hooks
python pre_gen.py

# Test post-generation hook manually
cd generated-project
python ../hooks/post_gen.py

# Test full generation with hooks
pnpm generate

# Test with specific answers
copier copy . /tmp/test-project --data-file test-answers.yml
```

### Accessing Copier Variables

```python
# In hooks, access variables with Jinja2 syntax
project_slug = "{{ project_slug }}"
project_name = "{{ project_name }}"
use_typescript = "{{ use_typescript }}" == "true"

# Check if variable exists
has_description = "{{ description }}" != ""
```

### Common Validation Patterns

```python
# Slug validation (kebab-case)
r'^[a-z][a-z0-9-]*$'

# Email validation
r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

# URL validation
r'^https?://[a-zA-Z0-9.-]+(:[0-9]+)?(/.*)?$'

# Version validation (semver)
r'^\d+\.\d+\.\d+$'
```

## 🛡️ Security Considerations (CRITICAL)

**Security in hooks is critical - they execute arbitrary code:**

- ⚠️ **Validate ALL inputs**: Never trust user input
- ⚠️ **Sanitize paths**: Prevent path traversal attacks
- ⚠️ **No shell=True**: Use subprocess with list arguments
- ⚠️ **Validate commands**: Check commands before executing
- ⚠️ **Limited permissions**: Don't require sudo/root
- ⚠️ **Error messages**: Don't leak sensitive info

**Example secure command execution:**

```python
# ❌ INSECURE - shell injection vulnerability
subprocess.run(f"rm -rf {user_input}", shell=True)

# ✅ SECURE - list arguments, no shell
subprocess.run(["rm", "-rf", validated_path], shell=False)
```

**Example path validation:**

```python
def validate_path(path_str: str) -> Path:
    """Validate path is safe (no traversal)."""
    path = Path(path_str).resolve()

    # Check for path traversal
    if ".." in path.parts:
        raise ValueError("Path traversal detected")

    # Must be within current directory
    if not path.is_relative_to(Path.cwd()):
        raise ValueError("Path must be relative to current directory")

    return path
```

## 🎯 Testing Strategy

### Unit Tests for Validation Functions

```python
# tests/test_pre_gen.py
import pytest
from hooks.pre_gen import validate_project_slug


def test_validate_project_slug_valid():
    valid, error = validate_project_slug("my-project")
    assert valid
    assert error == ""


def test_validate_project_slug_invalid_uppercase():
    valid, error = validate_project_slug("MyProject")
    assert not valid
    assert "lowercase" in error


def test_validate_project_slug_invalid_start():
    valid, error = validate_project_slug("-myproject")
    assert not valid
    assert "start with letter" in error
```

### Integration Tests

```bash
#!/bin/bash
# tests/test-hooks.sh

set -euo pipefail

echo "🧪 Testing Copier hooks..."

# Test successful generation
echo "Testing valid inputs..."
copier copy . /tmp/test-valid \
  --data project_slug="test-project" \
  --data author_email="test@example.com" \
  --vcs-ref HEAD

# Verify generation succeeded
if [[ ! -d /tmp/test-valid/test-project ]]; then
  echo "❌ Generation failed"
  exit 1
fi

# Test invalid inputs
echo "Testing invalid project slug..."
set +e
copier copy . /tmp/test-invalid \
  --data project_slug="Invalid-Project" \
  --vcs-ref HEAD
exit_code=$?
set -e

if [[ $exit_code -eq 0 ]]; then
  echo "❌ Should have rejected invalid input"
  exit 1
fi

echo "✅ Hook tests passed"
```

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Review hook execution logs
- **Monthly**: Test with latest Copier version
- **Quarterly**: Review validation rules
- **Per feature**: Update hooks for new template variables

### When to Update This AGENT.md

- Copier version updates
- New validation requirements
- Post-generation automation changes
- Security best practices evolve

### Debugging Hooks

```python
# Add debug logging
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def main():
    logger.debug("Starting pre-generation validation")
    logger.debug(f"Project slug: {{ project_slug }}")
    # ... rest of code
```

---

_Last updated: 2025-10-13 | Maintained by: VibesPro Project Team_
_Parent context: [copilot-instructions.md](/.github/copilot-instructions.md) | See also: [AGENTS.md](/AGENTS.md)_
