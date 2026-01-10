"""Tests for JWT authentication middleware."""
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
from jose import jwt

from app.middleware.auth import (
    verify_jwt_token,
    get_current_user,
    JWTAuthError,
    UserInfo,
)
from app.config import get_settings


@pytest.fixture
def mock_settings():
    """Mock settings with test JWT config."""
    settings = MagicMock()
    settings.jwt_secret = "test-jwt-secret-key-for-testing"
    settings.jwt_algorithm = "HS256"
    return settings


@pytest.fixture
def valid_token(mock_settings):
    """Generate a valid JWT token for testing."""
    payload = {
        "sub": "user-123-uuid",
        "email": "test@example.com",
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "iat": datetime.now(timezone.utc),
        "aud": "authenticated",
        "role": "authenticated",
    }
    return jwt.encode(payload, mock_settings.jwt_secret, algorithm=mock_settings.jwt_algorithm)


@pytest.fixture
def expired_token(mock_settings):
    """Generate an expired JWT token for testing."""
    payload = {
        "sub": "user-123-uuid",
        "email": "test@example.com",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        "iat": datetime.now(timezone.utc) - timedelta(hours=25),
        "aud": "authenticated",
    }
    return jwt.encode(payload, mock_settings.jwt_secret, algorithm=mock_settings.jwt_algorithm)


class TestVerifyJWTToken:
    """Tests for JWT token verification."""

    def test_verify_valid_token(self, mock_settings, valid_token):
        """Valid token returns decoded payload."""
        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            payload = verify_jwt_token(valid_token)
            assert payload["sub"] == "user-123-uuid"
            assert payload["email"] == "test@example.com"

    def test_verify_expired_token_raises(self, mock_settings, expired_token):
        """Expired token raises JWTAuthError."""
        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            with pytest.raises(JWTAuthError) as exc_info:
                verify_jwt_token(expired_token)
            assert "expired" in str(exc_info.value).lower()

    def test_verify_invalid_token_raises(self, mock_settings):
        """Invalid token raises JWTAuthError."""
        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            with pytest.raises(JWTAuthError) as exc_info:
                verify_jwt_token("invalid.token.here")
            assert "Invalid" in str(exc_info.value) or "invalid" in str(exc_info.value).lower()

    def test_verify_wrong_secret_raises(self, mock_settings):
        """Token signed with wrong secret raises JWTAuthError."""
        # Create token with different secret
        payload = {
            "sub": "user-123",
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        }
        wrong_token = jwt.encode(payload, "wrong-secret", algorithm="HS256")

        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            with pytest.raises(JWTAuthError) as exc_info:
                verify_jwt_token(wrong_token)
            assert "signature" in str(exc_info.value).lower() or "invalid" in str(exc_info.value).lower()

    def test_verify_empty_token_raises(self, mock_settings):
        """Empty token raises JWTAuthError."""
        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            with pytest.raises(JWTAuthError):
                verify_jwt_token("")


class TestGetCurrentUser:
    """Tests for user extraction from JWT."""

    @pytest.mark.asyncio
    async def test_get_current_user_valid_token(self, mock_settings, valid_token):
        """Valid token returns UserInfo."""
        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            user = await get_current_user(authorization=f"Bearer {valid_token}")
            assert user.id == "user-123-uuid"
            assert user.email == "test@example.com"

    @pytest.mark.asyncio
    async def test_get_current_user_missing_header_raises(self, mock_settings):
        """Missing authorization header raises HTTPException 401."""
        from fastapi import HTTPException

        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization=None)
            assert exc_info.value.status_code == 401
            assert "required" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_format_raises(self, mock_settings):
        """Invalid authorization format raises HTTPException 401."""
        from fastapi import HTTPException

        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization="InvalidFormat token")
            assert exc_info.value.status_code == 401
            assert "format" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    async def test_get_current_user_expired_token_raises(self, mock_settings, expired_token):
        """Expired token raises HTTPException 401."""
        from fastapi import HTTPException

        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization=f"Bearer {expired_token}")
            assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token_raises(self, mock_settings):
        """Invalid token raises HTTPException 401."""
        from fastapi import HTTPException

        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization="Bearer invalid.token")
            assert exc_info.value.status_code == 401


class TestUserInfo:
    """Tests for UserInfo model."""

    def test_user_info_creation(self):
        """UserInfo can be created with required fields."""
        user = UserInfo(id="user-123", email="test@example.com")
        assert user.id == "user-123"
        assert user.email == "test@example.com"
        assert user.name is None

    def test_user_info_with_name(self):
        """UserInfo can include optional name."""
        user = UserInfo(id="user-123", email="test@example.com", name="Test User")
        assert user.name == "Test User"

    def test_user_info_from_payload(self):
        """UserInfo can be created from JWT payload."""
        payload = {
            "sub": "user-456",
            "email": "another@example.com",
            "user_metadata": {"full_name": "Another User"}
        }
        user = UserInfo.from_jwt_payload(payload)
        assert user.id == "user-456"
        assert user.email == "another@example.com"
        assert user.name == "Another User"

    def test_user_info_from_payload_no_metadata(self):
        """UserInfo handles missing user_metadata gracefully."""
        payload = {
            "sub": "user-789",
            "email": "minimal@example.com"
        }
        user = UserInfo.from_jwt_payload(payload)
        assert user.id == "user-789"
        assert user.email == "minimal@example.com"
        assert user.name is None


class TestJWTAuthError:
    """Tests for JWTAuthError exception."""

    def test_jwt_auth_error_message(self):
        """JWTAuthError stores message correctly."""
        error = JWTAuthError("Token expired")
        assert str(error) == "Token expired"

    def test_jwt_auth_error_inherits_exception(self):
        """JWTAuthError inherits from Exception."""
        error = JWTAuthError("Test error")
        assert isinstance(error, Exception)
