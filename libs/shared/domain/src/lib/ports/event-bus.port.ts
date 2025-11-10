/**
 * Event Bus Pattern
 *
 * Provides a publish-subscribe mechanism for domain events,
 * enabling decoupled communication between domain components.
 *
 * @see DEV-ADR-024 - Unit of Work and Event Bus as First-Class Abstractions
 * @see DEV-PRD-026 - Event-Driven Architecture with EventBus
 * @see DEV-SDS-025 - Event Bus Contract Design
 */
export interface EventBus<T = unknown> {
  /**
   * Publish an event to all subscribers.
   * @param event The event to publish
   */
  publish(event: T): void | Promise<void>;

  /**
   * Subscribe to events of a specific type.
   * @param event Event descriptor (by name or constructor)
   * @param handler Function to handle the event
   */
  subscribe(
    event: { name?: string } | { constructor?: { name: string } },
    handler: (event: T) => void | Promise<void>,
  ): void;

  /**
   * Unsubscribe a handler from events.
   * @param event Event descriptor
   * @param handler The handler to remove
   */
  unsubscribe(
    event: { name?: string } | { constructor?: { name: string } },
    handler: (event: T) => void | Promise<void>,
  ): void;

  /**
   * Clear all subscriptions.
   */
  clear(): void;
}
