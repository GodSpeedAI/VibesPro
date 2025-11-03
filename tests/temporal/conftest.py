from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path

import pytest_asyncio

from temporal_db.python.repository import TemporalRepository, initialize_temporal_database


@pytest_asyncio.fixture
async def temporal_repository(tmp_path: Path) -> AsyncIterator[TemporalRepository]:
    """Provision a fresh TemporalRepository backed by a temporary SQLite file."""
    db_path = tmp_path / "temporal.db"
    repository = await initialize_temporal_database(str(db_path))
    try:
        yield repository
    finally:
        await repository.close()
        db_path.unlink(missing_ok=True)
