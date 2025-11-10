"""
Shared Domain - Unit of Work Port (Python)

Protocol definition for the Unit of Work pattern in Python.

See DEV-ADR-024, DEV-PRD-025, DEV-SDS-024
"""

from collections.abc import Awaitable, Callable
from typing import Protocol, TypeVar

T = TypeVar("T")


class UnitOfWork(Protocol):
    """
    Unit of Work Pattern - Python Protocol

    Maintains a list of objects affected by a business transaction and
    coordinates the writing out of changes.
    """

    async def begin(self) -> None:
        """Begin a new transaction."""
        ...

    async def commit(self) -> None:
        """Commit the current transaction."""
        ...

    async def rollback(self) -> None:
        """Rollback the current transaction."""
        ...

    def is_in_transaction(self) -> bool:
        """Check if a transaction is currently active."""
        ...

    def register_new(self, entity: object) -> None:
        """Register a new entity to be inserted."""
        ...

    def register_dirty(self, entity: object) -> None:
        """Register an existing entity that has been modified."""
        ...

    def register_deleted(self, entity: object) -> None:
        """Register an entity to be deleted."""
        ...

    def get_new(self) -> list[object]:
        """Get all entities registered as new."""
        ...

    def get_dirty(self) -> list[object]:
        """Get all entities registered as dirty."""
        ...

    def get_deleted(self) -> list[object]:
        """Get all entities registered for deletion."""
        ...

    async def with_transaction(self, work: Callable[[], Awaitable[T]]) -> T:
        """
        Execute work within a transaction.

        Automatically begins, commits on success, or rolls back on error.
        """
        ...
