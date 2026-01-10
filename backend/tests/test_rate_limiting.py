"""Tests for rate limiting functionality."""
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch, AsyncMock
from httpx import AsyncClient, ASGITransport
from jose import jwt

from app.services.redis import RedisService, RedisServiceError, get_redis_service
from app.services.rate_limiter import (
    RateLimiter,
    RateLimitExceeded,
    check_rate_limit,
)


@pytest.fixture
def mock_settings():
    """Mock settings for testing."""
    settings = MagicMock()
    settings.redis_url = "redis://localhost:6379"
    settings.jwt_secret = "test-secret-key"
    settings.jwt_algorithm = "HS256"
    settings.free_tier_limit = 50
    return settings


@pytest.fixture
def mock_redis_client():
    """Mock Redis client."""
    client = MagicMock()
    return client


class TestRedisService:
    """Tests for Redis service initialization and operations."""

    def test_init_with_valid_config(self, mock_settings):
        """Redis service initializes with valid config."""
        with patch("app.services.redis.get_settings", return_value=mock_settings):
            with patch("app.services.redis.redis.from_url") as mock_from_url:
                mock_from_url.return_value = MagicMock()
                service = RedisService()
                mock_from_url.assert_called_once_with(
                    "redis://localhost:6379",
                    decode_responses=True
                )

    def test_init_without_url_raises(self):
        """Redis service raises error when URL is missing."""
        settings = MagicMock()
        settings.redis_url = ""

        with patch("app.services.redis.get_settings", return_value=settings):
            with pytest.raises(RedisServiceError) as exc_info:
                RedisService()
            assert "URL not configured" in str(exc_info.value)

    def test_connection_failure_raises(self, mock_settings):
        """Connection failure raises RedisServiceError."""
        with patch("app.services.redis.get_settings", return_value=mock_settings):
            with patch("app.services.redis.redis.from_url") as mock_from_url:
                mock_from_url.side_effect = Exception("Connection refused")
                with pytest.raises(RedisServiceError) as exc_info:
                    RedisService()
                assert "Failed to connect" in str(exc_info.value)


class TestRateLimiter:
    """Tests for rate limiter logic."""

    @pytest.fixture
    def mock_supabase(self):
        """Mock Supabase service."""
        supabase = MagicMock()
        return supabase

    @pytest.fixture
    def rate_limiter(self, mock_settings, mock_supabase):
        """Create rate limiter with mocked services."""
        with patch("app.services.rate_limiter.get_settings", return_value=mock_settings):
            limiter = RateLimiter(supabase_service=mock_supabase)
            return limiter

    def test_check_limit_allowed(self, rate_limiter, mock_supabase):
        """Check limit returns True when under limit."""
        mock_supabase.get_user_profile.return_value = {
            "ai_generations_used": 10,
            "ai_generations_limit": 50
        }

        result = rate_limiter.check_limit("user-123")
        assert result is True

    def test_check_limit_exceeded(self, rate_limiter, mock_supabase):
        """Check limit returns False when at limit."""
        mock_supabase.get_user_profile.return_value = {
            "ai_generations_used": 50,
            "ai_generations_limit": 50
        }

        result = rate_limiter.check_limit("user-123")
        assert result is False

    def test_check_limit_over_limit(self, rate_limiter, mock_supabase):
        """Check limit returns False when over limit."""
        mock_supabase.get_user_profile.return_value = {
            "ai_generations_used": 60,
            "ai_generations_limit": 50
        }

        result = rate_limiter.check_limit("user-123")
        assert result is False

    def test_check_limit_no_profile(self, rate_limiter, mock_supabase):
        """Check limit returns False for non-existent user."""
        mock_supabase.get_user_profile.return_value = None

        result = rate_limiter.check_limit("unknown-user")
        assert result is False

    def test_increment_generation(self, rate_limiter, mock_supabase):
        """Increment generation updates counter."""
        mock_supabase.increment_ai_generation.return_value = 11

        result = rate_limiter.increment_generation("user-123")
        assert result == 11
        mock_supabase.increment_ai_generation.assert_called_once_with("user-123")

    def test_get_remaining(self, rate_limiter, mock_supabase):
        """Get remaining returns correct count."""
        mock_supabase.get_remaining_generations.return_value = 40

        result = rate_limiter.get_remaining("user-123")
        assert result == 40


class TestRateLimitDependency:
    """Tests for rate limit FastAPI dependency."""

    @pytest.fixture
    def valid_token(self, mock_settings):
        """Generate a valid JWT token."""
        payload = {
            "sub": "user-123",
            "email": "test@example.com",
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(payload, mock_settings.jwt_secret, algorithm=mock_settings.jwt_algorithm)

    @pytest.mark.asyncio
    async def test_check_rate_limit_allowed(self, mock_settings, valid_token):
        """Rate limit dependency passes when under limit."""
        mock_supabase = MagicMock()
        mock_supabase.get_user_profile.return_value = {
            "ai_generations_used": 10,
            "ai_generations_limit": 50
        }

        with patch("app.services.rate_limiter.get_settings", return_value=mock_settings):
            with patch("app.services.rate_limiter.get_supabase_service", return_value=mock_supabase):
                with patch("app.middleware.auth.get_settings", return_value=mock_settings):
                    # This should not raise
                    result = await check_rate_limit(
                        authorization=f"Bearer {valid_token}"
                    )
                    assert result.id == "user-123"

    @pytest.mark.asyncio
    async def test_check_rate_limit_exceeded_raises_429(self, mock_settings, valid_token):
        """Rate limit dependency raises 429 when exceeded."""
        from fastapi import HTTPException

        mock_supabase = MagicMock()
        mock_supabase.get_user_profile.return_value = {
            "ai_generations_used": 50,
            "ai_generations_limit": 50
        }

        with patch("app.services.rate_limiter.get_settings", return_value=mock_settings):
            with patch("app.services.rate_limiter.get_supabase_service", return_value=mock_supabase):
                with patch("app.middleware.auth.get_settings", return_value=mock_settings):
                    with pytest.raises(HTTPException) as exc_info:
                        await check_rate_limit(
                            authorization=f"Bearer {valid_token}"
                        )
                    assert exc_info.value.status_code == 429
                    assert "rate limit" in str(exc_info.value.detail).lower()


class TestGetRedisService:
    """Tests for Redis service singleton."""

    def test_get_redis_service_returns_instance(self, mock_settings, mock_redis_client):
        """get_redis_service returns a RedisService instance."""
        with patch("app.services.redis.get_settings", return_value=mock_settings):
            with patch("app.services.redis.redis.from_url", return_value=mock_redis_client):
                # Clear cached instance
                get_redis_service.cache_clear()
                service = get_redis_service()
                assert isinstance(service, RedisService)
