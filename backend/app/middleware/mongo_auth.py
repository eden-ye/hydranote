"""
MongoDB auth middleware for Hydra Notes.

Provides user-scoped queries since MongoDB doesn't have Supabase RLS.
All queries MUST include user_id to ensure data isolation.
"""

from fastapi import Depends, HTTPException, Header
from bson import ObjectId
from typing import Optional

from app.db.mongo import get_blocks_collection


async def get_current_user_id(
    authorization: Optional[str] = Header(None),
) -> str:
    """
    Extract user ID from Authorization header.

    In production, this validates the Supabase JWT and extracts the user ID.
    For development, accepts a simple Bearer token with the user ID.

    Returns:
        User ID as string (Supabase UID format)

    Raises:
        HTTPException 401 if not authenticated
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = authorization[7:]  # Remove "Bearer " prefix

    # TODO: In production, validate Supabase JWT here
    # For now, we trust the token as the user ID (development only)
    # This will be replaced with proper JWT validation

    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")

    return token


def user_scoped_query(user_id: str) -> dict:
    """
    Create a base query scoped to a specific user.

    CRITICAL: All MongoDB queries MUST use this to ensure data isolation.
    This replaces Supabase RLS.

    Args:
        user_id: The authenticated user's ID

    Returns:
        Base query dict with user_id and soft-delete filter
    """
    return {
        "user_id": user_id,
        "deleted_at": None,
    }


async def require_block_ownership(
    block_id: str,
    user_id: str = Depends(get_current_user_id),
) -> str:
    """
    Verify the user owns the specified block.

    Use as a dependency for routes that modify specific blocks.

    Args:
        block_id: The block ID to verify
        user_id: The authenticated user's ID (from dependency)

    Returns:
        The block_id if ownership verified

    Raises:
        HTTPException 404 if block not found or not owned by user
    """
    try:
        oid = ObjectId(block_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid block ID format")

    blocks = get_blocks_collection()
    block = await blocks.find_one({
        "_id": oid,
        "user_id": user_id,
        "deleted_at": None,
    })

    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    return block_id
