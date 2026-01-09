# FE-408: Expand Button Logic

## Description
Implement expand button on bullets that triggers AI expansion. Arrow icon that generates child bullets.

## Acceptance Criteria
- [ ] Expand button visible on hover
- [ ] Click triggers AI expand API
- [ ] Loading state during generation
- [ ] Results inserted as children
- [ ] Context passed to API (siblings, parent)
- [ ] Disable if at rate limit

## Dependencies
- EDITOR-302 (Bullet Block Schema)
- API-203 (WebSocket Streaming)

## Parallel Safe With
- AUTH-*

## Notes
- Core feature for iterative expansion
- Consider keyboard shortcut (Cmd+Right?)
- Stream results into editor

## Status
- **Created**: 2025-01-09
- **Status**: pending
- **Phase**: 4
