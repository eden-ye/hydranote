"""
Redis client service for Hydra Notes backend.

Provides connection management for rate limiting and caching.
"""
from functools import lru_cache
from typing import Optional

import redis

from app.config import get_settings


class RedisServiceError(Exception):
    """Exception raised for Redis service errors."""
    pass


class RedisService:
    """
    Redis client wrapper for backend operations.

    Used primarily for rate limiting and caching.
    """

    def __init__(self):
        """Initialize Redis client."""
        settings = get_settings()

        if not settings.redis_url:
            raise RedisServiceError("Redis URL not configured")

        try:
            self.client = redis.from_url(
                settings.redis_url,
                decode_responses=True
            )
            # Test connection
            self.client.ping()
        except redis.ConnectionError as e:
            raise RedisServiceError(f"Failed to connect to Redis: {e}")
        except Exception as e:
            raise RedisServiceError(f"Failed to connect to Redis: {e}")

    def get(self, key: str) -> Optional[str]:
        """Get value by key."""
        return self.client.get(key)

    def set(self, key: str, value: str, ex: int = None) -> bool:
        """Set value with optional expiration in seconds."""
        return self.client.set(key, value, ex=ex)

    def incr(self, key: str) -> int:
        """Increment value by 1."""
        return self.client.incr(key)

    def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on a key."""
        return self.client.expire(key, seconds)

    def delete(self, key: str) -> int:
        """Delete a key."""
        return self.client.delete(key)


@lru_cache
def get_redis_service() -> RedisService:
    """
    Get or create the Redis service singleton.

    Returns:
        RedisService instance
    """
    return RedisService()
