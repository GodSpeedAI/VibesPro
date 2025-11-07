import pytest
from supabase import create_client, Client
from libs.shared.domain.src.lib.adapters.supabase_uow import SupabaseUnitOfWork


@pytest.mark.skip(reason="Supabase stack is not running")
@pytest.mark.asyncio
async def test_commit_transaction_and_persist_entities():
    # This would normally start the Supabase stack and create the client
    # For now, we'll just create a dummy client
    url = "http://localhost:54323"
    key = "your-anon-key"
    client: Client = create_client(url, key)
    uow = SupabaseUnitOfWork(client)

    await uow.begin()
    uow.register_new({"id": "123", "name": "Test User"})
    await uow.commit()

    # Verify data persisted in postgres
    response = client.table("users").select("*").eq("id", "123").execute()
    assert len(response.data) == 1


@pytest.mark.skip(reason="Supabase stack is not running")
@pytest.mark.asyncio
async def test_rollback_transaction_and_discard_entities():
    # This would normally start the Supabase stack and create the client
    # For now, we'll just create a dummy client
    url = "http://localhost:54323"
    key = "your-anon-key"
    client: Client = create_client(url, key)
    uow = SupabaseUnitOfWork(client)

    await uow.begin()
    uow.register_new({"id": "456", "name": "Rollback User"})
    await uow.rollback()

    # Verify data NOT persisted
    response = client.table("users").select("*").eq("id", "456").execute()
    assert len(response.data) == 0
