"""Repository-layer integration tests for the temporal database."""

from __future__ import annotations

import asyncio
from pathlib import Path

import pytest

from temporal_db.python.repository import TemporalRepository, initialize_temporal_database
from temporal_db.python.types import (
    ArchitecturalPattern,
    PatternType,
    SpecificationRecord,
    SpecificationType,
)


@pytest.mark.asyncio
async def test_repository_initialization(tmp_path: Path) -> None:
    db_path = tmp_path / "init.db"
    repo = await initialize_temporal_database(str(db_path))
    try:
        assert repo.connection is not None
        for attr in (
            "store_specification",
            "get_latest_specification",
            "store_architectural_pattern",
            "record_decision",
        ):
            assert hasattr(repo, attr)
    finally:
        await repo.close()


@pytest.mark.asyncio
async def test_specification_crud_operations(temporal_repository: TemporalRepository) -> None:
    record = SpecificationRecord.create(
        spec_type=SpecificationType.ADR,
        identifier="ADR-CRUD-001",
        title="CRUD Test Decision",
        content="Testing basic CRUD operations",
        author="test_engineer",
    )

    await temporal_repository.store_specification(record)
    retrieved = await temporal_repository.get_latest_specification("ADR", "ADR-CRUD-001")
    assert retrieved is not None
    assert retrieved.title == "CRUD Test Decision"

    updated = SpecificationRecord.create(
        spec_type=SpecificationType.ADR,
        identifier="ADR-CRUD-001",
        title="CRUD Test Decision",
        content="Updated content for CRUD operations testing",
        author="test_engineer",
    )
    updated.version = 2

    await temporal_repository.store_specification(updated)
    latest = await temporal_repository.get_latest_specification("ADR", "ADR-CRUD-001")
    assert latest is not None
    assert latest.version == 2
    assert latest.content == "Updated content for CRUD operations testing"


@pytest.mark.asyncio
async def test_architectural_pattern_operations(
    temporal_repository: TemporalRepository,
) -> None:
    pattern = ArchitecturalPattern.create(
        pattern_name="Repository Pattern Test",
        pattern_type=PatternType.DOMAIN,
        pattern_definition={
            "purpose": "Data access abstraction",
            "structure": "Interface + Implementation",
            "benefits": ["Testability", "Flexibility"],
            "example_code": "interface Repository<T> { save(entity: T): Promise<void> }",
        },
    )
    await temporal_repository.store_architectural_pattern(pattern)

    patterns = await temporal_repository.get_similar_patterns("repository", 0.1, 30)
    assert any(p.pattern_name == "Repository Pattern Test" for p in patterns)


@pytest.mark.asyncio
async def test_decision_recording_and_analysis(
    temporal_repository: TemporalRepository,
) -> None:
    await temporal_repository.record_decision(
        spec_id="ADR-DECISION-001",
        decision_point="database_type",
        selected_option="PostgreSQL",
        context="ACID compliance required",
        author="data_architect",
        confidence=0.9,
    )
    await temporal_repository.record_decision(
        spec_id="ADR-DECISION-002",
        decision_point="database_type",
        selected_option="MongoDB",
        context="Document flexibility needed",
        author="backend_dev",
        confidence=0.7,
    )
    await temporal_repository.record_decision(
        spec_id="ADR-DECISION-003",
        decision_point="caching_strategy",
        selected_option="Redis",
        context="High performance caching",
        author="performance_engineer",
        confidence=0.95,
    )

    patterns = await temporal_repository.analyze_decision_patterns(30)
    assert any(p.get("decision_point") == "database_type" for p in patterns)
    assert any(p.get("decision_point") == "caching_strategy" for p in patterns)


@pytest.mark.asyncio
async def test_pattern_similarity_search(temporal_repository: TemporalRepository) -> None:
    for name, pattern_type, description in [
        ("MVC Pattern", PatternType.APPLICATION, "Model View Controller architecture pattern"),
        ("Repository Pattern", PatternType.DOMAIN, "Data access abstraction pattern"),
        ("Factory Pattern", PatternType.DOMAIN, "Object creation pattern"),
        ("Observer Pattern", PatternType.APPLICATION, "Event notification pattern"),
    ]:
        pattern = ArchitecturalPattern.create(
            pattern_name=name,
            pattern_type=pattern_type,
            pattern_definition={"description": description},
        )
        await temporal_repository.store_architectural_pattern(pattern)

    mvc_results = await temporal_repository.get_similar_patterns("model view controller", 0.1, 30)
    assert any(p.pattern_name == "MVC Pattern" for p in mvc_results)

    data_results = await temporal_repository.get_similar_patterns("data access", 0.1, 30)
    assert any(p.pattern_name == "Repository Pattern" for p in data_results)

    creation_results = await temporal_repository.get_similar_patterns("object creation", 0.1, 30)
    assert any(p.pattern_name == "Factory Pattern" for p in creation_results)


@pytest.mark.asyncio
async def test_temporal_queries(temporal_repository: TemporalRepository) -> None:
    spec = SpecificationRecord.create(
        spec_type=SpecificationType.TS,
        identifier="TS-TEMPORAL-001",
        title="Temporal Query Test",
        content="Testing time-based queries",
        author="time_tester",
    )
    await temporal_repository.store_specification(spec)

    await temporal_repository.record_decision(
        spec_id="TS-TEMPORAL-001",
        decision_point="query_strategy",
        selected_option="time_range_indexing",
        context="Optimize temporal queries",
        author="time_tester",
        confidence=0.8,
    )

    recent_patterns = await temporal_repository.analyze_decision_patterns(1)
    assert any(p.get("decision_point") == "query_strategy" for p in recent_patterns)

    old_patterns = await temporal_repository.analyze_decision_patterns(0)
    assert not old_patterns


@pytest.mark.asyncio
async def test_concurrent_operations(temporal_repository: TemporalRepository) -> None:
    async def store_spec(index: int) -> int:
        spec = SpecificationRecord.create(
            spec_type=SpecificationType.ADR,
            identifier=f"ADR-CONCURRENT-{index:03d}",
            title=f"Concurrent Test {index}",
            content=f"Testing concurrent operations {index}",
            author=f"tester_{index}",
        )
        await temporal_repository.store_specification(spec)
        return index

    results = await asyncio.gather(*(store_spec(i) for i in range(10)))
    assert sorted(results) == list(range(10))

    for i in range(10):
        retrieved = await temporal_repository.get_latest_specification(
            "ADR", f"ADR-CONCURRENT-{i:03d}"
        )
        assert retrieved is not None
        assert retrieved.title == f"Concurrent Test {i}"


@pytest.mark.asyncio
async def test_error_handling(temporal_repository: TemporalRepository) -> None:
    result = await temporal_repository.get_latest_specification("NON_EXISTENT", "INVALID-ID")
    assert result is None

    patterns = await temporal_repository.get_similar_patterns("", -1.0, -1)
    assert isinstance(patterns, list)
    assert not patterns

    invalid_patterns = await temporal_repository.analyze_decision_patterns(-1)
    assert isinstance(invalid_patterns, list)
    assert not invalid_patterns


@pytest.mark.asyncio
async def test_data_integrity(temporal_repository: TemporalRepository) -> None:
    spec = SpecificationRecord.create(
        spec_type=SpecificationType.PRD,
        identifier="PRD-INTEGRITY-001",
        title="Data Integrity Test",
        content="Testing data integrity across operations",
        author="integrity_tester",
    )
    await temporal_repository.store_specification(spec)

    await temporal_repository.record_decision(
        spec_id="PRD-INTEGRITY-001",
        decision_point="decision_quality",
        selected_option="high",
        context="Integrity evaluation",
        author="integrity_tester",
        confidence=0.85,
    )

    retrieved = await temporal_repository.get_latest_specification("PRD", "PRD-INTEGRITY-001")
    assert retrieved is not None

    patterns = await temporal_repository.analyze_decision_patterns(30)
    data_integrity = next(
        (p for p in patterns if p.get("decision_point") == "decision_quality"),
        None,
    )
    assert data_integrity is not None
    assert data_integrity["total_decisions"] >= 1
