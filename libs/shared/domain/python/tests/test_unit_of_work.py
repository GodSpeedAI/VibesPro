"""
Tests for Unit of Work (Python)

See DEV-PRD-025
"""

import pytest

from ..adapters.in_memory_uow import InMemoryUnitOfWork
from ..ports.unit_of_work import UnitOfWork


@pytest.fixture
def uow() -> UnitOfWork:
    return InMemoryUnitOfWork()


class TestEntity:
    def __init__(self, id: str, name: str):
        self.id = id
        self.name = name


class TestTransactionLifecycle:
    @pytest.mark.asyncio
    async def test_begin_and_commit(self, uow: UnitOfWork) -> None:
        await uow.begin()
        assert uow.is_in_transaction()

        await uow.commit()
        assert not uow.is_in_transaction()

    @pytest.mark.asyncio
    async def test_begin_and_rollback(self, uow: UnitOfWork) -> None:
        await uow.begin()
        assert uow.is_in_transaction()

        await uow.rollback()
        assert not uow.is_in_transaction()

    @pytest.mark.asyncio
    async def test_commit_without_transaction_raises_error(self, uow: UnitOfWork) -> None:
        with pytest.raises(RuntimeError, match="No active transaction"):
            await uow.commit()

    @pytest.mark.asyncio
    async def test_double_commit_raises_error(self, uow: UnitOfWork) -> None:
        await uow.begin()
        await uow.commit()

        with pytest.raises(RuntimeError, match="No active transaction"):
            await uow.commit()

    @pytest.mark.asyncio
    async def test_begin_twice_raises_error(self, uow: UnitOfWork) -> None:
        await uow.begin()

        with pytest.raises(RuntimeError, match="Transaction already active"):
            await uow.begin()


class TestEntityTracking:
    @pytest.mark.asyncio
    async def test_register_new_entities(self, uow: UnitOfWork) -> None:
        entity = TestEntity("1", "Test")

        await uow.begin()
        uow.register_new(entity)

        new_entities = uow.get_new()
        assert entity in new_entities
        assert len(new_entities) == 1

    @pytest.mark.asyncio
    async def test_register_dirty_entities(self, uow: UnitOfWork) -> None:
        entity = TestEntity("1", "Test")

        await uow.begin()
        uow.register_dirty(entity)

        dirty_entities = uow.get_dirty()
        assert entity in dirty_entities
        assert len(dirty_entities) == 1

    @pytest.mark.asyncio
    async def test_register_deleted_entities(self, uow: UnitOfWork) -> None:
        entity = TestEntity("1", "Test")

        await uow.begin()
        uow.register_deleted(entity)

        deleted_entities = uow.get_deleted()
        assert entity in deleted_entities
        assert len(deleted_entities) == 1

    @pytest.mark.asyncio
    async def test_clear_tracking_on_commit(self, uow: UnitOfWork) -> None:
        entity = TestEntity("1", "Test")

        await uow.begin()
        uow.register_new(entity)
        uow.register_dirty(entity)
        uow.register_deleted(entity)

        await uow.commit()

        assert len(uow.get_new()) == 0
        assert len(uow.get_dirty()) == 0
        assert len(uow.get_deleted()) == 0

    @pytest.mark.asyncio
    async def test_clear_tracking_on_rollback(self, uow: UnitOfWork) -> None:
        entity = TestEntity("1", "Test")

        await uow.begin()
        uow.register_new(entity)
        uow.register_dirty(entity)
        uow.register_deleted(entity)

        await uow.rollback()

        assert len(uow.get_new()) == 0
        assert len(uow.get_dirty()) == 0
        assert len(uow.get_deleted()) == 0


class TestTransactionalExecution:
    @pytest.mark.asyncio
    async def test_with_transaction_executes_and_commits(self, uow: UnitOfWork) -> None:
        executed = False

        async def work() -> str:
            nonlocal executed
            executed = True
            return "success"

        result = await uow.with_transaction(work)

        assert executed
        assert result == "success"
        assert not uow.is_in_transaction()

    @pytest.mark.asyncio
    async def test_with_transaction_rolls_back_on_error(self, uow: UnitOfWork) -> None:
        entity = TestEntity("1", "Test")

        async def failing_work() -> None:
            uow.register_new(entity)
            raise ValueError("Test error")

        with pytest.raises(ValueError, match="Test error"):
            await uow.with_transaction(failing_work)

        assert not uow.is_in_transaction()
        assert len(uow.get_new()) == 0
