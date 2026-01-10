"""Tests for Claude AI service with mocked Anthropic API."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from anthropic import APIError, RateLimitError, APIConnectionError

from app.services.claude import ClaudeService, ClaudeServiceError


@pytest.fixture
def mock_settings():
    """Mock settings with test API key."""
    settings = MagicMock()
    settings.anthropic_api_key = "test-api-key"
    return settings


@pytest.fixture
def claude_service(mock_settings):
    """Create Claude service with mocked settings."""
    with patch("app.services.claude.get_settings", return_value=mock_settings):
        service = ClaudeService()
        return service


class TestClaudeServiceInit:
    """Tests for Claude service initialization."""

    def test_init_with_api_key(self, mock_settings):
        """Service initializes with API key from settings."""
        with patch("app.services.claude.get_settings", return_value=mock_settings):
            with patch("app.services.claude.Anthropic") as mock_anthropic:
                service = ClaudeService()
                mock_anthropic.assert_called_once_with(api_key="test-api-key")

    def test_init_without_api_key_raises(self):
        """Service raises error when API key is missing."""
        mock_settings = MagicMock()
        mock_settings.anthropic_api_key = ""

        with patch("app.services.claude.get_settings", return_value=mock_settings):
            with pytest.raises(ClaudeServiceError) as exc_info:
                ClaudeService()
            assert "API key not configured" in str(exc_info.value)


class TestGenerate:
    """Tests for text generation."""

    @pytest.mark.asyncio
    async def test_generate_success(self, claude_service):
        """Generate returns text content on success."""
        mock_message = MagicMock()
        mock_message.content = [MagicMock(text="Generated text response")]
        mock_message.usage = MagicMock(input_tokens=10, output_tokens=20)

        claude_service.client.messages.create = MagicMock(return_value=mock_message)

        result = await claude_service.generate("Test prompt")

        assert result["text"] == "Generated text response"
        assert result["tokens_used"] == 30

    @pytest.mark.asyncio
    async def test_generate_with_system_prompt(self, claude_service):
        """Generate accepts custom system prompt."""
        mock_message = MagicMock()
        mock_message.content = [MagicMock(text="Response")]
        mock_message.usage = MagicMock(input_tokens=5, output_tokens=10)

        claude_service.client.messages.create = MagicMock(return_value=mock_message)

        await claude_service.generate("User prompt", system="Custom system")

        call_kwargs = claude_service.client.messages.create.call_args[1]
        assert call_kwargs["system"] == "Custom system"

    @pytest.mark.asyncio
    async def test_generate_with_max_tokens(self, claude_service):
        """Generate respects max_tokens parameter."""
        mock_message = MagicMock()
        mock_message.content = [MagicMock(text="Response")]
        mock_message.usage = MagicMock(input_tokens=5, output_tokens=10)

        claude_service.client.messages.create = MagicMock(return_value=mock_message)

        await claude_service.generate("Prompt", max_tokens=500)

        call_kwargs = claude_service.client.messages.create.call_args[1]
        assert call_kwargs["max_tokens"] == 500


class TestGenerateStream:
    """Tests for streaming generation."""

    @pytest.mark.asyncio
    async def test_generate_stream_yields_chunks(self, claude_service):
        """Streaming generation yields text chunks."""
        mock_stream = MagicMock()
        mock_events = [
            MagicMock(type="content_block_delta", delta=MagicMock(text="Hello ")),
            MagicMock(type="content_block_delta", delta=MagicMock(text="world")),
            MagicMock(type="message_delta", usage=MagicMock(output_tokens=10)),
        ]
        mock_stream.__enter__ = MagicMock(return_value=iter(mock_events))
        mock_stream.__exit__ = MagicMock(return_value=False)

        claude_service.client.messages.stream = MagicMock(return_value=mock_stream)

        chunks = []
        async for chunk in claude_service.generate_stream("Test prompt"):
            chunks.append(chunk)

        assert "Hello " in chunks
        assert "world" in chunks


class TestErrorHandling:
    """Tests for API error handling."""

    @pytest.mark.asyncio
    async def test_rate_limit_error(self, claude_service):
        """Rate limit errors are handled gracefully."""
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.headers = {}

        claude_service.client.messages.create = MagicMock(
            side_effect=RateLimitError(
                message="Rate limit exceeded",
                response=mock_response,
                body={"error": {"message": "Rate limit exceeded"}}
            )
        )

        with pytest.raises(ClaudeServiceError) as exc_info:
            await claude_service.generate("Test")
        assert "rate limit" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_api_connection_error(self, claude_service):
        """Connection errors are handled gracefully."""
        claude_service.client.messages.create = MagicMock(
            side_effect=APIConnectionError(request=MagicMock())
        )

        with pytest.raises(ClaudeServiceError) as exc_info:
            await claude_service.generate("Test")
        assert "connection" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_generic_api_error(self, claude_service):
        """Generic API errors are handled gracefully."""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.headers = {}

        claude_service.client.messages.create = MagicMock(
            side_effect=APIError(
                message="Internal server error",
                request=MagicMock(),
                body={"error": {"message": "Internal server error"}}
            )
        )

        with pytest.raises(ClaudeServiceError) as exc_info:
            await claude_service.generate("Test")
        assert "API error" in str(exc_info.value)


class TestModelConfiguration:
    """Tests for model configuration."""

    def test_default_model_is_sonnet(self, claude_service):
        """Default model is claude-3-sonnet for cost efficiency."""
        assert "sonnet" in claude_service.default_model.lower()

    @pytest.mark.asyncio
    async def test_generate_uses_specified_model(self, claude_service):
        """Generate uses model parameter when specified."""
        mock_message = MagicMock()
        mock_message.content = [MagicMock(text="Response")]
        mock_message.usage = MagicMock(input_tokens=5, output_tokens=10)

        claude_service.client.messages.create = MagicMock(return_value=mock_message)

        await claude_service.generate("Prompt", model="claude-3-opus-20240229")

        call_kwargs = claude_service.client.messages.create.call_args[1]
        assert call_kwargs["model"] == "claude-3-opus-20240229"
