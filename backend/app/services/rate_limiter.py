"""
Rate limiting service for AI generation endpoints.

Tracks user's AI generation count against their limit.
Uses Supabase for persistent tracking.
"""
from typing import Optional

from fastapi import HTTPException, Header

from app.config import get_settings
from app.middleware.auth import get_current_user, UserInfo
from app.services.supabase import get_supabase_service, SupabaseService


class RateLimitExceeded(Exception):
    """Exception raised when rate limit is exceeded."""
    pass


class RateLimiter:
    """
    Rate limiter for AI generation endpoints.

    Tracks usage against user's limit stored in Supabase.
    """

    def __init__(self, supabase_service: Optional[SupabaseService] = None):
        """
        Initialize rate limiter.

        Args:
            supabase_service: Optional Supabase service instance for testing
        """
        self._supabase = supabase_service
        settings = get_settings()
        self.default_limit = settings.free_tier_limit

    @property
    def supabase(self) -> SupabaseService:
        """Get Supabase service (lazy initialization)."""
        if self._supabase is None:
            self._supabase = get_supabase_service()
        return self._supabase

    def check_limit(self, user_id: str) -> bool:
        """
        Check if user is within their rate limit.

        Args:
            user_id: The user's ID

        Returns:
            True if user can generate, False if at/over limit
        """
        profile = self.supabase.get_user_profile(user_id)
        if not profile:
            return False

        used = profile.get("ai_generations_used", 0)
        limit = profile.get("ai_generations_limit", self.default_limit)
        return used < limit

    def increment_generation(self, user_id: str) -> int:
        """
        Increment the AI generation counter for a user.

        Args:
            user_id: The user's ID

        Returns:
            New generation count
        """
        return self.supabase.increment_ai_generation(user_id)

    def get_remaining(self, user_id: str) -> int:
        """
        Get remaining generations for a user.

        Args:
            user_id: The user's ID

        Returns:
            Number of remaining generations
        """
        return self.supabase.get_remaining_generations(user_id)


async def check_rate_limit(
    authorization: Optional[str] = Header(None),
) -> UserInfo:
    """
    FastAPI dependency that checks rate limit before allowing request.

    Should be used on AI generation endpoints.

    Args:
        authorization: Authorization header with JWT token

    Returns:
        UserInfo if rate limit check passes

    Raises:
        HTTPException 429: If rate limit exceeded
        HTTPException 401: If not authenticated
    """
    # First authenticate the user
    user = await get_current_user(authorization)

    # Then check rate limit
    limiter = RateLimiter()

    if not limiter.check_limit(user.id):
        remaining = limiter.get_remaining(user.id)
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. You have used all {50 - remaining + remaining} AI generations. "
                   f"Remaining: {remaining}",
            headers={"Retry-After": "86400"}  # 24 hours
        )

    return user


async def increment_after_generation(user_id: str) -> int:
    """
    Increment generation count after successful AI generation.

    Call this after a successful AI generation to track usage.

    Args:
        user_id: The user's ID

    Returns:
        New generation count
    """
    limiter = RateLimiter()
    return limiter.increment_generation(user_id)
