# EDITOR-305: IndexedDB Persistence

## Description
Set up local-first persistence using y-indexeddb. Documents should be saved to IndexedDB and survive page refreshes.

## Acceptance Criteria
- [x] y-indexeddb integrated with BlockSuite store
- [x] Documents persist across page refreshes
- [x] Persistence is automatic (no manual save)
- [x] Loading indicator while hydrating from IndexedDB
- [x] Error handling for storage failures

## Dependencies
- EDITOR-301 (BlockSuite Integration)

## Parallel Safe With
- EDITOR-302, EDITOR-303, EDITOR-304, EDITOR-306, EDITOR-307, AUTH-*, API-*, FE-*

## Notes
- y-indexeddb already installed
- This is the "local-first" part of the architecture
- Cloud sync comes later (Phase 3+)

## Implementation Details

### Files Added/Modified
- `frontend/src/hooks/useIndexedDBPersistence.ts` - Persistence utilities
- `frontend/src/hooks/index.ts` - Barrel export
- `frontend/src/components/Editor.tsx` - Integration with loading/error states
- `frontend/src/components/Editor.test.tsx` - Unit tests for persistence

### Key Components
- `HYDRA_DB_PREFIX` = "hydra-notes-" - Database name prefix
- `IndexeddbPersistence` - y-indexeddb integration with BlockSuite doc.spaceDoc
- `LoadingIndicator` - Shown while hydrating from IndexedDB
- `ErrorIndicator` - Shown when persistence fails
- `data-persistence-status` attribute - Tracks sync state ("loading" | "synced" | "error")

### E2E Evidence
- IndexedDB database `hydra-notes-main` created
- Persistence status shows "synced"

## Commits
- 66a539b feat(editor): EDITOR-305 - IndexedDB persistence with y-indexeddb

## Status
- **Created**: 2025-01-09
- **Completed**: 2026-01-09
- **Status**: done
- **PR**: https://github.com/eden-ye/hydranote/pull/12
