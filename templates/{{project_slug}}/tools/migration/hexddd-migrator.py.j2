"""HexDDD Project Migrator - Converts HexDDD projects to the merged platform."""

from __future__ import annotations

import json
import logging
import subprocess
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Any, Optional
import re
import yaml

from tools.migration.hexddd_analyzer import HexDDDAnalyzer, HexDDDAnalysisResult, GeneratorInfo, DomainLibrary

# Configure logger for migration operations
logger = logging.getLogger(__name__)


@dataclass
class MigrationResult:
    """Result of a HexDDD project migration."""
    success: bool
    target_path: Path
    migrated_files: List[str]
    preserved_config: List[str]
    migration_plan: List[str]
    errors: List[str]
    warnings: List[str] = field(default_factory=list)


class HexDDDMigrator:
    """Migrates HexDDD projects to the unified generator-first platform."""

    def __init__(self, source_path: Path):
        """Initialize migrator with source project path."""
        self.source_path = Path(source_path).resolve()
        self.analyzer = HexDDDAnalyzer(self.source_path)

        # Check if TypeScript parser is available
        self.ts_parser_path = Path(__file__).parent / "ts-generator-parser.mjs"
        self.has_ts_parser = self.ts_parser_path.exists()
        if self.has_ts_parser:
            logger.info("TypeScript parser available for enhanced generator analysis")
        else:
            logger.warning("TypeScript parser not found, using regex-based analysis")

    def _parse_typescript_with_ast(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Parse TypeScript file using ts-morph AST parser."""
        if not self.has_ts_parser:
            return None

        try:
            result = subprocess.run(
                ['node', str(self.ts_parser_path), str(file_path)],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                return json.loads(result.stdout)
            else:
                logger.warning(f"TypeScript parser failed for {file_path}: {result.stderr}")
                return None

        except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception) as e:
            logger.warning(f"Error using TypeScript parser for {file_path}: {e}")
            return None

    def migrate(self, target_path: Path, dry_run: bool = False) -> MigrationResult:
        """Perform the migration from HexDDD to merged platform format."""
        target_path = Path(target_path).resolve()
        errors = []
        warnings = []
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
                    errors=["Source project is not a valid HexDDD project"],
                    warnings=[]
                )

            if dry_run:
                return MigrationResult(
                    success=True,
                    target_path=target_path,
                    migrated_files=[],
                    preserved_config=[],
                    migration_plan=analysis.migration_plan,
                    errors=[],
                    warnings=[]
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
            generator_result = self._convert_generators(analysis.generators, target_path)
            migrated_files.extend(generator_result["files"])
            warnings.extend(generator_result["warnings"])

            # Migrate domain libraries to templates
            domain_result = self._migrate_domain_libraries(analysis.domain_libraries, target_path)
            migrated_files.extend(domain_result["files"])
            warnings.extend(domain_result["warnings"])

            # Create migration documentation
            self._create_migration_documentation(analysis, target_path)
            migrated_files.append("MIGRATION-GUIDE.md")

            return MigrationResult(
                success=True,
                target_path=target_path,
                migrated_files=migrated_files,
                preserved_config=preserved_config,
                migration_plan=analysis.migration_plan,
                errors=errors,
                warnings=warnings
            )

        except Exception as e:
            logger.exception("Migration failed with unexpected error")
            errors.append(f"Migration failed: {str(e)}")
            return MigrationResult(
                success=False,
                target_path=target_path,
                migrated_files=migrated_files,
                preserved_config=preserved_config,
                migration_plan=[],
                errors=errors,
                warnings=warnings
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

    def _convert_generators(self, generators: List[GeneratorInfo], target_path: Path) -> Dict[str, List[str]]:
        """Convert Nx generators to Copier templates."""
        migrated_files = []
        warnings = []

        for generator in generators:
            template_dir = target_path / "templates" / "generators" / generator.name
            template_dir.mkdir(parents=True, exist_ok=True)

            # Copy generator files and convert to templates
            if generator.generator_file.exists():
                try:
                    self._convert_generator_file(generator, template_dir)
                    migrated_files.append(f"generators/{generator.name}/generator.py")
                    logger.info(f"Successfully converted generator: {generator.name}")
                except Exception as e:
                    logger.warning(f"Failed to convert generator {generator.name}: {str(e)}")
                    warnings.append(f"Generator {generator.name}: Conversion failed - {str(e)}. Manual review required.")

            # Convert template files
            if generator.template_files:
                files_dir = template_dir / "files"
                files_dir.mkdir(exist_ok=True)

                for template_file in generator.template_files:
                    if template_file.is_file():
                        try:
                            relative_path = template_file.relative_to(generator.path / "files")
                            target_file = files_dir / relative_path
                            target_file.parent.mkdir(parents=True, exist_ok=True)

                            # Convert template syntax from Nx to Copier
                            content = template_file.read_text()
                            converted_content = self._convert_template_syntax(content)
                            target_file.write_text(converted_content)

                            migrated_files.append(f"generators/{generator.name}/files/{relative_path}")
                            logger.debug(f"Converted template file: {relative_path}")
                        except Exception as e:
                            logger.warning(f"Failed to convert template file {template_file}: {str(e)}")
                            warnings.append(f"Template file {template_file}: Conversion failed - {str(e)}. Manual review required.")

        return {"files": migrated_files, "warnings": warnings}

    def _convert_generator_file(self, generator: GeneratorInfo, template_dir: Path) -> None:
        """Convert a TypeScript generator to Python."""
        try:
            # Read the original generator
            original_content = generator.generator_file.read_text()
            logger.debug(f"Converting generator file: {generator.generator_file}")

            # Try TypeScript parser first, fallback to regex
            ts_analysis = self._parse_typescript_with_ast(generator.generator_file)
            if ts_analysis and not ts_analysis.get('errors'):
                logger.info(f"Using TypeScript AST analysis for {generator.name}")
                self._convert_generator_with_ast(generator, template_dir, ts_analysis)
                return
            else:
                if ts_analysis and ts_analysis.get('errors'):
                    logger.warning(f"TypeScript parser had errors for {generator.name}: {ts_analysis['errors']}")
                logger.info(f"Using regex-based analysis for {generator.name}")

            # Try to extract basic artifacts from TypeScript generator to create a
            # minimal equivalent Python generator. This is not a full AST-based
            # transpilation but provides a useful starting point.

            # 1) Find exported functions/classes
            try:
                exported_funcs = re.findall(r'export\s+function\s+(\w+)\s*\(([^)]*)\)', original_content)
                funcs = exported_funcs or re.findall(r'function\s+(\w+)\s*\(([^)]*)\)', original_content)
                logger.debug(f"Found {len(funcs)} functions in generator")
            except Exception as e:
                logger.warning(f"Failed to parse functions from {generator.name}: {e}")
                funcs = []

            # 2) Find write operations (fs.writeFileSync / writeFileSync)
            try:
                write_ops = re.findall(r'(?:fs\.|)writeFileSync\(\s*([^,\)]+)\s*,\s*([^,\)]+)\s*\)', original_content)
                logger.debug(f"Found {len(write_ops)} write operations in generator")
            except Exception as e:
                logger.warning(f"Failed to parse write operations from {generator.name}: {e}")
                write_ops = []

            # 3) Find template literal blocks (backticks)
            try:
                template_literals = re.findall(r'`([^`]*)`', original_content, flags=re.DOTALL)
                logger.debug(f"Found {len(template_literals)} template literals in generator")
            except Exception as e:
                logger.warning(f"Failed to parse template literals from {generator.name}: {e}")
                template_literals = []

            # Helper to normalize TypeScript template strings to Python str.format
            def _ts_template_to_py(s: str) -> str:
                try:
                    # Replace ${expr} with {expr}
                    return re.sub(r'\$\{([^}]+)\}', r'{\1}', s)
                except Exception as e:
                    logger.warning(f"Failed to convert TS template string: {e}")
                    return s

            py_lines = []
            py_lines.append(f'"""Generated from {generator.name} Nx generator."""')
            py_lines.append('import re')
            py_lines.append('import os')
            py_lines.append('from pathlib import Path')
            py_lines.append('from typing import Dict, Any')
            py_lines.append('')
            py_lines.append('')
            py_lines.append('def _render_template(tpl: str, context: Dict[str, Any]) -> str:')
            py_lines.append("    # Convert simple TS template placeholders ${x} to Python format {x}")
            py_lines.append("    tpl_py = re.sub(r'\\$\\{([^}]+)\\}', r'{\\1}', tpl)")
            py_lines.append("    try:")
            py_lines.append("        return tpl_py.format(**context)")
            py_lines.append("    except Exception:")
            py_lines.append("        # Fallback: return the raw converted template")
            py_lines.append("        return tpl_py")
            py_lines.append('')

            py_lines.append('def generate(context: Dict[str, Any], output_dir: Path) -> None:')
            py_lines.append('    """Generate files based on the approximated logic from the original TypeScript generator."""')
            py_lines.append("    output_dir = Path(output_dir)")
            py_lines.append("    output_dir.mkdir(parents=True, exist_ok=True)")
            py_lines.append("    print(f'Generating {generator.name} with context: {context}')")

            if funcs:
                py_lines.append('    # Detected functions in original generator:')
                for fn, params in funcs:
                    py_lines.append(f"    # - {fn}({params})")

            if write_ops:
                py_lines.append('    # Detected write operations - attempting to reproduce file writes')
                for idx, (fname_expr, content_expr) in enumerate(write_ops):
                    try:
                        # Normalize expressions (strip quotes/backticks)
                        fname = fname_expr.strip()
                        content_expr_str = content_expr.strip()

                        # Attempt to extract literal filename
                        if (fname.startswith('`') and fname.endswith('`')) or (fname.startswith("'") and fname.endswith("'") ) or (fname.startswith('"') and fname.endswith('"')):
                            fname_raw = fname[1:-1]
                            fname_py = _ts_template_to_py(fname_raw)
                            py_lines.append(f"    # write op {idx}: literal filename detected -> {fname_raw}")
                            py_lines.append(f"    filename_{idx} = output_dir / f\"{fname_py}\"")
                        else:
                            # Non-literal, fallback to named file using generator name
                            py_lines.append(f"    # write op {idx}: non-literal filename expression '{fname}' - using fallback name")
                            py_lines.append(f"    filename_{idx} = output_dir / '{generator.name}_file_{idx}.txt'")

                        # Attempt to extract literal content from backtick or quotes
                        if (content_expr_str.startswith('`') and content_expr_str.endswith('`')) or (content_expr_str.startswith("'") and content_expr_str.endswith("'")) or (content_expr_str.startswith('"') and content_expr_str.endswith('"')):
                            content_raw = content_expr_str[1:-1]
                            content_py = _ts_template_to_py(content_raw)
                            # Convert template syntax using existing helper in migrator if possible
                            try:
                                converted = self._convert_template_syntax(content_py)
                            except Exception as conv_e:
                                logger.warning(f"Failed to convert template syntax: {conv_e}")
                                converted = content_py
                            py_lines.append(f"    content_{idx} = _render_template(r'''{converted}''', context)")
                            py_lines.append(f"    filename_{idx}.parent.mkdir(parents=True, exist_ok=True)")
                            py_lines.append(f"    filename_{idx}.write_text(content_{idx})")
                        else:
                            py_lines.append(f"    # write op {idx}: dynamic content expression '{content_expr_str}' - writing placeholder")
                            py_lines.append(f"    filename_{idx}.parent.mkdir(parents=True, exist_ok=True)")
                            py_lines.append(f"    filename_{idx}.write_text('/* dynamic content from original generator - review manually */')")
                    except Exception as write_e:
                        logger.warning(f"Failed to process write operation {idx} in {generator.name}: {write_e}")
                        py_lines.append(f"    # write op {idx}: failed to parse - {str(write_e)}")

            elif template_literals:
                py_lines.append('    # No explicit writeFileSync calls found, but template literals exist - create sample files')
                for idx, tpl in enumerate(template_literals):
                    try:
                        tpl_conv = _ts_template_to_py(tpl)
                        try:
                            tpl_conv = self._convert_template_syntax(tpl_conv)
                        except Exception:
                            pass
                        py_lines.append(f"    sample_{idx} = output_dir / '{generator.name}_sample_{idx}.txt'")
                        py_lines.append("    sample_{0}.parent.mkdir(parents=True, exist_ok=True)".format(idx))
                        py_lines.append(f"    sample_{idx}.write_text(_render_template(r'''{tpl_conv}''', context))")
                    except Exception as tpl_e:
                        logger.warning(f"Failed to process template literal {idx} in {generator.name}: {tpl_e}")
                        py_lines.append(f"    # template literal {idx}: failed to parse - {str(tpl_e)}")

            else:
                py_lines.append("    # No file writes or templates detected - generator requires manual migration")
                py_lines.append("    print('No automatic file generation detected in original generator; please migrate logic manually.')")

            python_content = '\n'.join(py_lines) + '\n'

            generator_py = template_dir / 'generator.py'
            generator_py.write_text(python_content)
            logger.info(f"Successfully generated Python equivalent for {generator.name}")

        except Exception as e:
            logger.error(f"Failed to convert generator file {generator.generator_file}: {e}")
            # Create a basic fallback generator
            fallback_content = f'''"""Fallback generator for {generator.name} - conversion failed."""

import os
from pathlib import Path
from typing import Dict, Any


def generate(context: Dict[str, Any], output_dir: Path) -> None:
    """Fallback generator - original conversion failed."""
    print(f"Fallback generator for {generator.name}")
    print("Original TypeScript generator conversion failed.")
    print("Please manually review and implement generator logic.")

    # Original generator file: {generator.generator_file}
    # Error during conversion: {str(e)}
'''
            generator_py = template_dir / 'generator.py'
            generator_py.write_text(fallback_content)
            raise  # Re-raise to be caught by caller for warning generation

    def _convert_generator_with_ast(self, generator: GeneratorInfo, template_dir: Path, ts_analysis: Dict[str, Any]) -> None:
        """Convert a TypeScript generator using AST analysis results."""
        try:
            logger.debug(f"Converting generator {generator.name} using AST analysis")

            py_lines = []
            py_lines.append(f'"""Generated from {generator.name} Nx generator using AST analysis."""')
            py_lines.append('import re')
            py_lines.append('import os')
            py_lines.append('from pathlib import Path')
            py_lines.append('from typing import Dict, Any')
            py_lines.append('')

            # Add imports section
            if ts_analysis.get('imports'):
                py_lines.append('# Original TypeScript imports:')
                for imp in ts_analysis['imports']:
                    py_lines.append(f"# from {imp['module']}: {', '.join(imp['imports'])}")
                py_lines.append('')

            # Add template rendering helper
            py_lines.append('def _render_template(tpl: str, context: Dict[str, Any]) -> str:')
            py_lines.append('    """Convert TypeScript template placeholders to Python format."""')
            py_lines.append("    tpl_py = re.sub(r'\\$\\{([^}]+)\\}', r'{\\1}', tpl)")
            py_lines.append("    try:")
            py_lines.append("        return tpl_py.format(**context)")
            py_lines.append("    except Exception:")
            py_lines.append("        return tpl_py")
            py_lines.append('')

            # Add main generator function
            py_lines.append('def generate(context: Dict[str, Any], output_dir: Path) -> None:')
            py_lines.append('    """Main generator function."""')
            py_lines.append("    output_dir = Path(output_dir)")
            py_lines.append("    output_dir.mkdir(parents=True, exist_ok=True)")

            # Add functions section
            if ts_analysis.get('functions'):
                py_lines.append('    # Original TypeScript functions:')
                for func in ts_analysis['functions']:
                    py_lines.append(f"    # - {func['name']}({', '.join(func['parameters'])})")
                py_lines.append('')

            # Add write operations
            if ts_analysis.get('writeOperations'):
                py_lines.append('    # Detected write operations:')
                for idx, op in enumerate(ts_analysis['writeOperations']):
                    py_lines.append(f"    # Operation {idx}: {op['type']} -> {op['filenameExpression']}")

                    # Generate Python code for the write operation
                    if op.get('isLiteral') and op.get('literalContent'):
                        # Use literal content
                        content = op['literalContent']
                        try:
                            converted = self._convert_template_syntax(content)
                        except Exception as e:
                            logger.warning(f"Template conversion failed: {e}")
                            converted = content

                        py_lines.append(f"    content_{idx} = _render_template(r'''{converted}''', context)")
                        py_lines.append(f"    filename_{idx} = output_dir / f\"{generator.name}_file_{idx}\"")
                        py_lines.append(f"    filename_{idx}.parent.mkdir(parents=True, exist_ok=True)")
                        py_lines.append(f"    filename_{idx}.write_text(content_{idx})")
                    else:
                        # Non-literal, create placeholder
                        py_lines.append(f"    # TODO: Handle dynamic content for operation {idx}")
                        py_lines.append(f"    # Filename: {op['filenameExpression']}")
                        py_lines.append(f"    # Content: {op['contentExpression']}")
                py_lines.append('')

            # Add template literals section
            if ts_analysis.get('templateLiterals'):
                py_lines.append('    # Template literals found in original:')
                for idx, literal in enumerate(ts_analysis['templateLiterals'][:3]):  # Limit to first 3
                    preview = literal[:50] + '...' if len(literal) > 50 else literal
                    py_lines.append(f"    # {idx}: {preview}")
                py_lines.append('')

            # Add any warnings from analysis
            if ts_analysis.get('warnings'):
                py_lines.append('    # Analysis warnings:')
                for warning in ts_analysis['warnings']:
                    py_lines.append(f"    # WARNING: {warning}")
                py_lines.append('')

            python_content = '\n'.join(py_lines) + '\n'
            generator_py = template_dir / 'generator.py'
            generator_py.write_text(python_content)
            logger.info(f"Successfully generated AST-based Python equivalent for {generator.name}")

        except Exception as e:
            logger.error(f"AST-based conversion failed for {generator.name}: {e}")
            # Fall back to basic generator
            fallback_content = f'''"""AST conversion failed for {generator.name}."""
def generate(context, output_dir):
    print(f"Generator {generator.name} needs manual implementation")
    print(f"AST analysis error: {e}")
'''
            generator_py = template_dir / 'generator.py'
            generator_py.write_text(fallback_content)

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

    def _migrate_domain_libraries(self, domain_libraries: List[DomainLibrary], target_path: Path) -> Dict[str, List[str]]:
        """Migrate domain libraries to template format."""
        migrated_files = []
        warnings = []

        for domain_lib in domain_libraries:
            try:
                # Create template directory for this domain
                domain_template_dir = target_path / "templates" / "libs" / "{{domain_name}}"
                domain_template_dir.mkdir(parents=True, exist_ok=True)

                # Copy and template-ize all files
                for custom_file in domain_lib.custom_files:
                    try:
                        relative_path = custom_file.relative_to(domain_lib.path)
                        target_file = domain_template_dir / relative_path
                        target_file.parent.mkdir(parents=True, exist_ok=True)

                        # Read and convert content
                        content = custom_file.read_text()
                        templated_content = self._convert_code_to_template(content, domain_lib.name)

                        # Add .j2 extension for Jinja2 templates
                        target_file = target_file.with_suffix(f"{target_file.suffix}.j2")
                        target_file.write_text(templated_content)

                        migrated_files.append(f"libs/{{{{domain_name}}}}/{relative_path}.j2")
                        logger.debug(f"Converted domain file: {relative_path}")
                    except Exception as e:
                        logger.warning(f"Failed to convert domain file {custom_file}: {str(e)}")
                        warnings.append(f"Domain file {custom_file}: Conversion failed - {str(e)}. Manual review required.")

                logger.info(f"Successfully migrated domain library: {domain_lib.name}")
            except Exception as e:
                logger.warning(f"Failed to migrate domain library {domain_lib.name}: {str(e)}")
                warnings.append(f"Domain library {domain_lib.name}: Migration failed - {str(e)}. Manual review required.")

        return {"files": migrated_files, "warnings": warnings}

    def _convert_code_to_template(self, content: str, original_domain_name: str) -> str:
        """Convert domain code to template format."""
        original_content = content  # Store original for counting replacements

        try:
            # Replace specific domain name with template variable
            content = content.replace(original_domain_name, "{{domain_name}}")
            logger.debug(f"Replaced domain name '{original_domain_name}' with template variable")
        except Exception as e:
            logger.warning(f"Failed to replace domain name: {e}")

        try:
            # Replace common patterns with template variables
            # Class names: UserEntity -> {{entity_name}}Entity (allow multi-part names)
            content = re.sub(r'\b([A-Z][a-zA-Z]+)Entity\b', r'{{entity_name}}Entity', content)
            entity_replacements = len(re.findall(r'\b([A-Z][a-zA-Z]+)Entity\b', original_content))
            if entity_replacements > 0:
                logger.debug(f"Replaced {entity_replacements} entity class names")
        except Exception as e:
            logger.warning(f"Failed to replace entity class names: {e}")

        try:
            content = re.sub(r'\b([A-Z][a-zA-Z]+)Service\b', r'{{entity_name}}Service', content)
            service_replacements = len(re.findall(r'\b([A-Z][a-zA-Z]+)Service\b', original_content))
            if service_replacements > 0:
                logger.debug(f"Replaced {service_replacements} service class names")
        except Exception as e:
            logger.warning(f"Failed to replace service class names: {e}")

        try:
            content = re.sub(r'\b([A-Z][a-zA-Z]+)Repository\b', r'{{entity_name}}Repository', content)
            repo_replacements = len(re.findall(r'\b([A-Z][a-zA-Z]+)Repository\b', original_content))
            if repo_replacements > 0:
                logger.debug(f"Replaced {repo_replacements} repository class names")
        except Exception as e:
            logger.warning(f"Failed to replace repository class names: {e}")

        try:
            # File imports and references - only template imports that likely reference the entity
            original_imports = re.findall(r"from ['\"]\.\/(.*(?:entity|service|repository)[^'\"]*)['\"]", content, flags=re.IGNORECASE)
            content = re.sub(r"from ['\"]\.\/(.*(?:entity|service|repository)[^'\"]*)['\"]", r"from './{{entity_name}}'", content, flags=re.IGNORECASE)
            if original_imports:
                logger.debug(f"Replaced {len(original_imports)} entity-related import paths")
        except Exception as e:
            logger.warning(f"Failed to replace import paths: {e}")

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

        lines = [
            f"- **{gen.name}**: {len(gen.template_files)} template files"
            for gen in generators
        ]
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
