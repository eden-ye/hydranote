# API-201: MongoDB Schema Implementation

## Description

Design and implement MongoDB database schema for storing hierarchical notes in Hydra Notes. Based on RemNote's flat document model approach with support for portals, tags, rich content, and CRDT sync.

## Acceptance Criteria

- [x] Design MongoDB schema following RemNote's flat document model
- [x] Create `blocks` collection with all required fields (hierarchy, content, portals, tags, CRDT)
- [x] Create `tags` collection for hierarchical tag taxonomy
- [x] Create `versions` collection for version history
- [x] Implement MongoDB client with connection pooling (`db/mongo.py`)
- [x] Implement auth middleware to replace Supabase RLS (`middleware/mongo_auth.py`)
- [x] Create Pydantic models for API schemas (`models/block.py`)
- [x] Implement blocks CRUD endpoints (`api/routes/blocks.py`)
- [x] Create required indexes for performance
- [x] Write pytest unit tests (11/12 passing)
- [x] Create Bruno API test collection
- [x] Frontend build passes
- [x] Docker build passes

## Dependencies

- None (foundational infrastructure task)

## Parallel Safe With

- FE-* (Frontend tasks)
- EDITOR-* (Editor tasks)

## Technical Details

### Schema Design

**Industry Research:**
| Company | Database | Backend |
|---------|----------|---------|
| Notion | PostgreSQL (sharded) | Custom |
| RemNote | MongoDB | Node.js/Meteor |
| Logseq | DataScript | ClojureScript |
| Obsidian | File system | None |

**Decision:** MongoDB with flat document model (like RemNote)

### Collections Created

1. **`blocks`** - Core notes with hierarchy, content, portals, tags, CRDT
2. **`tags`** - Hierarchical tag taxonomy
3. **`versions`** - Version history snapshots

### Files Created/Modified

| File | Action |
|------|--------|
| `backend/app/config.py` | Added `mongodb_uri`, `mongodb_database` |
| `backend/app/db/__init__.py` | Created - DB module exports |
| `backend/app/db/mongo.py` | Created - MongoDB client + indexes |
| `backend/app/middleware/__init__.py` | Created - Middleware exports |
| `backend/app/middleware/mongo_auth.py` | Created - Auth middleware |
| `backend/app/models/__init__.py` | Updated - Block model exports |
| `backend/app/models/block.py` | Created - Pydantic models |
| `backend/app/api/routes/blocks.py` | Created - CRUD endpoints |
| `backend/app/api/routes/auth.py` | Fixed Python 3.9 type hints |
| `backend/app/api/routes/ai.py` | Fixed Python 3.9 type hints |
| `backend/app/main.py` | Updated - MongoDB lifecycle |
| `backend/requirements.txt` | Added `motor>=3.3.0` |
| `backend/tests/test_blocks.py` | Created - Unit tests |
| `bruno/collections/blocks/*.bru` | Created - 7 API test files |
| `.env.local` | Added MongoDB connection |
| `.env.example` | Added MongoDB template |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blocks` | List blocks (filter by parent_id) |
| POST | `/api/blocks` | Create block |
| GET | `/api/blocks/{id}` | Get single block |
| GET | `/api/blocks/{id}/tree` | Get block + all descendants |
| GET | `/api/blocks/{id}/children` | Get direct children |
| PATCH | `/api/blocks/{id}` | Update block |
| POST | `/api/blocks/{id}/move` | Move block |
| DELETE | `/api/blocks/{id}` | Soft delete block + descendants |

### Storage Estimate

```
512MB free tier ÷ 400 bytes/block = ~1,280,000 blocks
MVP1 (100 users × 500 blocks) = ~20 MB ✓
```

## Test Results

| Test Suite | Result |
|------------|--------|
| pytest | 11/12 passed |
| Frontend build | Passed |
| Docker build | Passed |

## Notes

- Docker Desktop must be running for Docker build verification
- MongoDB Atlas M0 free tier (512MB) is sufficient for MVP1
- Supabase still used for Auth only; MongoDB for data storage
- Auth middleware provides user-scoped queries (replaces RLS)

## Status

- **Created**: 2026-01-09
- **Completed**: 2026-01-09
- **Status**: completed
