# FE-405: AI Generation Store

## Description
Create Zustand store for AI generation state. Track generation requests, loading states, and limits.

## Acceptance Criteria
- [ ] Store in `frontend/src/stores/ai-store.ts`
- [ ] Track current generation request
- [ ] Track loading/streaming state
- [ ] Track generations used/remaining
- [ ] Actions: generate, expand, checkLimit
- [ ] WebSocket connection management

## Dependencies
- FE-401 (Supabase Client Frontend)

## Parallel Safe With
- FE-402, FE-403, AUTH-*, API-*, EDITOR-*

## Notes
- Zustand already installed
- Coordinate with WebSocket streaming
- Update limits after each generation

## Status
- **Created**: 2025-01-09
- **Status**: pending
- **Phase**: 4
