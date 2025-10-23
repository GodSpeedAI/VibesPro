import { IEventBus } from "../../../domain/src/lib/ports/event-bus.port";

function _getEventName(obj: unknown): string {
  if (obj && typeof obj === "object") {
    const asRec = obj as Record<string, unknown>;
    if (typeof asRec["name"] === "string") return asRec["name"] as string;
    const ctor = asRec["constructor"] as Record<string, unknown> | undefined;
    if (ctor && typeof ctor.name === "string") return ctor.name as string;
  }
  return "unknown";
}

export class EventBusInMemoryAdapter implements IEventBus<unknown> {
  private handlers: Map<string, Array<(event: unknown) => void>> = new Map();

  publish(event: unknown): void {
    const eventName = _getEventName(event);
    const eventHandlers = this.handlers.get(eventName);
    if (eventHandlers) {
      eventHandlers.forEach((handler) => handler(event));
    }
  }

  subscribe(
    event: { name?: string } | { constructor?: { name: string } },
    handler: (event: unknown) => void,
  ): void {
    const eventName = _getEventName(event);
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);
  }
}
