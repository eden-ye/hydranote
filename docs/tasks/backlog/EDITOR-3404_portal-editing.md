# EDITOR-3404: Portal Editing (Portal → Source)

## Description
Enable editing within portal that syncs changes back to source block.

## Acceptance Criteria
- [ ] User can edit text within expanded portal
- [ ] Edits sync back to source block in real-time
- [ ] Cursor and selection work within portal
- [ ] Handle concurrent edits (user editing both portal and source)
- [ ] Visual indication that editing affects source

## Technical Details
- Portal's rich-text binds to source's Y.Text (not its own)
- Edits go directly to source block's Yjs doc
- Concurrent edit handling via Yjs CRDT (automatic merge)
- Consider: subtle visual cue during edit (e.g., border glow)
- Warning on first edit: "Editing will modify source"

## Dependencies
- EDITOR-3401: Portal Block Schema
- EDITOR-3402: Portal Rendering
- EDITOR-3403: Live Sync

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 4: Portal. Bidirectional sync.

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Portal
