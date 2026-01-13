# API-303: Concept Extraction Endpoint

## Description
Create API endpoint that uses Claude to extract key concepts from note text for semantic search.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [x] POST `/api/ai/extract-concepts` endpoint
- [x] Input: note text (can be full document or single bullet)
- [x] Output: list of key concepts with optional category
- [x] Use Claude Haiku for fast, cheap extraction
- [x] Rate limiting applied (counts toward AI generation limit)
- [x] Handle empty/short text gracefully

## Technical Details

### Request/Response Schema
```python
@router.post("/ai/extract-concepts")
async def extract_concepts(
    request: ConceptExtractionRequest,
    current_user: User = Depends(get_current_user)
) -> ConceptExtractionResponse:
    pass

class ConceptExtractionRequest(BaseModel):
    text: str
    max_concepts: int = 5

class Concept(BaseModel):
    name: str  # "Tesla Model 3"
    category: Optional[str]  # "product", "company", "category"

class ConceptExtractionResponse(BaseModel):
    concepts: List[Concept]
```

### Claude Prompt
```
Extract 3-5 key concepts from this note that would be useful for finding related information in a knowledge base.

For each concept, provide:
- name: the concept name (e.g., "Tesla Model 3", "electric vehicle")
- category: one of [product, company, person, category, topic, other]

Note text:
{text}

Return as JSON array.
```

### Integration with Reorganization Flow
1. User triggers reorganization (Cmd+Shift+L)
2. Frontend calls `/api/ai/extract-concepts` with document text
3. For each concept, frontend calls `/api/notes/semantic-search`
4. Results aggregated and shown in suggestion modal

## Dependencies
- None (uses existing Claude service)

## Parallel Safe With
- EDITOR-*, FE-*, AUTH-*

## Notes
Part of Epic 5: Semantic Linking. Enables intelligent concept extraction for auto-reorganization.

**Design Doc**: See `docs/design/semantic-search.md` for full architecture.

## Implementation Phase
- **Phase**: Phase 3 (Concept Extraction API)
- **Time Estimate**: 3 hours
- **Branch**: `api/API-303-concept-extraction`
- **Dependencies**: None (uses existing Claude service, can run parallel with Phase 1-2)

## Deliverables
- [x] POST `/api/ai/extract-concepts` endpoint added to ai.py
- [x] Unit tests pass (13 tests)
- [x] Bruno tests pass

## Implementation Summary

### Files Changed
- `backend/app/api/routes/ai.py` - Added `extract_concepts` endpoint with:
  - `ConceptExtractionRequest` model (text, max_concepts)
  - `Concept` model (name, optional category)
  - `ConceptExtractionResponse` model (concepts list, tokens_used)
  - POST `/api/ai/extract-concepts` endpoint with authentication
- `backend/tests/test_concept_extraction.py` - Added 13 comprehensive tests
- `bruno/collections/ai/extract-concepts.bru` - Added Bruno API test

### Test Results
- Backend unit tests: 159 passed (including 13 new tests)
- Frontend tests: 736 passed
- Bruno API tests: 3/3 passed (ai collection)
- Docker build: Success

## Status
- **Created**: 2026-01-12
- **Updated**: 2026-01-12 (implemented)
- **Completed**: 2026-01-12
- **Status**: complete
- **Epic**: MVP2 - Semantic Linking
