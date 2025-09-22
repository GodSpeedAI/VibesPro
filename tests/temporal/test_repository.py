#!/usr/bin/env python3
"""
Test suite for temporal database repository layer.

This implements the RED phase of TDD - failing tests for repository operations.
"""

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
    ArchitecturalPattern,
    SpecificationType,
    PatternType,
)


class TestTemporalRepository:
    """Test cases for TemporalRepository class focusing on data operations."""

    async def setup_temp_repository(self):
        """Create a temporary repository for testing."""
        temp_file = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
        db_path = temp_file.name
        temp_file.close()
        
        repo = await initialize_temporal_database(db_path)
        return repo, db_path

    async def test_repository_initialization(self):
        """Test that repository initializes correctly."""
        repo, db_path = await self.setup_temp_repository()
        
        try:
            assert repo is not None
            assert repo.connection is not None
            assert hasattr(repo, 'store_specification')
            assert hasattr(repo, 'get_latest_specification')
            assert hasattr(repo, 'store_architectural_pattern')
            assert hasattr(repo, 'record_decision')
        finally:
            await repo.close()
            os.unlink(db_path)

    async def test_specification_crud_operations(self):
        """Test Create, Read, Update, Delete operations for specifications."""
        repo, db_path = await self.setup_temp_repository()
        
        try:
            # CREATE
            spec = SpecificationRecord.create(
                spec_type=SpecificationType.ADR,
                identifier="ADR-CRUD-001",
                title="CRUD Test Decision",
                content="Testing basic CRUD operations",
                author="test_engineer",
            )
            
            await repo.store_specification(spec)
            
            # READ
            retrieved = await repo.get_latest_specification("ADR", "ADR-CRUD-001")
            assert retrieved is not None
            assert retrieved.identifier == "ADR-CRUD-001"
            assert retrieved.title == "CRUD Test Decision"
            assert retrieved.author == "test_engineer"
            
            # UPDATE (store new version)
            updated_spec = SpecificationRecord.create(
                spec_type=SpecificationType.ADR,
                identifier="ADR-CRUD-001",
                title="CRUD Test Decision",
                content="Updated content for CRUD operations testing",
                author="test_engineer",
            )
            updated_spec.version = 2
            
            await repo.store_specification(updated_spec)
            
            # Verify update
            latest = await repo.get_latest_specification("ADR", "ADR-CRUD-001")
            assert latest is not None
            assert latest.content == "Updated content for CRUD operations testing"
            assert latest.version == 2
            
        finally:
            await repo.close()
            os.unlink(db_path)

    async def test_architectural_pattern_operations(self):
        """Test architectural pattern storage and retrieval."""
        repo, db_path = await self.setup_temp_repository()
        
        try:
            # Store pattern
            pattern = ArchitecturalPattern.create(
                pattern_name="Repository Pattern Test",
                pattern_type=PatternType.DOMAIN,
                pattern_definition={
                    "purpose": "Data access abstraction",
                    "structure": "Interface + Implementation",
                    "benefits": ["Testability", "Flexibility"],
                    "example_code": "interface Repository<T> { save(entity: T): Promise<void> }"
                }
            )
            
            await repo.store_architectural_pattern(pattern)
            
            # Retrieve patterns
            patterns = await repo.get_similar_patterns("repository", 0.1, 30)
            
            assert len(patterns) >= 1
            found = next((p for p in patterns if p.pattern_name == "Repository Pattern Test"), None)
            assert found is not None
            assert found.pattern_type == PatternType.DOMAIN
            assert "Data access abstraction" in str(found.pattern_definition)
            
        finally:
            await repo.close()
            os.unlink(db_path)

    async def test_decision_recording_and_analysis(self):
        """Test recording decisions and analyzing patterns."""
        repo, db_path = await self.setup_temp_repository()
        
        try:
            # Record multiple decisions
            await repo.record_decision(
                spec_id="ADR-DECISION-001",
                decision_point="database_type",
                selected_option="PostgreSQL",
                context="ACID compliance required",
                author="data_architect",
                confidence=0.9,
            )
            
            await repo.record_decision(
                spec_id="ADR-DECISION-002",
                decision_point="database_type",
                selected_option="MongoDB",
                context="Document flexibility needed",
                author="backend_dev",
                confidence=0.7,
            )
            
            await repo.record_decision(
                spec_id="ADR-DECISION-003",
                decision_point="caching_strategy",
                selected_option="Redis",
                context="High performance caching",
                author="performance_engineer",
                confidence=0.95,
            )
            
            # Analyze patterns
            patterns = await repo.analyze_decision_patterns(30)
            
            assert len(patterns) >= 2  # At least database_type and caching_strategy
            
            # Check database type decisions
            db_decisions = next(
                (p for p in patterns if p.get('decision_point') == 'database_type'),
                None
            )
            assert db_decisions is not None
            assert db_decisions['total_decisions'] == 2
            
            # Check caching decisions
            cache_decisions = next(
                (p for p in patterns if p.get('decision_point') == 'caching_strategy'),
                None
            )
            assert cache_decisions is not None
            assert cache_decisions['total_decisions'] == 1
            
        finally:
            await repo.close()
            os.unlink(db_path)

    async def test_pattern_similarity_search(self):
        """Test pattern similarity search functionality."""
        repo, db_path = await self.setup_temp_repository()
        
        try:
            # Store multiple patterns
            patterns_to_store = [
                {
                    "name": "MVC Pattern",
                    "type": PatternType.APPLICATION,
                    "definition": {"description": "Model View Controller architecture pattern"}
                },
                {
                    "name": "Repository Pattern",
                    "type": PatternType.DOMAIN,
                    "definition": {"description": "Data access abstraction pattern"}
                },
                {
                    "name": "Factory Pattern",
                    "type": PatternType.DOMAIN,
                    "definition": {"description": "Object creation pattern"}
                },
                {
                    "name": "Observer Pattern",
                    "type": PatternType.APPLICATION,
                    "definition": {"description": "Event notification pattern"}
                }
            ]
            
            for pattern_data in patterns_to_store:
                pattern = ArchitecturalPattern.create(
                    pattern_name=pattern_data["name"],
                    pattern_type=pattern_data["type"],
                    pattern_definition=pattern_data["definition"]
                )
                await repo.store_architectural_pattern(pattern)
            
            # Test similarity search
            mvc_results = await repo.get_similar_patterns("model view controller", 0.1, 30)
            assert len(mvc_results) >= 1
            assert any(p.pattern_name == "MVC Pattern" for p in mvc_results)
            
            data_results = await repo.get_similar_patterns("data access", 0.1, 30)
            assert len(data_results) >= 1
            assert any(p.pattern_name == "Repository Pattern" for p in data_results)
            
            creation_results = await repo.get_similar_patterns("object creation", 0.1, 30)
            assert len(creation_results) >= 1
            assert any(p.pattern_name == "Factory Pattern" for p in creation_results)
            
        finally:
            await repo.close()
            os.unlink(db_path)

    async def test_temporal_queries(self):
        """Test time-based query functionality."""
        repo, db_path = await self.setup_temp_repository()
        
        try:
            # Store specification and decision
            spec = SpecificationRecord.create(
                spec_type=SpecificationType.TS,
                identifier="TS-TEMPORAL-001",
                title="Temporal Query Test",
                content="Testing time-based queries",
                author="time_tester",
            )
            
            await repo.store_specification(spec)
            
            await repo.record_decision(
                spec_id="TS-TEMPORAL-001",
                decision_point="query_strategy",
                selected_option="time_range_indexing",
                context="Optimize temporal queries",
                author="time_tester",
                confidence=0.8,
            )
            
            # Query recent decisions (last day)
            recent_patterns = await repo.analyze_decision_patterns(1)
            
            assert len(recent_patterns) >= 1
            query_pattern = next(
                (p for p in recent_patterns if p.get('decision_point') == 'query_strategy'),
                None
            )
            assert query_pattern is not None
            assert query_pattern['total_decisions'] == 1
            
            # Query older decisions (should be empty for distant past)
            old_patterns = await repo.analyze_decision_patterns(0)  # 0 days = no results
            assert len(old_patterns) == 0
            
        finally:
            await repo.close()
            os.unlink(db_path)

    async def test_concurrent_operations(self):
        """Test that repository handles concurrent operations correctly."""
        repo, db_path = await self.setup_temp_repository()
        
        try:
            # Create multiple specifications concurrently
            async def store_spec(index):
                spec = SpecificationRecord.create(
                    spec_type=SpecificationType.ADR,
                    identifier=f"ADR-CONCURRENT-{index:03d}",
                    title=f"Concurrent Test {index}",
                    content=f"Testing concurrent operations {index}",
                    author=f"tester_{index}",
                )
                await repo.store_specification(spec)
                return index
            
            # Run 10 concurrent storage operations
            tasks = [store_spec(i) for i in range(10)]
            results = await asyncio.gather(*tasks)
            
            assert len(results) == 10
            assert all(isinstance(r, int) for r in results)
            
            # Verify all specifications were stored
            for i in range(10):
                retrieved = await repo.get_latest_specification("ADR", f"ADR-CONCURRENT-{i:03d}")
                assert retrieved is not None
                assert retrieved.title == f"Concurrent Test {i}"
                
        finally:
            await repo.close()
            os.unlink(db_path)

    async def test_error_handling(self):
        """Test repository error handling for edge cases."""
        repo, db_path = await self.setup_temp_repository()
        
        try:
            # Test retrieving non-existent specification
            result = await repo.get_latest_specification("NON_EXISTENT", "INVALID-ID")
            assert result is None
            
            # Test invalid pattern query
            patterns = await repo.get_similar_patterns("", -1.0, -1)
            assert isinstance(patterns, list)
            assert len(patterns) == 0  # Should return empty list for invalid params
            
            # Test decision analysis with invalid parameters
            invalid_patterns = await repo.analyze_decision_patterns(-1)
            assert isinstance(invalid_patterns, list)
            assert len(invalid_patterns) == 0
            
        finally:
            await repo.close()
            os.unlink(db_path)

    async def test_data_integrity(self):
        """Test that data integrity is maintained across operations."""
        repo, db_path = await self.setup_temp_repository()
        
        try:
            # Store specification
            spec = SpecificationRecord.create(
                spec_type=SpecificationType.PRD,
                identifier="PRD-INTEGRITY-001",
                title="Data Integrity Test",
                content="Testing data integrity across operations",
                author="integrity_tester",
            )
            
            await repo.store_specification(spec)
            
            # Store architectural pattern
            pattern = ArchitecturalPattern.create(
                pattern_name="Integrity Pattern",
                pattern_type=PatternType.APPLICATION,
                pattern_definition={"test": "integrity validation"}
            )
            
            await repo.store_architectural_pattern(pattern)
            
            # Record decision
            await repo.record_decision(
                spec_id="PRD-INTEGRITY-001",
                decision_point="integrity_approach",
                selected_option="database_constraints",
                context="Ensure data consistency",
                author="integrity_tester",
                confidence=0.85,
            )
            
            # Verify all data is accessible and consistent
            retrieved_spec = await repo.get_latest_specification("PRD", "PRD-INTEGRITY-001")
            assert retrieved_spec is not None
            assert retrieved_spec.title == "Data Integrity Test"
            
            retrieved_patterns = await repo.get_similar_patterns("integrity", 0.1, 30)
            assert len(retrieved_patterns) >= 1
            integrity_pattern = next(
                (p for p in retrieved_patterns if p.pattern_name == "Integrity Pattern"),
                None
            )
            assert integrity_pattern is not None
            
            decision_patterns = await repo.analyze_decision_patterns(30)
            integrity_decisions = next(
                (p for p in decision_patterns if p.get('decision_point') == 'integrity_approach'),
                None
            )
            assert integrity_decisions is not None
            assert integrity_decisions['total_decisions'] == 1
            
        finally:
            await repo.close()
            os.unlink(db_path)


async def run_all_tests():
    """Run all repository tests."""
    test_repo = TestTemporalRepository()
    
    tests = [
        test_repo.test_repository_initialization,
        test_repo.test_specification_crud_operations,
        test_repo.test_architectural_pattern_operations,
        test_repo.test_decision_recording_and_analysis,
        test_repo.test_pattern_similarity_search,
        test_repo.test_temporal_queries,
        test_repo.test_concurrent_operations,
        test_repo.test_error_handling,
        test_repo.test_data_integrity,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            print(f"Running {test.__name__}...")
            await test()
            print(f"✓ {test.__name__} passed")
            passed += 1
        except Exception as e:
            print(f"✗ {test.__name__} failed: {e}")
            failed += 1
    
    print(f"\nTest Results: {passed} passed, {failed} failed")
    return failed == 0


if __name__ == "__main__":
    asyncio.run(run_all_tests())