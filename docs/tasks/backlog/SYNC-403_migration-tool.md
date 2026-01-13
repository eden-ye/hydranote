# SYNC-403: Migration Tool

## Description
Create tool to migrate existing local-only documents (in IndexedDB) to the cloud sync system.

## Automation Status
**AUTO** - One-time migration script

## Acceptance Criteria
- [ ] UI to trigger migration for existing docs
- [ ] Progress indicator during migration
- [ ] Handle large documents gracefully
- [ ] Verify data integrity after migration
- [ ] Rollback option if migration fails

## Technical Details

### Migration Flow
```
1. User clicks "Enable Cloud Sync" on existing document
2. Show confirmation dialog with document size
3. Extract Yjs state from IndexedDB
4. Upload to sync server
5. Enable WebSocket provider
6. Verify sync complete
7. Mark document as "cloud-synced"
```

### Migration Service
```typescript
// frontend/src/services/migration.ts

export async function migrateToCloud(docId: string): Promise<MigrationResult> {
  // 1. Get current Yjs state
  const persistence = new IndexeddbPersistence(`hydra-notes-${docId}`, doc)
  await persistence.whenSynced

  // 2. Extract state
  const state = Y.encodeStateAsUpdate(doc)

  // 3. Upload to server via REST (initial sync)
  const response = await fetch('/api/documents/migrate', {
    method: 'POST',
    body: JSON.stringify({
      doc_id: docId,
      yjs_state: base64Encode(state)
    })
  })

  // 4. Verify upload
  if (!response.ok) {
    throw new Error('Migration failed')
  }

  // 5. Enable sync provider
  markDocumentAsSynced(docId)

  return { success: true, bytesUploaded: state.length }
}
```

### Migration UI
```typescript
// frontend/src/components/MigrationDialog.tsx
export function MigrationDialog({ docId, onComplete }) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'migrating' | 'done' | 'error'>('idle')

  const handleMigrate = async () => {
    setStatus('migrating')
    try {
      await migrateToCloud(docId)
      setStatus('done')
      onComplete()
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <dialog>
      <h2>Enable Cloud Sync</h2>
      <p>This will upload your document to the cloud for multi-device access.</p>
      {status === 'migrating' && <ProgressBar value={progress} />}
      <button onClick={handleMigrate} disabled={status === 'migrating'}>
        {status === 'migrating' ? 'Migrating...' : 'Enable Sync'}
      </button>
    </dialog>
  )
}
```

### Backend Endpoint
```python
# backend/app/api/routes/documents.py
@router.post("/documents/migrate")
async def migrate_document(
    request: MigrateRequest,
    current_user: User = Depends(get_current_user)
):
    """Initialize cloud sync for an existing local document."""
    # Decode and store Yjs state
    yjs_state = base64.b64decode(request.yjs_state)

    await collection.insert_one({
        "doc_id": request.doc_id,
        "user_id": current_user.id,
        "yjs_state": yjs_state,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    return {"success": True}
```

## Dependencies
- SYNC-102 (server persistence)
- SYNC-201 (sync provider)

## Parallel Safe With
- SYNC-401, SYNC-402

## Notes
- Part of MVP3 Epic 4: Testing & Migration
- Consider batch migration for multiple docs
- Show storage usage info

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Multi-Device Sync
- **Estimate**: 3h
