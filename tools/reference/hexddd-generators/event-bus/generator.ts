import {
  Tree,
  formatFiles,
} from '@nx/devkit';
import { EventBusGeneratorSchema } from './schema';

/**
 * Generates the TypeScript files for the Event Bus.
 * @param tree The file tree.
 * @param options The generator options.
 */
function addTsFiles(tree: Tree, options: EventBusGeneratorSchema) {
  const eventBusInterfaceContent = `export interface IEventBus<T = unknown> {
  publish(event: T): void;
  subscribe(eventType: { name?: string } | { constructor?: { name: string } }, handler: (event: T) => void): void;
}
`;

  const inMemoryAdapterContent = `import { IEventBus } from '@${options.domain}/domain';

function _getEventName(obj: unknown): string {
  if (obj && typeof obj === 'object') {
    const asRec = obj as Record<string, unknown>;
    if (typeof asRec['name'] === 'string') return asRec['name'] as string;
    const ctor = asRec['constructor'] as Record<string, unknown> | undefined;
    if (ctor && typeof ctor.name === 'string') return ctor.name as string;
  }
  return 'unknown';
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

  subscribe(eventType: { name?: string } | { constructor?: { name: string } }, handler: (event: unknown) => void): void {
    const eventName = _getEventName(eventType);
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);
  }
}
`;

  tree.write(`libs/${options.domain}/domain/src/lib/ports/event-bus.port.ts`, eventBusInterfaceContent);
  tree.write(`libs/${options.domain}/infrastructure/src/lib/adapters/event-bus.in-memory.adapter.ts`, inMemoryAdapterContent);
}

/**
 * Generates the Python files for the Event Bus.
 * @param tree The file tree.
 * @param options The generator options.
 */
function addPyFiles(tree: Tree, options: EventBusGeneratorSchema) {
  const snakeCaseDomain = options.domain.replace(/-/g, '_');

  const eventBusProtocolContent = `from typing import Protocol, Type, Callable

class IEventBus(Protocol):
    def publish(self, event: object) -> None:
        ...
    def subscribe(self, event_type: Type, handler: Callable) -> None:
        ...
`;

  const inMemoryAdapterContent = `from typing import Type, Callable, Dict, List
from ${snakeCaseDomain}.domain.ports import IEventBus

class EventBusInMemoryAdapter(IEventBus):
    def __init__(self) -> None:
        self._handlers: Dict[Type, List[Callable]] = {}

    def publish(self, event: object) -> None:
        event_type = type(event)
        if event_type in self._handlers:
            for handler in self._handlers[event_type]:
                handler(event)

    def subscribe(self, event_type: Type, handler: Callable) -> None:
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
`;

  tree.write(`libs/${options.domain}/domain/src/lib/ports/event_bus_port.py`, eventBusProtocolContent);
  tree.write(`libs/${options.domain}/infrastructure/src/lib/adapters/event_bus_in_memory_adapter.py`, inMemoryAdapterContent);
}

export async function eventBusGenerator(
  tree: Tree,
  options: EventBusGeneratorSchema
) {
  if (options.language === 'ts') {
    addTsFiles(tree, options);
  } else if (options.language === 'py') {
    addPyFiles(tree, options);
  }

  await formatFiles(tree);
}

export default eventBusGenerator;
