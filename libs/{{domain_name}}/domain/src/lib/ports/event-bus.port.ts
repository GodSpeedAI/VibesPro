export interface IEventBus<T = unknown> {
  publish(event: T): void;
  subscribe(event: { name?: string } | { constructor?: { name: string } }, handler: (event: T) => void): void;
}
