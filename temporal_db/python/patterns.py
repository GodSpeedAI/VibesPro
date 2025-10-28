# mypy: ignore-errors
"""Architectural pattern recognition utilities for the temporal database."""

from __future__ import annotations

import asyncio
from collections import Counter
from collections.abc import Sequence
from dataclasses import dataclass
from typing import TypedDict, cast

from .repository import TemporalRepository
from .types import (
    ArchitecturalPattern,
    PatternRecommendation,
    PatternType,
)


class DecisionStat(TypedDict):
    decision_point: str
    total_decisions: int
    selected_count: int
    spec_type: str
    contexts: list[str]


@dataclass
class PatternRecommendationResult:
    """Container for recommendation generation results."""

    recommendations: list[PatternRecommendation]
    regenerated: bool
    retention_deleted: int


class ArchitecturalPatternRecognizer:
    """Generate architectural recommendations from historical decisions."""

    def __init__(
        self,
        repository: TemporalRepository,
        *,
        retention_days: int = 90,
        minimum_confidence: float = 0.55,
        max_recommendations: int = 5,
    ) -> None:
        self._repository = repository
        self._retention_days = max(1, retention_days)
        self._minimum_confidence = min(0.95, max(0.3, minimum_confidence))
        self._max_recommendations = max(1, max_recommendations)

    async def generate_recommendations(
        self,
        *,
        lookback_days: int = 45,
        dry_run: bool = False,
    ) -> PatternRecommendationResult:
        """Generate recommendations from temporal history.

        Args:
            lookback_days: Window for historical analysis.
            dry_run: When True, skip persistence while still returning results.
        """

        decision_stats_raw = await self._repository.analyze_decision_patterns(lookback_days)
        if not decision_stats_raw:
            return PatternRecommendationResult([], regenerated=False, retention_deleted=0)

        decision_stats = cast(list[DecisionStat], decision_stats_raw)

        all_patterns = await self._repository.get_similar_patterns("", 0.0, lookback_days)
        pattern_tasks = [
            self._repository.get_similar_patterns(stat["decision_point"], 0.1, lookback_days)
            for stat in decision_stats
        ]
        pattern_candidates = await asyncio.gather(*pattern_tasks)

        generated: list[PatternRecommendation] = []
        for stat, candidates in zip(decision_stats, pattern_candidates):
            confidence = self._calculate_confidence(stat)
            if confidence < self._minimum_confidence:
                continue

            best_pattern = self._select_best_pattern(
                candidates, stat["decision_point"], all_patterns
            )
            metadata = self._build_metadata(stat, best_pattern)
            rationale = self._compose_rationale(stat, best_pattern, confidence)

            recommendation = PatternRecommendation.create(
                pattern_name=best_pattern.pattern_name,
                decision_point=stat["decision_point"],
                confidence=confidence,
                provenance=stat.get("spec_type", "unknown"),
                rationale=rationale,
                ttl_days=self._retention_days,
                metadata=metadata,
            )

            generated.append(recommendation)
            if len(generated) >= self._max_recommendations:
                break

        retention_deleted = 0
        if not dry_run:
            for recommendation in generated:
                await self._repository.store_pattern_recommendation(recommendation)
            retention_deleted = await self._repository.purge_stale_recommendations(
                self._retention_days
            )

        return PatternRecommendationResult(
            recommendations=generated,
            regenerated=not dry_run,
            retention_deleted=retention_deleted,
        )

    async def hydrate_existing(self, limit: int = 10) -> list[PatternRecommendation]:
        """Load persisted recommendations for downstream consumption."""

        return await self._repository.get_pattern_recommendations(limit=limit)

    def _calculate_confidence(self, stat: DecisionStat) -> float:
        total = stat["total_decisions"]
        selected = stat["selected_count"]
        if total == 0:
            return 0.0
        base_confidence = float(selected) / float(total)
        return min(0.98, max(0.1, base_confidence))

    def _select_best_pattern(
        self,
        candidates: Sequence[ArchitecturalPattern],
        decision_point: str,
        all_patterns: Sequence[ArchitecturalPattern],
    ) -> ArchitecturalPattern:
        if candidates:
            sorted_candidates = sorted(
                candidates,
                key=lambda pattern: (
                    pattern.success_rate or 0.5,
                    pattern.context_similarity,
                    pattern.usage_frequency,
                ),
                reverse=True,
            )
            top = sorted_candidates[0]
            # Create a copy of the pattern with updated metadata to avoid mutation
            if not top.metadata.get("canonical_decision_point"):
                updated_metadata = top.metadata.copy()
                updated_metadata["canonical_decision_point"] = decision_point
                return ArchitecturalPattern(
                    id=top.id,
                    pattern_name=top.pattern_name,
                    pattern_type=top.pattern_type,
                    context_similarity=top.context_similarity,
                    usage_frequency=top.usage_frequency,
                    success_rate=top.success_rate,
                    last_used=top.last_used,
                    pattern_definition=top.pattern_definition,
                    examples=top.examples,
                    metadata=updated_metadata,
                )
            return top

        canonical_match = next(
            (
                pattern
                for pattern in all_patterns
                if pattern.metadata.get("canonical_decision_point") == decision_point
            ),
            None,
        )
        if canonical_match:
            return canonical_match

        name_match = next(
            (
                pattern
                for pattern in all_patterns
                if decision_point.replace("_", " ").lower() in pattern.pattern_name.lower()
            ),
            None,
        )
        if name_match:
            return name_match

        inferred_name = decision_point.replace("_", " ").title() or "Architectural Pattern"
        return ArchitecturalPattern.create(
            pattern_name=inferred_name,
            pattern_type=PatternType.DOMAIN,
            pattern_definition={"source": "temporal-inference"},
        )

    def _build_metadata(
        self,
        stat: DecisionStat,
        pattern: ArchitecturalPattern,
    ) -> dict[str, object]:
        contexts = stat["contexts"]
        context_counts = Counter(contexts)
        top_contexts = [ctx for ctx, _ in context_counts.most_common(3)]

        tags = {pattern.pattern_type.value.lower() if pattern.pattern_type else "pattern"}
        decision_point = stat["decision_point"].replace(" ", "-")
        tags.add(decision_point.lower())

        metadata = {
            "decision_point": stat["decision_point"],
            "total_decisions": stat["total_decisions"],
            "selected_count": stat["selected_count"],
            "top_contexts": top_contexts,
            "success_rate": pattern.success_rate,
            "usage_frequency": pattern.usage_frequency,
            "tags": sorted(tags),
        }

        return metadata

    def _compose_rationale(
        self,
        stat: DecisionStat,
        pattern: ArchitecturalPattern,
        confidence: float,
    ) -> str:
        decision_point = stat["decision_point"]
        selected = stat["selected_count"]
        total = stat["total_decisions"]
        contexts = stat["contexts"]
        unique_contexts = sorted({ctx.strip() for ctx in contexts if ctx})

        summary_lines = [
            f"Observed {selected}/{total} historical decisions favouring {pattern.pattern_name} for '{decision_point}'.",
            f"Estimated confidence: {confidence:.2%}.",
        ]
        if unique_contexts:
            summary_lines.append("Representative contexts: " + ", ".join(unique_contexts[:3]))
        if pattern.success_rate is not None:
            summary_lines.append(f"Historical success rate: {pattern.success_rate:.2%}.")

        return " \n".join(summary_lines)


__all__ = [
    "ArchitecturalPatternRecognizer",
    "PatternRecommendationResult",
]
