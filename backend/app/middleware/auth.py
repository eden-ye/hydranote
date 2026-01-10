"""
JWT authentication middleware for Hydra Notes.

Verifies Supabase JWT tokens and extracts user information.
Use get_current_user as a FastAPI dependency for protected routes.
"""
from typing import Optional
from dataclasses import dataclass

from fastapi import HTTPException, Header
from jose import jwt, JWTError, ExpiredSignatureError

from app.config import get_settings


class JWTAuthError(Exception):
    """Exception raised for JWT authentication errors."""
    pass


@dataclass
class UserInfo:
    """User information extracted from JWT token."""
    id: str
    email: str
    name: Optional[str] = None

    @classmethod
    def from_jwt_payload(cls, payload: dict) -> "UserInfo":
        """
        Create UserInfo from a decoded JWT payload.

        Args:
            payload: Decoded JWT token payload

        Returns:
            UserInfo instance
        """
        user_metadata = payload.get("user_metadata", {})
        return cls(
            id=payload.get("sub", ""),
            email=payload.get("email", ""),
            name=user_metadata.get("full_name"),
        )


def verify_jwt_token(token: str) -> dict:
    """
    Verify and decode a JWT token.

    Args:
        token: The JWT token string to verify

    Returns:
        Decoded token payload

    Raises:
        JWTAuthError: If token is invalid, expired, or verification fails
    """
    if not token:
        raise JWTAuthError("Token is required")

    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={
                "verify_exp": True,
                "verify_iat": True,
                "require_exp": True,
                "verify_aud": False,  # Supabase tokens have aud, but we don't need to verify it
            }
        )
        return payload
    except ExpiredSignatureError:
        raise JWTAuthError("Token has expired")
    except JWTError as e:
        raise JWTAuthError(f"Invalid token: {e}")


async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> UserInfo:
    """
    FastAPI dependency to get current authenticated user.

    Extracts and verifies the JWT token from the Authorization header.
    Returns user information for protected routes.

    Args:
        authorization: Authorization header value (Bearer <token>)

    Returns:
        UserInfo with user's ID, email, and optional name

    Raises:
        HTTPException 401: If not authenticated or token invalid
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format. Use: Bearer <token>"
        )

    token = authorization[7:]  # Remove "Bearer " prefix

    try:
        payload = verify_jwt_token(token)
        return UserInfo.from_jwt_payload(payload)
    except JWTAuthError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e)
        )


async def get_current_user_id(
    user: UserInfo = None,
    authorization: Optional[str] = Header(None),
) -> str:
    """
    FastAPI dependency to get current user's ID only.

    Convenience wrapper around get_current_user for routes
    that only need the user ID.

    Args:
        authorization: Authorization header value (Bearer <token>)

    Returns:
        User ID string

    Raises:
        HTTPException 401: If not authenticated or token invalid
    """
    if user:
        return user.id
    user = await get_current_user(authorization)
    return user.id
