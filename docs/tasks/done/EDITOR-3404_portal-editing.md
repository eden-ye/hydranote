# EDITOR-3404: Portal Editing (Portal → Source)

## Description
Enable editing within portal that syncs changes back to source block.

## Acceptance Criteria
- [x] User can edit text within expanded portal
- [x] Edits sync back to source block in real-time
- [x] Cursor and selection work within portal
- [x] Handle concurrent edits (user editing both portal and source)
- [x] Visual indication that editing affects source

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
- **Completed**: 2026-01-11
- **Status**: completed
- **Epic**: MVP2 - Portal
- **PR**: https://github.com/eden-ye/hydranote/pull/63

## Implementation Summary

### Files Changed
- `frontend/src/blocks/utils/portal-editing.ts` - New utility functions for editing logic
- `frontend/src/blocks/__tests__/portal-editing.test.ts` - 33 new unit tests
- `frontend/src/blocks/components/portal-block.ts` - Added rich-text editing support
- `frontend/src/blocks/utils/index.ts` - Export portal-editing utils

### Key Implementation Details
1. **Editable Content**: Portal content rendered with `rich-text` component bound to source Y.Text
2. **Real-time Sync**: Direct Yjs binding means edits go immediately to source
3. **Visual Indicators**:
   - "Editing source" badge in header when focused
   - Border glow effect during editing (portal-editing CSS class)
4. **Warning System**: First edit shows warning banner with "Got it" dismiss button
5. **State Management**: `_isEditing`, `_isSyncing`, `_hasEditedBefore`, `_warningDismissed` flags

### Testing
- Unit tests: 33 new tests, all passing
- Build: TypeScript and Vite build successful
- E2E expectations documented in `e2e/expectations/EDITOR-3404-portal-editing.md`

## E2E Testing Results (2026-01-11)
- ✅ Unit tests pass (33 tests in portal-editing.test.ts)
- ✅ Build successful
- ⏳ Manual Chrome testing pending (test scenarios documented)
