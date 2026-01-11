# EDITOR-3403: Live Sync (Source → Portal)

## Description
Implement real-time synchronization from source block to portal.

## Acceptance Criteria
- [x] Portal updates in real-time when source block is edited
- [x] Changes to source text immediately reflected in portal
- [x] Changes to source children reflected in portal
- [x] Handle source block deletion gracefully (show orphaned state)
- [x] Efficient sync via Yjs observation (not polling)

## Technical Details
- Subscribe to source block's Yjs Y.Text and children changes
- Use Yjs observe callbacks for real-time updates
- Same-document sync: direct Yjs observation
- Cross-document sync: may need doc loading/caching
- Orphaned detection: observe doc for block deletion

## Dependencies
- EDITOR-3401: Portal Block Schema
- EDITOR-3402: Portal Rendering

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 4: Portal. Core sync mechanism.

## Status
- **Created**: 2026-01-10
- **Completed**: 2026-01-11
- **Status**: completed
- **Epic**: MVP2 - Portal
- **PR**: https://github.com/eden-ye/hydranote/pull/60

## E2E Testing Results (2026-01-11)
- ✅ Portal updates in real-time when source block text is edited
- ✅ Changes to source text immediately reflected in portal
- ✅ Yjs observation working for text changes (debounced 50ms)
- ✅ Orphaned state rendering verified (red border + deletion message)
- ⚠️ **Known Limitation**: Automatic orphaned detection requires page refresh or re-initialization when source is deleted at runtime (initial detection works, runtime detection needs follow-up ticket EDITOR-3406)
