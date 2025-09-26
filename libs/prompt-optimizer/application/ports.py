"""Port interfaces for prompt optimization following hexagonal architecture."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

from ..domain.entities import (
    FeedbackRecord,
    ModelType,
    OptimizationGoal,
    OptimizationResult,
    Prompt,
    PromptId,
    PromptOptimizationSession,
    TokenCount,
)


class TokenCounterPort(ABC):
    """Port for accurate token counting services."""

    @abstractmethod
    async def count_tokens(self, content: str, model: ModelType) -> TokenCount:
        """Count tokens accurately for the specified model."""
        pass

    @abstractmethod
    async def estimate_cost(self, token_count: int, model: ModelType) -> float:
        """Estimate the cost for the given token count and model."""
        pass


class PromptRepositoryPort(ABC):
    """Port for prompt persistence and retrieval."""

    @abstractmethod
    async def save_prompt(self, prompt: Prompt) -> None:
        """Save a prompt to persistent storage."""
        pass

    @abstractmethod
    async def get_prompt(self, prompt_id: PromptId) -> Prompt | None:
        """Retrieve a prompt by its ID."""
        pass

    @abstractmethod
    async def find_prompts_by_content_hash(self, content_hash: str) -> list[Prompt]:
        """Find prompts with similar content."""
        pass

    @abstractmethod
    async def get_recent_prompts(self, limit: int = 10) -> list[Prompt]:
        """Get recently analyzed prompts."""
        pass


class MLModelPort(ABC):
    """Port for machine learning model interactions."""

    @abstractmethod
    async def predict_effectiveness(self, features: dict[str, Any]) -> float:
        """Predict prompt effectiveness using ML model."""
        pass

    @abstractmethod
    async def generate_optimization_suggestions(
        self,
        prompt_content: str,
        goal: OptimizationGoal
    ) -> list[str]:
        """Generate optimization suggestions using ML."""
        pass

    @abstractmethod
    async def learn_from_feedback(self, feedback: FeedbackRecord) -> None:
        """Update model based on user feedback."""
        pass


class TemporalDatabasePort(ABC):
    """Port for temporal database operations."""

    @abstractmethod
    async def store_prompt_analysis(
        self,
        prompt: Prompt,
        timestamp: datetime
    ) -> None:
        """Store prompt analysis results in temporal database."""
        pass

    @abstractmethod
    async def store_optimization_session(
        self,
        session: PromptOptimizationSession
    ) -> None:
        """Store optimization session data."""
        pass

    @abstractmethod
    async def get_similar_prompts(
        self,
        features: dict[str, Any],
        similarity_threshold: float = 0.7
    ) -> list[Prompt]:
        """Find similar prompts based on features."""
        pass

    @abstractmethod
    async def get_optimization_patterns(
        self,
        goal: OptimizationGoal,
        days_back: int = 90
    ) -> list[dict[str, Any]]:
        """Get optimization patterns from historical data."""
        pass


class NotificationPort(ABC):
    """Port for notifications and events."""

    @abstractmethod
    async def notify_optimization_complete(
        self,
        result: OptimizationResult
    ) -> None:
        """Notify when optimization is complete."""
        pass

    @abstractmethod
    async def notify_model_updated(self, model_version: str) -> None:
        """Notify when ML model is updated."""
        pass
