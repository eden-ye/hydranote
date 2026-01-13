# SYNC-303: Conflict Indicator

## Description
Show visual indicator when CRDT merges concurrent edits, helping users understand sync behavior.

## Automation Status
**AUTO** - UI implementation with Yjs events

## Acceptance Criteria
- [ ] Visual flash/highlight when remote changes merge
- [ ] Subtle notification for background sync
- [ ] Distinguishable from user's own edits
- [ ] Non-intrusive UX
- [ ] Optional: show which blocks were updated

## Technical Details

### Detecting Remote Updates
```typescript
// In useYjsSync.ts
wsProvider.on('update', (update, origin) => {
  // origin is null for remote updates
  if (origin === null) {
    useSyncStore.getState().setRemoteUpdateReceived(true)
    // Flash indicator
    setTimeout(() => {
      useSyncStore.getState().setRemoteUpdateReceived(false)
    }, 1000)
  }
})

// Alternative: use Y.Doc observe
doc.on('update', (update, origin) => {
  if (origin === 'remote') {
    // Handle remote update
  }
})
```

### Conflict Indicator Component
```typescript
// frontend/src/components/ConflictIndicator.tsx
export function ConflictIndicator() {
  const { remoteUpdateReceived } = useSyncStore()

  if (!remoteUpdateReceived) return null

  return (
    <div className="conflict-indicator animate-pulse">
      <span>↓ Changes synced from another device</span>
    </div>
  )
}
```

### Block-Level Highlighting (Optional)
```typescript
// Highlight specific blocks that were updated remotely
const highlightRemoteChanges = (update: Uint8Array) => {
  const decoder = Y.decodeUpdate(update)
  // Extract affected block IDs and add temporary highlight class
}
```

## Dependencies
- SYNC-201 (provider events)

## Parallel Safe With
- All other tickets

## Notes
- Part of MVP3 Epic 3: User Experience
- Keep UX subtle - don't interrupt user flow
- Consider sound/haptic feedback option

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Multi-Device Sync
- **Estimate**: 2h
