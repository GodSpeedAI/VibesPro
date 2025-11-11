"""
Shared Domain - In-Memory Event Bus Adapter (Python)

Lightweight in-memory implementation for event handling.

See DEV-SDS-025
"""

import asyncio
import logging
import threading
from collections.abc import Callable, Coroutine


class InMemoryEventBus:
    """
    In-Memory Event Bus Adapter

    Supports both sync and async event handlers.
    """

    def __init__(self) -> None:
        self._handlers: dict[
            type, list[Callable[[object], None | Coroutine[None, None, None]]]
        ] = {}
        self._lock = threading.Lock()
        self._logger = logging.getLogger(__name__)

    def publish(self, event: object) -> None:
        event_type = type(event)
        with self._lock:
            handlers = list(self._handlers.get(event_type, []))

        loop = asyncio.get_running_loop()
        for handler in handlers:
            try:
                result = handler(event)
                if asyncio.iscoroutine(result):
                    task: asyncio.Task[None] = loop.create_task(result)
                    task.add_done_callback(self._handle_task_exception)
            except Exception as exc:
                self._logger.error(
                    "Handler error for %s: %s", event_type.__name__, exc, exc_info=exc
                )

    def subscribe(
        self, event_type: type, handler: Callable[[object], None | Coroutine[None, None, None]]
    ) -> None:
        with self._lock:
            handlers = self._handlers.setdefault(event_type, [])
            if handler not in handlers:
                handlers.append(handler)

    def unsubscribe(
        self, event_type: type, handler: Callable[[object], None | Coroutine[None, None, None]]
    ) -> None:
        with self._lock:
            if event_type in self._handlers:
                try:
                    self._handlers[event_type].remove(handler)
                    if not self._handlers[event_type]:
                        del self._handlers[event_type]
                except ValueError:
                    pass

    def clear(self) -> None:
        with self._lock:
            self._handlers.clear()

    def _handle_task_exception(self, task: asyncio.Task[None]) -> None:
        try:
            task.result()
        except Exception as exc:  # pragma: no cover - logs only
            self._logger.error("Async event handler failed", exc_info=exc)
