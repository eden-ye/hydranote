"""
Authentication routes for Hydra Notes.

Handles OAuth verification, user profile management, and session lifecycle.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.middleware.auth import get_current_user, UserInfo
from app.services.supabase import get_supabase_service, SupabaseServiceError
from app.config import get_settings

router = APIRouter()


class UserResponse(BaseModel):
    """User profile response model."""
    id: str
    email: str
    name: Optional[str] = None
    ai_generations_used: int = 0
    ai_generations_limit: int = 50


class VerifyResponse(BaseModel):
    """Response from verify endpoint."""
    user: UserResponse
    is_new_user: bool
    ai_generations_remaining: int


@router.post("/verify", response_model=VerifyResponse)
async def verify_auth(user: UserInfo = Depends(get_current_user)):
    """
    Verify Supabase authentication token and ensure user profile exists.

    This endpoint should be called after Supabase OAuth completes.
    It creates a user profile on first login and returns user info.

    Args:
        user: Authenticated user info from JWT token

    Returns:
        VerifyResponse with user profile and new user status
    """
    try:
        supabase = get_supabase_service()

        # Check if user profile exists
        profile = supabase.get_user_profile(user.id)

        if profile:
            # Existing user
            return VerifyResponse(
                user=UserResponse(
                    id=profile["id"],
                    email=profile.get("email", user.email),
                    name=profile.get("full_name", user.name),
                    ai_generations_used=profile.get("ai_generations_used", 0),
                    ai_generations_limit=profile.get("ai_generations_limit", 50),
                ),
                is_new_user=False,
                ai_generations_remaining=max(0,
                    profile.get("ai_generations_limit", 50) - profile.get("ai_generations_used", 0)
                )
            )
        else:
            # New user - create profile
            new_profile = supabase.create_user_profile(
                user_id=user.id,
                email=user.email,
                full_name=user.name
            )

            return VerifyResponse(
                user=UserResponse(
                    id=new_profile["id"],
                    email=new_profile.get("email", user.email),
                    name=new_profile.get("full_name", user.name),
                    ai_generations_used=0,
                    ai_generations_limit=50,
                ),
                is_new_user=True,
                ai_generations_remaining=50
            )

    except SupabaseServiceError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error verifying authentication: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_me(user: UserInfo = Depends(get_current_user)):
    """
    Get current authenticated user's profile.

    Args:
        user: Authenticated user info from JWT token

    Returns:
        UserResponse with profile data
    """
    try:
        supabase = get_supabase_service()
        profile = supabase.get_user_profile(user.id)

        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")

        return UserResponse(
            id=profile["id"],
            email=profile.get("email", user.email),
            name=profile.get("full_name", user.name),
            ai_generations_used=profile.get("ai_generations_used", 0),
            ai_generations_limit=profile.get("ai_generations_limit", 50),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching profile: {str(e)}"
        )


@router.post("/logout")
async def logout():
    """
    Logout user.

    Note: With Supabase, the actual session is managed client-side.
    This endpoint is provided for completeness and can be used for
    any server-side cleanup if needed.

    Returns:
        Success message
    """
    return {"message": "Logged out successfully"}
