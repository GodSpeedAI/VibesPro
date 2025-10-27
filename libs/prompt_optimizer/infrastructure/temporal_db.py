"""Temporal database adapters using redb instead of tsink."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import TypedDict, cast

from ..application.ports import (
    MLFeatures,
    OptimizationPattern,
    TemporalDatabasePort,
)
from ..domain.entities import (
    EffectivenessScore,
    ModelType,
    OptimizationGoal,
    Prompt,
    PromptFeatures,
    PromptOptimizationSession,
    TokenCount,
)


class PromptFeaturesJSON(TypedDict):
    """Serialized representation of prompt features."""

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


class TokenCountJSON(TypedDict):
    """Serialized representation of token count information."""

    total_tokens: int
    model: ModelType
    estimated_cost: float
    token_distribution: dict[str, int]


class EffectivenessScoreJSON(TypedDict):
    """Serialized representation of effectiveness metrics."""

    overall_score: float
    clarity_score: float
    specificity_score: float
    completeness_score: float


_PROMPT_FILE_PREFIX = "prompt_analysis"


class PromptRecord(TypedDict):
    """Serialized prompt analysis record stored on disk."""

    id: str
    content: str
    timestamp: str
    features: PromptFeaturesJSON | None
    token_count: TokenCountJSON | None
    effectiveness_score: EffectivenessScoreJSON | None
    optimization_suggestions: list[str]
    metadata: dict[str, object]


def _features_to_json(features: PromptFeatures) -> PromptFeaturesJSON:
    """Convert domain prompt features into a serializable structure."""
    return {
        "token_count": features.token_count,
        "sentence_count": features.sentence_count,
        "avg_sentence_length": float(features.avg_sentence_length),
        "instruction_clarity": float(features.instruction_clarity),
        "context_completeness": float(features.context_completeness),
        "task_specificity": float(features.task_specificity),
        "role_definition": features.role_definition,
        "example_count": features.example_count,
        "constraint_clarity": float(features.constraint_clarity),
        "readability_score": float(features.readability_score),
        "ambiguity_score": float(features.ambiguity_score),
        "directive_strength": float(features.directive_strength),
    }


def _token_count_to_json(token_count: TokenCount) -> TokenCountJSON:
    """Convert domain token count data into a serializable structure."""
    return {
        "total_tokens": token_count.total_tokens,
        "model": token_count.model,
        "estimated_cost": float(token_count.estimated_cost),
        "token_distribution": dict(token_count.token_distribution),
    }


def _effectiveness_score_to_json(score: EffectivenessScore) -> EffectivenessScoreJSON:
    """Convert domain effectiveness score into a serializable structure."""
    return {
        "overall_score": float(score.overall_score),
        "clarity_score": float(score.clarity_score),
        "specificity_score": float(score.specificity_score),
        "completeness_score": float(score.completeness_score),
    }


def _build_prompt_record(prompt: Prompt, timestamp: datetime) -> PromptRecord:
    """Create a prompt record from the domain entity."""
    return {
        "id": str(prompt.id),
        "content": prompt.content,
        "timestamp": timestamp.isoformat(),
        "features": _features_to_json(prompt.features) if prompt.features else None,
        "token_count": _token_count_to_json(prompt.token_count) if prompt.token_count else None,
        "effectiveness_score": (
            _effectiveness_score_to_json(prompt.effectiveness_score)
            if prompt.effectiveness_score
            else None
        ),
        "optimization_suggestions": list(prompt.optimization_suggestions),
        "metadata": dict(prompt.metadata),
    }


def _features_from_json(value: object) -> PromptFeaturesJSON | None:
    """Deserialize persisted prompt features."""
    if value is None:
        return None
    if not isinstance(value, dict):
        return None

    token_count = value.get("token_count")
    sentence_count = value.get("sentence_count")
    avg_sentence_length = value.get("avg_sentence_length")
    instruction_clarity = value.get("instruction_clarity")
    context_completeness = value.get("context_completeness")
    task_specificity = value.get("task_specificity")
    role_definition = value.get("role_definition")
    example_count = value.get("example_count")
    constraint_clarity = value.get("constraint_clarity")
    readability_score = value.get("readability_score")
    ambiguity_score = value.get("ambiguity_score")
    directive_strength = value.get("directive_strength")

    if not isinstance(token_count, int):
        return None
    if not isinstance(sentence_count, int):
        return None
    if not isinstance(role_definition, bool):
        return None
    if not isinstance(example_count, int):
        return None

    if not isinstance(avg_sentence_length, int | float):
        return None
    if not isinstance(instruction_clarity, int | float):
        return None
    if not isinstance(context_completeness, int | float):
        return None
    if not isinstance(task_specificity, int | float):
        return None
    if not isinstance(constraint_clarity, int | float):
        return None
    if not isinstance(readability_score, int | float):
        return None
    if not isinstance(ambiguity_score, int | float):
        return None
    if not isinstance(directive_strength, int | float):
        return None

    return {
        "token_count": token_count,
        "sentence_count": sentence_count,
        "avg_sentence_length": float(avg_sentence_length),
        "instruction_clarity": float(instruction_clarity),
        "context_completeness": float(context_completeness),
        "task_specificity": float(task_specificity),
        "role_definition": role_definition,
        "example_count": example_count,
        "constraint_clarity": float(constraint_clarity),
        "readability_score": float(readability_score),
        "ambiguity_score": float(ambiguity_score),
        "directive_strength": float(directive_strength),
    }


def _token_count_from_json(value: object) -> TokenCountJSON | None:
    """Deserialize persisted token count information."""
    if value is None:
        return None
    if not isinstance(value, dict):
        return None

    total_tokens = value.get("total_tokens")
    model = value.get("model")
    estimated_cost = value.get("estimated_cost")
    token_distribution_raw = value.get("token_distribution")

    if not isinstance(total_tokens, int):
        return None
    if not isinstance(model, str):
        return None
    if not isinstance(estimated_cost, int | float):
        return None
    if not isinstance(token_distribution_raw, dict):
        return None

    token_distribution: dict[str, int] = {}
    for key, token_value in token_distribution_raw.items():
        if not isinstance(key, str):
            return None
        if not isinstance(token_value, int):
            return None
        token_distribution[key] = token_value

    try:
        model_enum = ModelType(model)
    except ValueError:
        return None

    return {
        "total_tokens": total_tokens,
        "model": model_enum,
        "estimated_cost": float(estimated_cost),
        "token_distribution": token_distribution,
    }


def _effectiveness_score_from_json(value: object) -> EffectivenessScoreJSON | None:
    """Deserialize persisted effectiveness metrics."""
    if value is None:
        return None
    if not isinstance(value, dict):
        return None

    overall_score = value.get("overall_score")
    clarity_score = value.get("clarity_score")
    specificity_score = value.get("specificity_score")
    completeness_score = value.get("completeness_score")

    if not isinstance(overall_score, int | float):
        return None
    if not isinstance(clarity_score, int | float):
        return None
    if not isinstance(specificity_score, int | float):
        return None
    if not isinstance(completeness_score, int | float):
        return None

    return {
        "overall_score": float(overall_score),
        "clarity_score": float(clarity_score),
        "specificity_score": float(specificity_score),
        "completeness_score": float(completeness_score),
    }


def _ensure_str_list(value: object) -> list[str] | None:
    """Ensure the value is a list of strings."""
    if not isinstance(value, list):
        return None
    results: list[str] = []
    for item in value:
        if not isinstance(item, str):
            return None
        results.append(item)
    return results


def _ensure_metadata(value: object) -> dict[str, object] | None:
    """Ensure the metadata payload has string keys."""
    if not isinstance(value, dict):
        return None
    metadata: dict[str, object] = {}
    for key, item in value.items():
        if not isinstance(key, str):
            return None
        metadata[key] = item
    return metadata


def _prompt_record_from_json(value: object) -> PromptRecord | None:
    """Attempt to deserialize a prompt record stored on disk."""
    if not isinstance(value, dict):
        return None

    record_id = value.get("id")
    content = value.get("content")
    timestamp = value.get("timestamp")
    optimization_suggestions = _ensure_str_list(value.get("optimization_suggestions"))
    metadata = _ensure_metadata(value.get("metadata"))

    if not isinstance(record_id, str):
        return None
    if not isinstance(content, str):
        return None
    if not isinstance(timestamp, str):
        return None
    if optimization_suggestions is None:
        return None
    if metadata is None:
        return None

    try:
        datetime.fromisoformat(timestamp)
    except ValueError:
        return None

    features = _features_from_json(value.get("features"))
    token_count = _token_count_from_json(value.get("token_count"))
    effectiveness_score = _effectiveness_score_from_json(value.get("effectiveness_score"))

    return {
        "id": record_id,
        "content": content,
        "timestamp": timestamp,
        "features": features,
        "token_count": token_count,
        "effectiveness_score": effectiveness_score,
        "optimization_suggestions": optimization_suggestions,
        "metadata": metadata,
    }


def _prompt_record_to_serializable(record: PromptRecord) -> dict[str, object]:
    """Convert an in-memory prompt record into a JSON-serializable dictionary."""
    serialized: dict[str, object] = {
        "id": record["id"],
        "content": record["content"],
        "timestamp": record["timestamp"],
        "optimization_suggestions": list(record["optimization_suggestions"]),
        "metadata": dict(record["metadata"]),
    }

    features = record["features"]
    if features is None:
        serialized["features"] = None
    else:
        serialized["features"] = {
            "token_count": features["token_count"],
            "sentence_count": features["sentence_count"],
            "avg_sentence_length": features["avg_sentence_length"],
            "instruction_clarity": features["instruction_clarity"],
            "context_completeness": features["context_completeness"],
            "task_specificity": features["task_specificity"],
            "role_definition": features["role_definition"],
            "example_count": features["example_count"],
            "constraint_clarity": features["constraint_clarity"],
            "readability_score": features["readability_score"],
            "ambiguity_score": features["ambiguity_score"],
            "directive_strength": features["directive_strength"],
        }

    token_count = record["token_count"]
    if token_count is None:
        serialized["token_count"] = None
    else:
        serialized["token_count"] = {
            "total_tokens": token_count["total_tokens"],
            "model": token_count["model"].value,
            "estimated_cost": token_count["estimated_cost"],
            "token_distribution": dict(token_count["token_distribution"]),
        }

    effectiveness_score = record["effectiveness_score"]
    if effectiveness_score is None:
        serialized["effectiveness_score"] = None
    else:
        serialized["effectiveness_score"] = {
            "overall_score": effectiveness_score["overall_score"],
            "clarity_score": effectiveness_score["clarity_score"],
            "specificity_score": effectiveness_score["specificity_score"],
            "completeness_score": effectiveness_score["completeness_score"],
        }

    return serialized


def _record_sort_key(record: PromptRecord) -> datetime:
    """Sorting key helper for prompt records."""
    return datetime.fromisoformat(record["timestamp"])


def _parse_prompt_filename(path: Path) -> tuple[str, datetime] | None:
    """Extract the prompt identifier and timestamp from a filename."""
    stem = path.stem
    if not stem.startswith(f"{_PROMPT_FILE_PREFIX}:"):
        return None

    parts = stem.split(":")
    if len(parts) != 3:
        return None

    timestamp_str = parts[1].replace("_", ":")
    try:
        timestamp = datetime.fromisoformat(timestamp_str)
    except ValueError:
        return None

    prompt_id = parts[2]
    return prompt_id, timestamp


class JsonFileStorage(TemporalDatabasePort):
    """JSON file-based temporal database for storing prompt analysis data."""

    def __init__(self, db_path: str):
        """Initialize the JSON file storage."""
        self.db_path = Path(db_path)
        self.db_path.mkdir(parents=True, exist_ok=True)

    def _get_prompt_filepath(self, prompt_id: str, timestamp: datetime) -> Path:
        """Generate a unique filepath for a prompt record."""
        sanitized_timestamp = timestamp.isoformat().replace(":", "_")
        key = f"{_PROMPT_FILE_PREFIX}:{sanitized_timestamp}:{prompt_id}"
        return self.db_path / f"{key}.json"

    async def store_prompt_analysis(self, prompt: Prompt, timestamp: datetime) -> None:
        """Store prompt analysis results in a JSON file."""
        filepath = self._get_prompt_filepath(str(prompt.id), timestamp)
        record = _build_prompt_record(prompt, timestamp)
        serialized = json.dumps(_prompt_record_to_serializable(record), indent=4)
        filepath.write_text(f"{serialized}\n", encoding="utf-8")

    async def retrieve_recent_prompts(self, time_window: timedelta) -> list[dict[str, object]]:
        """Retrieve recent prompts from JSON files."""
        now = datetime.now(UTC)
        records: list[PromptRecord] = []

        for prompt_path in self.db_path.glob(f"{_PROMPT_FILE_PREFIX}:*.json"):
            parsed = _parse_prompt_filename(prompt_path)
            if parsed is None:
                continue

            _, timestamp = parsed
            if now - timestamp > time_window:
                continue

            try:
                raw_text = prompt_path.read_text(encoding="utf-8")
            except OSError:
                continue

            try:
                raw = cast(object, json.loads(raw_text))
            except json.JSONDecodeError:
                continue

            record = _prompt_record_from_json(raw)
            if record is not None:
                records.append(record)

        sorted_records = sorted(records, key=_record_sort_key, reverse=True)

        return [_prompt_record_to_serializable(record) for record in sorted_records]

    async def store_optimization_session(self, session: PromptOptimizationSession) -> None:
        """Store a prompt optimization session (placeholder)."""
        # This method can be implemented if session storage is needed.
        pass

    async def get_optimization_session(self, session_id: str) -> dict[str, object] | None:
        """Retrieve a prompt optimization session by its ID (placeholder)."""
        # This method can be implemented if session retrieval is needed.
        return None

    async def get_similar_prompts(
        self, features: MLFeatures, similarity_threshold: float = 0.7
    ) -> list[Prompt]:
        """Find similar prompts based on features (placeholder)."""
        # This is a placeholder and would require a proper implementation
        # of feature comparison in a real-world scenario.
        return []

    async def get_optimization_patterns(
        self, goal: OptimizationGoal, days_back: int = 90
    ) -> list[OptimizationPattern]:
        """Get optimization patterns from historical data (placeholder)."""
        # This is a placeholder. A real implementation would analyze
        # historical data to identify patterns.
        return []
