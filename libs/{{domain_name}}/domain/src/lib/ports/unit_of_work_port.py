from collections.abc import Awaitable, Callable
from typing import Protocol, TypeVar

T = TypeVar("T")


class IUnitOfWork(Protocol):
    async def with_transaction(self, work: Callable[[], Awaitable[T]]) -> T: ...
