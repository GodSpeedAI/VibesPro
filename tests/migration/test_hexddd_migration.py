"""Test suite for HexDDD project migration functionality."""

import json
import shutil
import tempfile
from pathlib import Path
from typing import Dict, Any
import pytest

from tools.migration.hexddd_analyzer import HexDDDAnalyzer
from tools.migration.hexddd_migrator import HexDDDMigrator


class TestHexDDDMigration:
    """Test cases for HexDDD project migration following TDD."""

    def setup_method(self):
        """Set up test fixtures."""
        self.temp_dir = Path(tempfile.mkdtemp())
        self.sample_hexddd_project = self.temp_dir / "sample-hexddd"
        self.sample_hexddd_project.mkdir()

        # Create minimal HexDDD project structure
        self._create_sample_hexddd_project()

    def teardown_method(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir)

    def _create_sample_hexddd_project(self):
        """Create a sample HexDDD project for testing."""
        # Create nx.json
        nx_config = {
            "$schema": "./node_modules/nx/schemas/nx-schema.json",
            "defaultBase": "main",
            "cli": {"packageManager": "pnpm"},
            "projects": {
                "ddd": "libs/ddd",
                "user-domain": "libs/user-domain"
            }
        }
        (self.sample_hexddd_project / "nx.json").write_text(json.dumps(nx_config, indent=2))

        # Create package.json
        package_json = {
            "name": "sample-hexddd-project",
            "version": "1.0.0",
            "dependencies": {
                "@nx/workspace": "^17.0.0"
            }
        }
        (self.sample_hexddd_project / "package.json").write_text(json.dumps(package_json, indent=2))

        # Create libs structure
        libs_dir = self.sample_hexddd_project / "libs"
        libs_dir.mkdir()

        # Create DDD library with generators
        ddd_dir = libs_dir / "ddd"
        ddd_dir.mkdir()
        generators_dir = ddd_dir / "src" / "generators"
        generators_dir.mkdir(parents=True)

        # Create domain generator
        domain_gen_dir = generators_dir / "domain"
        domain_gen_dir.mkdir()
        (domain_gen_dir / "generator.ts").write_text('''
import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import { DomainGeneratorSchema } from './schema';

export default async function (tree: Tree, options: DomainGeneratorSchema) {
  const templatePath = join(__dirname, 'files');
  generateFiles(tree, templatePath, options.directory, options);
  await formatFiles(tree);
}
''')

        # Create sample domain library
        user_domain_dir = libs_dir / "user-domain"
        user_domain_dir.mkdir()
        domain_subdir = user_domain_dir / "src" / "lib" / "domain"
        domain_subdir.mkdir(parents=True)

        (domain_subdir / "user.entity.ts").write_text('''
export class User {
  constructor(
    private readonly id: string,
    private readonly email: string
  ) {}
}
''')

    def test_hexddd_project_analysis(self):
        """Test that analyzer correctly identifies HexDDD project structure."""
        analyzer = HexDDDAnalyzer(self.sample_hexddd_project)
        analysis = analyzer.analyze()

        assert analysis.is_hexddd_project
        assert analysis.has_nx_config
        assert analysis.has_ddd_generators
        assert len(analysis.domain_libraries) > 0
        assert "user-domain" in [lib.name for lib in analysis.domain_libraries]

    def test_hexddd_migration_success(self):
        """Test successful migration of HexDDD project."""
        target_path = self.temp_dir / "migrated-project"
        migrator = HexDDDMigrator(self.sample_hexddd_project)

        result = migrator.migrate(target_path)

        assert result.success
        assert target_path.exists()
        assert (target_path / "copier.yml").exists()
        assert (target_path / "templates").exists()
        assert "nx.json" in [f.name for f in result.preserved_config]

    def test_generator_conversion(self):
        """Test that Nx generators are properly converted to Copier templates."""
        target_path = self.temp_dir / "migrated-project"
        migrator = HexDDDMigrator(self.sample_hexddd_project)

        result = migrator.migrate(target_path)

        # Check that domain generator was converted
        domain_template = target_path / "templates" / "libs" / "{{domain_name}}"
        assert domain_template.exists()

        # Check that original domain entities are preserved as templates
        entity_template = domain_template / "src" / "lib" / "domain" / "{{entity_name}}.entity.ts.j2"
        assert entity_template.exists()

    def test_migration_with_dry_run(self):
        """Test dry run mode doesn't create files."""
        target_path = self.temp_dir / "dry-run-target"
        migrator = HexDDDMigrator(self.sample_hexddd_project)

        result = migrator.migrate(target_path, dry_run=True)

        assert result.success
        assert not target_path.exists()  # No files should be created
        assert len(result.migration_plan) > 0  # But plan should be generated

    def test_migration_preserves_custom_code(self):
        """Test that custom domain implementations are preserved."""
        # Add custom code to the sample project
        custom_file = self.sample_hexddd_project / "libs" / "user-domain" / "src" / "lib" / "custom-service.ts"
        custom_file.write_text('''
export class CustomUserService {
  // Custom business logic
}
''')

        target_path = self.temp_dir / "migrated-project"
        migrator = HexDDDMigrator(self.sample_hexddd_project)

        result = migrator.migrate(target_path)

        # Check custom code is preserved in templates
        preserved_custom = target_path / "templates" / "libs" / "user-domain" / "src" / "lib" / "custom-service.ts"
        assert preserved_custom.exists()
        assert "CustomUserService" in preserved_custom.read_text()

    def test_build_config_migration(self):
        """Test that build configurations are properly migrated."""
        target_path = self.temp_dir / "migrated-project"
        migrator = HexDDDMigrator(self.sample_hexddd_project)

        result = migrator.migrate(target_path)

        # Check that nx.json is preserved but adapted
        migrated_nx = target_path / "nx.json"
        assert migrated_nx.exists()

        nx_content = json.loads(migrated_nx.read_text())
        assert "projects" in nx_content  # Should preserve project structure
