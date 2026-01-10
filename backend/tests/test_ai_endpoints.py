"""Tests for AI router endpoints."""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.claude import ClaudeServiceError


client = TestClient(app)


class TestGenerateEndpoint:
    """Tests for POST /api/ai/generate endpoint."""

    @pytest.fixture
    def mock_claude_service(self):
        """Mock Claude service for testing."""
        mock_service = MagicMock()
        return mock_service

    def test_generate_success(self):
        """Generate endpoint returns bullet structure on success."""
        mock_response = {
            "text": '["Point 1", "Point 2", "Point 3"]',
            "tokens_used": 150
        }

        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_service.generate = MagicMock(return_value=mock_response)
            mock_get.return_value = mock_service

            # Make async mock work
            import asyncio
            mock_service.generate = MagicMock(
                side_effect=lambda **kwargs: asyncio.coroutine(
                    lambda: mock_response
                )()
            )

            response = client.post(
                "/api/ai/generate",
                json={"input_text": "Machine learning basics", "max_levels": 3}
            )

            assert response.status_code == 200
            data = response.json()
            assert "bullets" in data
            assert "tokens_used" in data
            assert len(data["bullets"]) == 3
            assert data["bullets"][0]["text"] == "Point 1"

    def test_generate_with_markdown_code_block(self):
        """Generate endpoint handles markdown code block response."""
        mock_response = {
            "text": '```json\n["Point 1", "Point 2"]\n```',
            "tokens_used": 100
        }

        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_get.return_value = mock_service

            import asyncio
            mock_service.generate = MagicMock(
                side_effect=lambda **kwargs: asyncio.coroutine(
                    lambda: mock_response
                )()
            )

            response = client.post(
                "/api/ai/generate",
                json={"input_text": "Test topic"}
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data["bullets"]) == 2

    def test_generate_default_max_levels(self):
        """Generate endpoint uses default max_levels when not provided."""
        mock_response = {
            "text": '["Point 1"]',
            "tokens_used": 50
        }

        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_get.return_value = mock_service

            import asyncio
            mock_service.generate = MagicMock(
                side_effect=lambda **kwargs: asyncio.coroutine(
                    lambda: mock_response
                )()
            )

            response = client.post(
                "/api/ai/generate",
                json={"input_text": "Test"}
            )

            assert response.status_code == 200

    def test_generate_returns_tokens_used(self):
        """Generate endpoint returns token usage."""
        mock_response = {
            "text": '["Point 1"]',
            "tokens_used": 250
        }

        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_get.return_value = mock_service

            import asyncio
            mock_service.generate = MagicMock(
                side_effect=lambda **kwargs: asyncio.coroutine(
                    lambda: mock_response
                )()
            )

            response = client.post(
                "/api/ai/generate",
                json={"input_text": "Test"}
            )

            assert response.status_code == 200
            assert response.json()["tokens_used"] == 250

    def test_generate_invalid_json_response(self):
        """Generate endpoint handles invalid JSON from Claude."""
        mock_response = {
            "text": "This is not valid JSON",
            "tokens_used": 50
        }

        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_get.return_value = mock_service

            import asyncio
            mock_service.generate = MagicMock(
                side_effect=lambda **kwargs: asyncio.coroutine(
                    lambda: mock_response
                )()
            )

            response = client.post(
                "/api/ai/generate",
                json={"input_text": "Test"}
            )

            assert response.status_code == 500
            assert "Failed to parse" in response.json()["detail"]

    def test_generate_claude_service_error(self):
        """Generate endpoint handles Claude service errors."""
        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_get.return_value = mock_service

            import asyncio

            async def raise_error(**kwargs):
                raise ClaudeServiceError("Rate limit exceeded")

            mock_service.generate = MagicMock(side_effect=raise_error)

            response = client.post(
                "/api/ai/generate",
                json={"input_text": "Test"}
            )

            assert response.status_code == 503
            assert "Rate limit" in response.json()["detail"]

    def test_generate_missing_input_text(self):
        """Generate endpoint requires input_text."""
        response = client.post(
            "/api/ai/generate",
            json={}
        )

        assert response.status_code == 422  # Validation error

    def test_generate_empty_input_text(self):
        """Generate endpoint accepts empty input text."""
        mock_response = {
            "text": '["General knowledge point"]',
            "tokens_used": 50
        }

        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_get.return_value = mock_service

            import asyncio
            mock_service.generate = MagicMock(
                side_effect=lambda **kwargs: asyncio.coroutine(
                    lambda: mock_response
                )()
            )

            response = client.post(
                "/api/ai/generate",
                json={"input_text": ""}
            )

            # Should still work (Claude will generate something)
            assert response.status_code == 200


class TestExpandEndpoint:
    """Tests for POST /api/ai/expand endpoint."""

    def test_expand_success(self):
        """Expand endpoint returns children on success."""
        mock_response = {
            "text": '["Child 1", "Child 2", "Child 3"]',
            "tokens_used": 100
        }

        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_get.return_value = mock_service

            import asyncio
            mock_service.generate = MagicMock(
                side_effect=lambda **kwargs: asyncio.coroutine(
                    lambda: mock_response
                )()
            )

            response = client.post(
                "/api/ai/expand",
                json={"bullet_text": "Project planning"}
            )

            assert response.status_code == 200
            data = response.json()
            assert "children" in data
            assert "tokens_used" in data
            assert len(data["children"]) == 3
            assert data["children"][0] == "Child 1"

    def test_expand_with_context(self):
        """Expand endpoint uses parent and sibling context."""
        mock_response = {
            "text": '["Context-aware child 1", "Context-aware child 2"]',
            "tokens_used": 80
        }

        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_get.return_value = mock_service

            import asyncio
            mock_service.generate = MagicMock(
                side_effect=lambda **kwargs: asyncio.coroutine(
                    lambda: mock_response
                )()
            )

            response = client.post(
                "/api/ai/expand",
                json={
                    "bullet_text": "Testing strategy",
                    "siblings": ["Design phase", "Implementation"],
                    "parent_context": "Software development"
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data["children"]) == 2

    def test_expand_default_empty_siblings(self):
        """Expand endpoint uses empty siblings by default."""
        mock_response = {
            "text": '["Child 1"]',
            "tokens_used": 50
        }

        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_get.return_value = mock_service

            import asyncio
            mock_service.generate = MagicMock(
                side_effect=lambda **kwargs: asyncio.coroutine(
                    lambda: mock_response
                )()
            )

            response = client.post(
                "/api/ai/expand",
                json={"bullet_text": "Test"}
            )

            assert response.status_code == 200

    def test_expand_returns_tokens_used(self):
        """Expand endpoint returns token usage."""
        mock_response = {
            "text": '["Child 1"]',
            "tokens_used": 175
        }

        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_get.return_value = mock_service

            import asyncio
            mock_service.generate = MagicMock(
                side_effect=lambda **kwargs: asyncio.coroutine(
                    lambda: mock_response
                )()
            )

            response = client.post(
                "/api/ai/expand",
                json={"bullet_text": "Test"}
            )

            assert response.status_code == 200
            assert response.json()["tokens_used"] == 175

    def test_expand_invalid_json_response(self):
        """Expand endpoint handles invalid JSON from Claude."""
        mock_response = {
            "text": "Not valid JSON",
            "tokens_used": 50
        }

        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_get.return_value = mock_service

            import asyncio
            mock_service.generate = MagicMock(
                side_effect=lambda **kwargs: asyncio.coroutine(
                    lambda: mock_response
                )()
            )

            response = client.post(
                "/api/ai/expand",
                json={"bullet_text": "Test"}
            )

            assert response.status_code == 500
            assert "Failed to parse" in response.json()["detail"]

    def test_expand_claude_service_error(self):
        """Expand endpoint handles Claude service errors."""
        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_get.return_value = mock_service

            import asyncio

            async def raise_error(**kwargs):
                raise ClaudeServiceError("Rate limit exceeded")

            mock_service.generate = MagicMock(side_effect=raise_error)

            response = client.post(
                "/api/ai/expand",
                json={"bullet_text": "Test"}
            )

            assert response.status_code == 503
            assert "Rate limit" in response.json()["detail"]

    def test_expand_missing_bullet_text(self):
        """Expand endpoint requires bullet_text."""
        response = client.post(
            "/api/ai/expand",
            json={}
        )

        assert response.status_code == 422  # Validation error

    def test_expand_with_markdown_code_block(self):
        """Expand endpoint handles markdown code block response."""
        mock_response = {
            "text": '```json\n["Child 1", "Child 2"]\n```',
            "tokens_used": 60
        }

        with patch("app.api.routes.ai.get_claude_service") as mock_get:
            mock_service = MagicMock()
            mock_get.return_value = mock_service

            import asyncio
            mock_service.generate = MagicMock(
                side_effect=lambda **kwargs: asyncio.coroutine(
                    lambda: mock_response
                )()
            )

            response = client.post(
                "/api/ai/expand",
                json={"bullet_text": "Test"}
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data["children"]) == 2


class TestParseBulletJson:
    """Tests for parse_bullet_json helper function."""

    def test_parse_simple_array(self):
        """Parse simple JSON array."""
        from app.api.routes.ai import parse_bullet_json

        result = parse_bullet_json('["item1", "item2"]')
        assert result == ["item1", "item2"]

    def test_parse_with_markdown_code_block(self):
        """Parse JSON from markdown code block."""
        from app.api.routes.ai import parse_bullet_json

        result = parse_bullet_json('```json\n["item1", "item2"]\n```')
        assert result == ["item1", "item2"]

    def test_parse_with_surrounding_text(self):
        """Parse JSON array with surrounding text."""
        from app.api.routes.ai import parse_bullet_json

        result = parse_bullet_json('Here is the result: ["item1", "item2"]')
        assert result == ["item1", "item2"]

    def test_parse_invalid_json_raises(self):
        """Invalid JSON raises JSONDecodeError."""
        from app.api.routes.ai import parse_bullet_json
        import json

        with pytest.raises(json.JSONDecodeError):
            parse_bullet_json("not valid json")
