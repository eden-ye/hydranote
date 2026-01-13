# SYNC-202: Auth Token Handling

## Description
Implement JWT token authentication for WebSocket connections to ensure only authenticated users can sync their documents.

## Automation Status
**AUTO** - Clear implementation path

## Acceptance Criteria
- [ ] JWT token passed to WebSocket via query params
- [ ] Server validates token before accepting connection
- [ ] Connection rejected with error on invalid token
- [ ] Token refresh handled gracefully
- [ ] Unauthorized documents inaccessible

## Technical Details

### Client-Side Token Passing
```typescript
// In useYjsSync.ts
const wsProvider = new WebsocketProvider(
  SYNC_SERVER_URL,
  `${userId}/${docId}`,  // Namespace by user
  doc,
  {
    params: { token },
    // Reconnect with fresh token
    connect: true
  }
)

// Handle token expiry
wsProvider.on('connection-close', (event) => {
  if (event.code === 4001) { // Unauthorized
    // Refresh token and reconnect
    refreshToken().then(() => wsProvider.connect())
  }
})
```

### Server-Side Validation
```javascript
// sync-server/auth.js
import jwt from 'jsonwebtoken'

export function validateToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return { valid: true, userId: decoded.sub }
  } catch (err) {
    return { valid: false, error: err.message }
  }
}

// In index.js
wss.on('connection', (conn, req) => {
  const token = new URL(req.url, 'http://localhost').searchParams.get('token')
  const { valid, userId } = validateToken(token)

  if (!valid) {
    conn.close(4001, 'Unauthorized')
    return
  }

  // Verify user owns the document
  const docId = extractDocId(req.url)
  if (!docId.startsWith(userId)) {
    conn.close(4003, 'Forbidden')
    return
  }

  setupWSConnection(conn, req, { gc: true })
})
```

## Dependencies
- SYNC-101 (server)
- SYNC-201 (provider)

## Parallel Safe With
- SYNC-102, SYNC-103, SYNC-203

## Notes
- Part of MVP3 Epic 2: Frontend Sync Provider
- Use same JWT secret as FastAPI backend
- Consider Supabase JWT validation

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Multi-Device Sync
- **Estimate**: 3h
