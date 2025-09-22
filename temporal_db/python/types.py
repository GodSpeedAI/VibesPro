# temporal_db/python/types.py
"""
Type definitions for the temporal database Python bindings.

These mirror the Rust types defined in temporal_db/schema.rs
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
from dataclasses import dataclass
import uuid


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
    template_variables: Dict[str, Any]
    timestamp: datetime
    version: int
    author: Optional[str]
    matrix_ids: List[str]
    metadata: Dict[str, Any]
    hash: str

    @classmethod
    def create(
        cls,
        spec_type: SpecificationType,
        identifier: str,
        title: str,
        content: str,
        author: Optional[str] = None,
    ) -> "SpecificationRecord":
        """Create a new specification record."""
        import hashlib

        spec_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)
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

    def to_dict(self) -> Dict[str, Any]:
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
    def from_dict(cls, data: Dict[str, Any]) -> "SpecificationRecord":
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
    old_value: Optional[str]
    new_value: str
    author: str
    context: str
    confidence: Optional[float]

    def to_dict(self) -> Dict[str, Any]:
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
    def from_dict(cls, data: Dict[str, Any]) -> "SpecificationChange":
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
    success_rate: Optional[float]
    last_used: Optional[datetime]
    pattern_definition: Dict[str, Any]
    examples: List[str]
    metadata: Dict[str, Any]

    @classmethod
    def create(
        cls,
        pattern_name: str,
        pattern_type: PatternType,
        pattern_definition: Dict[str, Any],
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
        self.last_used = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
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
    def from_dict(cls, data: Dict[str, Any]) -> "ArchitecturalPattern":
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
    metadata: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
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
    def from_dict(cls, data: Dict[str, Any]) -> "DecisionPoint":
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
    description: Optional[str]
    pros: List[str]
    cons: List[str]
    selected: bool
    selection_rationale: Optional[str]
    timestamp: datetime

    def to_dict(self) -> Dict[str, Any]:
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
    def from_dict(cls, data: Dict[str, Any]) -> "DecisionOption":
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
