from collections.abc import Awaitable, Callable
from typing import TypeVar

from my_test_domain.domain.ports import IUnitOfWork
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar('T')

class UnitOfWorkSQLAlchemyAdapter(IUnitOfWork):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def with_transaction(self, work: Callable[[], Awaitable[T]]) -> T:
        async with self._session.begin():
            return await work()
