"""Tests for Embedding service with mocked OpenAI API."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from openai import OpenAIError, RateLimitError, APIConnectionError

from app.services.embedding import EmbeddingService, EmbeddingServiceError


@pytest.fixture
def mock_settings():
    """Mock settings with test API key."""
    settings = MagicMock()
    settings.openai_api_key = "test-openai-key"
    return settings


@pytest.fixture
def embedding_service(mock_settings):
    """Create Embedding service with mocked settings."""
    with patch("app.services.embedding.get_settings", return_value=mock_settings):
        service = EmbeddingService()
        return service


class TestEmbeddingServiceInit:
    """Tests for Embedding service initialization."""

    def test_init_with_api_key(self, mock_settings):
        """Service initializes with API key from settings."""
        with patch("app.services.embedding.get_settings", return_value=mock_settings):
            with patch("app.services.embedding.OpenAI") as mock_openai:
                service = EmbeddingService()
                mock_openai.assert_called_once_with(api_key="test-openai-key")

    def test_init_without_api_key_raises(self):
        """Service raises error when API key is missing."""
        mock_settings = MagicMock()
        mock_settings.openai_api_key = ""

        with patch("app.services.embedding.get_settings", return_value=mock_settings):
            with pytest.raises(EmbeddingServiceError) as exc_info:
                EmbeddingService()
            assert "API key not configured" in str(exc_info.value)


class TestBuildEmbeddingText:
    """Tests for building context-aware embedding text."""

    def test_build_text_with_full_context(self, embedding_service):
        """Build text includes ancestor path, bullet text, and children summary."""
        result = embedding_service.build_embedding_text(
            bullet_text="Red Sweet Fruit",
            context_path="Food > Fruit > Apple",
            descriptor_type="What",
            children_summary="Crunchy, Grows on trees"
        )

        expected = "Food > Fruit > Apple > [What] Red Sweet Fruit | contains: Crunchy, Grows on trees"
        assert result == expected

    def test_build_text_without_descriptor(self, embedding_service):
        """Build text works without descriptor type."""
        result = embedding_service.build_embedding_text(
            bullet_text="Sweet Fruit",
            context_path="Food > Fruit",
            descriptor_type=None,
            children_summary="Red, Green"
        )

        expected = "Food > Fruit > Sweet Fruit | contains: Red, Green"
        assert result == expected

    def test_build_text_without_children(self, embedding_service):
        """Build text works without children summary."""
        result = embedding_service.build_embedding_text(
            bullet_text="Leaf Node",
            context_path="Tree > Branch",
            descriptor_type="How",
            children_summary=None
        )

        expected = "Tree > Branch > [How] Leaf Node"
        assert result == expected

    def test_build_text_minimal(self, embedding_service):
        """Build text works with minimal required fields."""
        result = embedding_service.build_embedding_text(
            bullet_text="Simple",
            context_path="Root",
            descriptor_type=None,
            children_summary=None
        )

        expected = "Root > Simple"
        assert result == expected


class TestGenerateEmbedding:
    """Tests for embedding generation."""

    @pytest.mark.asyncio
    async def test_generate_embedding_success(self, embedding_service):
        """Generate embedding returns vector on success."""
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.1, 0.2, 0.3])]

        embedding_service.client.embeddings.create = AsyncMock(return_value=mock_response)

        result = await embedding_service.generate_embedding("Test text")

        assert result == [0.1, 0.2, 0.3]
        embedding_service.client.embeddings.create.assert_called_once_with(
            model="text-embedding-3-small",
            input="Test text"
        )

    @pytest.mark.asyncio
    async def test_generate_embedding_uses_correct_model(self, embedding_service):
        """Generate embedding uses text-embedding-3-small model."""
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.1] * 1536)]

        embedding_service.client.embeddings.create = AsyncMock(return_value=mock_response)

        await embedding_service.generate_embedding("Test")

        call_kwargs = embedding_service.client.embeddings.create.call_args[1]
        assert call_kwargs["model"] == "text-embedding-3-small"

    @pytest.mark.asyncio
    async def test_generate_embedding_dimensions(self, embedding_service):
        """Generated embedding has 1536 dimensions."""
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.1] * 1536)]

        embedding_service.client.embeddings.create = AsyncMock(return_value=mock_response)

        result = await embedding_service.generate_embedding("Test")

        assert len(result) == 1536


class TestCreateEmbedding:
    """Tests for full embedding creation workflow."""

    @pytest.mark.asyncio
    async def test_create_embedding_full_workflow(self, embedding_service):
        """Create embedding builds text and generates vector."""
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.1] * 1536)]

        embedding_service.client.embeddings.create = AsyncMock(return_value=mock_response)

        result = await embedding_service.create_embedding(
            bullet_text="Apple",
            context_path="Food > Fruit",
            descriptor_type="What",
            children_summary="Red, Green"
        )

        assert "embedding_text" in result
        assert "embedding" in result
        assert result["embedding_text"] == "Food > Fruit > [What] Apple | contains: Red, Green"
        assert len(result["embedding"]) == 1536


class TestErrorHandling:
    """Tests for API error handling."""

    @pytest.mark.asyncio
    async def test_rate_limit_error(self, embedding_service):
        """Rate limit errors are handled gracefully."""
        embedding_service.client.embeddings.create = AsyncMock(
            side_effect=RateLimitError(
                message="Rate limit exceeded",
                response=MagicMock(status_code=429),
                body={"error": {"message": "Rate limit exceeded"}}
            )
        )

        with pytest.raises(EmbeddingServiceError) as exc_info:
            await embedding_service.generate_embedding("Test")
        assert "rate limit" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_api_connection_error(self, embedding_service):
        """Connection errors are handled gracefully."""
        embedding_service.client.embeddings.create = AsyncMock(
            side_effect=APIConnectionError(request=MagicMock())
        )

        with pytest.raises(EmbeddingServiceError) as exc_info:
            await embedding_service.generate_embedding("Test")
        assert "connection" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_generic_api_error(self, embedding_service):
        """Generic API errors are handled gracefully."""
        embedding_service.client.embeddings.create = AsyncMock(
            side_effect=OpenAIError("API error")
        )

        with pytest.raises(EmbeddingServiceError) as exc_info:
            await embedding_service.generate_embedding("Test")
        assert "error" in str(exc_info.value).lower()
