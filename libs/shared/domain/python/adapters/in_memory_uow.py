"""
Shared Domain - In-Memory Unit of Work Adapter (Python)

Lightweight in-memory implementation for testing and development.

See DEV-SDS-024
"""

from collections.abc import Awaitable, Callable
from typing import TypeVar

T = TypeVar("T")


class InMemoryUnitOfWork:
    """
    In-Memory Unit of Work Adapter

    Perfect for testing and scenarios where true transactional semantics
    aren't required.
    """

    def __init__(self) -> None:
        self._new_entities: list[object] = []
        self._dirty_entities: list[object] = []
        self._deleted_entities: list[object] = []
        self._in_transaction = False

    async def begin(self) -> None:
        if self._in_transaction:
            raise RuntimeError("Transaction already active")
        self._in_transaction = True

    async def commit(self) -> None:
        if not self._in_transaction:
            raise RuntimeError("No active transaction")
        self._clear()
        self._in_transaction = False

    async def rollback(self) -> None:
        self._clear()
        self._in_transaction = False

    def is_in_transaction(self) -> bool:
        return self._in_transaction

    def register_new(self, entity: object) -> None:
        self._new_entities.append(entity)

    def register_dirty(self, entity: object) -> None:
        self._dirty_entities.append(entity)

    def register_deleted(self, entity: object) -> None:
        self._deleted_entities.append(entity)

    def get_new(self) -> list[object]:
        return list(self._new_entities)

    def get_dirty(self) -> list[object]:
        return list(self._dirty_entities)

    def get_deleted(self) -> list[object]:
        return list(self._deleted_entities)

    async def with_transaction(self, work: Callable[[], Awaitable[T]]) -> T:
        await self.begin()
        try:
            result = await work()
            await self.commit()
            return result
        except Exception:
            await self.rollback()
            raise

    def _clear(self) -> None:
        self._new_entities.clear()
        self._dirty_entities.clear()
        self._deleted_entities.clear()
