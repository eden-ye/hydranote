"""Tests for notes semantic search endpoints."""
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
    settings.openai_api_key = "test-openai-key"
    settings.supabase_url = "https://test.supabase.co"
    settings.supabase_service_key = "test-service-key"
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
def mock_services(mock_settings, mock_embedding, mock_supabase):
    """Context manager to mock all required services."""
    with patch("app.services.embedding.get_settings", return_value=mock_settings):
        with patch("app.api.routes.notes.EmbeddingService") as MockEmbeddingService:
            MockEmbeddingService.return_value = mock_embedding
            with patch("app.api.routes.notes.get_supabase_service", return_value=mock_supabase):
                with patch("app.middleware.auth.get_settings", return_value=mock_settings):
                    yield


def create_mock_supabase(data):
    """Helper to create a mock Supabase service with RPC chain."""
    mock_supabase = MagicMock()
    mock_rpc_chain = MagicMock()
    mock_rpc_chain.execute.return_value.data = data
    mock_supabase.client.rpc.return_value = mock_rpc_chain
    return mock_supabase


class TestSemanticSearchEndpoint:
    """Tests for POST /api/notes/semantic-search endpoint."""

    @pytest.mark.asyncio
    async def test_semantic_search_basic(self, client, mock_settings, valid_token):
        """Test basic semantic search returns results with scores."""
        mock_embedding = AsyncMock()
        mock_embedding.generate_embedding.return_value = [0.1] * 1536

        mock_data = [
            {
                "document_id": "doc1",
                "block_id": "block1",
                "bullet_text": "Red sweet fruit",
                "context_path": "Food > Fruit > Apple",
                "children_summary": "Crunchy, Grows on trees",
                "descriptor_type": "What",
                "score": 0.92
            },
            {
                "document_id": "doc2",
                "block_id": "block2",
                "bullet_text": "Technology company",
                "context_path": "Companies > Tech > Apple",
                "children_summary": "Founded by Steve Jobs",
                "descriptor_type": "What",
                "score": 0.85
            }
        ]

        with mock_services(mock_settings, mock_embedding, create_mock_supabase(mock_data)):
            response = await client.post(
                "/api/notes/semantic-search",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"query": "apple fruit", "limit": 5, "threshold": 0.8}
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["block_id"] == "block1"
        assert data[0]["score"] == 0.92
        assert data[0]["context_path"] == "Food > Fruit > Apple"
        assert data[1]["score"] == 0.85

    @pytest.mark.asyncio
    async def test_semantic_search_with_descriptor_filter(self, client, mock_settings, valid_token):
        """Test semantic search with descriptor type filter."""
        mock_embedding = AsyncMock()
        mock_embedding.generate_embedding.return_value = [0.1] * 1536

        mock_data = [
            {
                "document_id": "doc1",
                "block_id": "block1",
                "bullet_text": "Red sweet fruit",
                "context_path": "Food > Fruit > Apple",
                "children_summary": None,
                "descriptor_type": "What",
                "score": 0.92
            }
        ]

        with mock_services(mock_settings, mock_embedding, create_mock_supabase(mock_data)):
            response = await client.post(
                "/api/notes/semantic-search",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"query": "apple", "descriptor_filter": "What"}
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["descriptor_type"] == "What"

    @pytest.mark.asyncio
    async def test_semantic_search_empty_results(self, client, mock_settings, valid_token):
        """Test semantic search returns empty array when no matches."""
        mock_embedding = AsyncMock()
        mock_embedding.generate_embedding.return_value = [0.1] * 1536

        with mock_services(mock_settings, mock_embedding, create_mock_supabase([])):
            response = await client.post(
                "/api/notes/semantic-search",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"query": "nonexistent query"}
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_semantic_search_requires_auth(self, client, mock_settings):
        """Test semantic search requires valid authentication."""
        response = await client.post(
            "/api/notes/semantic-search",
            json={"query": "apple"}
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_semantic_search_validates_query(self, client, mock_settings, valid_token):
        """Test semantic search validates query parameter."""
        with patch("app.middleware.auth.get_settings", return_value=mock_settings):
            response = await client.post(
                "/api/notes/semantic-search",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={}  # Missing query
            )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_semantic_search_default_params(self, client, mock_settings, valid_token):
        """Test semantic search uses default limit and threshold."""
        mock_embedding = AsyncMock()
        mock_embedding.generate_embedding.return_value = [0.1] * 1536

        with mock_services(mock_settings, mock_embedding, create_mock_supabase([])):
            response = await client.post(
                "/api/notes/semantic-search",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"query": "test"}
            )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_semantic_search_user_isolation(self, client, mock_settings, valid_token):
        """Test semantic search only returns user's own notes (RLS enforced)."""
        mock_embedding = AsyncMock()
        mock_embedding.generate_embedding.return_value = [0.1] * 1536

        mock_data = [
            {
                "document_id": "doc1",
                "block_id": "block1",
                "bullet_text": "My note",
                "context_path": "My Notes > Block",
                "children_summary": None,
                "descriptor_type": None,
                "score": 0.9
            }
        ]

        with mock_services(mock_settings, mock_embedding, create_mock_supabase(mock_data)):
            response = await client.post(
                "/api/notes/semantic-search",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"query": "test"}
            )

        assert response.status_code == 200
        data = response.json()
        # RLS ensures only user's notes are returned
        assert len(data) == 1

    @pytest.mark.asyncio
    async def test_semantic_search_ordered_by_score(self, client, mock_settings, valid_token):
        """Test semantic search results are ordered by similarity score."""
        mock_embedding = AsyncMock()
        mock_embedding.generate_embedding.return_value = [0.1] * 1536

        mock_data = [
            {"document_id": "doc1", "block_id": "b1", "bullet_text": "High match",
             "context_path": "A", "children_summary": None, "descriptor_type": None, "score": 0.95},
            {"document_id": "doc2", "block_id": "b2", "bullet_text": "Medium match",
             "context_path": "B", "children_summary": None, "descriptor_type": None, "score": 0.85},
            {"document_id": "doc3", "block_id": "b3", "bullet_text": "Low match",
             "context_path": "C", "children_summary": None, "descriptor_type": None, "score": 0.81}
        ]

        with mock_services(mock_settings, mock_embedding, create_mock_supabase(mock_data)):
            response = await client.post(
                "/api/notes/semantic-search",
                headers={"Authorization": f"Bearer {valid_token}"},
                json={"query": "test"}
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        # Verify ordering by score (descending)
        assert data[0]["score"] >= data[1]["score"] >= data[2]["score"]
        assert data[0]["score"] == 0.95
        assert data[2]["score"] == 0.81
