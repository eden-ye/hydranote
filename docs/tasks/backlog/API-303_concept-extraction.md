# API-303: Concept Extraction Endpoint

## Description
Create API endpoint that uses Claude to extract key concepts from note text for semantic search.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [ ] POST `/api/ai/extract-concepts` endpoint
- [ ] Input: note text (can be full document or single bullet)
- [ ] Output: list of key concepts with optional category
- [ ] Use Claude Haiku for fast, cheap extraction
- [ ] Rate limiting applied (counts toward AI generation limit)
- [ ] Handle empty/short text gracefully

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

## Status
- **Created**: 2026-01-12
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
