import { EventBus, EventDescriptor, EventHandler } from '../ports/event-bus.port';

/**
 * In-Memory Event Bus Adapter
 *
 * Lightweight in-memory implementation for synchronous event handling.
 * Supports async handlers and error aggregation.
 *
 * @see DEV-SDS-025 - Event Bus Contract Design
 */
export class InMemoryEventBus implements EventBus<unknown> {
  private handlers: Map<string, EventHandler<unknown>[]> = new Map();

  async publish(event: unknown): Promise<void> {
    const eventName = this.getEventName(event);
    const eventHandlers = this.handlers.get(eventName);

    if (eventHandlers && eventHandlers.length > 0) {
      const errors: Error[] = [];

      await Promise.all(
        eventHandlers.map(async (handler) => {
          try {
            await handler(event);
          } catch (error) {
            errors.push(error instanceof Error ? error : new Error('Unknown event handler error'));
          }
        }),
      );

      if (errors.length > 0) {
        console.error(`${errors.length} handler(s) failed for event ${eventName}:`, errors);
      }
    }
  }

  subscribe(event: EventDescriptor, handler: EventHandler<unknown>): void {
    const eventName = this.getEventName(event);

    let eventHandlers = this.handlers.get(eventName);
    if (!eventHandlers) {
      eventHandlers = [];
      this.handlers.set(eventName, eventHandlers);
    }
    if (eventHandlers.includes(handler)) {
      return;
    }

    eventHandlers.push(handler);
  }

  unsubscribe(event: EventDescriptor, handler: EventHandler<unknown>): void {
    const eventName = this.getEventName(event);
    const eventHandlers = this.handlers.get(eventName);

    if (eventHandlers) {
      const index = eventHandlers.indexOf(handler);
      if (index > -1) {
        eventHandlers.splice(index, 1);
      }

      if (eventHandlers.length === 0) {
        this.handlers.delete(eventName);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }

  private getEventName(obj: unknown): string {
    if (obj && typeof obj === 'object') {
      const asRec = obj as Record<string, unknown>;

      if (typeof asRec['name'] === 'string') {
        return asRec['name'];
      }

      const ctor = asRec['constructor'] as Record<string, unknown> | undefined;
      if (ctor && typeof ctor['name'] === 'string') {
        return ctor['name'] as string;
      }
    }

    return 'unknown';
  }
}
