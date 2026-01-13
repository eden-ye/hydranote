# SYNC-302: Sync Toggle

## Description
Add UI toggle to enable/disable cloud sync per document, allowing users to keep some documents local-only.

## Automation Status
**AUTO** - UI implementation

## Acceptance Criteria
- [ ] Toggle switch in document settings/toolbar
- [ ] When disabled: document stays local only (IndexedDB)
- [ ] When enabled: document syncs to cloud
- [ ] Setting persisted per document
- [ ] Clear indicator of sync status

## Technical Details

### UI Component
```typescript
// frontend/src/components/SyncToggle.tsx
interface SyncToggleProps {
  docId: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export function SyncToggle({ docId, enabled, onToggle }: SyncToggleProps) {
  return (
    <label className="sync-toggle">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className="sync-toggle__label">
        {enabled ? 'Cloud Sync On' : 'Local Only'}
      </span>
    </label>
  )
}
```

### Document Settings Store
```typescript
// frontend/src/stores/document-settings-store.ts
interface DocumentSettings {
  syncEnabled: boolean
}

const useDocumentSettings = create<{
  settings: Record<string, DocumentSettings>
  setSyncEnabled: (docId: string, enabled: boolean) => void
}>((set) => ({
  settings: {},
  setSyncEnabled: (docId, enabled) => set((state) => ({
    settings: {
      ...state.settings,
      [docId]: { ...state.settings[docId], syncEnabled: enabled }
    }
  }))
}))
```

### Integration with Sync Provider
```typescript
// In useYjsSync.ts
const { settings } = useDocumentSettings()
const syncEnabled = settings[docId]?.syncEnabled ?? true

useEffect(() => {
  if (!syncEnabled || !token) return
  // Only create WebSocket provider if sync is enabled
  const wsProvider = new WebsocketProvider(...)
}, [syncEnabled, ...])
```

## Dependencies
- SYNC-201 (provider to toggle)

## Parallel Safe With
- All other tickets

## Notes
- Part of MVP3 Epic 3: User Experience
- Default to sync enabled for new documents
- Consider showing warning when disabling sync

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Multi-Device Sync
- **Estimate**: 2h
