# Migration Guide

This guide helps you migrate existing projects to vibes-pro.

## Migration Steps

### Step 1: Analyze Your Current Project

Before migrating, understand your current architecture:
- Identify domain boundaries
- Map existing entities and value objects
- Catalog external dependencies

### Step 2: Prepare Migration Environment

```bash
# Install migration tools
pip install -r tools/migration/requirements.txt
```

### Step 3: Run Migration Analysis

```bash
# Analyze existing project
python tools/migration/hexddd-migrator.py analyze /path/to/current/project
```

## From HexDDD Projects

### Automated Migration

```bash
# Migrate project
python tools/migration/hexddd-migrator.py migrate /path/to/hexddd/project /path/to/new/project
```

## From VibePDK Templates

### Template Conversion

```bash
# Convert template
python tools/migration/vibepdk-migrator.py /path/to/cookiecutter/template

# Validate conversion
copier copy . /tmp/test-output
```

## Migration Tools

- `hexddd-migrator.py`: Migrate from HexDDD projects
- `vibepdk-migrator.py`: Convert VibePDK templates
- `legacy-analyzer.py`: Analyze legacy codebases

## Validation

After migration, validate your project:

```bash
# Run tests
just test

# Validate architecture
python tools/validation/architecture-checker.py
```
## Validation

After migration, validate your project:

```bash
# Run tests
just test

# Validate architecture
python tools/validation/architecture-checker.py
```
