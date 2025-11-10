/**
 * Unit of Work Pattern
 *
 * Maintains a list of objects affected by a business transaction
 * and coordinates the writing out of changes and resolution of concurrency problems.
 *
 * @see DEV-ADR-024 - Unit of Work and Event Bus as First-Class Abstractions
 * @see DEV-PRD-025 - Unit of Work Abstraction
 * @see DEV-SDS-024 - Unit of Work Design
 */
export interface UnitOfWork {
  /**
   * Begin a new transaction.
   * @throws Error if a transaction is already active
   */
  begin(): Promise<void>;

  /**
   * Commit the current transaction and persist all registered changes.
   * @throws Error if no transaction is active
   */
  commit(): Promise<void>;

  /**
   * Rollback the current transaction and discard all registered changes.
   */
  rollback(): Promise<void>;

  /**
   * Check if a transaction is currently active.
   */
  isInTransaction(): boolean;

  /**
   * Register a new entity to be inserted.
   * @param entity The entity to register as new
   */
  registerNew<T>(entity: T): void;

  /**
   * Register an existing entity that has been modified.
   * @param entity The entity to register as dirty
   */
  registerDirty<T>(entity: T): void;

  /**
   * Register an entity to be deleted.
   * @param entity The entity to register for deletion
   */
  registerDeleted<T>(entity: T): void;

  /**
   * Get all entities registered as new.
   */
  getNew<T = unknown>(): T[];

  /**
   * Get all entities registered as dirty.
   */
  getDirty<T = unknown>(): T[];

  /**
   * Get all entities registered for deletion.
   */
  getDeleted<T = unknown>(): T[];

  /**
   * Execute work within a transaction.
   * Automatically begins, commits on success, or rolls back on error.
   *
   * @param work The work to execute within the transaction
   * @returns The result of the work function
   * @throws Re-throws any error from the work function after rollback
   */
  withTransaction<T>(work: () => Promise<T>): Promise<T>;
}
