import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseUnitOfWork } from '../../libs/shared/domain/src/lib/adapters/supabase-uow';

describe.skip('UnitOfWork with Supabase', () => {
  let uow: SupabaseUnitOfWork;
  let client: SupabaseClient;

  beforeAll(async () => {
    // This would normally start the Supabase stack and create the client
    // For now, we'll just create a dummy client
    client = createClient('http://localhost:54323', 'your-anon-key');
    uow = new SupabaseUnitOfWork(client);
  });

  it('should commit transaction and persist entities', async () => {
    await uow.begin();
    uow.registerNew({ id: '123', name: 'Test User' });
    await uow.commit();

    // Verify data persisted in postgres
    const { data } = await client.from('users').select('*').eq('id', '123');
    expect(data).toHaveLength(1);
  });

  it('should rollback transaction and discard entities', async () => {
    await uow.begin();
    uow.registerNew({ id: '456', name: 'Rollback User' });
    await uow.rollback();

    // Verify data NOT persisted
    const { data } = await client.from('users').select('*').eq('id', '456');
    expect(data).toHaveLength(0);
  });
});
