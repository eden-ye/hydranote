"""
Supabase client service for Hydra Notes backend.

Provides database operations using Supabase with the service key
for elevated privileges (bypass RLS when needed).
"""
from functools import lru_cache
from typing import Optional

from supabase import create_client, Client

from app.config import get_settings


class SupabaseServiceError(Exception):
    """Exception raised for Supabase service errors."""
    pass


class SupabaseService:
    """
    Supabase client wrapper for backend operations.

    Uses the service key for elevated privileges.
    All operations should respect user isolation.
    """

    def __init__(self):
        """Initialize Supabase client with service key."""
        settings = get_settings()

        if not settings.supabase_url:
            raise SupabaseServiceError("Supabase URL not configured")

        if not settings.supabase_service_key:
            raise SupabaseServiceError("Supabase service key not configured")

        try:
            self.client: Client = create_client(
                settings.supabase_url,
                settings.supabase_service_key
            )
        except Exception as e:
            raise SupabaseServiceError(f"Failed to connect to Supabase: {e}")

    def get_user_profile(self, user_id: str) -> Optional[dict]:
        """
        Get user profile by ID.

        Args:
            user_id: The user's Supabase auth ID

        Returns:
            User profile dict or None if not found
        """
        response = (
            self.client
            .table("user_profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return response.data

    def create_user_profile(
        self,
        user_id: str,
        email: str,
        full_name: Optional[str] = None
    ) -> dict:
        """
        Create a new user profile.

        Args:
            user_id: The user's Supabase auth ID
            email: User's email address
            full_name: Optional full name

        Returns:
            Created user profile dict
        """
        profile_data = {
            "id": user_id,
            "email": email,
            "ai_generations_used": 0,
            "ai_generations_limit": 50,
        }
        if full_name:
            profile_data["full_name"] = full_name

        response = (
            self.client
            .table("user_profiles")
            .insert(profile_data)
            .execute()
        )
        return response.data

    def increment_ai_generation(self, user_id: str) -> int:
        """
        Increment the AI generation counter for a user.

        Uses the increment_ai_generation() Supabase function
        for atomic updates.

        Args:
            user_id: The user's Supabase auth ID

        Returns:
            Updated generation count
        """
        response = (
            self.client
            .rpc("increment_ai_generation", {"user_id_input": user_id})
            .execute()
        )
        return response.data.get("ai_generations_used", 0)

    def get_remaining_generations(self, user_id: str) -> int:
        """
        Get remaining AI generations for a user.

        Args:
            user_id: The user's Supabase auth ID

        Returns:
            Number of remaining generations
        """
        profile = self.get_user_profile(user_id)
        if not profile:
            return 0

        used = profile.get("ai_generations_used", 0)
        limit = profile.get("ai_generations_limit", 50)
        return max(0, limit - used)

    def check_generation_limit(self, user_id: str) -> bool:
        """
        Check if user is under the AI generation limit.

        Args:
            user_id: The user's Supabase auth ID

        Returns:
            True if user can generate, False if at limit
        """
        profile = self.get_user_profile(user_id)
        if not profile:
            return False

        used = profile.get("ai_generations_used", 0)
        limit = profile.get("ai_generations_limit", 50)
        return used < limit


@lru_cache
def get_supabase_service() -> SupabaseService:
    """
    Get or create the Supabase service singleton.

    Returns:
        SupabaseService instance
    """
    return SupabaseService()
