class User:
    """User model"""

    id: str
    name: str
    email: str
    age: int
    isActive: bool  # noqa: N815 - fixture intentionally uses camelCase
    createdAt: str | None  # noqa: N815 - fixture intentionally uses camelCase
