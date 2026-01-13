# API-302: Semantic Search Endpoint

## Description
Create API endpoint for context-aware semantic similarity search across user's notes.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [x] POST `/api/notes/semantic-search` endpoint
- [x] Input: query text, limit, threshold, user_id
- [x] Output: ranked bullets with similarity scores + **full context path**
- [x] Filter to user's own notes only (RLS enforced)
- [x] Support filtering by descriptor type (optional)
- [x] Return enough context for disambiguation display

## Technical Details

### Request/Response Schema
```python
@router.post("/notes/semantic-search")
async def semantic_search(
    request: SemanticSearchRequest,
    current_user: User = Depends(get_current_user)
) -> List[SemanticSearchResult]:
    # 1. Generate embedding for query using OpenAI
    # 2. Vector similarity search via pgvector
    # 3. Return top-k results with full context
    pass

class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 5
    threshold: float = 0.8  # Default threshold
    descriptor_filter: Optional[str] = None  # "What", "Why", "How", etc.

class SemanticSearchResult(BaseModel):
    document_id: str
    block_id: str
    bullet_text: str
    context_path: str  # "Apple > What it is > Red Sweet Fruit"
    children_summary: Optional[str]  # "Crunchy, Grows on trees"
    descriptor_type: Optional[str]
    score: float
```

### Similarity Query
```sql
SELECT
  block_id,
  bullet_text,
  context_path,
  children_summary,
  descriptor_type,
  1 - (embedding <=> $query_embedding) as score
FROM note_embeddings
WHERE user_id = $user_id
  AND 1 - (embedding <=> $query_embedding) >= $threshold
ORDER BY embedding <=> $query_embedding
LIMIT $limit;
```

### Context Path Display
Results include full path for disambiguation:
- "Apple > [What] Red Sweet Fruit" (fruit)
- "Apple > [What] Technology company" (company)

## Dependencies
- API-301: Embedding/Vector Storage Setup

## Parallel Safe With
- EDITOR-*, FE-*

## Notes
Part of Epic 5: Semantic Linking. Core search capability.

**Design Doc**: See `docs/design/semantic-search.md` for full architecture.

## Implementation Phase
- **Phase**: Phase 2 (Semantic Search API)
- **Time Estimate**: 4 hours
- **Branch**: `api/API-302-semantic-search-endpoint`
- **Dependencies**: API-301 (Phase 1) must be complete

## Deliverables
- [x] `backend/app/api/routes/notes.py` created
- [x] POST `/api/notes/semantic-search` endpoint working
- [x] Unit tests pass
- [x] Bruno tests for search endpoint pass

## Status
- **Created**: 2026-01-10
- **Updated**: 2026-01-13 (completed)
- **Status**: ✅ complete
- **Epic**: MVP2 - Semantic Linking

## Implementation Summary
- **Date Completed**: 2026-01-13
- **Branch**: `api/API-302-semantic-search-endpoint`
- **Tests**: 8 new unit tests, all 146 backend tests passing
- **Files Created**:
  - `backend/app/api/routes/notes.py` - Semantic search endpoint
  - `backend/tests/test_notes.py` - Unit tests
  - `database/migrations/003_semantic_search_function.sql` - PostgreSQL search function
  - `bruno/collections/notes/semantic-search.bru` - Bruno API test
- **Files Modified**:
  - `backend/app/main.py` - Registered notes router
- **Database**: PostgreSQL function `semantic_search()` for pgvector similarity search
