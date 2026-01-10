"""Tests for WebSocket AI streaming endpoint."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket

from app.api.websockets.ai_stream import router as ws_router
from app.services.claude import ClaudeServiceError


@pytest.fixture
def app():
    """Create test FastAPI app with WebSocket router."""
    app = FastAPI()
    app.include_router(ws_router)
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return TestClient(app)


class TestWebSocketAuthentication:
    """Tests for WebSocket authentication."""

    def test_missing_token_closes_connection(self, client):
        """WebSocket closes when no token provided."""
        from starlette.websockets import WebSocketDisconnect
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect("/ws/ai/stream"):
                pass

    def test_empty_token_closes_connection(self, client):
        """WebSocket closes when empty token provided."""
        from starlette.websockets import WebSocketDisconnect
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect("/ws/ai/stream?token="):
                pass

    def test_valid_token_accepts_connection(self, client):
        """WebSocket accepts connection with valid token."""
        with patch("app.api.websockets.ai_stream.get_claude_service") as mock_get_service:
            mock_service = MagicMock()
            mock_service.generate_stream = AsyncMock(return_value=iter([]))
            mock_get_service.return_value = mock_service

            with client.websocket_connect("/ws/ai/stream?token=test-user-id") as ws:
                # Connection should be accepted
                # Send a message to trigger the handler
                ws.send_json({"action": "ping"})
                response = ws.receive_json()
                assert response["type"] == "pong"


class TestWebSocketStreaming:
    """Tests for AI streaming through WebSocket."""

    def test_generate_streams_chunks(self, client):
        """WebSocket streams AI response chunks."""
        with patch("app.api.websockets.ai_stream.get_claude_service") as mock_get_service:
            # Mock the streaming generator
            async def mock_stream(*args, **kwargs):
                for chunk in ["Hello ", "world", "!"]:
                    yield chunk

            mock_service = MagicMock()
            mock_service.generate_stream = mock_stream
            mock_get_service.return_value = mock_service

            with client.websocket_connect("/ws/ai/stream?token=test-user-id") as ws:
                # Request AI generation
                ws.send_json({
                    "action": "generate",
                    "prompt": "Test prompt",
                })

                # Collect streamed chunks
                chunks = []
                while True:
                    response = ws.receive_json()
                    if response["type"] == "chunk":
                        chunks.append(response["text"])
                    elif response["type"] == "done":
                        break
                    elif response["type"] == "error":
                        pytest.fail(f"Unexpected error: {response}")

                assert chunks == ["Hello ", "world", "!"]

    def test_generate_with_system_prompt(self, client):
        """WebSocket passes system prompt to Claude service."""
        with patch("app.api.websockets.ai_stream.get_claude_service") as mock_get_service:
            captured_kwargs = {}

            async def mock_stream(*args, **kwargs):
                captured_kwargs.update(kwargs)
                yield "Response"

            mock_service = MagicMock()
            mock_service.generate_stream = mock_stream
            mock_get_service.return_value = mock_service

            with client.websocket_connect("/ws/ai/stream?token=test-user-id") as ws:
                ws.send_json({
                    "action": "generate",
                    "prompt": "Test",
                    "system": "Custom system prompt",
                })

                # Wait for done
                while True:
                    response = ws.receive_json()
                    if response["type"] == "done":
                        break

                # Verify system prompt was passed
                assert captured_kwargs.get("system") == "Custom system prompt"


class TestWebSocketErrorHandling:
    """Tests for error handling in WebSocket."""

    def test_claude_service_error_sends_error_message(self, client):
        """Claude service errors are sent as error messages."""
        with patch("app.api.websockets.ai_stream.get_claude_service") as mock_get_service:
            async def mock_stream(*args, **kwargs):
                raise ClaudeServiceError("Rate limit exceeded")
                yield  # Make it a generator

            mock_service = MagicMock()
            mock_service.generate_stream = mock_stream
            mock_get_service.return_value = mock_service

            with client.websocket_connect("/ws/ai/stream?token=test-user-id") as ws:
                ws.send_json({
                    "action": "generate",
                    "prompt": "Test",
                })

                response = ws.receive_json()
                assert response["type"] == "error"
                assert "Rate limit" in response["message"]

    def test_invalid_action_sends_error(self, client):
        """Invalid action sends error message."""
        with patch("app.api.websockets.ai_stream.get_claude_service") as mock_get_service:
            mock_service = MagicMock()
            mock_get_service.return_value = mock_service

            with client.websocket_connect("/ws/ai/stream?token=test-user-id") as ws:
                ws.send_json({
                    "action": "invalid_action",
                })

                response = ws.receive_json()
                assert response["type"] == "error"
                assert "Unknown action" in response["message"]

    def test_missing_prompt_sends_error(self, client):
        """Missing prompt in generate action sends error."""
        with patch("app.api.websockets.ai_stream.get_claude_service") as mock_get_service:
            mock_service = MagicMock()
            mock_get_service.return_value = mock_service

            with client.websocket_connect("/ws/ai/stream?token=test-user-id") as ws:
                ws.send_json({
                    "action": "generate",
                    # No prompt provided
                })

                response = ws.receive_json()
                assert response["type"] == "error"
                assert "prompt" in response["message"].lower()


class TestWebSocketLifecycle:
    """Tests for WebSocket connection lifecycle."""

    def test_ping_pong(self, client):
        """WebSocket responds to ping with pong."""
        with patch("app.api.websockets.ai_stream.get_claude_service") as mock_get_service:
            mock_service = MagicMock()
            mock_get_service.return_value = mock_service

            with client.websocket_connect("/ws/ai/stream?token=test-user-id") as ws:
                ws.send_json({"action": "ping"})
                response = ws.receive_json()
                assert response["type"] == "pong"

    def test_multiple_generate_requests(self, client):
        """WebSocket handles multiple sequential generate requests."""
        with patch("app.api.websockets.ai_stream.get_claude_service") as mock_get_service:
            call_count = 0

            async def mock_stream(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                yield f"Response {call_count}"

            mock_service = MagicMock()
            mock_service.generate_stream = mock_stream
            mock_get_service.return_value = mock_service

            with client.websocket_connect("/ws/ai/stream?token=test-user-id") as ws:
                # First request
                ws.send_json({"action": "generate", "prompt": "First"})
                chunks1 = []
                while True:
                    response = ws.receive_json()
                    if response["type"] == "chunk":
                        chunks1.append(response["text"])
                    elif response["type"] == "done":
                        break

                # Second request
                ws.send_json({"action": "generate", "prompt": "Second"})
                chunks2 = []
                while True:
                    response = ws.receive_json()
                    if response["type"] == "chunk":
                        chunks2.append(response["text"])
                    elif response["type"] == "done":
                        break

                assert chunks1 == ["Response 1"]
                assert chunks2 == ["Response 2"]

    def test_graceful_disconnect(self, client):
        """WebSocket handles graceful client disconnect."""
        with patch("app.api.websockets.ai_stream.get_claude_service") as mock_get_service:
            mock_service = MagicMock()
            mock_get_service.return_value = mock_service

            with client.websocket_connect("/ws/ai/stream?token=test-user-id") as ws:
                ws.send_json({"action": "ping"})
                ws.receive_json()
                # Implicit close when exiting context manager
            # Should not raise any exceptions


class TestWebSocketMessageFormat:
    """Tests for WebSocket message format."""

    def test_chunk_message_format(self, client):
        """Chunk messages have correct format."""
        with patch("app.api.websockets.ai_stream.get_claude_service") as mock_get_service:
            async def mock_stream(*args, **kwargs):
                yield "Test chunk"

            mock_service = MagicMock()
            mock_service.generate_stream = mock_stream
            mock_get_service.return_value = mock_service

            with client.websocket_connect("/ws/ai/stream?token=test-user-id") as ws:
                ws.send_json({"action": "generate", "prompt": "Test"})

                response = ws.receive_json()
                assert response["type"] == "chunk"
                assert "text" in response
                assert response["text"] == "Test chunk"

    def test_done_message_format(self, client):
        """Done messages have correct format."""
        with patch("app.api.websockets.ai_stream.get_claude_service") as mock_get_service:
            async def mock_stream(*args, **kwargs):
                yield "chunk"

            mock_service = MagicMock()
            mock_service.generate_stream = mock_stream
            mock_get_service.return_value = mock_service

            with client.websocket_connect("/ws/ai/stream?token=test-user-id") as ws:
                ws.send_json({"action": "generate", "prompt": "Test"})

                # Skip chunk
                ws.receive_json()

                response = ws.receive_json()
                assert response["type"] == "done"

    def test_error_message_format(self, client):
        """Error messages have correct format."""
        with patch("app.api.websockets.ai_stream.get_claude_service") as mock_get_service:
            mock_service = MagicMock()
            mock_get_service.return_value = mock_service

            with client.websocket_connect("/ws/ai/stream?token=test-user-id") as ws:
                ws.send_json({"action": "invalid"})

                response = ws.receive_json()
                assert response["type"] == "error"
                assert "message" in response


class TestWebSocketUserContext:
    """Tests for user context in WebSocket."""

    def test_user_id_extracted_from_token(self, client):
        """User ID is extracted from token and available in handler."""
        with patch("app.api.websockets.ai_stream.get_claude_service") as mock_get_service:
            async def mock_stream(*args, **kwargs):
                yield "chunk"

            mock_service = MagicMock()
            mock_service.generate_stream = mock_stream
            mock_get_service.return_value = mock_service

            with client.websocket_connect("/ws/ai/stream?token=user-123-abc") as ws:
                ws.send_json({"action": "generate", "prompt": "Test"})

                # Collect all messages until done
                while True:
                    response = ws.receive_json()
                    if response["type"] == "done":
                        # User ID should be in done message for tracking
                        assert response.get("user_id") == "user-123-abc"
                        break
