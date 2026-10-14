"""Core application constants."""

# Allowed avatars: exactly 20 keys, avatar-01 to avatar-20
ALLOWED_AVATARS: tuple[str, ...] = tuple(f"avatar-{i:02d}" for i in range(1, 21))
DEFAULT_AVATAR: str = "avatar-01"
