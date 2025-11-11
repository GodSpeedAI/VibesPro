import { UnitOfWork } from '../ports/unit-of-work.port';
import { InMemoryUnitOfWork } from '../adapters/in-memory-uow.adapter';

describe('UnitOfWork Contract (TypeScript)', () => {
  let uow: UnitOfWork;

  beforeEach(() => {
    uow = new InMemoryUnitOfWork();
  });

  describe('Transaction Lifecycle', () => {
    it('should begin and commit a transaction', async () => {
      await uow.begin();
      expect(uow.isInTransaction()).toBe(true);

      await uow.commit();
      expect(uow.isInTransaction()).toBe(false);
    });

    it('should begin and rollback a transaction', async () => {
      await uow.begin();
      expect(uow.isInTransaction()).toBe(true);

      await uow.rollback();
      expect(uow.isInTransaction()).toBe(false);
    });

    it('should throw error when committing without active transaction', async () => {
      await expect(uow.commit()).rejects.toThrow('No active transaction');
    });

    it('should throw error when double-committing', async () => {
      await uow.begin();
      await uow.commit();
      await expect(uow.commit()).rejects.toThrow('No active transaction');
    });

    it('should throw error when rolling back without active transaction', async () => {
      await expect(uow.rollback()).rejects.toThrow('No active transaction');
    });

    it('should throw error when double-rolling back', async () => {
      await uow.begin();
      await uow.rollback();
      await expect(uow.rollback()).rejects.toThrow('No active transaction');
    });
  });

  describe('Entity Tracking', () => {
    interface TestEntity {
      id: string;
      name: string;
    }

    it('should register new entities', async () => {
      const entity: TestEntity = { id: '1', name: 'Test' };

      await uow.begin();
      uow.registerNew(entity);

      const newEntities = uow.getNew<TestEntity>();
      expect(newEntities).toContain(entity);
      expect(newEntities.length).toBe(1);
    });

    it('should register dirty entities', async () => {
      const entity: TestEntity = { id: '1', name: 'Test' };

      await uow.begin();
      uow.registerDirty(entity);

      const dirtyEntities = uow.getDirty<TestEntity>();
      expect(dirtyEntities).toContain(entity);
      expect(dirtyEntities.length).toBe(1);
    });

    it('should register deleted entities', async () => {
      const entity: TestEntity = { id: '1', name: 'Test' };

      await uow.begin();
      uow.registerDeleted(entity);

      const deletedEntities = uow.getDeleted<TestEntity>();
      expect(deletedEntities).toContain(entity);
      expect(deletedEntities.length).toBe(1);
    });

    it('should clear entity tracking on commit', async () => {
      const entity: TestEntity = { id: '1', name: 'Test' };

      await uow.begin();
      uow.registerNew(entity);
      uow.registerDirty(entity);
      uow.registerDeleted(entity);

      await uow.commit();

      expect(uow.getNew().length).toBe(0);
      expect(uow.getDirty().length).toBe(0);
      expect(uow.getDeleted().length).toBe(0);
    });

    it('should clear entity tracking on rollback', async () => {
      const entity: TestEntity = { id: '1', name: 'Test' };

      await uow.begin();
      uow.registerNew(entity);
      uow.registerDirty(entity);
      uow.registerDeleted(entity);

      await uow.rollback();

      expect(uow.getNew().length).toBe(0);
      expect(uow.getDirty().length).toBe(0);
      expect(uow.getDeleted().length).toBe(0);
    });
  });

  describe('Transactional Execution', () => {
    it('should execute work within transaction and commit', async () => {
      let executed = false;

      const result = await uow.withTransaction(async () => {
        executed = true;
        return 'success';
      });

      expect(executed).toBe(true);
      expect(result).toBe('success');
      expect(uow.isInTransaction()).toBe(false);
    });

    it('should rollback transaction on error', async () => {
      const entity = { id: '1', name: 'Test' };

      await expect(
        uow.withTransaction(async () => {
          uow.registerNew(entity);
          throw new Error('Test error');
        }),
      ).rejects.toThrow('Test error');

      expect(uow.isInTransaction()).toBe(false);
      expect(uow.getNew().length).toBe(0);
    });
  });
});
