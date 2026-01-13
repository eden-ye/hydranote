"""
Notes routes for semantic search and related operations.

Handles vector similarity search across user's notes using pgvector.
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.middleware.auth import get_current_user, UserInfo
from app.services.embedding import EmbeddingService, EmbeddingServiceError
from app.services.supabase import get_supabase_service, SupabaseServiceError

router = APIRouter()


class SemanticSearchRequest(BaseModel):
    """Request model for semantic search."""
    query: str = Field(..., min_length=1, description="Search query text")
    limit: int = Field(default=5, ge=1, le=50, description="Maximum number of results")
    threshold: float = Field(default=0.8, ge=0.0, le=1.0, description="Minimum similarity score")
    descriptor_filter: Optional[str] = Field(default=None, description="Filter by descriptor type (What, Why, How, etc.)")


class SemanticSearchResult(BaseModel):
    """Result model for semantic search."""
    document_id: str
    block_id: str
    bullet_text: str
    context_path: str
    children_summary: Optional[str] = None
    descriptor_type: Optional[str] = None
    score: float


@router.post("/semantic-search", response_model=List[SemanticSearchResult])
async def semantic_search(
    request: SemanticSearchRequest,
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Perform context-aware semantic similarity search across user's notes.

    This endpoint:
    1. Generates an embedding for the search query using OpenAI
    2. Performs vector similarity search using pgvector in Supabase
    3. Returns ranked results with similarity scores and full context

    Args:
        request: Search parameters (query, limit, threshold, optional descriptor filter)
        current_user: Authenticated user info from JWT token

    Returns:
        List of matching notes with similarity scores, ordered by score (descending)

    Raises:
        HTTPException: If embedding generation or search fails
    """
    try:
        # Generate embedding for query
        embedding_service = EmbeddingService()
        query_embedding = await embedding_service.generate_embedding(request.query)

        # Build SQL function call parameters
        supabase = get_supabase_service()

        # Call the semantic_search stored function (RLS enforced)
        # The stored function will handle user isolation via RLS
        rpc_params = {
            "query_embedding": query_embedding,
            "match_threshold": request.threshold,
            "match_count": request.limit,
            "p_user_id": current_user.id
        }

        # Add descriptor filter if provided
        if request.descriptor_filter:
            rpc_params["p_descriptor_type"] = request.descriptor_filter

        response = (
            supabase.client
            .rpc("semantic_search", rpc_params)
            .execute()
        )

        # Parse results
        results = []
        if response.data:
            for row in response.data:
                results.append(SemanticSearchResult(
                    document_id=row["document_id"],
                    block_id=row["block_id"],
                    bullet_text=row["bullet_text"],
                    context_path=row["context_path"],
                    children_summary=row.get("children_summary"),
                    descriptor_type=row.get("descriptor_type"),
                    score=row["score"]
                ))

        return results

    except EmbeddingServiceError as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")
    except SupabaseServiceError as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error during search: {str(e)}")
