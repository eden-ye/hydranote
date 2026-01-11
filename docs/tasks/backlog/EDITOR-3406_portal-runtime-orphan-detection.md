# EDITOR-3406: Portal Runtime Orphan Detection

## Description
Enhance portal blocks to automatically detect when their source block is deleted at runtime, without requiring page refresh.

## Background
Current implementation detects orphaned state only at initialization (when `createSourceObserver` is called). If the source block is deleted while the portal is already rendered, the portal won't automatically detect this until the page is refreshed.

## Acceptance Criteria
- [ ] Portal automatically detects source block deletion in real-time
- [ ] Portal updates to orphaned state without page refresh
- [ ] Uses efficient document-level event listening (not polling)

## Technical Details
Add document-level block deletion listener in `createSourceObserver`:
```typescript
// Subscribe to document block-removed events
const blockRemovedHandler = (blockId: string) => {
  if (blockId === sourceBlockId) {
    onOrphaned()
  }
}
doc.on('block-removed', blockRemovedHandler)

// Cleanup in dispose
return {
  dispose: () => {
    sourceText.yText.unobserve(textObserver)
    doc.off('block-removed', blockRemovedHandler)
  }
}
```

## Dependencies
- EDITOR-3401: Portal Block Schema (completed)
- EDITOR-3402: Portal Rendering (completed)
- EDITOR-3403: Portal Live Sync (completed)

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Enhancement to EDITOR-3403. Low priority - orphaned state detection works on page refresh.

## Status
- **Created**: 2026-01-11
- **Status**: backlog
- **Epic**: MVP2 - Portal
- **Priority**: Low (enhancement)
