"""
Shared Domain - Event Bus Port (Python)

Protocol definition for the Event Bus pattern in Python.

See DEV-ADR-024, DEV-PRD-026, DEV-SDS-025
"""

from collections.abc import Awaitable, Callable
from typing import Protocol


class EventBus(Protocol):
    """
    Event Bus Pattern - Python Protocol

    Provides publish-subscribe mechanism for domain events.
    """

    def publish(self, event: object) -> None:
        """Publish an event to all subscribers."""
        ...

    def subscribe(
        self, event_type: type, handler: Callable[[object], None | Awaitable[None]]
    ) -> None:
        """Subscribe to events of a specific type."""
        ...

    def unsubscribe(
        self, event_type: type, handler: Callable[[object], None | Awaitable[None]]
    ) -> None:
        """Unsubscribe a handler from events."""
        ...

    def clear(self) -> None:
        """Clear all subscriptions."""
        ...
