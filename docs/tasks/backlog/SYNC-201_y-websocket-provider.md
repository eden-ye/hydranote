# SYNC-201: Add y-websocket Provider

## Description
Integrate y-websocket provider into the frontend Editor component to enable real-time sync with the sync server.

## Automation Status
**AUTO** - Can be implemented with clear code changes

## Acceptance Criteria
- [ ] y-websocket package added to frontend
- [ ] WebsocketProvider created on document load
- [ ] Provider connects to sync server URL
- [ ] Document syncs across browser tabs
- [ ] Provider cleanup on unmount

## Technical Details

### Package Installation
```bash
npm install y-websocket
```

### Hook Implementation
```typescript
// frontend/src/hooks/useYjsSync.ts
import { WebsocketProvider } from 'y-websocket'
import { Doc } from 'yjs'

export function useYjsSync(doc: Doc, docId: string) {
  const { token } = useAuthStore()
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')

  useEffect(() => {
    if (!token || !doc) return

    const wsProvider = new WebsocketProvider(
      import.meta.env.VITE_SYNC_SERVER_URL || 'ws://localhost:1234',
      docId,
      doc,
      { params: { token } }
    )

    wsProvider.on('status', ({ status }) => {
      setStatus(status === 'connected' ? 'connected' : 'connecting')
    })

    wsProvider.on('sync', (isSynced) => {
      console.log('Sync status:', isSynced)
    })

    return () => wsProvider.destroy()
  }, [doc, docId, token])

  return { status }
}
```

### Editor Integration
```typescript
// In Editor.tsx
const { status } = useYjsSync(doc.spaceDoc, docId)
```

## Dependencies
- SYNC-101 (server running)

## Parallel Safe With
- SYNC-102, SYNC-103, SYNC-301-303

## Notes
- Part of MVP3 Epic 2: Frontend Sync Provider
- Test with two browser windows to verify sync
- Handle reconnection gracefully

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Multi-Device Sync
- **Estimate**: 3h
