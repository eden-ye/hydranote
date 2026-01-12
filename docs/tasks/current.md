# Current Tasks

**Current Phase**: Phase 2 - Core Editor (Keyboard Behaviors Complete)
**Last Updated**: 2026-01-13

## Summary

**Completed**: 45 tickets in `done/`
**Active**: 2 tickets remaining (1 MVP1 bug, 1 already done)
**Backlog (MVP2)**: 25 tickets (ready after MVP1 complete)
**Archived**: 2 obsolete tickets

## Recently Completed (moved to done/)

All keyboard behavior tickets (EDITOR-3051-3063) are now complete:
- Enter key: creates sibling, splits text, creates first child when parent has children
- Backspace: merges with previous, navigates to last visible descendant, handles selection
- Delete: merges with next, unindents children instead of deleting them
- Arrow keys: normal text navigation (no expand/collapse on arrows)
- Cmd+Enter: toggles fold

Also completed: API-203 (WebSocket streaming), FE-401-404 (Supabase, auth store, login UI, spotlight)

**2026-01-11**: FE-405 (AI Generation Store) - Integrated into App.tsx, Spotlight shows "50 remaining"

**2026-01-11**: FE-406-409 (Integration) - Focus mode, breadcrumb, expand button, ghost questions (#42)
- FE-406: Double-click enters focus mode, Escape exits
- FE-407: Breadcrumb shows in focus mode with ancestor path
- FE-408: Expand button (+) appears on bullet hover
- FE-409: Ghost questions render in focus mode

**2026-01-11**: INFRA-001 & INFRA-501 - Deployment infrastructure complete

**2026-01-11**: EDITOR-3101 (Color Palette System) - First MVP2 ticket completed (#43)
- Defined 6 colors with semantic names and hex values
- Created color-palette.ts utility with helper functions
- Added CSS styles for data-v-highlight attribute

**2026-01-11**: EDITOR-3401-3403 (Portal Block) - MVP2 Portal epic tickets completed (#60)
- EDITOR-3401: Portal Block Schema - sourceDocId, sourceBlockId, isCollapsed, syncStatus
- EDITOR-3402: Portal Rendering - distinctive border, collapse/expand, source hints
- EDITOR-3403: Live Sync - Yjs observation for real-time updates
- Chrome E2E tested: portal creation, live sync, collapse toggle, orphaned state rendering

**2026-01-12**: EDITOR-3406 (Portal Runtime Orphan Detection) - MVP2 enhancement completed
- Added subscription to `doc.slots.blockUpdated` for runtime block deletion detection
- Portals now automatically transition to "orphaned" state when source block is deleted
- No page refresh required - real-time detection via BlockSuite's slot system
- 6 new tests added, all 700 frontend tests passing

**2026-01-12**: API-301 (Embedding/Vector Storage) - MVP2 semantic linking Phase 1 completed
- Added OpenAI embedding service with text-embedding-3-small model (1536 dimensions)
- Created context-aware embedding text builder (ancestor path + descriptor + children)
- Added database migration for note_embeddings table with pgvector
- Added IVFFlat index for similarity search
- Added RLS policies for user isolation
- 13 new embedding service tests, all 138 backend tests passing

**2026-01-13**: API-302 (Semantic Search Endpoint) - MVP2 semantic linking Phase 2 completed
- Created POST `/api/notes/semantic-search` endpoint with auth
- Generates query embeddings using OpenAI
- Performs vector similarity search via PostgreSQL pgvector
- Returns ranked results with context paths and similarity scores
- Supports optional descriptor_type filtering
- Created `semantic_search()` PostgreSQL function for RPC calls
- 8 new endpoint tests, all 146 backend tests passing
- Bruno API test created for integration testing

**2026-01-11**: EDITOR-307 (Editor Store) - MVP1 ticket completed
- Added document ID tracking (`currentDocumentId`, `setCurrentDocumentId`)
- Added selection state (`selectedBlockIds`, `setSelectedBlocks`, `clearSelection`)
- Added `EditorMode` type and `selectEditorMode` selector
- 27 editor store tests (up from 9), 318 total frontend tests

## Active Tickets (3)

### MVP1 Core (3)

| Ticket | Title | Status | Notes |
|--------|-------|--------|-------|
| BUG-EDITOR-3064 | Null Model Render Error | open | "Cannot read properties of null" in production |
| EDITOR-307 | Editor Store | done | Document ID, selection state, editor mode tracking |
| EDITOR-3056 | Inline Formatting | done | Bold/italic/underline (Cmd+B/I/U) support - already completed |

## Next Steps

1. **BUG-EDITOR-3064**: Fix null model render error in production

## Recently Verified Complete (Phase 3)

### AUTH (Phase 3) - Backend ✅
- AUTH-101, 102, 103, 104: All completed with 125 backend tests passing

### FE (Phase 4-5) - Integration Complete ✅
- FE-405: ✅ DONE - Integrated into App.tsx (PR #40)
- FE-406-409: ✅ DONE - Integrated into Editor.tsx (PR #42)
  - Focus mode, breadcrumb, expand button, ghost questions all working

### INFRA - Deployment Complete ✅
- INFRA-001: ✅ DONE - SAT/PROD deployment separation
- INFRA-501: ✅ DONE - CI/CD duplication fixed

## Notes for Claude Code

**Quick Start**:
1. Phase 2-5 keyboard behaviors and auth are complete
2. Active MVP1: BUG-EDITOR-3064 only (EDITOR-307 ✅ DONE)
3. FE-405-409 ✅ ALL DONE - Full UI integration complete
4. INFRA-001, INFRA-501 ✅ DONE - Deployment complete
5. Backlog: 22 MVP2 tickets (ready after MVP1 complete)

**Test Commands**:
```bash
# Backend (146 tests)
cd backend && python3 -m pytest tests/ -v

# Frontend (290 tests)
cd frontend && npm run test:run

# Build
cd frontend && npm run build
```

**Ticket Folders**:
- `docs/tasks/*.md` - Active tickets (3)
- `docs/tasks/done/*.md` - Completed tickets (45)
- `docs/tasks/backlog/*.md` - MVP2 tickets (25)
- `docs/tasks/archive/*.md` - Obsolete tickets (2)

---

## MVP2 Backlog (25 tickets)

**Prerequisites**: Complete MVP1 first (BUG-EDITOR-3064, EDITOR-307)

**NEW (2026-01-13)**: Added 7 tickets for Silent Auto-Reorg + Cmd+S Portal Search features

| Epic | Tickets | Count |
|------|---------|-------|
| Background Coloring | EDITOR-3102 to 3103 (3101 done) | 2 |
| Descriptor System | EDITOR-3201 to 3204 | 4 |
| Cheatsheet | EDITOR-3301 to 3304 | 4 |
| Portal | EDITOR-3404-3405 (3401-3403, 3406 done) | 2 |
| **Semantic Linking** | **API-303, EDITOR-3407-3410, EDITOR-3501, FE-501 (301, 302 done)** | **9** |
| Auto AI Generation | EDITOR-3601, 3602, FE-502 | 3 |

### Semantic Linking Details (9 remaining, 2 done)

**Backend APIs (3):**
- API-301: ✅ DONE - Embedding/Vector Storage (pgvector + OpenAI) - Phase 1 (6h)
- API-302: ✅ DONE - Semantic Search Endpoint - Phase 2 (4h)
- API-303: Concept Extraction - Phase 3 (3h)

**Silent Auto-Reorg (2):**
- EDITOR-3407: Auto-Reorg Foundation (with mocks) - Phase 4 (5h)
- EDITOR-3408: Auto-Reorg Integration (real APIs) - Phase 5 (4h)

**Cmd+S Portal Search (2):**
- EDITOR-3409: Portal Search Modal (with mocks) - Phase 6 (6h)
- EDITOR-3410: Search Modal Integration - Phase 7 (4h)

**Other (4):**
- EDITOR-3501: Portal subtree editing
- EDITOR-3502-3505: Reorganization UI (moved to MVP4)
- FE-501: Semantic linking settings

**Total Estimate:** 32 hours sequential, **14 hours with 3-thread parallelism (OPTIMAL)**

### 3-Thread Parallel Execution Plan (14 hours total)

**Optimal Strategy for Maximum Speed:**

```
🔴 Thread 1 (Critical Path - 14h):
   API-301 (6h) → API-302 (4h) → EDITOR-3408 (4h)

🟢 Thread 2 (Support Path - 8h):
   API-303 (3h) → EDITOR-3407 (5h)

🔵 Thread 3 (Independent Path - 10h):
   EDITOR-3409 (6h) → EDITOR-3410 (4h)
```

**Timeline:**
- **Hour 0-6**: All 3 threads working (Phase 1, 3, 6)
- **Hour 6-8**: Thread 1 & 2 working (Phase 2, 4), Thread 3 working (Phase 7)
- **Hour 8-10**: Thread 1 & 3 working (Phase 2, 7), Thread 2 idle
- **Hour 10-14**: Thread 1 only (Phase 5), others idle
- **Total: 14 hours** (vs 32h sequential)

**⚠️ One Merge Conflict:**
- `editor-store.ts` (Hours 3-6): Thread 2 & 3 both modify
- **Resolution**: Trivial additive merge (2 minutes)
- **Strategy**: Let both threads proceed, resolve during PR merge

**Prerequisites (Phase 0 - 15 min):**
1. Enable pgvector in Supabase Dashboard (all environments)
2. Add `OPENAI_API_KEY` to backend env files
3. Verify with: `SELECT * FROM pg_extension WHERE extname = 'vector';`

**Execution Order:**
1. User completes Phase 0 (prerequisite)
2. Launch all 3 threads simultaneously
3. Thread 3 finishes first (Hour 10) → merge EDITOR-3409, EDITOR-3410
4. Thread 2 finishes (Hour 8) → resolve editor-store.ts conflict → merge
5. Thread 1 finishes last (Hour 14) → merge all API tickets and EDITOR-3408

See `docs/roadmap.md` for full MVP2 feature breakdown.
See `/Users/taylorye/.claude/plans/linear-crunching-knuth.md` for detailed implementation plan.
