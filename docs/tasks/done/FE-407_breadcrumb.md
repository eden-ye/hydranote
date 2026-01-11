# FE-407: Breadcrumb Component

## Description
Create breadcrumb navigation for focus mode. Shows path to currently focused bullet.

## Acceptance Criteria
- [x] Breadcrumb component shows ancestor path
- [x] Clickable breadcrumb items to navigate up
- [x] Home button to exit focus mode entirely
- [x] Shows bullet text (truncated at 30 chars)
- [x] Keyboard accessible (Enter/Space to navigate)
- [x] ARIA labels for accessibility

## Implementation
- Component in `frontend/src/components/Breadcrumb.tsx`
- Styles in `frontend/src/components/Breadcrumb.css`
- Props: items, onNavigate, onExitFocusMode

## Dependencies
- FE-406 (Focus Mode Navigation) ✅

## Parallel Safe With
- AUTH-*, API-*

## Notes
- Essential for orientation in focus mode
- Text truncated to 30 characters with ellipsis
- SVG home icon for exit button

## Testing
- **Unit Tests**: 15 tests in `src/components/__tests__/Breadcrumb.test.tsx` ✅
- **Commit**: `1b97c07` feat(fe): FE-407 - Add Breadcrumb component for focus mode navigation (#24)

## Status
- **Created**: 2025-01-09
- **Code Complete**: 2026-01-10
- **Integration Complete**: 2026-01-11
- **Status**: done
- **Phase**: 5

## Integration Completed

Component integrated into Editor.tsx.

**Completed integration tasks:**
- [x] Import `Breadcrumb` in Editor.tsx
- [x] Connect to `useFocusMode` hook for focus state
- [x] Build ancestor path from block tree
- [x] Wire `onNavigate` to change focus target
- [x] Wire `onExitFocusMode` to exit focus mode

**Integration Commit**: `cdf1b0c` feat(fe): FE-406-409 - Integrate focus mode, breadcrumb, expand button, ghost questions (#42)
