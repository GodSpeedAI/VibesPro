#!/usr/bin/env python3
"""
Temporal Database Initialization Script

This script initializes the temporal database for VibesPro projects,
setting up the necessary tables and initial data.
"""

import argparse
import asyncio
import sys
from datetime import datetime
from pathlib import Path

# Add the temporal_db module to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "temporal_db"))

from python.repository import initialize_temporal_database  # noqa: E402
from python.types import (  # noqa: E402
    ArchitecturalPattern,
    PatternType,
    SpecificationRecord,
    SpecificationType,
)


async def init_database(db_path: str, project_name: str) -> None:
    """Initialize the temporal database with project-specific data."""
    print(f"🔗 Initializing temporal database at: {db_path}")

    try:
        # Initialize the database
        repo = await initialize_temporal_database(db_path)

        # Create initial project specification
        project_spec = SpecificationRecord.create(
            spec_type=SpecificationType.ADR,
            identifier="ADR-PROJECT-001",
            title="Project Architecture Foundation",
            content=f"""# Project Architecture Foundation

This document establishes the architectural foundation for the {project_name} project.

## Decision

We adopt a hexagonal architecture (ports and adapters) pattern combined with Domain-Driven Design (DDD) principles to ensure:

1. **Separation of Concerns**: Clear boundaries between business logic and infrastructure
2. **Testability**: Easy unit testing of business logic without external dependencies
3. **Flexibility**: Ability to swap implementations without affecting core business logic
4. **Maintainability**: Organized code structure that scales with team size

## Architecture Layers

### Domain Layer
- **Entities**: Core business objects with identity
- **Value Objects**: Immutable data structures
- **Domain Events**: Business-significant occurrences
- **Domain Services**: Complex business operations

### Application Layer
- **Use Cases**: Application-specific business flows
- **Ports**: Interfaces for external dependencies
- **Application Services**: Orchestration and coordination
- **DTOs**: Data transfer objects for boundaries

### Infrastructure Layer
- **Adapters**: Implementations of ports
- **Repositories**: Data persistence abstractions
- **External Services**: Third-party integrations
- **Framework Code**: Web frameworks, databases, etc.

### Interface Layer
- **Controllers**: Web API endpoints
- **Views**: User interface components
- **CLI Commands**: Command-line interfaces
- **Event Handlers**: External event processing

## Status

Accepted

## Consequences

- All new code must follow hexagonal architecture principles
- Business logic must be testable in isolation
- Infrastructure concerns must be abstracted behind ports
- Code organization follows DDD bounded context patterns
""",
            author="VibesPro Generator",
        )

        await repo.store_specification(project_spec)

        # Add some common architectural patterns
        patterns = [
            ArchitecturalPattern.create(
                pattern_name="Repository Pattern",
                pattern_type=PatternType.DOMAIN,
                pattern_definition={
                    "description": "Encapsulates data access logic and provides a uniform interface for accessing data",
                    "implementation": "Define repository interface in domain layer, implement in infrastructure layer",
                    "benefits": ["Testability", "Flexibility", "Separation of concerns"],
                    "example_code": {
                        "interface": "interface UserRepository { findById(id: string): Promise<User | null> }",
                        "implementation": "class SqlUserRepository implements UserRepository { ... }"
                    }
                }
            ),
            ArchitecturalPattern.create(
                pattern_name="Use Case Pattern",
                pattern_type=PatternType.APPLICATION,
                pattern_definition={
                    "description": "Encapsulates application-specific business logic and orchestrates domain objects",
                    "implementation": "Create one use case class per business operation",
                    "benefits": ["Single responsibility", "Clear business intent", "Easy testing"],
                    "example_code": {
                        "class": "class CreateUserUseCase { execute(command: CreateUserCommand): Promise<User> }"
                    }
                }
            ),
            ArchitecturalPattern.create(
                pattern_name="Event Sourcing",
                pattern_type=PatternType.INFRASTRUCTURE,
                pattern_definition={
                    "description": "Store domain events as the source of truth for application state",
                    "implementation": "Emit domain events, store in event store, build read models from events",
                    "benefits": ["Audit trail", "Temporal queries", "Event replay"],
                    "considerations": ["Complexity", "Eventual consistency", "Event versioning"]
                }
            ),
        ]

        for pattern in patterns:
            await repo.store_architectural_pattern(pattern)

        # Record initial decisions
        await repo.record_decision(
            spec_id="ADR-PROJECT-001",
            decision_point="architecture_style",
            selected_option="hexagonal_architecture",
            context="Need for testable, maintainable architecture",
            author="VibesPro Generator",
            confidence=0.9
        )

        await repo.record_decision(
            spec_id="ADR-PROJECT-001",
            decision_point="design_methodology",
            selected_option="domain_driven_design",
            context="Complex business domain requires structured approach",
            author="VibesPro Generator",
            confidence=0.85
        )

        await repo.close()

        print("✅ Temporal database initialized successfully")
        print("   📊 Created 1 specification")
        print(f"   🏗️  Added {len(patterns)} architectural patterns")
        print("   🎯 Recorded 2 initial decisions")

    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        sys.exit(1)


async def status_database(db_path: str) -> None:
    """Show status of the temporal database."""
    print(f"📊 Checking temporal database status: {db_path}")

    try:
        repo = await initialize_temporal_database(db_path)

        # Get some basic statistics
        patterns = await repo.get_similar_patterns("", 0.0, 365)
        decision_patterns = await repo.analyze_decision_patterns(365)

        await repo.close()

        print("✅ Database connection successful")
        print(f"   🏗️  Architectural patterns: {len(patterns)}")
        print(f"   🎯 Decision patterns: {len(decision_patterns)}")

        if patterns:
            print("\n   📋 Recent patterns:")
            for pattern in patterns[:3]:
                print(f"      • {pattern.pattern_name} ({pattern.pattern_type.value})")

        if decision_patterns:
            print("\n   📋 Recent decisions:")
            for decision in decision_patterns[:3]:
                print(f"      • {decision.get('decision_point', 'Unknown')}: {decision.get('total_decisions', 0)} decisions")

    except Exception as e:
        print(f"❌ Database status check failed: {e}")
        sys.exit(1)


async def backup_database(db_path: str, backup_path: str) -> None:
    """Create a backup of the temporal database."""
    print(f"💾 Creating backup: {db_path} → {backup_path}")

    try:
        import shutil
        shutil.copy2(db_path, backup_path)
        print("✅ Backup created successfully")

    except Exception as e:
        print(f"❌ Backup failed: {e}")
        sys.exit(1)


def main():
    """Main CLI interface for temporal database management."""
    parser = argparse.ArgumentParser(description="VibesPro Temporal Database Management")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Init command
    init_parser = subparsers.add_parser("init", help="Initialize temporal database")
    init_parser.add_argument("--db-path", default="./temporal_db/project_specs.db",
                           help="Database file path")
    init_parser.add_argument("--project-name", default="Project",
                           help="Project name for initialization")

    # Status command
    status_parser = subparsers.add_parser("status", help="Check database status")
    status_parser.add_argument("--db-path", default="./temporal_db/project_specs.db",
                             help="Database file path")

    # Backup command
    backup_parser = subparsers.add_parser("backup", help="Backup database")
    backup_parser.add_argument("--db-path", default="./temporal_db/project_specs.db",
                             help="Database file path")
    backup_parser.add_argument("--backup-path",
                             default=f"./temporal_db/backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db",
                             help="Backup file path")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    if args.command == "init":
        asyncio.run(init_database(args.db_path, args.project_name))
    elif args.command == "status":
        asyncio.run(status_database(args.db_path))
    elif args.command == "backup":
        asyncio.run(backup_database(args.db_path, args.backup_path))


if __name__ == "__main__":
    main()
