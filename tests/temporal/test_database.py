#!/usr/bin/env python3
"""
Test suite for temporal database functionality.

This implements the RED phase of TDD - failing tests that define expected behavior.
"""

import pytest
import asyncio
import tempfile
import os
from pathlib import Path
from datetime import datetime, timezone
import json

# Add temporal_db to path
import sys
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "temporal_db"))

from python.repository import TemporalRepository, initialize_temporal_database
from python.types import (
    SpecificationRecord,
    SpecificationChange,
    ArchitecturalPattern,
    DecisionPoint,
    DecisionOption,
    SpecificationType,
    PatternType,
    ChangeType,
)


class TestTemporalDatabase:
    """Test cases for temporal database functionality based on MERGE-TASK-006 requirements."""

    @pytest.fixture
    async def temp_db(self):
        """Create a temporary database for testing."""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name

        try:
            repo = await initialize_temporal_database(db_path)
            yield repo
        finally:
            await repo.close()
            os.unlink(db_path)

    @pytest.mark.asyncio
    async def test_database_initialization(self):
        """Test that database initializes successfully."""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name

        try:
            repo = await initialize_temporal_database(db_path)
            assert repo is not None
            assert repo.connection is not None
            await repo.close()
        finally:
            os.unlink(db_path)

    @pytest.mark.asyncio
    async def test_specification_storage_and_retrieval(self, temp_db):
        """Test storing and retrieving specifications."""
        # Create test specification
        spec = SpecificationRecord.create(
            spec_type=SpecificationType.ADR,
            identifier="ADR-TEST-001",
            title="Test Decision",
            content="This is a test architectural decision record for temporal database testing.",
            author="test_author",
        )

        # Store specification
        await temp_db.store_specification(spec)

        # Retrieve specification
        retrieved = await temp_db.get_latest_specification("ADR", "ADR-TEST-001")

        assert retrieved is not None
        assert retrieved.identifier == "ADR-TEST-001"
        assert retrieved.title == "Test Decision"
        assert retrieved.author == "test_author"
        assert retrieved.spec_type == SpecificationType.ADR

    @pytest.mark.asyncio
    async def test_specification_versioning(self, temp_db):
        """Test that specification versions are tracked correctly."""
        # Create initial specification
        spec1 = SpecificationRecord.create(
            spec_type=SpecificationType.PRD,
            identifier="PRD-TEST-001",
            title="Test Product Requirements",
            content="Initial requirements",
            author="product_manager",
        )

        await temp_db.store_specification(spec1)

        # Create updated specification
        spec2 = SpecificationRecord.create(
            spec_type=SpecificationType.PRD,
            identifier="PRD-TEST-001",
            title="Test Product Requirements",
            content="Updated requirements with more details",
            author="product_manager",
        )
        spec2.version = 2

        await temp_db.store_specification(spec2)

        # Should retrieve the latest version
        retrieved = await temp_db.get_latest_specification("PRD", "PRD-TEST-001")

        assert retrieved is not None
        assert retrieved.content == "Updated requirements with more details"

    @pytest.mark.asyncio
    async def test_architectural_pattern_storage(self, temp_db):
        """Test storing and retrieving architectural patterns."""
        pattern = ArchitecturalPattern.create(
            pattern_name="Test Repository Pattern",
            pattern_type=PatternType.DOMAIN,
            pattern_definition={
                "description": "Data access abstraction pattern for testing",
                "implementation": "interface + concrete class",
                "benefits": ["Testability", "Flexibility", "Separation of concerns"],
                "example": "interface UserRepository { findById(id: string): Promise<User | null> }"
            }
        )

        await temp_db.store_architectural_pattern(pattern)

        # Query patterns using text-based search
        patterns = await temp_db.get_similar_patterns("repository", 0.1, 30)

        assert len(patterns) >= 1
        found_pattern = next((p for p in patterns if p.pattern_name == "Test Repository Pattern"), None)
        assert found_pattern is not None
        assert found_pattern.pattern_type == PatternType.DOMAIN

    @pytest.mark.asyncio
    async def test_decision_recording(self, temp_db):
        """Test recording and analyzing architectural decisions."""
        # Record multiple decisions
        await temp_db.record_decision(
            spec_id="ADR-TEST-002",
            decision_point="database_choice",
            selected_option="PostgreSQL",
            context="Need reliable ACID transactions",
            author="architect",
            confidence=0.85,
        )

        await temp_db.record_decision(
            spec_id="ADR-TEST-002",
            decision_point="caching_strategy",
            selected_option="Redis",
            context="Need fast read performance",
            author="architect",
            confidence=0.9,
        )

        await temp_db.record_decision(
            spec_id="ADR-TEST-003",
            decision_point="database_choice",
            selected_option="SQLite",
            context="Embedded application needs",
            author="developer",
            confidence=0.7,
        )

        # Analyze decision patterns
        patterns = await temp_db.analyze_decision_patterns(30)

        assert len(patterns) >= 2

        # Check database choice pattern
        db_pattern = next(
            (p for p in patterns if p.get('decision_point') == 'database_choice'),
            None
        )
        assert db_pattern is not None
        assert db_pattern['total_decisions'] == 2
        assert db_pattern['selected_count'] >= 1  # At least one high confidence decision

    @pytest.mark.asyncio
    async def test_pattern_usage_tracking(self, temp_db):
        """Test that pattern usage is tracked correctly."""
        pattern = ArchitecturalPattern.create(
            pattern_name="Tracked Pattern",
            pattern_type=PatternType.APPLICATION,
            pattern_definition={"test": "pattern"}
        )

        # Use the pattern (simulate usage)
        pattern.use_pattern()
        pattern.use_pattern()

        await temp_db.store_architectural_pattern(pattern)

        # Retrieve and verify usage tracking
        patterns = await temp_db.get_similar_patterns("tracked", 0.0, 30)
        tracked_pattern = next((p for p in patterns if p.pattern_name == "Tracked Pattern"), None)

        assert tracked_pattern is not None
        assert tracked_pattern.usage_frequency == 2
        assert tracked_pattern.last_used is not None

    @pytest.mark.asyncio
    async def test_temporal_queries(self, temp_db):
        """Test time-based queries work correctly."""
        # Store specification
        spec = SpecificationRecord.create(
            spec_type=SpecificationType.TS,
            identifier="TS-TEMPORAL-001",
            title="Temporal Test",
            content="Testing temporal queries",
            author="tester",
        )

        await temp_db.store_specification(spec)

        # Record decision
        await temp_db.record_decision(
            spec_id="TS-TEMPORAL-001",
            decision_point="testing_approach",
            selected_option="TDD",
            context="Ensure quality and design",
            author="tester",
            confidence=0.95,
        )

        # Query recent decisions (should find our decision)
        recent_patterns = await temp_db.analyze_decision_patterns(1)  # Last 1 day

        assert len(recent_patterns) >= 1
        testing_pattern = next(
            (p for p in recent_patterns if p.get('decision_point') == 'testing_approach'),
            None
        )
        assert testing_pattern is not None

    @pytest.mark.asyncio
    async def test_database_performance(self, temp_db):
        """Test that database operations meet performance requirements."""
        import time

        # Test bulk specification storage
        start_time = time.time()

        for i in range(10):
            spec = SpecificationRecord.create(
                spec_type=SpecificationType.ADR,
                identifier=f"ADR-PERF-{i:03d}",
                title=f"Performance Test Decision {i}",
                content=f"This is performance test decision number {i}",
                author="performance_tester",
            )
            await temp_db.store_specification(spec)

        storage_time = time.time() - start_time

        # Should complete within reasonable time (10 specs in < 1 second)
        assert storage_time < 1.0, f"Bulk storage took {storage_time:.2f}s, expected < 1.0s"

        # Test bulk retrieval
        start_time = time.time()

        for i in range(10):
            retrieved = await temp_db.get_latest_specification("ADR", f"ADR-PERF-{i:03d}")
            assert retrieved is not None

        retrieval_time = time.time() - start_time

        # Should complete within reasonable time
        assert retrieval_time < 1.0, f"Bulk retrieval took {retrieval_time:.2f}s, expected < 1.0s"

    @pytest.mark.asyncio
    async def test_error_handling(self, temp_db):
        """Test error handling for edge cases."""
        # Test retrieving non-existent specification
        result = await temp_db.get_latest_specification("ADR", "NON-EXISTENT")
        assert result is None

        # Test querying with invalid parameters
        patterns = await temp_db.get_similar_patterns("", -1.0, -1)  # Invalid threshold and days
        assert isinstance(patterns, list)  # Should return empty list, not crash

    @pytest.mark.asyncio
    async def test_data_consistency(self, temp_db):
        """Test that data remains consistent across operations."""
        # Store specification
        spec = SpecificationRecord.create(
            spec_type=SpecificationType.SDS,
            identifier="SDS-CONSISTENCY-001",
            title="Consistency Test",
            content="Testing data consistency",
            author="consistency_tester",
        )

        await temp_db.store_specification(spec)

        # Record multiple decisions for the same spec
        for i in range(5):
            await temp_db.record_decision(
                spec_id="SDS-CONSISTENCY-001",
                decision_point=f"test_point_{i}",
                selected_option=f"option_{i}",
                context=f"Test context {i}",
                author="consistency_tester",
                confidence=0.8,
            )

        # Verify all decisions are recorded
        patterns = await temp_db.analyze_decision_patterns(30)
        consistency_patterns = [
            p for p in patterns
            if p.get('spec_type') == 'SDS' and 'test_point_' in p.get('decision_point', '')
        ]

        assert len(consistency_patterns) == 5

        # Verify specification is still retrievable
        retrieved = await temp_db.get_latest_specification("SDS", "SDS-CONSISTENCY-001")
        assert retrieved is not None
        assert retrieved.title == "Consistency Test"


# Performance benchmark tests
class TestTemporalDatabasePerformance:
    """Performance tests to ensure temporal database meets requirements."""

    @pytest.mark.asyncio
    async def test_generation_time_target(self):
        """Test that database initialization meets the 30-second target."""
        import time

        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name

        try:
            start_time = time.time()
            repo = await initialize_temporal_database(db_path)
            await repo.close()
            init_time = time.time() - start_time

            # Should initialize in well under 30 seconds (target from MERGE-TASK-006)
            assert init_time < 30.0, f"Database initialization took {init_time:.2f}s, expected < 30.0s"

        finally:
            os.unlink(db_path)

    @pytest.mark.asyncio
    async def test_memory_usage_target(self):
        """Test that memory usage is reasonable."""
        import psutil
        import os

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss

        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name

        try:
            repo = await initialize_temporal_database(db_path)

            # Store 100 specifications to test memory usage
            for i in range(100):
                spec = SpecificationRecord.create(
                    spec_type=SpecificationType.ADR,
                    identifier=f"ADR-MEM-{i:03d}",
                    title=f"Memory Test {i}",
                    content=f"This is a memory test specification number {i}" * 10,  # Larger content
                    author="memory_tester",
                )
                await repo.store_specification(spec)

            final_memory = process.memory_info().rss
            memory_increase = final_memory - initial_memory

            await repo.close()

            # Memory increase should be reasonable (< 100MB for 100 specs)
            assert memory_increase < 100 * 1024 * 1024, f"Memory increased by {memory_increase / 1024 / 1024:.1f}MB, expected < 100MB"

        finally:
            os.unlink(db_path)


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])
