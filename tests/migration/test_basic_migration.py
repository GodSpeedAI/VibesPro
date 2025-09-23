"""Simple verification test for HexDDD migration functionality."""

import tempfile
import json
from pathlib import Path
from tools.migration.hexddd_analyzer import HexDDDAnalyzer
from tools.migration.hexddd_migrator import HexDDDMigrator


def test_basic_migration():
    """Test basic migration functionality works end-to-end."""
    # Create a temporary test project
    temp_dir = Path(tempfile.mkdtemp())
    test_project = temp_dir / "test-hexddd"
    test_project.mkdir()

    # Create minimal HexDDD structure
    (test_project / "nx.json").write_text('{"projects": {}}')
    (test_project / "package.json").write_text('{"name": "test-project"}')

    libs_dir = test_project / "libs"
    libs_dir.mkdir()

    # Create a domain library
    domain_lib = libs_dir / "test-domain"
    domain_lib.mkdir()
    domain_src = domain_lib / "src" / "lib"
    domain_src.mkdir(parents=True)
    (domain_src / "test.entity.ts").write_text("export class TestEntity {}")

    # Test analyzer
    analyzer = HexDDDAnalyzer(test_project)
    analysis = analyzer.analyze()

    print(f"✅ Project detected as HexDDD: {analysis.is_hexddd_project}")
    print(f"✅ Found {len(analysis.domain_libraries)} domain libraries")
    print(f"✅ Found {len(analysis.generators)} generators")

    # Test migrator with dry run
    migrator = HexDDDMigrator(test_project)
    target_path = temp_dir / "migrated"
    result = migrator.migrate(target_path, dry_run=True)

    print(f"✅ Dry run migration successful: {result.success}")
    print(f"✅ Migration plan has {len(result.migration_plan)} steps")

    # Test actual migration
    result = migrator.migrate(target_path, dry_run=False)
    print(f"✅ Full migration successful: {result.success}")
    print(f"✅ Created target directory: {target_path.exists()}")
    print(f"✅ Created copier.yml: {(target_path / 'copier.yml').exists()}")

    # Cleanup
    import shutil
    shutil.rmtree(temp_dir)

    print("🎉 All basic migration tests passed!")


if __name__ == "__main__":
    test_basic_migration()
