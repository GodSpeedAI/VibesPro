import shutil
import tempfile
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from libs.prompt_optimizer.domain.entities import (
    EffectivenessScore,
    ModelType,
    Prompt,
    PromptFeatures,
    PromptId,
    TokenCount,
)
from libs.prompt_optimizer.infrastructure.temporal_db import JsonFileStorage


@pytest.fixture
def db_path() -> str:
    """Create a temporary directory for the test database."""
    path = tempfile.mkdtemp()
    yield path
    shutil.rmtree(path)


@pytest.mark.asyncio
async def test_store_and_retrieve_prompt_analysis(db_path: str):
    """Test that storing and retrieving a prompt works correctly."""
    storage = JsonFileStorage(db_path)
    prompt_id = PromptId(uuid4())
    now = datetime.now(UTC)

    prompt = Prompt(
        id=prompt_id,
        content="Test prompt",
        created_at=now,
    )
    prompt.update_features(
        PromptFeatures(
            token_count=10,
            sentence_count=1,
            avg_sentence_length=10.0,
            instruction_clarity=0.9,
            context_completeness=0.8,
            task_specificity=0.7,
            role_definition=True,
            example_count=1,
            constraint_clarity=0.9,
            readability_score=80.0,
            ambiguity_score=0.1,
            directive_strength=0.9,
        )
    )
    prompt.update_token_count(
        TokenCount(
            total_tokens=10,
            model=ModelType.GPT_4,
            estimated_cost=0.001,
            token_distribution={"input": 5, "output": 5},
        )
    )
    prompt.update_effectiveness_score(
        EffectivenessScore(
            overall_score=90.0,
            clarity_score=95.0,
            specificity_score=85.0,
            completeness_score=90.0,
        )
    )

    await storage.store_prompt_analysis(prompt, now)

    retrieved_prompts = await storage.retrieve_recent_prompts(timedelta(minutes=1))

    assert len(retrieved_prompts) == 1
    retrieved_prompt = retrieved_prompts[0]

    assert retrieved_prompt["id"] == str(prompt.id)
    assert retrieved_prompt["content"] == prompt.content
    assert retrieved_prompt["features"]["token_count"] == 10
    assert retrieved_prompt["token_count"]["total_tokens"] == 10
    assert retrieved_prompt["effectiveness_score"]["overall_score"] == 90.0
