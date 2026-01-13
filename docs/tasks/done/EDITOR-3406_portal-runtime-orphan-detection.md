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
- **Status**: ⚠️ INCOMPLETE - Missing Chrome E2E testing
- **Epic**: MVP2 - Portal
- **Priority**: Low (enhancement)

## E2E Testing Status (2026-01-12)

**Status:** ❌ NOT COMPLETED

**Blocker:** Stale IndexedDB data from previous testing sessions causes 7 console TypeErrors that prevent proper E2E validation. Despite the fix in EDITOR-3405 (commit `219b2a5`), orphaned portal blocks persist in browser storage.

**Cleanup Attempts:**
- ✅ Cleared IndexedDB via JavaScript
- ✅ Cleared Vite cache
- ✅ Restarted dev server
- ✅ Hard refresh
- ❌ Errors persist due to Y-indexeddb persistence layer

**Required Actions:**
1. Manual Chrome testing with DevTools → Application → Clear All Site Data
2. OR test in fresh Incognito window
3. Execute all scenarios from `e2e/expectations/EDITOR-3406_portal-runtime-orphan-detection.md`
4. Verify no console errors
5. Capture screenshot evidence

**Reference:** See `e2e/results/EDITOR-3406_3601_3602_combined-e2e-report.md` for full details.

**TDD Workflow:** Step 7 (Chrome E2E) is INCOMPLETE. Per CLAUDE.md rules, this ticket should NOT be in `done/` folder until E2E testing is completed.
