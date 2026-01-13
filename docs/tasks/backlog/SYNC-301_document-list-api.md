# SYNC-301: Document List API

## Description
Create API endpoint to list user's synced documents, enabling document selection and navigation.

## Automation Status
**AUTO** - Standard FastAPI endpoint

## Acceptance Criteria
- [ ] GET `/api/documents` endpoint
- [ ] Returns list of user's synced documents
- [ ] Sorted by `updated_at` descending
- [ ] Includes document title and metadata
- [ ] Pagination support
- [ ] User can only see their own documents

## Technical Details

### API Endpoint
```python
# backend/app/api/routes/documents.py
from fastapi import APIRouter, Depends
from app.middleware.mongo_auth import get_current_user

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("")
async def list_documents(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
) -> DocumentListResponse:
    """List user's synced documents."""
    collection = get_yjs_documents_collection()

    cursor = collection.find(
        {"user_id": current_user.id}
    ).sort("updated_at", -1).skip(offset).limit(limit)

    documents = await cursor.to_list(length=limit)
    total = await collection.count_documents({"user_id": current_user.id})

    return DocumentListResponse(
        documents=[doc_to_response(d) for d in documents],
        total=total
    )
```

### Response Schema
```python
class DocumentSummary(BaseModel):
    doc_id: str
    title: str
    created_at: datetime
    updated_at: datetime

class DocumentListResponse(BaseModel):
    documents: list[DocumentSummary]
    total: int
```

## Dependencies
- SYNC-102 (yjs_documents collection)

## Parallel Safe With
- SYNC-201, SYNC-202, SYNC-203, SYNC-302, SYNC-303

## Notes
- Part of MVP3 Epic 3: User Experience
- Add to existing FastAPI backend
- Consider caching for performance

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Multi-Device Sync
- **Estimate**: 3h
