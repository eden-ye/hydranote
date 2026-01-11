# EDITOR-3401: Portal Block Schema

## Description
Create the data model for portal blocks - live-syncing embeds that reference other bullets.

## Acceptance Criteria
- [ ] New block type: `portal`
- [ ] Portal stores source reference (document ID + block ID)
- [ ] Portal metadata: collapsed state, sync status
- [ ] Schema supports both same-document and cross-document portals
- [ ] Graceful handling when source is deleted

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
- **Status**: pending
- **Epic**: MVP2 - Portal
