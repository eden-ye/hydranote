# FE-506: Back/Forward Buttons

## Summary
Add browser-style back and forward navigation buttons above the breadcrumb to navigate through page history.

## Desired Behavior

### Visual Layout
```
[←] [→]
Home > Parent > Current
```

### History Tracking
Track navigation events:
- Zoom in (focus mode enter)
- Zoom out (focus mode exit or breadcrumb click)
- Left panel click (jump to different bullet)
- Search result click (jump via search)

### Interactions
- Click [←] → Go to previous location in history
- Click [→] → Go to next location (if went back)
- Buttons disabled when no history in that direction

## Acceptance Criteria
- [ ] Back/forward buttons appear above breadcrumb
- [ ] Track zoom in/out events
- [ ] Track left panel navigation
- [ ] Track search result navigation
- [ ] Back button navigates to previous location
- [ ] Forward button navigates forward after going back
- [ ] Buttons disabled appropriately (no history)
- [ ] History persists during session (not across refresh)

## Technical Notes
- Create navigation history stack in store
- Similar to browser history API pattern
- Maximum history size (e.g., 50 entries)

## Files to Create/Modify
- `frontend/src/components/NavigationButtons.tsx` (new)
- `frontend/src/stores/editor-store.ts` (add navigation history)
- `frontend/src/components/Editor.tsx` (integrate buttons)

## Dependencies
- FE-505 (Breadcrumb Navigation) - share layout area

## Estimate
4 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP2 - Navigation
