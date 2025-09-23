"""HexDDD Project Analyzer - Scans existing HexDDD projects for migration."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Dict, Any


@dataclass
class DomainLibrary:
    """Represents a domain library in a HexDDD project."""
    name: str
    path: Path
    has_entities: bool
    has_value_objects: bool
    has_aggregates: bool
    has_services: bool
    custom_files: List[Path]


@dataclass
class GeneratorInfo:
    """Information about an Nx generator in the project."""
    name: str
    path: Path
    schema_path: Optional[Path]
    template_files: List[Path]
    generator_file: Path


@dataclass
class HexDDDAnalysisResult:
    """Result of analyzing a HexDDD project."""
    is_hexddd_project: bool
    project_root: Path
    has_nx_config: bool
    has_ddd_generators: bool
    domain_libraries: List[DomainLibrary]
    generators: List[GeneratorInfo]
    build_config: Dict[str, Any]
    package_config: Dict[str, Any]
    migration_plan: List[str]


class HexDDDAnalyzer:
    """Analyzes existing HexDDD projects to prepare for migration."""

    def __init__(self, project_path: Path):
        """Initialize analyzer with project path."""
        self.project_path = Path(project_path).resolve()

    def analyze(self) -> HexDDDAnalysisResult:
        """Perform comprehensive analysis of the HexDDD project."""
        if not self.project_path.exists():
            raise ValueError(f"Project path does not exist: {self.project_path}")

        # Check if this is a HexDDD project
        is_hexddd = self._is_hexddd_project()

        # Analyze components
        nx_config = self._analyze_nx_config()
        package_config = self._analyze_package_config()
        generators = self._find_generators()
        domain_libraries = self._find_domain_libraries()
        migration_plan = self._create_migration_plan(generators, domain_libraries)

        return HexDDDAnalysisResult(
            is_hexddd_project=is_hexddd,
            project_root=self.project_path,
            has_nx_config=nx_config is not None,
            has_ddd_generators=len(generators) > 0,
            domain_libraries=domain_libraries,
            generators=generators,
            build_config=nx_config or {},
            package_config=package_config or {},
            migration_plan=migration_plan
        )

    def _is_hexddd_project(self) -> bool:
        """Determine if this is a HexDDD project."""
        # Check for key indicators
        nx_json = self.project_path / "nx.json"
        package_json = self.project_path / "package.json"
        libs_dir = self.project_path / "libs"

        if not (nx_json.exists() and package_json.exists() and libs_dir.exists()):
            return False

        # Check for DDD-specific patterns
        ddd_lib = libs_dir / "ddd"
        if ddd_lib.exists():
            return True

        # Check for domain libraries
        for lib_dir in libs_dir.iterdir():
            if lib_dir.is_dir() and self._is_domain_library(lib_dir):
                return True

        return False

    def _analyze_nx_config(self) -> Optional[Dict[str, Any]]:
        """Analyze nx.json configuration."""
        nx_json_path = self.project_path / "nx.json"
        if not nx_json_path.exists():
            return None

        try:
            with open(nx_json_path, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return None

    def _analyze_package_config(self) -> Optional[Dict[str, Any]]:
        """Analyze package.json configuration."""
        package_json_path = self.project_path / "package.json"
        if not package_json_path.exists():
            return None

        try:
            with open(package_json_path, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return None

    def _find_generators(self) -> List[GeneratorInfo]:
        """Find all Nx generators in the project."""
        generators = []

        # Look for generators in libs/ddd/src/generators
        ddd_generators_path = self.project_path / "libs" / "ddd" / "src" / "generators"
        if ddd_generators_path.exists():
            generators.extend(self._scan_generators_directory(ddd_generators_path))

        # Look for generators in other common locations
        tools_generators = self.project_path / "tools" / "generators"
        if tools_generators.exists():
            generators.extend(self._scan_generators_directory(tools_generators))

        return generators

    def _scan_generators_directory(self, generators_dir: Path) -> List[GeneratorInfo]:
        """Scan a directory for Nx generators."""
        generators = []

        for gen_dir in generators_dir.iterdir():
            if not gen_dir.is_dir():
                continue

            generator_file = gen_dir / "generator.ts"
            if not generator_file.exists():
                continue

            # Find schema file
            schema_file = gen_dir / "schema.json"
            if not schema_file.exists():
                schema_file = None

            # Find template files
            template_files = []
            files_dir = gen_dir / "files"
            if files_dir.exists():
                template_files = list(files_dir.rglob("*"))

            generators.append(GeneratorInfo(
                name=gen_dir.name,
                path=gen_dir,
                schema_path=schema_file,
                template_files=template_files,
                generator_file=generator_file
            ))

        return generators

    def _find_domain_libraries(self) -> List[DomainLibrary]:
        """Find all domain libraries in the project."""
        domain_libraries = []
        libs_dir = self.project_path / "libs"

        if not libs_dir.exists():
            return domain_libraries

        for lib_dir in libs_dir.iterdir():
            if not lib_dir.is_dir():
                continue

            if self._is_domain_library(lib_dir):
                domain_lib = self._analyze_domain_library(lib_dir)
                domain_libraries.append(domain_lib)

        return domain_libraries

    def _is_domain_library(self, lib_dir: Path) -> bool:
        """Check if a library directory is a domain library."""
        # Check for domain-specific structure
        domain_dir = lib_dir / "src" / "lib" / "domain"
        if domain_dir.exists():
            return True

        # Check for DDD patterns in file names
        src_dir = lib_dir / "src"
        if src_dir.exists():
            for file_path in src_dir.rglob("*.ts"):
                if any(pattern in file_path.name.lower() for pattern in
                       ['entity', 'aggregate', 'value-object', 'domain-service']):
                    return True

        return False

    def _analyze_domain_library(self, lib_dir: Path) -> DomainLibrary:
        """Analyze a domain library for its components."""
        name = lib_dir.name

        # Scan for domain components
        src_dir = lib_dir / "src"
        has_entities = False
        has_value_objects = False
        has_aggregates = False
        has_services = False
        custom_files = []

        if src_dir.exists():
            for file_path in src_dir.rglob("*.ts"):
                file_name = file_path.name.lower()

                if 'entity' in file_name:
                    has_entities = True
                elif 'value-object' in file_name or 'value_object' in file_name:
                    has_value_objects = True
                elif 'aggregate' in file_name:
                    has_aggregates = True
                elif 'service' in file_name:
                    has_services = True

                # Collect all TypeScript files as potential custom code
                custom_files.append(file_path)

        return DomainLibrary(
            name=name,
            path=lib_dir,
            has_entities=has_entities,
            has_value_objects=has_value_objects,
            has_aggregates=has_aggregates,
            has_services=has_services,
            custom_files=custom_files
        )

    def _create_migration_plan(self, generators: List[GeneratorInfo],
                             domain_libraries: List[DomainLibrary]) -> List[str]:
        """Create a step-by-step migration plan."""
        plan = []

        plan.append("1. Create Copier template structure")
        plan.append("2. Convert nx.json to template configuration")
        plan.append("3. Migrate package.json dependencies")

        if generators:
            plan.append(f"4. Convert {len(generators)} Nx generators to Copier templates:")
            for gen in generators:
                plan.append(f"   - {gen.name} generator -> templates/{gen.name}/")

        if domain_libraries:
            plan.append(f"5. Migrate {len(domain_libraries)} domain libraries:")
            for lib in domain_libraries:
                plan.append(f"   - {lib.name} -> templates/libs/{{{{domain_name}}}}/")

        plan.append("6. Create migration documentation")
        plan.append("7. Validate migrated project structure")

        return plan
