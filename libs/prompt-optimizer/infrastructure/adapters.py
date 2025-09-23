"""Adapters for external services following hexagonal architecture."""

from __future__ import annotations
import hashlib
import json
from datetime import datetime
from typing import Optional, Any
from uuid import UUID

from ..application.ports import TokenCounterPort, PromptRepositoryPort
from ..domain.entities import (
    Prompt, PromptId, TokenCount, ModelType
)


class TiktokenAdapter(TokenCounterPort):
    """Adapter for tiktoken-based accurate token counting."""

    def __init__(self):
        self._encodings: dict[str, Any] = {}
        self._model_costs: dict[ModelType, dict[str, float]] = {
            ModelType.GPT_4: {"input": 0.00003, "output": 0.00006},
            ModelType.GPT_4_TURBO: {"input": 0.00001, "output": 0.00003},
            ModelType.GPT_3_5_TURBO: {"input": 0.0000015, "output": 0.000002},
            ModelType.CLAUDE_3_OPUS: {"input": 0.000015, "output": 0.000075},
            ModelType.CLAUDE_3_SONNET: {"input": 0.000003, "output": 0.000015},
        }

    async def count_tokens(self, content: str, model: ModelType) -> TokenCount:
        """Count tokens accurately using tiktoken."""
        try:
            # Import tiktoken dynamically to avoid hard dependency
            import tiktoken  # type: ignore

            # Get appropriate encoding for model
            if model in [ModelType.GPT_4, ModelType.GPT_4_TURBO, ModelType.GPT_3_5_TURBO]:
                encoding = tiktoken.encoding_for_model(model.value)  # type: ignore
            else:
                # Use GPT-4 encoding as fallback for non-OpenAI models
                encoding = tiktoken.encoding_for_model("gpt-4")  # type: ignore

            # Encode and count tokens
            tokens = encoding.encode(content)  # type: ignore
            total_tokens = len(tokens)

            # Analyze token distribution
            decoded_tokens: list[str] = [encoding.decode([token]) for token in tokens]  # type: ignore
            token_distribution = self._analyze_token_distribution(decoded_tokens)

            # Estimate cost
            estimated_cost = await self.estimate_cost(total_tokens, model)

            return TokenCount(
                total_tokens=total_tokens,
                model=model,
                estimated_cost=estimated_cost,
                token_distribution=token_distribution
            )

        except ImportError:
            # Fallback to simple word-based estimation
            return await self._fallback_token_count(content, model)

    async def estimate_cost(self, token_count: int, model: ModelType) -> float:
        """Estimate cost based on token count and model pricing."""
        if model not in self._model_costs:
            return 0.0

        # Assume all tokens are input tokens for estimation
        cost_per_token = self._model_costs[model]["input"]
        return token_count * cost_per_token

    def _analyze_token_distribution(self, decoded_tokens: list[str]) -> dict[str, int]:
        """Analyze the distribution of token types."""
        distribution = {
            "words": 0,
            "punctuation": 0,
            "special": 0,
            "whitespace": 0
        }

        for token in decoded_tokens:
            if token.isalpha():
                distribution["words"] += 1
            elif token in ".,!?;:\"'()[]{}":
                distribution["punctuation"] += 1
            elif token.isspace():
                distribution["whitespace"] += 1
            else:
                distribution["special"] += 1

        return distribution

    async def _fallback_token_count(self, content: str, model: ModelType) -> TokenCount:
        """Fallback token counting when tiktoken is not available."""
        # Rough estimation: 1 token ≈ 0.75 words
        word_count = len(content.split())
        estimated_tokens = int(word_count / 0.75)

        estimated_cost = await self.estimate_cost(estimated_tokens, model)

        return TokenCount(
            total_tokens=estimated_tokens,
            model=model,
            estimated_cost=estimated_cost,
            token_distribution={"words": word_count, "punctuation": 0, "special": 0, "whitespace": 0}
        )


class InMemoryPromptRepository(PromptRepositoryPort):
    """In-memory prompt repository for development and testing."""

    def __init__(self):
        self._prompts: dict[str, Prompt] = {}
        self._content_hashes: dict[str, list[str]] = {}

    async def save_prompt(self, prompt: Prompt) -> None:
        """Save prompt to in-memory storage."""
        prompt_id_str = str(prompt.id)
        self._prompts[prompt_id_str] = prompt

        # Index by content hash for similarity search
        content_hash = self._hash_content(prompt.content)
        if content_hash not in self._content_hashes:
            self._content_hashes[content_hash] = []
        self._content_hashes[content_hash].append(prompt_id_str)

    async def get_prompt(self, prompt_id: PromptId) -> Optional[Prompt]:
        """Retrieve prompt by ID."""
        return self._prompts.get(str(prompt_id))

    async def find_prompts_by_content_hash(self, content_hash: str) -> list[Prompt]:
        """Find prompts with matching content hash."""
        prompt_ids = self._content_hashes.get(content_hash, [])
        return [self._prompts[pid] for pid in prompt_ids if pid in self._prompts]

    async def get_recent_prompts(self, limit: int = 10) -> list[Prompt]:
        """Get recently created prompts."""
        all_prompts = list(self._prompts.values())
        # Sort by creation time, most recent first
        sorted_prompts = sorted(all_prompts, key=lambda p: p.created_at, reverse=True)
        return sorted_prompts[:limit]

    def _hash_content(self, content: str) -> str:
        """Generate hash for content similarity."""
        # Normalize content for hashing
        normalized = content.lower().strip()
        return hashlib.md5(normalized.encode()).hexdigest()


class FilePromptRepository(PromptRepositoryPort):
    """File-based prompt repository using JSON storage."""

    def __init__(self, storage_path: str):
        self.storage_path = storage_path
        self._ensure_storage_exists()

    async def save_prompt(self, prompt: Prompt) -> None:
        """Save prompt to JSON file."""
        import os

        prompt_data: dict[str, Any] = {
            "id": str(prompt.id),
            "content": prompt.content,
            "created_at": prompt.created_at.isoformat(),
            "features": prompt.features.to_dict() if prompt.features else None,
            "token_count": {
                "total_tokens": prompt.token_count.total_tokens,
                "model": prompt.token_count.model.value,
                "estimated_cost": prompt.token_count.estimated_cost,
                "token_distribution": prompt.token_count.token_distribution
            } if prompt.token_count else None,
            "effectiveness_score": {
                "overall_score": prompt.effectiveness_score.overall_score,
                "clarity_score": prompt.effectiveness_score.clarity_score,
                "specificity_score": prompt.effectiveness_score.specificity_score,
                "completeness_score": prompt.effectiveness_score.completeness_score
            } if prompt.effectiveness_score else None,
            "optimization_suggestions": prompt.optimization_suggestions,
            "metadata": prompt.metadata
        }

        file_path = os.path.join(self.storage_path, f"{prompt.id}.json")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(prompt_data, f, indent=2, ensure_ascii=False)

    async def get_prompt(self, prompt_id: PromptId) -> Optional[Prompt]:
        """Retrieve prompt from JSON file."""
        import os

        file_path = os.path.join(self.storage_path, f"{prompt_id}.json")
        if not os.path.exists(file_path):
            return None

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            return self._deserialize_prompt(data)
        except (json.JSONDecodeError, KeyError, ValueError):
            return None

    async def find_prompts_by_content_hash(self, content_hash: str) -> list[Prompt]:
        """Find prompts by content similarity (simplified implementation)."""
        # For file-based storage, this would require indexing
        # This is a simplified implementation
        all_prompts = await self.get_recent_prompts(limit=100)

        similar: list[Prompt] = []

        for prompt in all_prompts:
            prompt_hash = self._hash_content(prompt.content)
            if prompt_hash == content_hash:
                similar.append(prompt)

        return similar

    async def get_recent_prompts(self, limit: int = 10) -> list[Prompt]:
        """Get recent prompts from file system."""
        import os
        import glob

        pattern = os.path.join(self.storage_path, "*.json")
        files = glob.glob(pattern)

        # Sort by modification time
        files.sort(key=os.path.getmtime, reverse=True)

        prompts: list[Prompt] = []
        for file_path in files[:limit]:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                prompt = self._deserialize_prompt(data)
                if prompt:
                    prompts.append(prompt)
            except (json.JSONDecodeError, KeyError, ValueError):
                continue

        return prompts

    def _ensure_storage_exists(self) -> None:
        """Ensure storage directory exists."""
        import os
        os.makedirs(self.storage_path, exist_ok=True)

    def _deserialize_prompt(self, data: dict[str, Any]) -> Optional[Prompt]:
        """Deserialize prompt from JSON data."""
        from ..domain.entities import (
            PromptFeatures, TokenCount, EffectivenessScore, ModelType
        )

        try:
            prompt_id = PromptId(UUID(data["id"]))
            created_at = datetime.fromisoformat(data["created_at"])

            prompt = Prompt(
                id=prompt_id,
                content=data["content"],
                created_at=created_at,
                optimization_suggestions=data.get("optimization_suggestions", []),
                metadata=data.get("metadata", {})
            )

            # Restore features if present
            if data.get("features"):
                features_data = data["features"]
                features = PromptFeatures(**features_data)
                prompt.update_features(features)

            # Restore token count if present
            if data.get("token_count"):
                tc_data = data["token_count"]
                token_count = TokenCount(
                    total_tokens=tc_data["total_tokens"],
                    model=ModelType(tc_data["model"]),
                    estimated_cost=tc_data["estimated_cost"],
                    token_distribution=tc_data["token_distribution"]
                )
                prompt.update_token_count(token_count)

            # Restore effectiveness score if present
            if data.get("effectiveness_score"):
                es_data = data["effectiveness_score"]
                effectiveness = EffectivenessScore(
                    overall_score=es_data["overall_score"],
                    clarity_score=es_data["clarity_score"],
                    specificity_score=es_data["specificity_score"],
                    completeness_score=es_data["completeness_score"]
                )
                prompt.update_effectiveness_score(effectiveness)

            return prompt

        except (KeyError, ValueError, TypeError):
            return None

    def _hash_content(self, content: str) -> str:
        """Generate hash for content similarity."""
        normalized = content.lower().strip()
        return hashlib.md5(normalized.encode()).hexdigest()
