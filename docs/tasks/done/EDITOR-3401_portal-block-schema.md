# EDITOR-3401: Portal Block Schema

## Description
Create the data model for portal blocks - live-syncing embeds that reference other bullets.

## Acceptance Criteria
- [x] New block type: `portal`
- [x] Portal stores source reference (document ID + block ID)
- [x] Portal metadata: collapsed state, sync status
- [x] Schema supports both same-document and cross-document portals
- [x] Graceful handling when source is deleted

## Technical Details
```typescript
interface PortalBlockProps {
  type: 'portal';
  sourceDocId: string;      // ID of source document
  sourceBlockId: string;    // ID of source block
  isCollapsed: boolean;     // Collapsed/expanded state
  syncStatus: 'synced' | 'stale' | 'orphaned';
}
```
- Register new block type with BlockSuite
- Portal renders source content, not its own text
- Orphaned status when source is deleted

## Dependencies
- None (foundation ticket)

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 4: Portal. Originally planned for MVP4, pulled into MVP2 for semantic linking.

## Status
- **Created**: 2026-01-10
- **Completed**: 2026-01-11
- **Status**: completed
- **Epic**: MVP2 - Portal
- **PR**: https://github.com/eden-ye/hydranote/pull/60

## E2E Testing Results (2026-01-11)
- ✅ Portal block created via JavaScript API
- ✅ Portal stores source reference (document ID + block ID)
- ✅ Collapsed state persists correctly
- ✅ Sync status transitions (synced → orphaned) verified
