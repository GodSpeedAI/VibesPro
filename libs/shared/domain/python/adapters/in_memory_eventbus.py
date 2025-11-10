"""
Shared Domain - In-Memory Event Bus Adapter (Python)

Lightweight in-memory implementation for event handling.

See DEV-SDS-025
"""

import asyncio
from collections.abc import Awaitable, Callable


class InMemoryEventBus:
    """
    In-Memory Event Bus Adapter

    Supports both sync and async event handlers.
    """

    def __init__(self) -> None:
        self._handlers: dict[type, list[Callable[[object], None | Awaitable[None]]]] = {}

    def publish(self, event: object) -> None:
        event_type = type(event)
        handlers = self._handlers.get(event_type, [])

        for handler in handlers:
            try:
                result = handler(event)
                if asyncio.iscoroutine(result):
                    # mypy: allow coroutine scheduling
                    asyncio.create_task(result)  # type: ignore[misc]
            except Exception as e:
                print(f"Handler error for {event_type.__name__}: {e}")

    def subscribe(
        self, event_type: type, handler: Callable[[object], None | Awaitable[None]]
    ) -> None:
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    def unsubscribe(
        self, event_type: type, handler: Callable[[object], None | Awaitable[None]]
    ) -> None:
        if event_type in self._handlers:
            try:
                self._handlers[event_type].remove(handler)
                if not self._handlers[event_type]:
                    del self._handlers[event_type]
            except ValueError:
                pass

    def clear(self) -> None:
        self._handlers.clear()
