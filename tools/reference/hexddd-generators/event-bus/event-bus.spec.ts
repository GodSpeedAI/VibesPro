import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { hexDomainGenerator } from '../hex-domain/generator';
import { eventBusGenerator } from './generator';

describe('eventBusGenerator (TypeScript)', () => {
  let tree: Tree;
  const domainName = 'test-domain';

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace();
    await hexDomainGenerator(tree, { name: domainName });
  });

  it('should create the Event Bus interface and in-memory adapter', async () => {
    await eventBusGenerator(tree, { domain: domainName, language: 'ts' });

    const eventBusInterfacePath = `libs/${domainName}/domain/src/lib/ports/event-bus.port.ts`;
    const inMemoryAdapterPath = `libs/${domainName}/infrastructure/src/lib/adapters/event-bus.in-memory.adapter.ts`;

    expect(tree.exists(eventBusInterfacePath)).toBe(true);
    expect(tree.exists(inMemoryAdapterPath)).toBe(true);
  });

  it('should generate the correct content for the Event Bus interface', async () => {
    await eventBusGenerator(tree, { domain: domainName, language: 'ts' });

    const eventBusInterfacePath = `libs/${domainName}/domain/src/lib/ports/event-bus.port.ts`;
    const fileContent = tree.read(eventBusInterfacePath);
    expect(fileContent).toBeTruthy();
    const content = fileContent!.toString();

    expect(content).toContain(`export interface IEventBus<T = unknown> {`);
    expect(content).toContain(`publish(event: T): void;`);
    expect(content).toContain(`subscribe(eventType: { name?: string } | { constructor?: { name: string } }, handler: (event: T) => void): void;`);
    expect(content).toContain(`}`);
  });

  it('should generate the correct content for the in-memory adapter', async () => {
    await eventBusGenerator(tree, { domain: domainName, language: 'ts' });

    const inMemoryAdapterPath = `libs/${domainName}/infrastructure/src/lib/adapters/event-bus.in-memory.adapter.ts`;
    const fileContent = tree.read(inMemoryAdapterPath);
    expect(fileContent).toBeTruthy();
    const content = fileContent!.toString();

    expect(content).toContain(`import { IEventBus } from '@${domainName}/domain';`);
    expect(content).toContain(`export class EventBusInMemoryAdapter implements IEventBus<unknown> {`);
    expect(content).toContain(`private handlers: Map<string, Array<(event: unknown) => void>> = new Map();`);
    expect(content).toContain(`publish(event: unknown): void {`);
    expect(content).toContain(`const eventName = _getEventName(event);`);
    expect(content).toContain(`const eventHandlers = this.handlers.get(eventName);`);
    expect(content).toContain(`if (eventHandlers) {`);
    expect(content).toContain(`eventHandlers.forEach((handler) => handler(event));`);
    expect(content).toContain(`}`);
    expect(content).toContain(`}`);
    expect(content).toContain(`subscribe(eventType: { name?: string } | { constructor?: { name: string } }, handler: (event: unknown) => void): void {`);
    expect(content).toContain(`const eventName = _getEventName(eventType);`);
    expect(content).toContain(`if (!this.handlers.has(eventName)) {`);
    expect(content).toContain(`this.handlers.set(eventName, []);`);
    expect(content).toContain(`}`);
    expect(content).toContain(`this.handlers.get(eventName)!.push(handler);`);
    expect(content).toContain(`}`);
    expect(content).toContain(`}`);
  });
});
