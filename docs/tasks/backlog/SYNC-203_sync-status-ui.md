# SYNC-203: Sync Status UI

## Description
Create a visual indicator showing the current sync status (connecting, synced, offline, error) in the editor UI.

## Automation Status
**AUTO** - UI component implementation

## Acceptance Criteria
- [ ] Status indicator component created
- [ ] Shows: Connecting, Synced, Offline, Error states
- [ ] Positioned in header or toolbar
- [ ] Animated transitions between states
- [ ] Tooltip with detailed status info
- [ ] Click to retry on error

## Technical Details

### Component Design
```typescript
// frontend/src/components/SyncStatus.tsx
import { useSyncStore } from '@/stores/sync-store'

type SyncState = 'connecting' | 'synced' | 'offline' | 'error'

const STATUS_CONFIG = {
  connecting: { icon: '🔄', color: 'yellow', label: 'Syncing...' },
  synced: { icon: '✓', color: 'green', label: 'Synced' },
  offline: { icon: '○', color: 'gray', label: 'Offline' },
  error: { icon: '!', color: 'red', label: 'Sync Error' },
}

export function SyncStatus() {
  const { status, lastSyncTime, error } = useSyncStore()
  const config = STATUS_CONFIG[status]

  return (
    <div className={`sync-status sync-status--${status}`} title={getTooltip()}>
      <span className="sync-status__icon">{config.icon}</span>
      <span className="sync-status__label">{config.label}</span>
    </div>
  )
}
```

### Sync Store
```typescript
// frontend/src/stores/sync-store.ts
import { create } from 'zustand'

interface SyncState {
  status: 'connecting' | 'synced' | 'offline' | 'error'
  lastSyncTime: Date | null
  error: string | null
  setStatus: (status: SyncState['status']) => void
  setError: (error: string | null) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'offline',
  lastSyncTime: null,
  error: null,
  setStatus: (status) => set({ status, lastSyncTime: new Date() }),
  setError: (error) => set({ error, status: error ? 'error' : 'synced' }),
}))
```

## Dependencies
- SYNC-201 (provider for status events)

## Parallel Safe With
- All other tickets

## Notes
- Part of MVP3 Epic 2: Frontend Sync Provider
- Use Tailwind CSS for styling
- Consider showing last sync timestamp

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Multi-Device Sync
- **Estimate**: 3h
