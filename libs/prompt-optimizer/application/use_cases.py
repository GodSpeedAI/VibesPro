"""Use cases for prompt optimization following hexagonal architecture."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from ..domain.entities import (
    FeedbackRecord,
    ModelType,
    OptimizationGoal,
    OptimizationResult,
    Prompt,
    PromptId,
    PromptOptimizationSession,
)
from ..domain.services import PromptAnalyzer, PromptFeatureExtractor, PromptOptimizer
from .ports import (
    MLModelPort,
    NotificationPort,
    PromptRepositoryPort,
    TemporalDatabasePort,
    TokenCounterPort,
)


@dataclass
class AnalyzePromptCommand:
    """Command for analyzing a prompt."""
    content: str
    model: ModelType = ModelType.GPT_4
    store_result: bool = True


@dataclass
class OptimizePromptCommand:
    """Command for optimizing a prompt."""
    content: str
    goal: OptimizationGoal
    model: ModelType = ModelType.GPT_4
    use_ml_suggestions: bool = True


@dataclass
class SubmitFeedbackCommand:
    """Command for submitting feedback on optimization results."""
    result_id: str
    user_satisfaction: float
    response_quality: float
    comments: str | None = None


class AnalyzePromptUseCase:
    """Use case for analyzing prompt effectiveness and characteristics."""

    def __init__(
        self,
        token_counter: TokenCounterPort,
        prompt_repository: PromptRepositoryPort,
        temporal_db: TemporalDatabasePort,
        feature_extractor: PromptFeatureExtractor,
        analyzer: PromptAnalyzer
    ):
        self.token_counter = token_counter
        self.prompt_repository = prompt_repository
        self.temporal_db = temporal_db
        self.feature_extractor = feature_extractor
        self.analyzer = analyzer

    async def execute(self, command: AnalyzePromptCommand) -> Prompt:
        """Execute prompt analysis."""
        # Create prompt entity
        prompt = Prompt(
            id=PromptId(),
            content=command.content,
            created_at=datetime.now(UTC)
        )

        # Extract features
        features = self.feature_extractor.extract_features(prompt)
        prompt.update_features(features)

        # Count tokens accurately
        token_count = await self.token_counter.count_tokens(
            command.content, command.model
        )
        prompt.update_token_count(token_count)

        # Analyze effectiveness
        effectiveness = self.analyzer.analyze_effectiveness(prompt)
        prompt.update_effectiveness_score(effectiveness)

        # Store results if requested
        if command.store_result:
            await self.prompt_repository.save_prompt(prompt)
            await self.temporal_db.store_prompt_analysis(
                prompt, datetime.now(UTC)
            )

        return prompt


class OptimizePromptUseCase:
    """Use case for optimizing prompts based on specific goals."""

    def __init__(
        self,
        analyze_use_case: AnalyzePromptUseCase,
        ml_model: MLModelPort,
        temporal_db: TemporalDatabasePort,
        notification: NotificationPort,
        optimizer: PromptOptimizer
    ):
        self.analyze_use_case = analyze_use_case
        self.ml_model = ml_model
        self.temporal_db = temporal_db
        self.notification = notification
        self.optimizer = optimizer

    async def execute(self, command: OptimizePromptCommand) -> OptimizationResult:
        """Execute prompt optimization."""
        # First analyze the original prompt
        analyze_command = AnalyzePromptCommand(
            content=command.content,
            model=command.model,
            store_result=True
        )
        original_prompt = await self.analyze_use_case.execute(analyze_command)

        # Generate optimization suggestions
        domain_suggestions = self.optimizer.generate_optimization_suggestions(
            original_prompt, command.goal
        )

        ml_suggestions = []
        if command.use_ml_suggestions:
            ml_suggestions = await self.ml_model.generate_optimization_suggestions(
                command.content, command.goal
            )

        # Combine suggestions (remove duplicates)
        all_suggestions = list(set(domain_suggestions + ml_suggestions))

        # For now, generate a simple optimized version
        # In a real implementation, this would use sophisticated ML
        optimized_content = await self._generate_optimized_content(
            original_prompt, command.goal, all_suggestions
        )

        # Analyze optimized version
        optimized_analyze = AnalyzePromptCommand(
            content=optimized_content,
            model=command.model,
            store_result=False
        )
        optimized_prompt = await self.analyze_use_case.execute(optimized_analyze)

        # Calculate improvements
        token_savings = (
            original_prompt.token_count.total_tokens -
            optimized_prompt.token_count.total_tokens
            if original_prompt.token_count and optimized_prompt.token_count
            else 0
        )

        effectiveness_improvement = (
            optimized_prompt.effectiveness_score.overall_score -
            original_prompt.effectiveness_score.overall_score
            if original_prompt.effectiveness_score and optimized_prompt.effectiveness_score
            else 0.0
        )

        # Create result
        result = OptimizationResult(
            original_prompt=original_prompt,
            optimized_content=optimized_content,
            improvements=all_suggestions,
            token_savings=token_savings,
            effectiveness_improvement=effectiveness_improvement,
            alternative_versions=[],  # Would generate multiple alternatives
            optimization_goal=command.goal,
            confidence_score=0.8  # Would be calculated by ML model
        )

        # Notify completion
        await self.notification.notify_optimization_complete(result)

        return result

    async def _generate_optimized_content(
        self,
        prompt: Prompt,
        goal: OptimizationGoal,
        suggestions: list[str]
    ) -> str:
        """Generate optimized content based on suggestions."""
        # This is a simplified implementation
        # In practice, this would use sophisticated ML models

        content = prompt.content

        if goal == OptimizationGoal.CONCISENESS:
            # Remove filler words and redundancy
            filler_words = [
                "basically", "actually", "really", "very", "quite",
                "somewhat", "rather", "pretty", "fairly", "definitely"
            ]
            for word in filler_words:
                content = content.replace(f" {word} ", " ")

        elif goal == OptimizationGoal.CLARITY:
            # Add structure if missing
            if not any(marker in content.lower() for marker in ["1.", "2.", "•", "-"]):
                # Add basic structure
                sentences = content.split(". ")
                if len(sentences) > 2:
                    numbered_content: list[str] = []
                    for i, sentence in enumerate(sentences, 1):
                        if sentence.strip():
                            numbered_content.append(f"{i}. {sentence.strip()}")
                    content = "\n".join(numbered_content)

        return content.strip()


class CreateOptimizationSessionUseCase:
    """Use case for creating and managing optimization sessions."""

    def __init__(
        self,
        temporal_db: TemporalDatabasePort,
        optimize_use_case: OptimizePromptUseCase
    ):
        self.temporal_db = temporal_db
        self.optimize_use_case = optimize_use_case

    async def execute(
        self,
        prompts: list[str],
        goal: OptimizationGoal,
        model: ModelType = ModelType.GPT_4
    ) -> PromptOptimizationSession:
        """Create and execute an optimization session."""
        session = PromptOptimizationSession(
            id=uuid4(),
            prompts=[],
            optimization_goal=goal,
            target_model=model,
            started_at=datetime.now(UTC)
        )

        # Optimize each prompt
        for prompt_content in prompts:
            optimize_command = OptimizePromptCommand(
                content=prompt_content,
                goal=goal,
                model=model
            )

            result = await self.optimize_use_case.execute(optimize_command)
            session.add_prompt(result.original_prompt)
            session.add_result(result)

        # Complete session
        session.complete_session()

        # Store session
        await self.temporal_db.store_optimization_session(session)

        return session


class SubmitFeedbackUseCase:
    """Use case for collecting and processing user feedback."""

    def __init__(
        self,
        ml_model: MLModelPort,
        temporal_db: TemporalDatabasePort
    ):
        self.ml_model = ml_model
        self.temporal_db = temporal_db

    async def execute(self, command: SubmitFeedbackCommand) -> None:
        """Submit feedback for model improvement."""
        feedback = FeedbackRecord(
            result_id=uuid4(),  # Would map to actual result ID
            user_satisfaction=command.user_satisfaction,
            response_quality=command.response_quality,
            comments=command.comments
        )

        # Update ML model with feedback
        await self.ml_model.learn_from_feedback(feedback)


class GetSimilarPromptsUseCase:
    """Use case for finding similar prompts based on content."""

    def __init__(
        self,
        temporal_db: TemporalDatabasePort,
        feature_extractor: PromptFeatureExtractor
    ):
        self.temporal_db = temporal_db
        self.feature_extractor = feature_extractor

    async def execute(self, content: str, limit: int = 5) -> list[Prompt]:
        """Find prompts similar to the given content."""
        # Create temporary prompt to extract features
        temp_prompt = Prompt(
            id=PromptId(),
            content=content,
            created_at=datetime.now(UTC)
        )

        features = self.feature_extractor.extract_features(temp_prompt)

        # Find similar prompts
        similar_prompts = await self.temporal_db.get_similar_prompts(
            features.to_dict(),
            similarity_threshold=0.7
        )

        return similar_prompts[:limit]
