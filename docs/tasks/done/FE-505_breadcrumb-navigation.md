# FE-505: Breadcrumb Navigation

## Summary
Add breadcrumb navigation at the top of the note showing the current zoom path. Each level is clickable to navigate (zoom out) to that level.

## Desired Behavior

### Visual Layout
```
Home > Parent Bullet > Current Bullet
```

### Interactions
- Click "Home" → Exit focus mode, show full document
- Click any ancestor → Zoom out to that bullet
- Current bullet (rightmost) is not clickable (already there)

### States
- **Normal view**: Shows "Home" only (or hidden)
- **Focus mode**: Shows full path from root to focused bullet

## Acceptance Criteria
- [x] Breadcrumb appears at top of editor area
- [x] Shows current zoom path (root → focused bullet)
- [x] Each level is clickable except current
- [x] Clicking ancestor zooms out to that level
- [x] Updates dynamically when focus changes
- [x] Styled consistently with app theme
- [x] Handles long paths gracefully (truncation or scroll)

## Technical Notes
- Integrate with existing focus mode (EDITOR-3508)
- Use `enterFocusMode(blockId)` for navigation
- Get path from BlockSuite document structure

## Files to Create/Modify
- `frontend/src/components/Breadcrumb.tsx` (new)
- `frontend/src/components/Editor.tsx` (integrate breadcrumb)
- `frontend/src/stores/editor-store.ts` (may need zoom path state)

## Estimate
6 hours

## Status
- **Created**: 2026-01-13
- **Completed**: 2026-01-13
- **Status**: completed
- **Epic**: MVP2 - Navigation

## Implementation Summary

### What Was Done
The Breadcrumb component was already implemented (FE-407) and integrated into the Editor. This ticket adds comprehensive unit tests (26 tests) covering:
- Rendering (navigation, items, home button, separators)
- Text truncation (30 char max with ellipsis)
- Navigation (ancestor clicks, current item not clickable)
- Keyboard navigation (Enter/Space on clickable items)
- Accessibility (aria-labels, aria-current, roles, tabIndex)
- Styling (clickable class on ancestors only)

### Files Changed
- `frontend/src/__tests__/components/Breadcrumb.test.tsx` (new - 26 tests)

### E2E Testing Results
Chrome E2E testing confirmed:
1. Breadcrumb appears in focus mode with path display (e.g., `🏠 Parent Level / Child Level 1`)
2. Clicking ancestor in breadcrumb zooms out to that level
3. Home button exits focus mode completely
4. Breadcrumb hidden when not in focus mode
