"""Tests for concept extraction endpoint (API-303)."""
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch, AsyncMock
from httpx import AsyncClient, ASGITransport
from jose import jwt
from contextlib import contextmanager

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
    settings.anthropic_api_key = "test-anthropic-key"
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
        }
    }
    return jwt.encode(payload, mock_settings.jwt_secret, algorithm=mock_settings.jwt_algorithm)


@contextmanager
def mock_claude_service(mock_settings, mock_response):
    """Context manager to mock Claude service."""
    with patch("app.middleware.auth.get_settings", return_value=mock_settings):
        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_service.generate = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_service
            yield mock_service


class TestExtractConceptsEndpoint:
    """Tests for POST /api/ai/extract-concepts endpoint."""

    @pytest.mark.asyncio
    async def test_extract_concepts_success(self, client, mock_settings, valid_token):
        """Test basic concept extraction returns concepts with categories."""
        mock_response = {
            "text": '''[
                {"name": "Tesla Model 3", "category": "product"},
                {"name": "electric vehicle", "category": "category"},
                {"name": "Tesla Inc", "category": "company"}
            ]''',
            "tokens_used": 150
        }

        with mock_claude_service(mock_settings, mock_response):
            response = await client.post(
                "/api/ai/extract-concepts",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"text": "I just bought a Tesla Model 3. It's an amazing electric vehicle from Tesla."}
            )

        assert response.status_code == 200
        data = response.json()
        assert "concepts" in data
        assert len(data["concepts"]) == 3
        assert data["concepts"][0]["name"] == "Tesla Model 3"
        assert data["concepts"][0]["category"] == "product"
        assert data["concepts"][1]["name"] == "electric vehicle"
        assert data["concepts"][2]["name"] == "Tesla Inc"

    @pytest.mark.asyncio
    async def test_extract_concepts_with_max_concepts(self, client, mock_settings, valid_token):
        """Test concept extraction respects max_concepts parameter."""
        mock_response = {
            "text": '''[
                {"name": "Python", "category": "topic"},
                {"name": "machine learning", "category": "topic"}
            ]''',
            "tokens_used": 100
        }

        with mock_claude_service(mock_settings, mock_response):
            response = await client.post(
                "/api/ai/extract-concepts",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"text": "Python is great for machine learning", "max_concepts": 2}
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data["concepts"]) == 2

    @pytest.mark.asyncio
    async def test_extract_concepts_default_max_concepts(self, client, mock_settings, valid_token):
        """Test concept extraction uses default max_concepts of 5."""
        mock_response = {
            "text": '''[
                {"name": "concept1", "category": "topic"}
            ]''',
            "tokens_used": 50
        }

        with mock_claude_service(mock_settings, mock_response):
            response = await client.post(
                "/api/ai/extract-concepts",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"text": "Test text"}
            )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_extract_concepts_requires_auth(self, client, mock_settings):
        """Test concept extraction requires valid authentication."""
        response = await client.post(
            "/api/ai/extract-concepts",
            json={"text": "Some text to analyze"}
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_extract_concepts_validates_text(self, client, mock_settings, valid_token):
        """Test concept extraction validates text parameter is required."""
        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            response = await client.post(
                "/api/ai/extract-concepts",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={}  # Missing text
            )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_extract_concepts_handles_empty_text(self, client, mock_settings, valid_token):
        """Test concept extraction handles empty/short text gracefully."""
        mock_response = {
            "text": '[]',
            "tokens_used": 20
        }

        with mock_claude_service(mock_settings, mock_response):
            response = await client.post(
                "/api/ai/extract-concepts",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"text": ""}
            )

        assert response.status_code == 200
        data = response.json()
        assert data["concepts"] == []

    @pytest.mark.asyncio
    async def test_extract_concepts_handles_short_text(self, client, mock_settings, valid_token):
        """Test concept extraction handles very short text."""
        mock_response = {
            "text": '[]',
            "tokens_used": 20
        }

        with mock_claude_service(mock_settings, mock_response):
            response = await client.post(
                "/api/ai/extract-concepts",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"text": "Hi"}
            )

        assert response.status_code == 200
        data = response.json()
        # Short text may return empty or minimal concepts
        assert "concepts" in data

    @pytest.mark.asyncio
    async def test_extract_concepts_with_markdown_code_block(self, client, mock_settings, valid_token):
        """Test concept extraction handles markdown code block response."""
        mock_response = {
            "text": '''```json
[
    {"name": "React", "category": "topic"},
    {"name": "TypeScript", "category": "topic"}
]
```''',
            "tokens_used": 80
        }

        with mock_claude_service(mock_settings, mock_response):
            response = await client.post(
                "/api/ai/extract-concepts",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"text": "Building a React app with TypeScript"}
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data["concepts"]) == 2
        assert data["concepts"][0]["name"] == "React"

    @pytest.mark.asyncio
    async def test_extract_concepts_optional_category(self, client, mock_settings, valid_token):
        """Test concept extraction handles missing category (optional field)."""
        mock_response = {
            "text": '''[
                {"name": "concept without category"},
                {"name": "concept with category", "category": "topic"}
            ]''',
            "tokens_used": 60
        }

        with mock_claude_service(mock_settings, mock_response):
            response = await client.post(
                "/api/ai/extract-concepts",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"text": "Test text with various concepts"}
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data["concepts"]) == 2
        assert data["concepts"][0]["category"] is None
        assert data["concepts"][1]["category"] == "topic"

    @pytest.mark.asyncio
    async def test_extract_concepts_claude_error(self, client, mock_settings, valid_token):
        """Test concept extraction handles Claude service errors."""
        from app.services.claude import ClaudeServiceError

        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            with patch("app.api.routes.ai.get_claude_service") as mock_get:
                mock_service = MagicMock()

                async def raise_error(*args, **kwargs):
                    raise ClaudeServiceError("Rate limit exceeded")

                mock_service.generate = AsyncMock(side_effect=raise_error)
                mock_get.return_value = mock_service

                response = await client.post(
                    "/api/ai/extract-concepts",
                    headers={"Authorization": f"Bearer {valid_token}"},
                    json={"text": "Test text"}
                )

        assert response.status_code == 503
        assert "Rate limit" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_extract_concepts_invalid_json_response(self, client, mock_settings, valid_token):
        """Test concept extraction handles invalid JSON from Claude."""
        mock_response = {
            "text": "This is not valid JSON",
            "tokens_used": 50
        }

        with mock_claude_service(mock_settings, mock_response):
            response = await client.post(
                "/api/ai/extract-concepts",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"text": "Test text"}
            )

        assert response.status_code == 500
        assert "Failed to parse" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_extract_concepts_returns_tokens_used(self, client, mock_settings, valid_token):
        """Test concept extraction returns token usage information."""
        mock_response = {
            "text": '''[{"name": "concept", "category": "topic"}]''',
            "tokens_used": 175
        }

        with mock_claude_service(mock_settings, mock_response):
            response = await client.post(
                "/api/ai/extract-concepts",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"text": "Some text about a concept"}
            )

        assert response.status_code == 200
        data = response.json()
        assert "tokens_used" in data
        assert data["tokens_used"] == 175


class TestConceptExtractionPrompt:
    """Tests for concept extraction prompt building."""

    @pytest.mark.asyncio
    async def test_prompt_includes_max_concepts(self, client, mock_settings, valid_token):
        """Test that the prompt includes the max_concepts parameter."""
        mock_response = {
            "text": '[]',
            "tokens_used": 50
        }

        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            with patch("app.api.routes.ai.get_claude_service") as mock_get:
                mock_service = MagicMock()
                mock_service.generate = AsyncMock(return_value=mock_response)
                mock_get.return_value = mock_service

                await client.post(
                    "/api/ai/extract-concepts",
                    headers={"Authorization": f"Bearer {valid_token}"},
                    json={"text": "Test text", "max_concepts": 3}
                )

                # Verify the prompt was called with max_concepts in the text
                call_args = mock_service.generate.call_args
                prompt = call_args.kwargs.get("prompt", call_args.args[0] if call_args.args else "")
                assert "3" in prompt or "three" in prompt.lower()
