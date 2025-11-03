from __future__ import annotations

import logging
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
        # Best-effort cleanup: ensure the DB file is removed even if close() fails.
        try:
            await repository.close()
        except Exception as exc:  # pragma: no cover - best-effort teardown path
            # Log the exception so ruff doesn't complain about silent suppression
            # and maintain visibility into teardown issues without failing tests.
            logging.exception("Error while closing temporal repository during teardown: %s", exc)
        try:
            db_path.unlink(missing_ok=True)
        except Exception as exc:  # pragma: no cover - cleanup best-effort
            logging.exception(
                "Failed to unlink temporal DB at %s during teardown: %s", db_path, exc
            )
