# SYNC-102: Server Persistence Layer

## Description
Add persistence to the y-websocket server to store Yjs document state in MongoDB. This ensures documents survive server restarts and enables document listing.

## Automation Status
**SEMI-AUTO** - Requires MongoDB setup, then automated

## Acceptance Criteria
- [ ] Yjs document updates persisted to MongoDB
- [ ] Documents load from MongoDB on server restart
- [ ] `yjs_documents` collection created with indexes
- [ ] Document garbage collection for old updates
- [ ] Connection to existing MongoDB instance

## Technical Details

### MongoDB Schema
```javascript
// yjs_documents collection
{
  _id: ObjectId,
  doc_id: string,           // Yjs room name (e.g., "user-123/doc-456")
  user_id: string,          // Owner UUID
  yjs_state: Binary,        // Y.encodeStateAsUpdate(doc)
  title: string,            // Cached document title
  created_at: Date,
  updated_at: Date,
}

// Indexes
db.yjs_documents.createIndex({ doc_id: 1 }, { unique: true })
db.yjs_documents.createIndex({ user_id: 1, updated_at: -1 })
```

### Persistence Implementation
```javascript
// sync-server/persistence.js
import { MongoClient } from 'mongodb'

export class MongoPersistence {
  constructor(connectionString) {
    this.client = new MongoClient(connectionString)
  }

  async bindState(docName, ydoc) {
    // Load existing state from MongoDB
    // Subscribe to updates and persist
  }

  async writeState(docName, ydoc) {
    // Persist Yjs state to MongoDB
  }
}
```

## Dependencies
- SYNC-101 (y-websocket server)

## Parallel Safe With
- SYNC-103, Frontend tickets (different concerns)

## Notes
- Part of MVP3 Epic 1: Sync Server Setup
- Use existing MongoDB from FastAPI backend
- Consider y-leveldb for local dev, MongoDB for production

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Multi-Device Sync
- **Estimate**: 4h
