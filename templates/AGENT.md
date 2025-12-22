# templates/ Agent Instructions

## 📍 Context

> **Purpose**: Copier/Jinja2 templates for full project generation and template-based scaffolding.
> **When to use**: When generating complete projects, initializing workspaces, or working with Copier templates.

## 🔗 Parent Context

See [root copilot-instructions.md](/.github/copilot-instructions.md) for comprehensive project guidance and [AGENT-MAP.md](/AGENT-MAP.md) for navigation across contexts.

## 🎯 Local Scope

**This directory handles:**

- Copier templates for project generation
- Jinja2 template syntax and patterns
- Template variables and configuration
- Pre-generation and post-generation hooks
- Template validation and testing

**Related Technology**: [Copier](https://copier.readthedocs.io/) + [Jinja2](https://jinja.palletsprojects.com/)

## 📁 Key Files & Patterns

### Directory Structure

```
templates/
├── {{project_slug}}/           # Main project template (Jinja2 variable)
│   ├── .github/                # Generated GitHub workflows
│   │   ├── workflows/
│   │   ├── ISSUE_TEMPLATE/
│   │   └── copilot-instructions.md.j2
│   ├── apps/
│   │   └── {{app_name}}/       # Template variable for app name
│   ├── libs/
│   ├── docs/
│   ├── justfile.j2             # Template for justfile
│   ├── package.json.j2         # Template for package.json
│   ├── tsconfig.json.j2        # Template for tsconfig
│   ├── nx.json.j2              # Template for Nx configuration
│   └── README.md.j2            # Template for README
├── copier.yml                  # Template configuration (in root)
├── hooks/                      # Pre/post generation hooks (in root)
│   ├── pre_gen.py              # Runs before generation
│   └── post_gen.py             # Runs after generation
└── README.md                   # Template documentation
```

### Key Configuration Files

#### copier.yml (Root)

```yaml
# Questions to ask user during generation
_templates_suffix: .j2
_envops:
    block_start_string: '{%'
    block_end_string: '%}'
    variable_start_string: '{{'
    variable_end_string: '}}'
    comment_start_string: '{#'
    comment_end_string: '#}'

# Project configuration
project_name:
    type: str
    help: 'Project name (human-readable)'
    default: 'My Awesome Project'

project_slug:
    type: str
    help: 'Project slug (kebab-case, used for directories)'
    default: "{{ project_name|lower|replace(' ', '-') }}"

description:
    type: str
    help: 'Project description'
    default: ''

author_name:
    type: str
    help: 'Your name'
    default: '{{ author_name }}'

author_email:
    type: str
    help: 'Your email'
    default: '{{ author_email }}'

license:
    type: str
    help: 'License'
    choices:
        - MIT
        - Apache-2.0
        - MPL-2.0
    default: MPL-2.0

use_typescript:
    type: bool
    help: 'Use TypeScript?'
    default: true

use_python:
    type: bool
    help: 'Include Python support?'
    default: false

include_web_app:
    type: bool
    help: 'Include Next.js web app?'
    default: true

include_api:
    type: bool
    help: 'Include API backend?'
    default: true

database:
    type: str
    help: 'Database'
    choices:
        - postgresql
        - mongodb
        - none
    default: postgresql

# Computed values
current_year:
    type: str
    default: "{% now 'utc', '%Y' %}"
```

### Jinja2 Template Syntax

#### Variables

```jinja2
{# Basic variable #}
Project: {{ project_name }}

{# Filters #}
Slug: {{ project_name|lower|replace(' ', '-') }}

{# Default values #}
Author: {{ author_name|default('Anonymous') }}

{# Computed values #}
Year: {% now 'utc', '%Y' %}
```

#### Conditionals

```jinja2
{# If statement #}
{% if use_typescript %}
TypeScript is enabled
{% endif %}

{# If-else #}
{% if include_api %}
import { ApiModule } from './api';
{% else %}
// No API module
{% endif %}

{# Multiple conditions #}
{% if use_typescript and include_web_app %}
// TypeScript web app config
{% elif use_typescript %}
// TypeScript only
{% else %}
// JavaScript
{% endif %}
```

#### Loops

```jinja2
{# Loop over list #}
{% for feature in features %}
- {{ feature }}
{% endfor %}

{# Loop with index #}
{% for item in items %}
{{ loop.index }}. {{ item }}
{% endfor %}

{# Loop with conditions #}
{% for dep in dependencies %}
  {% if dep.required %}
"{{ dep.name }}": "{{ dep.version }}"{{ "," if not loop.last }}
  {% endif %}
{% endfor %}
```

#### Comments

```jinja2
{# This is a comment and won't appear in output #}

{# Multi-line comment
   spanning multiple
   lines #}
```

### File Naming with Variables

```
templates/
├── {{project_slug}}/
│   ├── apps/
│   │   └── {{app_name}}/
│   │       └── src/
│   │           └── {{app_name}}.tsx.j2
│   └── libs/
│       └── {{domain_name}}/
```

## 🧭 Routing Rules

### Use This Context When:

- [ ] Generating full projects with Copier
- [ ] Working with Jinja2 template files (\*.j2)
- [ ] Configuring copier.yml
- [ ] Writing pre/post generation hooks
- [ ] Testing template generation

### Refer to Other Contexts When:

| Context                                     | When to Use                                 |
| ------------------------------------------- | ------------------------------------------- |
| [generators/AGENT.md](/generators/AGENT.md) | Nx generators for individual components     |
| [libs/AGENT.md](/libs/AGENT.md)             | Understanding library structure to template |
| [apps/AGENT.md](/apps/AGENT.md)             | Understanding app structure to template     |
| [hooks/](/hooks/)                           | Pre/post generation hook implementation     |
| [docs/AGENT.md](/docs/AGENT.md)             | Documentation templates                     |

## 🔧 Local Conventions

### Template File Conventions

**File naming:**

- Template files: `filename.ext.j2`
- Variable directories: `{{variable_name}}/`
- Keep original extensions before `.j2` suffix

**Example:**

```
package.json.j2          → generates package.json
{{project_slug}}/        → generates actual-project-name/
justfile.j2              → generates justfile
```

### Jinja2 Best Practices

#### 1. Use Filters for Transformations

```jinja2
{# Convert to kebab-case #}
{{ project_name|lower|replace(' ', '-')|replace('_', '-') }}

{# Title case #}
{{ project_name|title }}

{# Quote strings #}
"name": "{{ project_name|replace('"', '\\"') }}"

{# Default values #}
{{ description|default('No description provided') }}
```

#### 2. Whitespace Control

```jinja2
{# Remove whitespace before #}
{%- if condition %}
content
{% endif %}

{# Remove whitespace after #}
{% if condition -%}
content
{% endif %}

{# Remove both #}
{%- if condition -%}
content
{%- endif -%}
```

#### 3. Macros for Reusability

```jinja2
{# Define macro #}
{% macro render_dependency(name, version, dev=false) -%}
"{{ name }}": "{{ version }}"
{%- endmacro %}

{# Use macro #}
{
  "dependencies": {
    {{ render_dependency('react', '^18.2.0') }},
    {{ render_dependency('react-dom', '^18.2.0') }}
  },
  "devDependencies": {
    {{ render_dependency('typescript', '^5.0.0', dev=true) }}
  }
}
```

#### 4. Include for Modularity

```jinja2
{# Include partial template #}
{% include 'partials/header.j2' %}

{# Include with variables #}
{% include 'partials/config.j2' with context %}
```

### Pre/Post Generation Hooks

#### Pre-Generation Hook (hooks/pre_gen.py)

```python
"""Pre-generation hook - validates inputs before generation."""
import sys
import re
from pathlib import Path

def validate_project_slug(slug: str) -> bool:
    """Validate project slug format."""
    return bool(re.match(r'^[a-z][a-z0-9-]*$', slug))

def main():
    """Run pre-generation validation."""
    # Access Copier context
    project_slug = "{{ project_slug }}"

    if not validate_project_slug(project_slug):
        print("❌ Error: project_slug must be lowercase kebab-case")
        sys.exit(1)

    # Check for existing directory
    target_path = Path.cwd() / project_slug
    if target_path.exists():
        print(f"⚠️  Warning: Directory '{project_slug}' already exists")
        response = input("Continue anyway? [y/N] ")
        if response.lower() != 'y':
            sys.exit(1)

    print("✅ Pre-generation checks passed")

if __name__ == "__main__":
    main()
```

#### Post-Generation Hook (hooks/post_gen.py)

```python
"""Post-generation hook - setup after files are generated."""
import subprocess
import sys
from pathlib import Path

def run_command(cmd: list[str], cwd: Path) -> bool:
    """Run command and return success status."""
    try:
        subprocess.run(cmd, cwd=cwd, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {' '.join(cmd)}")
        print(f"Error: {e.stderr.decode()}")
        return False

def main():
    """Run post-generation setup."""
    project_slug = "{{ project_slug }}"
    project_path = Path.cwd() / project_slug

    print(f"📦 Setting up project: {project_slug}")

    # Install Node dependencies
    if "{{ use_typescript }}" == "true":
        print("📥 Installing Node dependencies...")
        if not run_command(["pnpm", "install"], project_path):
            sys.exit(1)

    # Install Python dependencies
    if "{{ use_python }}" == "true":
        print("🐍 Installing Python dependencies...")
        if not run_command(["uv", "sync"], project_path):
            sys.exit(1)

    # Initialize git
    print("🔧 Initializing git repository...")
    if not run_command(["git", "init"], project_path):
        sys.exit(1)

    run_command(["git", "add", "."], project_path)
    run_command(
        ["git", "commit", "-m", "chore: initial commit from template"],
        project_path
    )

    print(f"\n✅ Project '{project_slug}' generated successfully!")
    print(f"\n📁 cd {project_slug}")
    print("🚀 pnpm dev")

if __name__ == "__main__":
    main()
```

## 📚 Related Instructions

**Modular instructions that apply here:**

- [.github/instructions/generators-first.instructions.md](/.github/instructions/generators-first.instructions.md) - Generator-first policy
- [.github/instructions/testing.instructions.md](/.github/instructions/testing.instructions.md) - Testing templates
- [.github/instructions/security.instructions.md](/.github/instructions/security.instructions.md) - Security in templates

**Relevant documentation:**

- [Copier documentation](https://copier.readthedocs.io/)
- [Jinja2 documentation](https://jinja.palletsprojects.com/)

## 💡 Examples

### Example 1: package.json Template

```jinja2
{# templates/{{project_slug}}/package.json.j2 #}
{
  "name": "{{ project_slug }}",
  "version": "0.1.0",
  "description": "{{ description|default('No description') }}",
  "author": "{{ author_name }} <{{ author_email }}>",
  "license": "{{ license }}",
  "private": true,
  "workspaces": [
    "apps/*",
    "libs/*"
  ],
  "scripts": {
    "dev": "nx serve",
    "build": "nx build",
    "test": "nx test"{% if use_typescript %},
    "type-check": "nx run-many --target=type-check"{% endif %}
  },
  "dependencies": {
    {% if include_web_app -%}
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0"{{ "," if use_typescript or include_api }}
    {% endif -%}
    {% if use_typescript -%}
    "typescript": "^5.3.0"{{ "," if include_api }}
    {% endif -%}
    {% if include_api -%}
    "@nestjs/core": "^10.0.0",
    "@nestjs/common": "^10.0.0"
    {% endif -%}
  },
  "devDependencies": {
    "nx": "^19.0.0",
    "@nx/workspace": "^19.0.0"{% if use_typescript %},
    "@types/node": "^20.0.0"{% endif %}{% if include_web_app %},
    "@nx/next": "^19.0.0"{% endif %}
  }
}
```

### Example 2: Conditional File Inclusion

```jinja2
{# templates/{{project_slug}}/libs/config/src/database.config.ts.j2 #}
{% if database != 'none' -%}
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService) => ({
  {% if database == 'postgresql' -%}
  type: 'postgres' as const,
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USER', 'postgres'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME', '{{ project_slug }}'),
  {% elif database == 'mongodb' -%}
  type: 'mongodb' as const,
  url: configService.get('MONGO_URL', 'mongodb://localhost:27017'),
  database: configService.get('DB_NAME', '{{ project_slug }}'),
  {% endif -%}
  synchronize: configService.get('NODE_ENV') !== 'production',
  logging: configService.get('DB_LOGGING', false),
});
{% endif -%}
```

### Example 3: Loop for Multiple Apps

```jinja2
{# templates/{{project_slug}}/nx.json.j2 #}
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"]
      }
    }
  },
  "targetDefaults": {
    {% for app in apps -%}
    "{{ app.name }}:build": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/dist"]
    }{{ "," if not loop.last }}
    {% endfor %}
  }
}
```

### Example 4: README Template with Rich Content

````jinja2
{# templates/{{project_slug}}/README.md.j2 #}
# {{ project_name }}

> {{ description|default('No description provided') }}

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

{% if use_python -%}
# Setup Python environment
uv sync
{% endif -%}

# Start development server
{% if include_web_app -%}
pnpm dev  # Web app on http://localhost:3000
{% elif include_api -%}
pnpm dev  # API on http://localhost:3001
{% endif %}
````

## 📦 Project Structure

```
{{ project_slug }}/
{% if include_web_app -%}
├── apps/web/           # Next.js web application
{% endif -%}
{% if include_api -%}
├── apps/api/           # NestJS API backend
{% endif -%}
├── libs/               # Shared libraries
├── docs/               # Documentation
└── tools/              # Development tools
```

## 🛠️ Tech Stack

{% if use_typescript -%}

- **TypeScript** - Type-safe JavaScript
  {% endif -%}
  {% if include_web_app -%}
- **Next.js** - React framework
- **React** - UI library
  {% endif -%}
  {% if include_api -%}
- **NestJS** - Node.js framework
  {% endif -%}
  {% if database == 'postgresql' -%}
- **PostgreSQL** - Relational database
  {% elif database == 'mongodb' -%}
- **MongoDB** - Document database
  {% endif -%}
- **Nx** - Monorepo tooling

## 📝 License

{{ license }}

---

_Generated with ❤️ by VibesPro • {{ current_year }}_

````

## ✅ Checklist

### Before Generating a Project:

- [ ] Review copier.yml configuration
- [ ] Test template with `copier copy . /tmp/test-project --vcs-ref HEAD`
- [ ] Validate all Jinja2 syntax
- [ ] Check hooks/pre_gen.py logic
- [ ] Prepare default values

### While Generating:

- [ ] Answer prompts carefully
- [ ] Review generated file structure
- [ ] Check for syntax errors in generated files
- [ ] Verify conditional logic worked correctly

### After Generation:

- [ ] Run post-generation hook
- [ ] Install dependencies
- [ ] Run tests: `pnpm test`
- [ ] Build project: `pnpm build`
- [ ] Commit initial state to git

## 🔍 Quick Reference

### Common Commands

```bash
# Generate project (interactive)
pnpm generate
# or
copier copy . path/to/new-project

# Generate with answers file
copier copy . path/to/new-project --data-file answers.yml

# Update existing project from template
copier update path/to/existing-project

# Test template (dry-run)
copier copy . /tmp/test-project --vcs-ref HEAD

# Validate template
python tools/validate-templates.py
````

### Jinja2 Filters

| Filter    | Purpose           | Example                         |
| --------- | ----------------- | ------------------------------- |
| `lower`   | Lowercase         | `{{ name\|lower }}`             |
| `upper`   | Uppercase         | `{{ name\|upper }}`             |
| `title`   | Title case        | `{{ name\|title }}`             |
| `replace` | Replace substring | `{{ name\|replace(' ', '-') }}` |
| `default` | Default value     | `{{ desc\|default('None') }}`   |
| `length`  | String length     | `{{ items\|length }}`           |
| `join`    | Join list         | `{{ items\|join(', ') }}`       |
| `trim`    | Remove whitespace | `{{ text\|trim }}`              |

### Copier Context Variables

```python
# Available in hooks/pre_gen.py and hooks/post_gen.py
{{ _copier_answers }}       # All user answers
{{ _copier_conf }}          # Copier configuration
{{ _folder_name }}          # Target folder name
{{ project_slug }}          # User-defined variable
```

## 🛡️ Security Considerations

**Security in templates:**

- ⚠️ **Sanitize variables**: Escape user input in templates
- ⚠️ **Validate paths**: Check for path traversal in hooks
- ⚠️ **No secrets**: Never include secrets in templates
- ⚠️ **Secure defaults**: Use secure default values
- ⚠️ **Validate hooks**: Review pre/post generation scripts

**Example sanitization:**

```jinja2
{# Escape quotes in JSON #}
"description": "{{ description|replace('"', '\\"')|replace('\n', ' ') }}"

{# Validate in hook #}
import re

def validate_input(value: str) -> bool:
    # Allow only lowercase alphanumeric and hyphens
    return bool(re.match(r'^[a-z0-9-]+
```

## 🎯 Testing Strategy

### Template Validation

```python
# tools/validate-templates.py
import sys
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, TemplateSyntaxError

def validate_templates(template_dir: Path) -> bool:
    """Validate all Jinja2 templates."""
    env = Environment(loader=FileSystemLoader(template_dir))

    errors = []
    for template_file in template_dir.rglob('*.j2'):
        try:
            template = env.get_template(str(template_file.relative_to(template_dir)))
            # Validate syntax
            template.module
        except TemplateSyntaxError as e:
            errors.append(f"{template_file}: {e}")

    if errors:
        for error in errors:
            print(f"❌ {error}")
        return False

    print("✅ All templates valid")
    return True

if __name__ == '__main__':
    templates_dir = Path(__file__).parent.parent / 'templates'
    sys.exit(0 if validate_templates(templates_dir) else 1)
```

### Integration Test

```bash
#!/bin/bash
# tests/test-template-generation.sh

set -euo pipefail

echo "🧪 Testing template generation..."

# Generate test project
TEST_DIR=$(mktemp -d)
copier copy . "$TEST_DIR/test-project" \
  --data project_name="Test Project" \
  --data project_slug="test-project" \
  --data use_typescript=true \
  --data include_web_app=true \
  --vcs-ref HEAD

# Verify structure
cd "$TEST_DIR/test-project"
test -f package.json || exit 1
test -d apps/web || exit 1
test -f apps/web/src/pages/index.tsx || exit 1

# Install and build
pnpm install
pnpm build

echo "✅ Template generation test passed"
rm -rf "$TEST_DIR"
```

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Test template generation with latest changes
- **Monthly**: Update dependencies in template
- **Quarterly**: Review copier.yml questions for relevance
- **Per feature**: Update templates to match current conventions

### When to Update This AGENT.md

- Copier version updates
- New template patterns emerge
- Hook logic changes
- Jinja2 best practices evolve

### Common Issues & Solutions

| Issue                 | Solution                                     |
| --------------------- | -------------------------------------------- |
| Template syntax error | Run `python tools/validate-templates.py`     |
| Hook fails            | Check Python syntax and imports              |
| Missing variables     | Verify copier.yml has all required variables |
| Wrong output          | Test with `--vcs-ref HEAD` flag              |
| Whitespace issues     | Use `{%-` and `-%}` for control              |

---

_Last updated: 2025-10-13 | Maintained by: VibesPro Project Team_
_Parent context: [copilot-instructions.md](/.github/copilot-instructions.md) | Navigation: [AGENT-MAP.md](/AGENT-MAP.md)_
, value))

````

## 🎯 Testing Strategy

### Template Validation

```python
# tools/validate-templates.py
import sys
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, TemplateSyntaxError

def validate_templates(template_dir: Path) -> bool:
    """Validate all Jinja2 templates."""
    env = Environment(loader=FileSystemLoader(template_dir))

    errors = []
    for template_file in template_dir.rglob('*.j2'):
        try:
            template = env.get_template(str(template_file.relative_to(template_dir)))
            # Validate syntax
            template.module
        except TemplateSyntaxError as e:
            errors.append(f"{template_file}: {e}")

    if errors:
        for error in errors:
            print(f"❌ {error}")
        return False

    print("✅ All templates valid")
    return True

if __name__ == '__main__':
    templates_dir = Path(__file__).parent.parent / 'templates'
    sys.exit(0 if validate_templates(templates_dir) else 1)
````

### Integration Test

```bash
#!/bin/bash
# tests/test-template-generation.sh

set -euo pipefail

echo "🧪 Testing template generation..."

# Generate test project
TEST_DIR=$(mktemp -d)
copier copy . "$TEST_DIR/test-project" \
  --data project_name="Test Project" \
  --data project_slug="test-project" \
  --data use_typescript=true \
  --data include_web_app=true \
  --vcs-ref HEAD

# Verify structure
cd "$TEST_DIR/test-project"
test -f package.json || exit 1
test -d apps/web || exit 1
test -f apps/web/src/pages/index.tsx || exit 1

# Install and build
pnpm install
pnpm build

echo "✅ Template generation test passed"
rm -rf "$TEST_DIR"
```

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Test template generation with latest changes
- **Monthly**: Update dependencies in template
- **Quarterly**: Review copier.yml questions for relevance
- **Per feature**: Update templates to match current conventions

### When to Update This AGENT.md

- Copier version updates
- New template patterns emerge
- Hook logic changes
- Jinja2 best practices evolve

### Common Issues & Solutions

| Issue                 | Solution                                     |
| --------------------- | -------------------------------------------- |
| Template syntax error | Run `python tools/validate-templates.py`     |
| Hook fails            | Check Python syntax and imports              |
| Missing variables     | Verify copier.yml has all required variables |
| Wrong output          | Test with `--vcs-ref HEAD` flag              |
| Whitespace issues     | Use `{%-` and `-%}` for control              |

---

_Last updated: 2025-10-13 | Maintained by: VibesPro Project Team_
_Parent context: [copilot-instructions.md](/.github/copilot-instructions.md) | Navigation: [AGENT-MAP.md](/AGENT-MAP.md)_
