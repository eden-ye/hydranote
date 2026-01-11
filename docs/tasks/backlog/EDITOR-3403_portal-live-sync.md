# EDITOR-3403: Live Sync (Source → Portal)

## Description
Implement real-time synchronization from source block to portal.

## Acceptance Criteria
- [ ] Portal updates in real-time when source block is edited
- [ ] Changes to source text immediately reflected in portal
- [ ] Changes to source children reflected in portal
- [ ] Handle source block deletion gracefully (show orphaned state)
- [ ] Efficient sync via Yjs observation (not polling)

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
- **Status**: pending
- **Epic**: MVP2 - Portal
