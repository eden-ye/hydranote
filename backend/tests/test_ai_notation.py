"""Tests for AI notation generation endpoint (EDITOR-3704)"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import UserInfo


client = TestClient(app)


def mock_get_current_user():
    """Mock auth dependency for testing."""
    return UserInfo(user_id="test-user-123")


class TestGenerateNotationEndpoint:
    """Tests for POST /api/ai/generate-notation endpoint."""

    def test_generate_notation_success(self):
        """Notation endpoint returns short notation on success."""
        mock_response = {
            "text": "Tesla Model 3 autopilot",
            "tokens_used": 25,
        }

        with patch("app.api.routes.ai.get_current_user", return_value=mock_get_current_user()):
            with patch("app.api.routes.ai.get_claude_service") as mock_get:
                mock_service = MagicMock()
                mock_service.generate = AsyncMock(return_value=mock_response)
                mock_get.return_value = mock_service

                response = client.post(
                    "/api/ai/generate-notation",
                    json={"text": "The Tesla Model 3 is an electric sedan with autopilot features and long range battery that can travel over 300 miles on a single charge with impressive acceleration."},
                )

                assert response.status_code == 200
                data = response.json()
                assert "notation" in data
                assert "tokens_used" in data
                assert data["notation"] == "Tesla Model 3 autopilot"
                assert data["tokens_used"] == 25

    def test_generate_notation_empty_text(self):
        """Notation endpoint rejects empty text."""
        with patch("app.api.routes.ai.get_current_user", return_value=mock_get_current_user()):
            response = client.post(
                "/api/ai/generate-notation",
                json={"text": ""},
            )

            assert response.status_code == 400
            assert "empty" in response.json()["detail"].lower()

    def test_generate_notation_whitespace_only(self):
        """Notation endpoint rejects whitespace-only text."""
        with patch("app.api.routes.ai.get_current_user", return_value=mock_get_current_user()):
            response = client.post(
                "/api/ai/generate-notation",
                json={"text": "   \n\t  "},
            )

            assert response.status_code == 400
            assert "empty" in response.json()["detail"].lower()

    def test_generate_notation_claude_service_error(self):
        """Notation endpoint returns 503 when Claude service fails."""
        with patch("app.api.routes.ai.get_current_user", return_value=mock_get_current_user()):
            with patch("app.api.routes.ai.get_claude_service") as mock_get:
                mock_service = MagicMock()
                mock_service.generate = AsyncMock(side_effect=Exception("Claude API error"))
                mock_get.return_value = mock_service

                response = client.post(
                    "/api/ai/generate-notation",
                    json={"text": "Some long text that needs summarization for testing error handling"},
                )

            assert response.status_code == 503

    def test_generate_notation_truncates_long_response(self):
        """Notation endpoint truncates overly long notations to 5 words."""
        mock_response = {
            "text": "This is a very long notation that exceeds five words",
            "tokens_used": 30,
        }

        with patch("app.api.routes.ai.get_current_user", return_value=mock_get_current_user()):
            with patch("app.api.routes.ai.get_claude_service") as mock_get:
                mock_service = MagicMock()
                mock_service.generate = AsyncMock(return_value=mock_response)
                mock_get.return_value = mock_service

                response = client.post(
                    "/api/ai/generate-notation",
                    json={"text": "Some long text that needs a brief summarization notation that captures the key concepts"},
                )

            assert response.status_code == 200
            data = response.json()
            notation_words = data["notation"].split()
            # Should be truncated to first 5 words
            assert len(notation_words) <= 5

    def test_generate_notation_strips_quotes(self):
        """Notation endpoint strips surrounding quotes from notation."""
        mock_response = {
            "text": '"Tesla Model 3"',
            "tokens_used": 20,
        }

        with patch("app.api.routes.ai.get_current_user", return_value=mock_get_current_user()):
            with patch("app.api.routes.ai.get_claude_service") as mock_get:
                mock_service = MagicMock()
                mock_service.generate = AsyncMock(return_value=mock_response)
                mock_get.return_value = mock_service

                response = client.post(
                    "/api/ai/generate-notation",
                    json={"text": "The Tesla Model 3 is an electric sedan with autopilot features and long range battery"},
                )

            assert response.status_code == 200
            data = response.json()
            # Quotes should be stripped
            assert data["notation"] == "Tesla Model 3"
            assert '"' not in data["notation"]
