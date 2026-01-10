"""Tests for Supabase client service."""
import pytest
from unittest.mock import MagicMock, patch, AsyncMock

from app.services.supabase import (
    SupabaseService,
    SupabaseServiceError,
    get_supabase_service,
)


@pytest.fixture
def mock_settings():
    """Mock settings with test Supabase config."""
    settings = MagicMock()
    settings.supabase_url = "https://test-project.supabase.co"
    settings.supabase_service_key = "test-service-key"
    return settings


@pytest.fixture
def mock_supabase_client():
    """Create a mock Supabase client."""
    client = MagicMock()
    return client


class TestSupabaseServiceInit:
    """Tests for Supabase service initialization."""

    def test_init_with_valid_config(self, mock_settings):
        """Service initializes with valid Supabase config."""
        with patch("app.services.supabase.get_settings", return_value=mock_settings):
            with patch("app.services.supabase.create_client") as mock_create:
                mock_create.return_value = MagicMock()
                service = SupabaseService()
                mock_create.assert_called_once_with(
                    "https://test-project.supabase.co",
                    "test-service-key"
                )

    def test_init_without_url_raises(self):
        """Service raises error when URL is missing."""
        mock_settings = MagicMock()
        mock_settings.supabase_url = ""
        mock_settings.supabase_service_key = "key"

        with patch("app.services.supabase.get_settings", return_value=mock_settings):
            with pytest.raises(SupabaseServiceError) as exc_info:
                SupabaseService()
            assert "URL not configured" in str(exc_info.value)

    def test_init_without_key_raises(self):
        """Service raises error when service key is missing."""
        mock_settings = MagicMock()
        mock_settings.supabase_url = "https://test.supabase.co"
        mock_settings.supabase_service_key = ""

        with patch("app.services.supabase.get_settings", return_value=mock_settings):
            with pytest.raises(SupabaseServiceError) as exc_info:
                SupabaseService()
            assert "service key not configured" in str(exc_info.value)


class TestUserProfileOperations:
    """Tests for user profile database operations."""

    @pytest.fixture
    def supabase_service(self, mock_settings, mock_supabase_client):
        """Create Supabase service with mocked client."""
        with patch("app.services.supabase.get_settings", return_value=mock_settings):
            with patch("app.services.supabase.create_client", return_value=mock_supabase_client):
                service = SupabaseService()
                return service

    def test_get_user_profile_success(self, supabase_service):
        """Get user profile returns profile data."""
        mock_response = MagicMock()
        mock_response.data = {
            "id": "user-123",
            "email": "test@example.com",
            "ai_generations_used": 5,
            "ai_generations_limit": 50
        }
        supabase_service.client.table().select().eq().single().execute.return_value = mock_response

        result = supabase_service.get_user_profile("user-123")
        assert result["id"] == "user-123"
        assert result["ai_generations_used"] == 5

    def test_get_user_profile_not_found(self, supabase_service):
        """Get user profile returns None when not found."""
        mock_response = MagicMock()
        mock_response.data = None
        supabase_service.client.table().select().eq().single().execute.return_value = mock_response

        result = supabase_service.get_user_profile("nonexistent")
        assert result is None

    def test_create_user_profile(self, supabase_service):
        """Create user profile inserts new record."""
        mock_response = MagicMock()
        mock_response.data = {
            "id": "new-user",
            "email": "new@example.com",
            "ai_generations_used": 0,
            "ai_generations_limit": 50
        }
        supabase_service.client.table().insert().execute.return_value = mock_response

        result = supabase_service.create_user_profile(
            user_id="new-user",
            email="new@example.com"
        )
        assert result["id"] == "new-user"
        assert result["ai_generations_used"] == 0


class TestAIGenerationTracking:
    """Tests for AI generation usage tracking."""

    @pytest.fixture
    def supabase_service(self, mock_settings, mock_supabase_client):
        """Create Supabase service with mocked client."""
        with patch("app.services.supabase.get_settings", return_value=mock_settings):
            with patch("app.services.supabase.create_client", return_value=mock_supabase_client):
                service = SupabaseService()
                return service

    def test_increment_ai_generation(self, supabase_service):
        """Increment AI generation updates counter."""
        mock_response = MagicMock()
        mock_response.data = {"ai_generations_used": 6}
        supabase_service.client.rpc().execute.return_value = mock_response

        result = supabase_service.increment_ai_generation("user-123")
        assert result == 6

    def test_get_remaining_generations(self, supabase_service):
        """Get remaining generations calculates correctly."""
        mock_response = MagicMock()
        mock_response.data = {
            "ai_generations_used": 10,
            "ai_generations_limit": 50
        }
        supabase_service.client.table().select().eq().single().execute.return_value = mock_response

        result = supabase_service.get_remaining_generations("user-123")
        assert result == 40

    def test_check_generation_limit_allowed(self, supabase_service):
        """Check generation limit returns True when under limit."""
        mock_response = MagicMock()
        mock_response.data = {
            "ai_generations_used": 10,
            "ai_generations_limit": 50
        }
        supabase_service.client.table().select().eq().single().execute.return_value = mock_response

        result = supabase_service.check_generation_limit("user-123")
        assert result is True

    def test_check_generation_limit_exceeded(self, supabase_service):
        """Check generation limit returns False when at limit."""
        mock_response = MagicMock()
        mock_response.data = {
            "ai_generations_used": 50,
            "ai_generations_limit": 50
        }
        supabase_service.client.table().select().eq().single().execute.return_value = mock_response

        result = supabase_service.check_generation_limit("user-123")
        assert result is False


class TestConnectionHandling:
    """Tests for connection error handling."""

    def test_connection_failure_raises_service_error(self, mock_settings):
        """Connection failure raises SupabaseServiceError."""
        with patch("app.services.supabase.get_settings", return_value=mock_settings):
            with patch("app.services.supabase.create_client") as mock_create:
                mock_create.side_effect = Exception("Connection refused")
                with pytest.raises(SupabaseServiceError) as exc_info:
                    SupabaseService()
                assert "Failed to connect" in str(exc_info.value)


class TestGetSupabaseService:
    """Tests for service singleton getter."""

    def test_get_supabase_service_returns_instance(self, mock_settings, mock_supabase_client):
        """get_supabase_service returns a SupabaseService instance."""
        with patch("app.services.supabase.get_settings", return_value=mock_settings):
            with patch("app.services.supabase.create_client", return_value=mock_supabase_client):
                service = get_supabase_service()
                assert isinstance(service, SupabaseService)
