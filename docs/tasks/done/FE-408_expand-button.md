# FE-408: Expand Button Logic

## Description
Implement expand button on bullets that triggers AI expansion. Arrow icon that generates child bullets.

## Acceptance Criteria
- [x] useExpandBlock hook for AI expansion
- [x] WebSocket connection to AI streaming endpoint
- [x] Context passed to API (blockText, siblingTexts, parentText)
- [x] Streaming response handling (chunk, done, error, pong)
- [x] Rate limit check via canExpand (from AI store)
- [x] Cancel expansion functionality
- [x] Error handling for WebSocket failures

## Implementation
- Hook in `frontend/src/hooks/useExpandBlock.ts`
- Uses AI store for state management
- Builds prompt with context from siblings/parent
- Returns: isExpanding, streamedText, error, canExpand, expandBlock, cancelExpansion

## Dependencies
- EDITOR-302 (Bullet Block Schema) ✅
- API-203 (WebSocket Streaming) ✅
- FE-405 (AI Store) ✅

## Parallel Safe With
- AUTH-*

## Notes
- Core feature for iterative expansion
- WebSocket URL derived from VITE_API_URL
- Prompt includes parent and sibling context

## Testing
- **Unit Tests**: 14 tests in `src/hooks/__tests__/useExpandBlock.test.ts` ✅
- **Commit**: `b4fb991` feat(fe): FE-408 - Add useExpandBlock hook for AI-powered expansion (#25)

## Status
- **Created**: 2025-01-09
- **Code Complete**: 2026-01-10
- **Integration Complete**: 2026-01-11
- **Status**: done
- **Phase**: 4

## Integration Completed

Hook integrated into Editor.tsx and expand button added to bullet blocks.

**Completed integration tasks:**
- [x] Import `useExpandBlock` in Editor.tsx
- [x] Add expand button UI to bullet blocks (shows on hover)
- [x] Wire button click to `expandBlock` action via custom event
- [x] Add `selectAccessToken` selector to auth store
- [ ] Display `streamedText` during expansion (future iteration)
- [ ] Show loading state while `isExpanding` (future iteration)
- [ ] Handle expansion errors in UI (future iteration)

**Integration Commit**: `cdf1b0c` feat(fe): FE-406-409 - Integrate focus mode, breadcrumb, expand button, ghost questions (#42)
