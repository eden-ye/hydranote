"""Claude AI service for text generation."""
from typing import AsyncGenerator, Optional
from anthropic import Anthropic, APIError, RateLimitError, APIConnectionError

from app.config import get_settings


class ClaudeServiceError(Exception):
    """Custom exception for Claude service errors."""
    pass


class ClaudeService:
    """Service for interacting with Claude API."""

    def __init__(self):
        """Initialize the Claude service with API key from settings."""
        settings = get_settings()

        if not settings.anthropic_api_key:
            raise ClaudeServiceError("API key not configured")

        self.client = Anthropic(api_key=settings.anthropic_api_key)
        self.default_model = "claude-haiku-4-5-20251001"
        self.default_max_tokens = 4096

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: Optional[int] = None,
        model: Optional[str] = None,
    ) -> dict:
        """
        Generate text using Claude API.

        Args:
            prompt: The user prompt to send to Claude
            system: Optional system prompt to set context
            max_tokens: Maximum tokens in response (default: 4096)
            model: Model to use (default: claude-3-sonnet)

        Returns:
            dict with 'text' and 'tokens_used' keys

        Raises:
            ClaudeServiceError: On API failures
        """
        try:
            message = self.client.messages.create(
                model=model or self.default_model,
                max_tokens=max_tokens or self.default_max_tokens,
                system=system or "You are a helpful assistant.",
                messages=[{"role": "user", "content": prompt}],
            )

            return {
                "text": message.content[0].text,
                "tokens_used": message.usage.input_tokens + message.usage.output_tokens,
            }

        except RateLimitError as e:
            raise ClaudeServiceError(f"Rate limit exceeded: {e}")
        except APIConnectionError as e:
            raise ClaudeServiceError(f"Connection error: {e}")
        except APIError as e:
            raise ClaudeServiceError(f"API error: {e}")

    async def generate_stream(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: Optional[int] = None,
        model: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Generate text using Claude API with streaming.

        Args:
            prompt: The user prompt to send to Claude
            system: Optional system prompt to set context
            max_tokens: Maximum tokens in response (default: 4096)
            model: Model to use (default: claude-3-sonnet)

        Yields:
            Text chunks as they are generated

        Raises:
            ClaudeServiceError: On API failures
        """
        try:
            with self.client.messages.stream(
                model=model or self.default_model,
                max_tokens=max_tokens or self.default_max_tokens,
                system=system or "You are a helpful assistant.",
                messages=[{"role": "user", "content": prompt}],
            ) as stream:
                for event in stream:
                    if event.type == "content_block_delta":
                        yield event.delta.text

        except RateLimitError as e:
            raise ClaudeServiceError(f"Rate limit exceeded: {e}")
        except APIConnectionError as e:
            raise ClaudeServiceError(f"Connection error: {e}")
        except APIError as e:
            raise ClaudeServiceError(f"API error: {e}")


# Singleton instance
_claude_service: Optional[ClaudeService] = None


def get_claude_service() -> ClaudeService:
    """Get or create the Claude service singleton."""
    global _claude_service
    if _claude_service is None:
        _claude_service = ClaudeService()
    return _claude_service
