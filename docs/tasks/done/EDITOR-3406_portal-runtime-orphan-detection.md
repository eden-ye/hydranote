# EDITOR-3406: Portal Runtime Orphan Detection

## Description
Enhance portal blocks to automatically detect when their source block is deleted at runtime, without requiring page refresh.

## Background
Current implementation detects orphaned state only at initialization (when `createSourceObserver` is called). If the source block is deleted while the portal is already rendered, the portal won't automatically detect this until the page is refreshed.

## Acceptance Criteria
- [x] Portal automatically detects source block deletion in real-time
- [x] Portal updates to orphaned state without page refresh
- [x] Uses efficient document-level event listening (not polling)

## Technical Details
**Implemented Solution:**

Used BlockSuite's `doc.slots.blockUpdated` slot to listen for block deletion events:

```typescript
// EDITOR-3406: Subscribe to document-level block deletion events
const blockUpdatedSubscription = doc.slots.blockUpdated.on((event) => {
  if (event.type === 'delete' && event.id === sourceBlockId) {
    onOrphaned()
  }
})

// Cleanup in dispose
return {
  dispose: () => {
    sourceText.yText.unobserve(textObserver)
    blockUpdatedSubscription.dispose()  // EDITOR-3406: Cleanup
  },
}
```

**Key differences from original proposal:**
- Used `doc.slots.blockUpdated` instead of `doc.on('block-removed')` - this is the actual BlockSuite API
- Event structure is `{ type: 'add' | 'delete' | 'update', id: string, ... }`
- Subscription returns a disposable object with `.dispose()` method

## Dependencies
- EDITOR-3401: Portal Block Schema (completed)
- EDITOR-3402: Portal Rendering (completed)
- EDITOR-3403: Portal Live Sync (completed)

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Enhancement to EDITOR-3403. Low priority - orphaned state detection works on page refresh.

## Implementation Summary

### Files Modified
1. **`frontend/src/blocks/utils/portal-sync.ts`**
   - Added subscription to `doc.slots.blockUpdated` in `createSourceObserver()`
   - Filter for `type === 'delete'` events matching `sourceBlockId`
   - Added cleanup in dispose method

2. **`frontend/src/blocks/__tests__/portal-sync.test.ts`**
   - Added `MockSlot` and `MockBlockUpdatedEvent` interfaces
   - Updated `MockDoc` interface with `slots.blockUpdated`
   - Added 6 new tests for runtime orphan detection:
     - Should subscribe to blockUpdated slot on creation
     - Should call onOrphaned when source block is deleted at runtime
     - Should NOT call onOrphaned when a different block is deleted
     - Should NOT call onOrphaned for non-delete events
     - Should cleanup blockUpdated listener on dispose
     - Should not listen for blockUpdated when source is already orphaned at init

3. **`e2e/expectations/EDITOR-3406_portal-runtime-orphan-detection.md`** (new)
   - Created E2E test expectations for manual testing

### Test Results
- All 700 unit tests passing
- Build successful

### E2E Testing
- Chrome MCP not connected - E2E expectations documented for manual testing
- Created `e2e/expectations/EDITOR-3406_portal-runtime-orphan-detection.md`

## Status
- **Created**: 2026-01-11
- **Completed**: 2026-01-12
- **Status**: completed
- **Epic**: MVP2 - Portal
- **Priority**: Low (enhancement)
