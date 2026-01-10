"""Tests for authentication endpoints."""
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch, AsyncMock
from httpx import AsyncClient, ASGITransport
from jose import jwt

from app.main import app


@pytest.fixture
async def client():
    """Create test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_settings():
    """Mock settings for testing."""
    settings = MagicMock()
    settings.jwt_secret = "test-secret-key"
    settings.jwt_algorithm = "HS256"
    settings.supabase_url = "https://test.supabase.co"
    settings.supabase_service_key = "test-service-key"
    return settings


@pytest.fixture
def valid_token(mock_settings):
    """Generate a valid Supabase JWT token."""
    payload = {
        "sub": "user-123-uuid",
        "email": "test@example.com",
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "iat": datetime.now(timezone.utc),
        "aud": "authenticated",
        "role": "authenticated",
        "user_metadata": {
            "full_name": "Test User",
            "avatar_url": "https://example.com/avatar.jpg"
        }
    }
    return jwt.encode(payload, mock_settings.jwt_secret, algorithm=mock_settings.jwt_algorithm)


class TestVerifyAuthEndpoint:
    """Tests for POST /api/auth/verify endpoint."""

    @pytest.mark.asyncio
    async def test_verify_creates_new_user_profile(self, client, mock_settings, valid_token):
        """Verify endpoint creates user profile on first login."""
        mock_supabase = MagicMock()
        # Simulate no existing profile
        mock_supabase.get_user_profile.return_value = None
        mock_supabase.create_user_profile.return_value = {
            "id": "user-123-uuid",
            "email": "test@example.com",
            "full_name": "Test User",
            "ai_generations_used": 0,
            "ai_generations_limit": 50
        }

        with patch("app.api.routes.auth.get_settings", return_value=mock_settings):
            with patch("app.api.routes.auth.get_supabase_service", return_value=mock_supabase):
                with patch("app.middleware.auth.get_settings", return_value=mock_settings):
                    response = await client.post(
                        "/api/auth/verify",
                        headers={"Authorization": f"Bearer {valid_token}"}
                    )

        assert response.status_code == 200
        data = response.json()
        assert data["user"]["id"] == "user-123-uuid"
        assert data["user"]["email"] == "test@example.com"
        assert data["is_new_user"] is True

    @pytest.mark.asyncio
    async def test_verify_returns_existing_user_profile(self, client, mock_settings, valid_token):
        """Verify endpoint returns existing profile for returning user."""
        mock_supabase = MagicMock()
        mock_supabase.get_user_profile.return_value = {
            "id": "user-123-uuid",
            "email": "test@example.com",
            "full_name": "Existing User",
            "ai_generations_used": 10,
            "ai_generations_limit": 50
        }

        with patch("app.api.routes.auth.get_settings", return_value=mock_settings):
            with patch("app.api.routes.auth.get_supabase_service", return_value=mock_supabase):
                with patch("app.middleware.auth.get_settings", return_value=mock_settings):
                    response = await client.post(
                        "/api/auth/verify",
                        headers={"Authorization": f"Bearer {valid_token}"}
                    )

        assert response.status_code == 200
        data = response.json()
        assert data["user"]["id"] == "user-123-uuid"
        assert data["is_new_user"] is False
        assert data["ai_generations_remaining"] == 40

    @pytest.mark.asyncio
    async def test_verify_without_token_returns_401(self, client):
        """Verify endpoint returns 401 without authorization."""
        response = await client.post("/api/auth/verify")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_verify_with_invalid_token_returns_401(self, client, mock_settings):
        """Verify endpoint returns 401 with invalid token."""
        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            response = await client.post(
                "/api/auth/verify",
                headers={"Authorization": "Bearer invalid.token.here"}
            )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_verify_handles_supabase_error(self, client, mock_settings, valid_token):
        """Verify endpoint handles Supabase errors gracefully."""
        mock_supabase = MagicMock()
        mock_supabase.get_user_profile.side_effect = Exception("Database error")

        with patch("app.api.routes.auth.get_settings", return_value=mock_settings):
            with patch("app.api.routes.auth.get_supabase_service", return_value=mock_supabase):
                with patch("app.middleware.auth.get_settings", return_value=mock_settings):
                    response = await client.post(
                        "/api/auth/verify",
                        headers={"Authorization": f"Bearer {valid_token}"}
                    )

        assert response.status_code == 500
        data = response.json()
        assert "error" in data["detail"].lower()


class TestGetMeEndpoint:
    """Tests for GET /api/auth/me endpoint."""

    @pytest.mark.asyncio
    async def test_get_me_returns_user_info(self, client, mock_settings, valid_token):
        """Get me endpoint returns current user info."""
        mock_supabase = MagicMock()
        mock_supabase.get_user_profile.return_value = {
            "id": "user-123-uuid",
            "email": "test@example.com",
            "full_name": "Test User",
            "ai_generations_used": 5,
            "ai_generations_limit": 50
        }

        with patch("app.api.routes.auth.get_supabase_service", return_value=mock_supabase):
            with patch("app.middleware.auth.get_settings", return_value=mock_settings):
                response = await client.get(
                    "/api/auth/me",
                    headers={"Authorization": f"Bearer {valid_token}"}
                )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "user-123-uuid"
        assert data["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_get_me_without_token_returns_401(self, client):
        """Get me endpoint returns 401 without authorization."""
        response = await client.get("/api/auth/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me_profile_not_found_returns_404(self, client, mock_settings, valid_token):
        """Get me endpoint returns 404 if profile not found."""
        mock_supabase = MagicMock()
        mock_supabase.get_user_profile.return_value = None

        with patch("app.api.routes.auth.get_supabase_service", return_value=mock_supabase):
            with patch("app.middleware.auth.get_settings", return_value=mock_settings):
                response = await client.get(
                    "/api/auth/me",
                    headers={"Authorization": f"Bearer {valid_token}"}
                )

        assert response.status_code == 404


class TestLogoutEndpoint:
    """Tests for POST /api/auth/logout endpoint."""

    @pytest.mark.asyncio
    async def test_logout_returns_success(self, client, mock_settings, valid_token):
        """Logout endpoint returns success message."""
        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            response = await client.post(
                "/api/auth/logout",
                headers={"Authorization": f"Bearer {valid_token}"}
            )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Logged out successfully"

    @pytest.mark.asyncio
    async def test_logout_without_token_still_works(self, client):
        """Logout works even without token (idempotent)."""
        response = await client.post("/api/auth/logout")
        assert response.status_code == 200
