# SYNC-101: y-websocket Server Setup

## Description
Create a Node.js WebSocket server using y-websocket to handle Yjs document synchronization. This is the core sync server that enables multi-device editing.

## Automation Status
**SEMI-AUTO** - Initial setup requires configuration, then automated

## Acceptance Criteria
- [ ] Node.js project created in `sync-server/` directory
- [ ] y-websocket server running on port 1234
- [ ] Basic JWT authentication via query params
- [ ] Connection logging and error handling
- [ ] Health check endpoint
- [ ] Local development script (`npm start`)

## Technical Details

### Directory Structure
```
sync-server/
├── package.json
├── index.js          # Main server entry
├── auth.js           # JWT validation
├── Dockerfile
└── README.md
```

### Package Dependencies
```json
{
  "name": "hydra-sync-server",
  "version": "1.0.0",
  "dependencies": {
    "y-websocket": "^1.5.0",
    "ws": "^8.0.0",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.0.0"
  }
}
```

### Server Implementation
```javascript
import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'

const wss = new WebSocketServer({ port: 1234 })

wss.on('connection', (conn, req) => {
  const token = new URL(req.url, 'http://localhost').searchParams.get('token')
  // Validate JWT, then setup Yjs connection
  setupWSConnection(conn, req, { gc: true })
})
```

## Dependencies
- None (foundational infrastructure)

## Parallel Safe With
- All other tickets (infrastructure setup)

## Notes
- Part of MVP3 Epic 1: Sync Server Setup
- Follow AFFiNE's y-websocket approach
- Reference: https://github.com/yjs/y-websocket

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Multi-Device Sync
- **Estimate**: 4h
