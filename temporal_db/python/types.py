# mypy: ignore-errors
# temporal_db/python/types.py
"""
Type definitions for the temporal database Python bindings.

These mirror the Rust types defined in temporal_db/schema.rs
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Any


class SpecificationType(Enum):
    """Type of specification document."""

    ADR = "ADR"
    PRD = "PRD"
    SDS = "SDS"
    TS = "TS"


class PatternType(Enum):
    """Type of architectural pattern."""

    DOMAIN = "Domain"
    APPLICATION = "Application"
    INFRASTRUCTURE = "Infrastructure"
    INTERFACE = "Interface"


class ChangeType(Enum):
    """Type of change in the temporal database."""

    CREATE = "Create"
    UPDATE = "Update"
    DELETE = "Delete"
    DECISION = "Decision"
    PATTERN = "Pattern"


@dataclass
class SpecificationRecord:
    """A specification record stored in the temporal database."""

    id: str
    spec_type: SpecificationType
    identifier: str  # e.g., 'ADR-MERGE-001'
    title: str
    content: str
    template_variables: dict[str, Any]
    timestamp: datetime
    version: int
    author: str | None
    matrix_ids: list[str]
    metadata: dict[str, Any]
    hash: str

    @classmethod
    def create(
        cls,
        spec_type: SpecificationType,
        identifier: str,
        title: str,
        content: str,
        author: str | None = None,
    ) -> "SpecificationRecord":
        """Create a new specification record."""
        import hashlib

        spec_id = str(uuid.uuid4())
        timestamp = datetime.now(UTC)
        content_hash = hashlib.md5(content.encode()).hexdigest()

        return cls(
            id=spec_id,
            spec_type=spec_type,
            identifier=identifier,
            title=title,
            content=content,
            template_variables={},
            timestamp=timestamp,
            version=1,
            author=author,
            matrix_ids=[],
            metadata={},
            hash=content_hash,
        )

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "spec_type": self.spec_type.value,
            "identifier": self.identifier,
            "title": self.title,
            "content": self.content,
            "template_variables": self.template_variables,
            "timestamp": self.timestamp.isoformat(),
            "version": self.version,
            "author": self.author,
            "matrix_ids": self.matrix_ids,
            "metadata": self.metadata,
            "hash": self.hash,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "SpecificationRecord":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            spec_type=SpecificationType(data["spec_type"]),
            identifier=data["identifier"],
            title=data["title"],
            content=data["content"],
            template_variables=data["template_variables"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            version=data["version"],
            author=data.get("author"),
            matrix_ids=data["matrix_ids"],
            metadata=data["metadata"],
            hash=data["hash"],
        )


@dataclass
class SpecificationChange:
    """A change record in the temporal database."""

    spec_id: str
    change_type: ChangeType
    field: str
    old_value: str | None
    new_value: str
    author: str
    context: str
    confidence: float | None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "spec_id": self.spec_id,
            "change_type": self.change_type.value,
            "field": self.field,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "author": self.author,
            "context": self.context,
            "confidence": self.confidence,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "SpecificationChange":
        """Create from dictionary."""
        return cls(
            spec_id=data["spec_id"],
            change_type=ChangeType(data["change_type"]),
            field=data["field"],
            old_value=data.get("old_value"),
            new_value=data["new_value"],
            author=data["author"],
            context=data["context"],
            confidence=data.get("confidence"),
        )


@dataclass
class ArchitecturalPattern:
    """An architectural pattern stored in the temporal database."""

    id: str
    pattern_name: str
    pattern_type: PatternType
    context_similarity: float  # 0.0 to 1.0
    usage_frequency: int
    success_rate: float | None
    last_used: datetime | None
    pattern_definition: dict[str, Any]
    examples: list[str]
    metadata: dict[str, Any]

    @classmethod
    def create(
        cls,
        pattern_name: str,
        pattern_type: PatternType,
        pattern_definition: dict[str, Any],
    ) -> "ArchitecturalPattern":
        """Create a new architectural pattern."""
        return cls(
            id=str(uuid.uuid4()),
            pattern_name=pattern_name,
            pattern_type=pattern_type,
            context_similarity=0.0,
            usage_frequency=0,
            success_rate=None,
            last_used=None,
            pattern_definition=pattern_definition,
            examples=[],
            metadata={},
        )

    def use_pattern(self) -> None:
        """Mark pattern as used."""
        self.usage_frequency += 1
        self.last_used = datetime.now(UTC)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "pattern_name": self.pattern_name,
            "pattern_type": self.pattern_type.value,
            "context_similarity": self.context_similarity,
            "usage_frequency": self.usage_frequency,
            "success_rate": self.success_rate,
            "last_used": self.last_used.isoformat() if self.last_used else None,
            "pattern_definition": self.pattern_definition,
            "examples": self.examples,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ArchitecturalPattern":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            pattern_name=data["pattern_name"],
            pattern_type=PatternType(data["pattern_type"]),
            context_similarity=data["context_similarity"],
            usage_frequency=data["usage_frequency"],
            success_rate=data.get("success_rate"),
            last_used=datetime.fromisoformat(data["last_used"]) if data.get("last_used") else None,
            pattern_definition=data["pattern_definition"],
            examples=data["examples"],
            metadata=data["metadata"],
        )


@dataclass
class DecisionPoint:
    """A decision point in the specification process."""

    id: str
    specification_id: str
    decision_point: str
    context: str
    timestamp: datetime
    metadata: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "specification_id": self.specification_id,
            "decision_point": self.decision_point,
            "context": self.context,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "DecisionPoint":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            specification_id=data["specification_id"],
            decision_point=data["decision_point"],
            context=data["context"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            metadata=data["metadata"],
        )


@dataclass
class DecisionOption:
    """A decision option for a decision point."""

    id: str
    decision_point_id: str
    option_name: str
    description: str | None
    pros: list[str]
    cons: list[str]
    selected: bool
    selection_rationale: str | None
    timestamp: datetime

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "decision_point_id": self.decision_point_id,
            "option_name": self.option_name,
            "description": self.description,
            "pros": self.pros,
            "cons": self.cons,
            "selected": self.selected,
            "selection_rationale": self.selection_rationale,
            "timestamp": self.timestamp.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "DecisionOption":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            decision_point_id=data["decision_point_id"],
            option_name=data["option_name"],
            description=data.get("description"),
            pros=data["pros"],
            cons=data["cons"],
            selected=data["selected"],
            selection_rationale=data.get("selection_rationale"),
            timestamp=datetime.fromisoformat(data["timestamp"]),
        )


@dataclass
class PatternRecommendation:
    """A generated pattern recommendation entry."""

    id: str
    pattern_name: str
    decision_point: str
    confidence: float
    provenance: str
    rationale: str
    created_at: datetime
    expires_at: datetime
    metadata: dict[str, Any]

    @classmethod
    def create(
        cls,
        *,
        pattern_name: str,
        decision_point: str,
        confidence: float,
        provenance: str,
        rationale: str,
        ttl_days: int,
        metadata: dict[str, Any] | None = None,
    ) -> "PatternRecommendation":
        """Create a new recommendation instance with calculated identifiers."""

        recommendation_id = str(uuid.uuid4())
        created_at = datetime.now(UTC)
        expires_at = created_at + timedelta(days=max(1, ttl_days))

        return cls(
            id=recommendation_id,
            pattern_name=pattern_name,
            decision_point=decision_point,
            confidence=max(0.0, min(1.0, confidence)),
            provenance=provenance,
            rationale=rationale,
            created_at=created_at,
            expires_at=expires_at,
            metadata=metadata or {},
        )

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary representation."""

        return {
            "id": self.id,
            "pattern_name": self.pattern_name,
            "decision_point": self.decision_point,
            "confidence": self.confidence,
            "provenance": self.provenance,
            "rationale": self.rationale,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "PatternRecommendation":
        """Rehydrate recommendation from raw dictionary data."""

        return cls(
            id=data["id"],
            pattern_name=data["pattern_name"],
            decision_point=data["decision_point"],
            confidence=float(data["confidence"]),
            provenance=data["provenance"],
            rationale=data["rationale"],
            created_at=datetime.fromisoformat(data["created_at"]),
            expires_at=datetime.fromisoformat(data["expires_at"]),
            metadata=data.get("metadata", {}),
        )

    def with_adjusted_confidence(self, delta: float) -> "PatternRecommendation":
        """Return a new instance with confidence adjusted by delta."""

        return PatternRecommendation(
            id=self.id,
            pattern_name=self.pattern_name,
            decision_point=self.decision_point,
            confidence=max(0.0, min(1.0, self.confidence + delta)),
            provenance=self.provenance,
            rationale=self.rationale,
            created_at=self.created_at,
            expires_at=self.expires_at,
            metadata=self.metadata,
        )
