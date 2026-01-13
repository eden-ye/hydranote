# SYNC-103: Railway Deployment

## Description
Deploy the y-websocket sync server to Railway platform alongside the existing FastAPI backend.

## Automation Status
**MANUAL** - Requires Railway dashboard configuration

## Acceptance Criteria
- [ ] Dockerfile created for sync server
- [ ] Railway service configured
- [ ] Environment variables set (MONGODB_URI, JWT_SECRET)
- [ ] WebSocket URL accessible (wss://sync.hydranotes.app or similar)
- [ ] Health check endpoint working
- [ ] Logs visible in Railway dashboard

## Technical Details

### Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 1234
CMD ["node", "index.js"]
```

### Railway Configuration
```yaml
# railway.toml
[build]
  builder = "DOCKERFILE"
  dockerfilePath = "./Dockerfile"

[deploy]
  healthcheckPath = "/health"
  healthcheckTimeout = 100
  restartPolicyType = "ON_FAILURE"
```

### Environment Variables
- `MONGODB_URI` - Same as FastAPI backend
- `JWT_SECRET` - Same as FastAPI backend (for token validation)
- `PORT` - Railway will set this automatically
- `NODE_ENV` - production

## Dependencies
- SYNC-101 (server code)
- SYNC-102 (persistence)

## Parallel Safe With
- All frontend tickets

## Notes
- Part of MVP3 Epic 1: Sync Server Setup
- Consider Railway's WebSocket support limitations
- May need to configure Railway networking for WebSocket

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Multi-Device Sync
- **Estimate**: 2h
