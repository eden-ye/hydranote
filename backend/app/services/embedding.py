"""Embedding service for generating vector embeddings using OpenAI."""
from typing import Optional, List
from openai import OpenAI, OpenAIError, RateLimitError, APIConnectionError
from app.config import get_settings


class EmbeddingServiceError(Exception):
    """Exception raised for embedding service errors."""
    pass


class EmbeddingService:
    """Service for generating embeddings using OpenAI text-embedding-3-small."""

    def __init__(self):
        """Initialize the embedding service with OpenAI client."""
        settings = get_settings()

        if not settings.openai_api_key:
            raise EmbeddingServiceError("OpenAI API key not configured")

        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = "text-embedding-3-small"

    def build_embedding_text(
        self,
        bullet_text: str,
        context_path: str,
        descriptor_type: Optional[str] = None,
        children_summary: Optional[str] = None
    ) -> str:
        """
        Build context-aware text for embedding.

        Format: "context_path > [descriptor] bullet_text | contains: children"

        Args:
            bullet_text: The raw text of the bullet
            context_path: Full ancestor path (e.g., "Food > Fruit > Apple")
            descriptor_type: Optional descriptor (What, Why, How, Pros, Cons)
            children_summary: Optional children text concatenated

        Returns:
            Formatted text string for embedding
        """
        # Start with context path
        parts = [context_path]

        # Add descriptor prefix if present
        if descriptor_type:
            parts.append(f"[{descriptor_type}] {bullet_text}")
        else:
            parts.append(bullet_text)

        # Build the main text
        embedding_text = " > ".join(parts)

        # Add children summary if present
        if children_summary:
            embedding_text += f" | contains: {children_summary}"

        return embedding_text

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for given text.

        Args:
            text: Text to embed

        Returns:
            List of floats representing the embedding vector (1536 dimensions)

        Raises:
            EmbeddingServiceError: If embedding generation fails
        """
        try:
            response = await self.client.embeddings.create(
                model=self.model,
                input=text
            )
            return response.data[0].embedding

        except RateLimitError as e:
            raise EmbeddingServiceError(f"OpenAI rate limit exceeded: {e}")
        except APIConnectionError as e:
            raise EmbeddingServiceError(f"OpenAI connection error: {e}")
        except OpenAIError as e:
            raise EmbeddingServiceError(f"OpenAI API error: {e}")
        except Exception as e:
            raise EmbeddingServiceError(f"Unexpected error generating embedding: {e}")

    async def create_embedding(
        self,
        bullet_text: str,
        context_path: str,
        descriptor_type: Optional[str] = None,
        children_summary: Optional[str] = None
    ) -> dict:
        """
        Create embedding with full context-aware workflow.

        Args:
            bullet_text: The raw text of the bullet
            context_path: Full ancestor path
            descriptor_type: Optional descriptor type
            children_summary: Optional children summary

        Returns:
            Dict with 'embedding_text' and 'embedding' keys
        """
        embedding_text = self.build_embedding_text(
            bullet_text=bullet_text,
            context_path=context_path,
            descriptor_type=descriptor_type,
            children_summary=children_summary
        )

        embedding = await self.generate_embedding(embedding_text)

        return {
            "embedding_text": embedding_text,
            "embedding": embedding
        }
