#!/usr/bin/env python3
"""Integration tests for the architectural pattern recognizer."""

from __future__ import annotations

import asyncio
import os
import sys
import tempfile
from datetime import UTC, datetime, timedelta
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "temporal_db"))

from python.patterns import ArchitecturalPatternRecognizer  # noqa: E402
from python.repository import TemporalRepository, initialize_temporal_database  # noqa: E402
from python.types import (  # noqa: E402
    ArchitecturalPattern,
    PatternRecommendation,
    PatternType,
    SpecificationRecord,
    SpecificationType,
)


async def _bootstrap_repository(db_path: str) -> TemporalRepository:
    repository = await initialize_temporal_database(db_path)

    # Seed specification history to drive recognizer
    spec = SpecificationRecord.create(
        spec_type=SpecificationType.ADR,
        identifier="ADR-AI-GUIDANCE",
        title="AI Guidance Fabric",
        content="Documenting unified AI guidance fabric.",
        author="test",
    )
    await repository.store_specification(spec)

    # Persist architectural pattern with strong success signal
    pattern = ArchitecturalPattern.create(
        pattern_name="Hexagonal Architecture",
        pattern_type=PatternType.APPLICATION,
        pattern_definition={"summary": "Ports and adapters for service orchestration."},
    )
    pattern.context_similarity = 0.92
    pattern.usage_frequency = 8
    pattern.success_rate = 0.87
    pattern.last_used = datetime.now(UTC) - timedelta(days=2)
    pattern.metadata.update({"canonical_decision_point": "integration_strategy"})
    await repository.store_architectural_pattern(pattern)

    # Record high confidence decisions referencing pattern
    for idx in range(3):
        await repository.record_decision(
            spec_id=f"ADR-AI-GUIDANCE-{idx}",
            decision_point="integration_strategy",
            selected_option="hexagonal",  # align with pattern
            context="Align orchestration through ports and adapters",
            author="architect",
            confidence=0.93,
        )

    return repository


async def _generate_recommendations(
    tmp_path: Path,
) -> tuple[object, list[PatternRecommendation]]:
    repository = await _bootstrap_repository(str(tmp_path / "temporal"))
    recognizer = ArchitecturalPatternRecognizer(
        repository, retention_days=60, max_recommendations=3
    )

    result = await recognizer.generate_recommendations(lookback_days=90)
    stored = await repository.get_pattern_recommendations(limit=5)

    await repository.close()
    return result, stored


def test_recommendation_generation_creates_entries() -> None:
    """End-to-end generation should produce stored recommendations with provenance."""

    tmp_dir = Path(tempfile.mkdtemp(prefix="temporal-tests-"))
    result, stored = asyncio.run(_generate_recommendations(tmp_dir))

    try:
        assert (
            hasattr(result, "recommendations") and result.recommendations
        ), "Recognizer should emit recommendations"
        assert stored, "Recommendations should be stored in repository"

        recommendation = stored[0]
        assert recommendation.pattern_name == "Hexagonal Architecture"
        assert recommendation.decision_point == "integration_strategy"
        assert recommendation.provenance == "ADR"
        assert recommendation.confidence >= 0.55
        assert "ports and adapters" in recommendation.rationale.lower()
        assert recommendation.metadata["total_decisions"] >= 3
    finally:
        for file in tmp_dir.glob("*"):
            try:
                os.unlink(file)
            except OSError:
                pass
        tmp_dir.rmdir()


def test_retention_and_feedback_controls_confidence() -> None:
    """Retention purge and feedback adjustments should update stored confidence."""

    tmp_dir = Path(tempfile.mkdtemp(prefix="temporal-tests-"))
    repository = asyncio.run(_bootstrap_repository(str(tmp_dir / "temporal")))
    recognizer = ArchitecturalPatternRecognizer(repository, retention_days=30)

    try:
        # Insert stale recommendation manually
        expired = PatternRecommendation.create(
            pattern_name="CQRS",
            decision_point="query_strategy",
            confidence=0.65,
            provenance="ADR",
            rationale="Event sourcing pairs well with CQRS.",
            ttl_days=7,
            metadata={"tags": ["cqrs"]},
        )
        expired.created_at = datetime.now(UTC) - timedelta(days=120)
        expired.expires_at = datetime.now(UTC) - timedelta(days=90)
        asyncio.run(repository.store_pattern_recommendation(expired))

        # Run recognition to seed fresh recommendation
        asyncio.run(recognizer.generate_recommendations(lookback_days=30))

        existing = asyncio.run(repository.get_pattern_recommendations(limit=5))
        assert existing, "Expected at least one active recommendation"
        assert all(rec.decision_point != "query_strategy" for rec in existing)

        # Apply acceptance feedback to adjust confidence
        recent = existing[0]
        updated = asyncio.run(
            repository.record_recommendation_feedback(recent.id, "accept", "Followed guidance")
        )
        assert updated is not None
        assert updated.confidence > recent.confidence
    finally:
        asyncio.run(repository.close())
        for file in tmp_dir.glob("*"):
            try:
                os.unlink(file)
            except OSError:
                pass
        tmp_dir.rmdir()
