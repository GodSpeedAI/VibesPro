import { UnitOfWork } from '../ports/unit-of-work.port';

/**
 * In-Memory Unit of Work Adapter
 *
 * A lightweight, in-memory implementation of the Unit of Work pattern.
 * Perfect for testing and scenarios where true transactional semantics aren't required.
 *
 * @see DEV-SDS-024 - Unit of Work Design
 */
export class InMemoryUnitOfWork implements UnitOfWork {
  private newEntities: unknown[] = [];
  private dirtyEntities: unknown[] = [];
  private deletedEntities: unknown[] = [];
  private inTransaction = false;

  async begin(): Promise<void> {
    if (this.inTransaction) {
      throw new Error('Transaction already active');
    }
    this.inTransaction = true;
  }

  async commit(): Promise<void> {
    this.ensureTransactionActive();
    this.clear();
    this.inTransaction = false;
  }

  async rollback(): Promise<void> {
    this.ensureTransactionActive();
    this.clear();
    this.inTransaction = false;
  }

  isInTransaction(): boolean {
    return this.inTransaction;
  }

  registerNew<T>(entity: T): void {
    this.ensureTransactionActive();
    this.removeFromCollections(entity, ['dirty', 'deleted']);

    if (!this.contains(this.newEntities, entity)) {
      this.newEntities.push(entity);
    }
  }

  registerDirty<T>(entity: T): void {
    this.ensureTransactionActive();

    if (this.contains(this.newEntities, entity)) {
      return;
    }

    this.removeFromCollections(entity, ['deleted']);
    if (!this.contains(this.dirtyEntities, entity)) {
      this.dirtyEntities.push(entity);
    }
  }

  registerDeleted<T>(entity: T): void {
    this.ensureTransactionActive();
    this.removeFromCollections(entity, ['new', 'dirty']);

    if (!this.contains(this.deletedEntities, entity)) {
      this.deletedEntities.push(entity);
    }
  }

  getNew<T = unknown>(): T[] {
    return [...this.newEntities] as T[];
  }

  getDirty<T = unknown>(): T[] {
    return [...this.dirtyEntities] as T[];
  }

  getDeleted<T = unknown>(): T[] {
    return [...this.deletedEntities] as T[];
  }

  async withTransaction<T>(work: () => Promise<T>): Promise<T> {
    await this.begin();
    try {
      const result = await work();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  private clear(): void {
    this.newEntities = [];
    this.dirtyEntities = [];
    this.deletedEntities = [];
  }

  private ensureTransactionActive(): void {
    if (!this.inTransaction) {
      throw new Error('No active transaction');
    }
  }

  private contains(collection: unknown[], entity: unknown): boolean {
    return collection.some((item) => item === entity);
  }

  private removeFromCollections(
    entity: unknown,
    collections: Array<'new' | 'dirty' | 'deleted'>,
  ): void {
    if (collections.includes('new')) {
      this.newEntities = this.newEntities.filter((item) => item !== entity);
    }
    if (collections.includes('dirty')) {
      this.dirtyEntities = this.dirtyEntities.filter((item) => item !== entity);
    }
    if (collections.includes('deleted')) {
      this.deletedEntities = this.deletedEntities.filter((item) => item !== entity);
    }
  }
}
