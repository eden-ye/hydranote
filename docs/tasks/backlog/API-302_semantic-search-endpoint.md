# API-302: Semantic Search Endpoint

## Description
Create API endpoint for semantic similarity search across user's notes.

## Acceptance Criteria
- [ ] POST `/api/notes/semantic-search` endpoint
- [ ] Input: query text, limit, user_id
- [ ] Output: ranked list of related notes with similarity scores
- [ ] Filter to user's own notes only (RLS enforced)
- [ ] Configurable similarity threshold

## Technical Details
```python
@router.post("/notes/semantic-search")
async def semantic_search(
    request: SemanticSearchRequest,
    current_user: User = Depends(get_current_user)
) -> List[SemanticSearchResult]:
    # 1. Generate embedding for query
    # 2. Vector similarity search
    # 3. Return top-k results
    pass

class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 5
    threshold: float = 0.7

class SemanticSearchResult(BaseModel):
    document_id: str
    block_id: str
    content: str
    score: float
```
- Use OpenAI/Anthropic for query embedding
- pgvector for similarity search
- Rate limiting applied

## Dependencies
- API-301: Embedding/Vector Storage Setup

## Parallel Safe With
- EDITOR-*, FE-*

## Notes
Part of Epic 5: Semantic Linking

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
