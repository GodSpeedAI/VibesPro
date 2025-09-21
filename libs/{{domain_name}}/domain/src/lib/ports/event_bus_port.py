from collections.abc import Callable
from typing import Protocol


class IEventBus(Protocol):
    def publish(self, event: object) -> None:
        ...
    def subscribe(self, event_type: type, handler: Callable) -> None:
        ...