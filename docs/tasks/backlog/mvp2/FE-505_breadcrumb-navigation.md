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
- [ ] Breadcrumb appears at top of editor area
- [ ] Shows current zoom path (root → focused bullet)
- [ ] Each level is clickable except current
- [ ] Clicking ancestor zooms out to that level
- [ ] Updates dynamically when focus changes
- [ ] Styled consistently with app theme
- [ ] Handles long paths gracefully (truncation or scroll)

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
- **Status**: pending
- **Epic**: MVP2 - Navigation
