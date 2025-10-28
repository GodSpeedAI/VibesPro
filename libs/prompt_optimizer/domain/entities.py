"""Domain entities for prompt optimization following DDD patterns."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4


class OptimizationGoal(StrEnum):
    """Enumeration of prompt optimization objectives."""

    CLARITY = "clarity"
    CONCISENESS = "conciseness"
    EFFECTIVENESS = "effectiveness"
    TOKEN_EFFICIENCY = "token_efficiency"


class ModelType(StrEnum):
    """Supported AI model types for token counting."""

    GPT_4 = "gpt-4"
    GPT_4_TURBO = "gpt-4-turbo"
    GPT_3_5_TURBO = "gpt-3.5-turbo"
    CLAUDE_3_OPUS = "claude-3-opus"
    CLAUDE_3_SONNET = "claude-3-sonnet"


@dataclass(frozen=True)
class PromptId:
    """Value object representing a unique prompt identifier."""

    value: UUID = field(default_factory=uuid4)

    def __str__(self) -> str:
        return str(self.value)


@dataclass(frozen=True)
class TokenCount:
    """Value object representing token counting results."""

    total_tokens: int
    model: ModelType
    estimated_cost: float
    token_distribution: dict[str, int]

    def __post_init__(self) -> None:
        if self.total_tokens < 0:
            raise ValueError("Token count cannot be negative")
        if self.estimated_cost < 0:
            raise ValueError("Estimated cost cannot be negative")


@dataclass(frozen=True)
class EffectivenessScore:
    """Value object representing prompt effectiveness metrics."""

    overall_score: float  # 0.0 to 100.0
    clarity_score: float
    specificity_score: float
    completeness_score: float

    def __post_init__(self) -> None:
        scores = [
            self.overall_score,
            self.clarity_score,
            self.specificity_score,
            self.completeness_score,
        ]
        for score in scores:
            if not 0.0 <= score <= 100.0:
                raise ValueError(f"Score must be between 0.0 and 100.0, got {score}")


@dataclass(frozen=True)
class PromptFeatures:
    """Value object containing extracted prompt features for ML analysis."""

    token_count: int
    sentence_count: int
    avg_sentence_length: float
    instruction_clarity: float
    context_completeness: float
    task_specificity: float
    role_definition: bool
    example_count: int
    constraint_clarity: float
    readability_score: float
    ambiguity_score: float
    directive_strength: float

    def to_dict(self) -> dict[str, int | float]:
        """Convert features to dictionary for ML processing."""
        return {
            "token_count": self.token_count,
            "sentence_count": self.sentence_count,
            "avg_sentence_length": self.avg_sentence_length,
            "instruction_clarity": self.instruction_clarity,
            "context_completeness": self.context_completeness,
            "task_specificity": self.task_specificity,
            "role_definition": float(self.role_definition),
            "example_count": self.example_count,
            "constraint_clarity": self.constraint_clarity,
            "readability_score": self.readability_score,
            "ambiguity_score": self.ambiguity_score,
            "directive_strength": self.directive_strength,
        }


type MetadataValue = object


@dataclass
class Prompt:
    """Domain entity representing a prompt for optimization."""

    id: PromptId
    content: str
    created_at: datetime
    features: PromptFeatures | None = None
    token_count: TokenCount | None = None
    effectiveness_score: EffectivenessScore | None = None
    optimization_suggestions: list[str] = field(default_factory=list)
    metadata: dict[str, MetadataValue] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.content.strip():
            raise ValueError("Prompt content cannot be empty")

    def update_features(self, features: PromptFeatures) -> None:
        """Update the prompt's extracted features."""
        self.features = features

    def update_token_count(self, token_count: TokenCount) -> None:
        """Update the prompt's token count information."""
        self.token_count = token_count

    def update_effectiveness_score(self, score: EffectivenessScore) -> None:
        """Update the prompt's effectiveness assessment."""
        self.effectiveness_score = score

    def add_optimization_suggestion(self, suggestion: str) -> None:
        """Add an optimization suggestion to the prompt."""
        if suggestion.strip() and suggestion not in self.optimization_suggestions:
            self.optimization_suggestions.append(suggestion)

    def is_analyzed(self) -> bool:
        """Check if the prompt has been fully analyzed."""
        return all(
            [
                self.features is not None,
                self.token_count is not None,
                self.effectiveness_score is not None,
            ]
        )


@dataclass(frozen=True)
class OptimizationResult:
    """Value object representing the result of prompt optimization."""

    original_prompt: Prompt
    optimized_content: str
    improvements: list[str]
    token_savings: int
    effectiveness_improvement: float
    alternative_versions: list[str]
    optimization_goal: OptimizationGoal
    confidence_score: float

    def __post_init__(self) -> None:
        if not 0.0 <= self.confidence_score <= 1.0:
            raise ValueError("Confidence score must be between 0.0 and 1.0")


@dataclass
class PromptOptimizationSession:
    """Domain entity representing an optimization session."""

    id: UUID
    prompts: list[Prompt]
    optimization_goal: OptimizationGoal
    target_model: ModelType
    started_at: datetime
    completed_at: datetime | None = None
    results: list[OptimizationResult] = field(default_factory=list)

    def add_prompt(self, prompt: Prompt) -> None:
        """Add a prompt to the optimization session."""
        if prompt not in self.prompts:
            self.prompts.append(prompt)

    def add_result(self, result: OptimizationResult) -> None:
        """Add an optimization result to the session."""
        self.results.append(result)

    def complete_session(self) -> None:
        """Mark the optimization session as completed."""
        self.completed_at = datetime.now(UTC)

    def is_completed(self) -> bool:
        """Check if the optimization session is completed."""
        return self.completed_at is not None


@dataclass(frozen=True)
class FeedbackRecord:
    """Value object for collecting user feedback on optimization results."""

    result_id: UUID
    user_satisfaction: float  # 0.0 to 10.0
    response_quality: float  # 0.0 to 10.0
    comments: str | None = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))

    def __post_init__(self) -> None:
        if not 0.0 <= self.user_satisfaction <= 10.0:
            raise ValueError("User satisfaction must be between 0.0 and 10.0")
        if not 0.0 <= self.response_quality <= 10.0:
            raise ValueError("Response quality must be between 0.0 and 10.0")
