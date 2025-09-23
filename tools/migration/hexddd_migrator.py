"""HexDDD Project Migrator - Converts HexDDD projects to the merged platform."""

from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any, Optional
import re

from tools.migration.hexddd_analyzer import HexDDDAnalyzer, HexDDDAnalysisResult, GeneratorInfo, DomainLibrary


@dataclass
class MigrationResult:
    """Result of a HexDDD project migration."""
    success: bool
    target_path: Path
    migrated_files: List[str]
    preserved_config: List[str]
    migration_plan: List[str]
    errors: List[str]


class HexDDDMigrator:
    """Migrates HexDDD projects to the unified generator-first platform."""

    def __init__(self, source_path: Path):
        """Initialize migrator with source project path."""
        self.source_path = Path(source_path).resolve()
        self.analyzer = HexDDDAnalyzer(self.source_path)

    def migrate(self, target_path: Path, dry_run: bool = False) -> MigrationResult:
        """Perform the migration from HexDDD to merged platform format."""
        target_path = Path(target_path).resolve()
        errors = []
        migrated_files = []
        preserved_config = []

        try:
            # Analyze the source project
            analysis = self.analyzer.analyze()

            if not analysis.is_hexddd_project:
                return MigrationResult(
                    success=False,
                    target_path=target_path,
                    migrated_files=[],
                    preserved_config=[],
                    migration_plan=[],
                    errors=["Source project is not a valid HexDDD project"]
                )

            if dry_run:
                return MigrationResult(
                    success=True,
                    target_path=target_path,
                    migrated_files=[],
                    preserved_config=[],
                    migration_plan=analysis.migration_plan,
                    errors=[]
                )

            # Create target directory structure
            self._create_target_structure(target_path)
            migrated_files.append("Project structure created")

            # Create copier.yml configuration
            copier_config = self._create_copier_config(analysis)
            copier_yml_path = target_path / "copier.yml"
            with open(copier_yml_path, 'w') as f:
                f.write(copier_config)
            migrated_files.append("copier.yml")

            # Migrate build configurations
            preserved_config.extend(self._migrate_build_configs(analysis, target_path))

            # Convert Nx generators to Copier templates
            migrated_files.extend(self._convert_generators(analysis.generators, target_path))

            # Migrate domain libraries to templates
            migrated_files.extend(self._migrate_domain_libraries(analysis.domain_libraries, target_path))

            # Create migration documentation
            self._create_migration_documentation(analysis, target_path)
            migrated_files.append("MIGRATION-GUIDE.md")

            return MigrationResult(
                success=True,
                target_path=target_path,
                migrated_files=migrated_files,
                preserved_config=preserved_config,
                migration_plan=analysis.migration_plan,
                errors=errors
            )

        except Exception as e:
            errors.append(f"Migration failed: {str(e)}")
            return MigrationResult(
                success=False,
                target_path=target_path,
                migrated_files=migrated_files,
                preserved_config=preserved_config,
                migration_plan=[],
                errors=errors
            )

    def _create_target_structure(self, target_path: Path) -> None:
        """Create the target directory structure for the migrated project."""
        target_path.mkdir(parents=True, exist_ok=True)

        # Create essential directories
        directories = [
            "templates",
            "hooks",
            "tests",
            "docs",
            "tools/migration",
        ]

        for dir_path in directories:
            (target_path / dir_path).mkdir(parents=True, exist_ok=True)

    def _create_copier_config(self, analysis: HexDDDAnalysisResult) -> str:
        """Create copier.yml configuration based on the analyzed project."""
        project_name = analysis.package_config.get("name", "migrated-hexddd-project")

        config = {
            "project_name": {
                "type": "str",
                "help": "Name of the project",
                "default": project_name
            },
            "author_name": {
                "type": "str",
                "help": "Author's name",
                "default": "Development Team"
            },
            "include_nx_workspace": {
                "type": "bool",
                "help": "Include Nx workspace configuration",
                "default": True
            },
            "architecture_style": {
                "type": "str",
                "help": "Primary architecture pattern",
                "choices": ["hexagonal", "layered", "microservices"],
                "default": "hexagonal"
            },
            "package_manager": {
                "type": "str",
                "help": "Package manager to use",
                "choices": ["npm", "yarn", "pnpm"],
                "default": analysis.build_config.get("cli", {}).get("packageManager", "pnpm")
            }
        }

        # Add domain-specific configuration
        domain_names = [lib.name for lib in analysis.domain_libraries]
        if domain_names:
            config["domain_libraries"] = {
                "type": "json",
                "help": "List of domain libraries to generate",
                "default": domain_names
            }

        # Convert to YAML format
        import yaml
        return yaml.dump(config, default_flow_style=False, sort_keys=False)

    def _migrate_build_configs(self, analysis: HexDDDAnalysisResult, target_path: Path) -> List[str]:
        """Migrate build configuration files."""
        preserved_files = []

        # Copy and adapt nx.json
        if analysis.has_nx_config:
            source_nx = self.source_path / "nx.json"
            target_nx = target_path / "nx.json"

            # Adapt nx.json for template context
            nx_config = analysis.build_config.copy()
            # Remove project-specific configurations that will be templated
            if "projects" in nx_config:
                # Convert projects to template format
                nx_config["projects"] = {
                    "{{project_name}}": "libs/{{project_name}}"
                }

            with open(target_nx, 'w') as f:
                json.dump(nx_config, f, indent=2)
            preserved_files.append("nx.json")

        # Copy and adapt package.json
        if analysis.package_config:
            package_config = analysis.package_config.copy()
            package_config["name"] = "{{project_name}}"

            target_package = target_path / "package.json"
            with open(target_package, 'w') as f:
                json.dump(package_config, f, indent=2)
            preserved_files.append("package.json")

        return preserved_files

    def _convert_generators(self, generators: List[GeneratorInfo], target_path: Path) -> List[str]:
        """Convert Nx generators to Copier templates."""
        migrated_files = []

        for generator in generators:
            template_dir = target_path / "templates" / "generators" / generator.name
            template_dir.mkdir(parents=True, exist_ok=True)

            # Copy generator files and convert to templates
            if generator.generator_file.exists():
                self._convert_generator_file(generator, template_dir)
                migrated_files.append(f"generators/{generator.name}/generator.py")

            # Convert template files
            if generator.template_files:
                files_dir = template_dir / "files"
                files_dir.mkdir(exist_ok=True)

                for template_file in generator.template_files:
                    if template_file.is_file():
                        relative_path = template_file.relative_to(generator.path / "files")
                        target_file = files_dir / relative_path
                        target_file.parent.mkdir(parents=True, exist_ok=True)

                        # Convert template syntax from Nx to Copier
                        content = template_file.read_text()
                        converted_content = self._convert_template_syntax(content)
                        target_file.write_text(converted_content)

                        migrated_files.append(f"generators/{generator.name}/files/{relative_path}")

        return migrated_files

    def _convert_generator_file(self, generator: GeneratorInfo, template_dir: Path) -> None:
        """Convert a TypeScript generator to Python."""
        # Read the original generator
        original_content = generator.generator_file.read_text()

        # Convert to Python equivalent
        python_content = f'''"""Generated from {generator.name} Nx generator."""

import os
from pathlib import Path
from typing import Dict, Any


def generate(context: Dict[str, Any], output_dir: Path) -> None:
    """Generate files based on the template context."""
    # Original generator: {generator.generator_file}
    # TODO: Implement generator logic based on original TypeScript code

    # Template variables available:
    # - context: All variables from copier.yml
    # - output_dir: Target directory for generated files

    print(f"Generating {{context.get('name', 'component')}} with {{generator.name}} generator")

    # Add your generation logic here based on the original generator:
    # {original_content[:200]}...
'''

        generator_py = template_dir / "generator.py"
        generator_py.write_text(python_content)

    def _convert_template_syntax(self, content: str) -> str:
        """Convert Nx template syntax to Copier/Jinja2 syntax."""
        # Convert <%= variable %> to {{ variable }}
        content = re.sub(r'<%=\s*([^%]+)\s*%>', r'{{ \1 }}', content)

        # Convert <% if condition %> to {% if condition %}
        content = re.sub(r'<%\s*if\s+([^%]+)\s*%>', r'{% if \1 %}', content)
        content = re.sub(r'<%\s*endif\s*%>', r'{% endif %}', content)

        # Convert <% for item in items %> to {% for item in items %}
        content = re.sub(r'<%\s*for\s+([^%]+)\s*%>', r'{% for \1 %}', content)
        content = re.sub(r'<%\s*endfor\s*%>', r'{% endfor %}', content)

        # Convert __variable__ format to {{variable}}
        content = re.sub(r'__([a-zA-Z_][a-zA-Z0-9_]*)__', r'{{\1}}', content)

        return content

    def _migrate_domain_libraries(self, domain_libraries: List[DomainLibrary], target_path: Path) -> List[str]:
        """Migrate domain libraries to template format."""
        migrated_files = []

        for domain_lib in domain_libraries:
            # Create template directory for this domain
            domain_template_dir = target_path / "templates" / "libs" / "{{domain_name}}"
            domain_template_dir.mkdir(parents=True, exist_ok=True)

            # Copy and template-ize all files
            for custom_file in domain_lib.custom_files:
                relative_path = custom_file.relative_to(domain_lib.path)
                target_file = domain_template_dir / relative_path
                target_file.parent.mkdir(parents=True, exist_ok=True)

                # Read and convert content
                content = custom_file.read_text()
                templated_content = self._convert_code_to_template(content, domain_lib.name)

                # Add .j2 extension for Jinja2 templates
                target_file = target_file.with_suffix(target_file.suffix + ".j2")
                target_file.write_text(templated_content)

                migrated_files.append(f"libs/{{{{domain_name}}}}/{relative_path}.j2")

        return migrated_files

    def _convert_code_to_template(self, content: str, original_domain_name: str) -> str:
        """Convert domain code to template format."""
        # Replace specific domain name with template variable
        content = content.replace(original_domain_name, "{{domain_name}}")

        # Replace common patterns with template variables
        # Class names: UserEntity -> {{entity_name}}Entity
        content = re.sub(r'\b([A-Z][a-z]+)Entity\b', r'{{entity_name}}Entity', content)
        content = re.sub(r'\b([A-Z][a-z]+)Service\b', r'{{entity_name}}Service', content)
        content = re.sub(r'\b([A-Z][a-z]+)Repository\b', r'{{entity_name}}Repository', content)

        # File imports and references
        content = re.sub(r"from ['\"]\.\/([^'\"]+)['\"]", r"from './{{entity_name}}'", content)

        return content

    def _create_migration_documentation(self, analysis: HexDDDAnalysisResult, target_path: Path) -> None:
        """Create comprehensive migration documentation."""
        docs_dir = target_path / "docs"
        docs_dir.mkdir(exist_ok=True)

        migration_guide = f"""# Migration from HexDDD Project

## Overview

This project was migrated from a HexDDD project located at: `{self.source_path}`

## Migration Summary

- **Original Project**: {analysis.package_config.get('name', 'Unknown')}
- **Generators Converted**: {len(analysis.generators)}
- **Domain Libraries Migrated**: {len(analysis.domain_libraries)}
- **Build System**: {'Nx Workspace' if analysis.has_nx_config else 'Standard'}

## Migrated Components

### Generators
{self._format_generators_list(analysis.generators)}

### Domain Libraries
{self._format_domain_libraries_list(analysis.domain_libraries)}

## Next Steps

1. Review the generated `copier.yml` configuration
2. Test template generation with: `copier copy . /tmp/test-project`
3. Validate that all domain logic is preserved
4. Customize templates as needed for your use case

## Validation Checklist

- [ ] All original domain entities are present in templates
- [ ] Build configuration works in generated projects
- [ ] Custom business logic is preserved
- [ ] Tests can be run successfully
- [ ] All dependencies are correctly migrated

## Support

If you encounter issues with the migration, please refer to the original project structure and adapt the templates accordingly.
"""

        (target_path / "MIGRATION-GUIDE.md").write_text(migration_guide)

    def _format_generators_list(self, generators: List[GeneratorInfo]) -> str:
        """Format generators list for documentation."""
        if not generators:
            return "None found"

        lines = []
        for gen in generators:
            lines.append(f"- **{gen.name}**: {len(gen.template_files)} template files")
        return "\n".join(lines)

    def _format_domain_libraries_list(self, domain_libraries: List[DomainLibrary]) -> str:
        """Format domain libraries list for documentation."""
        if not domain_libraries:
            return "None found"

        lines = []
        for lib in domain_libraries:
            components = []
            if lib.has_entities:
                components.append("entities")
            if lib.has_value_objects:
                components.append("value objects")
            if lib.has_aggregates:
                components.append("aggregates")
            if lib.has_services:
                components.append("services")

            components_str = ", ".join(components) if components else "custom code"
            lines.append(f"- **{lib.name}**: {len(lib.custom_files)} files ({components_str})")
        return "\n".join(lines)
