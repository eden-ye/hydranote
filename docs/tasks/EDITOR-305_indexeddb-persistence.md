# EDITOR-305: IndexedDB Persistence

## Description
Set up local-first persistence using y-indexeddb. Documents should be saved to IndexedDB and survive page refreshes.

## Acceptance Criteria
- [ ] y-indexeddb integrated with BlockSuite store
- [ ] Documents persist across page refreshes
- [ ] Persistence is automatic (no manual save)
- [ ] Loading indicator while hydrating from IndexedDB
- [ ] Error handling for storage failures

## Dependencies
- EDITOR-301 (BlockSuite Integration)

## Parallel Safe With
- EDITOR-302, EDITOR-303, EDITOR-304, EDITOR-306, EDITOR-307, AUTH-*, API-*, FE-*

## Notes
- y-indexeddb already installed
- This is the "local-first" part of the architecture
- Cloud sync comes later (Phase 3+)

## Status
- **Created**: 2025-01-09
- **Status**: pending
