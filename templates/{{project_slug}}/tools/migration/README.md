# Migration Tools

Tools for migrating existing projects to the {{project_name}} unified platform.

## Available Migrators

### HexDDD Migrator (`hexddd-migrator.py`)

Migrates existing HexDDD projects to the merged Copier template format.

**Usage:**
```bash
# Analyze project (dry run)
python tools/migration/hexddd-migrator.py /path/to/hexddd/project /path/to/target --dry-run

# Perform migration
python tools/migration/hexddd-migrator.py /path/to/hexddd/project /path/to/target
```

**Features:**
- Preserves existing domain implementations
- Converts Nx generators to Copier templates
- Maintains project configuration
- Provides detailed migration log

### VibePDK Migrator (`vibepdk-migrator.py`)

Converts VibePDK Cookiecutter templates to Copier format.

**Usage:**
```bash
# Convert template
python tools/migration/vibepdk-migrator.py /path/to/cookiecutter/template /path/to/copier/template
```

## Migration Process

1. **Analysis Phase**: Examine source project structure
2. **Validation Phase**: Check compatibility and identify issues
3. **Migration Phase**: Copy and convert files to new format
4. **Verification Phase**: Validate migrated project

## Post-Migration

After migration, run:

```bash
# Validate migrated project
just validate-migration

# Test project generation
just test-generation

# Build and test
just build && just test
```
