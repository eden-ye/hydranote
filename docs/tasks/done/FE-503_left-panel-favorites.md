# FE-503: Left Panel with Favorites

## Description

Create a collapsible left panel sidebar following AFFiNE's patterns. In Hydra Notes, each block is like a document - users can zoom into any block via focus mode. The left panel provides:

- User info (avatar/login) and Settings button
- Favorites section: starred blocks for quick navigation
- Clicking a favorite → enters focus mode on that block
- All Bullets section: top-level blocks (roots)
- Drag-to-reorder favorites

## Acceptance Criteria

- [x] Sidebar renders on left side (240px width)
- [x] Toggle button collapses/expands sidebar
- [x] User info shows avatar when logged in, login button when not
- [x] Settings button opens settings modal
- [x] Favorites section with star icon
- [x] "No favorites" placeholder when empty
- [x] Star button on block nodes toggles favorite
- [x] Click block → enters focus mode on that block
- [x] Active block highlighted in sidebar
- [x] Favorites persist in localStorage
- [x] Drag-to-reorder favorites works (grip handle, visual drop indicator)
- [x] Reordered favorites persist after reload
- [x] All top-level blocks listed in "All Bullets" section
- [x] Dark theme matching AFFiNE aesthetic
- [x] No console errors

## Implementation Phases

### Phase 1: Layout Infrastructure (~2h)
- Update App.tsx layout to flex-row with sidebar
- Create LeftPanel/index.tsx shell component
- Add toggle button to collapse/expand sidebar
- CSS for sidebar width (240px), transition animations

### Phase 2: User Info & Settings (~1.5h)
- Create UserInfo.tsx - avatar for logged in, login button if not
- Move settings button from Header to sidebar
- Account dropdown menu (settings, sign out)

### Phase 3: Favorites State with Ordering (~2.5h)
- Add favoriteBlockIds: string[] to editor-store.ts
- Add toggleFavorite(), isFavorite(), reorderFavorite() actions
- Persist to localStorage: hydra:favorites

### Phase 4: Favorites Section with Drag-to-Reorder (~4h)
- Create FavoritesSection.tsx with collapsible header
- Create BlockNode.tsx with star toggle and grip handle
- Implement HTML5 drag-and-drop for reordering
- Visual feedback: drop indicator line, opacity on drag

### Phase 5: All Bullets Section (~2.5h)
- Create AllBulletsSection.tsx
- List top-level blocks from BlockSuite doc
- Click → enterFocusMode(blockId)

### Phase 6: Polish & Integration (~2.5h)
- Dark theme styling to match AFFiNE
- Keyboard shortcut: Cmd+\ to toggle sidebar
- Active state: highlight focused block in sidebar

## Files to Modify

| File | Changes |
|------|---------|
| frontend/src/App.tsx | Add flex-row layout with sidebar |
| frontend/src/App.css | Sidebar width, transitions |
| frontend/src/components/Header.tsx | Remove settings/user (move to sidebar) |
| frontend/src/stores/editor-store.ts | Add favoriteBlockIds, toggleFavorite(), reorderFavorite() |

## New Files to Create

| File | Purpose |
|------|---------|
| frontend/src/components/LeftPanel/index.tsx | Main sidebar container |
| frontend/src/components/LeftPanel/UserInfo.tsx | Avatar/login button |
| frontend/src/components/LeftPanel/CollapsibleSection.tsx | Reusable section with expand/collapse |
| frontend/src/components/LeftPanel/FavoritesSection.tsx | List of favorited blocks |
| frontend/src/components/LeftPanel/AllBulletsSection.tsx | Top-level blocks list |
| frontend/src/components/LeftPanel/BlockNode.tsx | Single block row (icon, title, star) |
| frontend/src/components/LeftPanel/styles.css | Sidebar styles |

## Dependencies

- EDITOR-3508 (Focus Mode Zoom) - for enterFocusMode() integration
- Existing editor-store.ts
- Existing auth-store.ts

## Parallel Safe With

- AUTH-*, API-* (backend tickets)
- EDITOR-* (different frontend area)

## Reference Implementation

AFFiNE source at /Users/taylorye/Workspace/hydra/affine:
- Main Sidebar: packages/frontend/core/src/components/root-app-sidebar/index.tsx
- Favorites Section: packages/frontend/core/src/desktop/components/navigation-panel/sections/favorites/
- Collapsible Section: packages/frontend/core/src/desktop/components/navigation-panel/layouts/collapsible-section.tsx
- Doc Node: packages/frontend/core/src/desktop/components/navigation-panel/nodes/doc/
- User Info: packages/frontend/core/src/components/root-app-sidebar/user-info/

## Estimate

**15 hours total**

## Status

- **Created**: 2026-01-13
- **Completed**: 2026-01-13
- **Status**: completed
- **Epic**: MVP2 - Left Panel Navigation

## Implementation Summary

### Commits
- Added favorites state management to editor-store.ts with localStorage persistence
- Created LeftPanel component structure:
  - `LeftPanel/index.tsx` - Main sidebar container with toggle, settings modal, and Cmd+\ shortcut
  - `LeftPanel/UserInfo.tsx` - Avatar display / login button
  - `LeftPanel/CollapsibleSection.tsx` - Reusable collapsible section with count badge
  - `LeftPanel/FavoritesSection.tsx` - Favorites list with drag-to-reorder
  - `LeftPanel/AllBulletsSection.tsx` - Top-level blocks list
  - `LeftPanel/BlockNode.tsx` - Single block row with star toggle and drag handle
- Updated App.tsx layout to include sidebar
- Updated App.css with flex layout for sidebar

### Test Coverage
- 78 new unit tests for LeftPanel components
- 15 new tests for favorites state in editor-store
- All 1387 tests pass
- Build and lint pass

### Files Changed
- `frontend/src/stores/editor-store.ts` - Added favorites state and actions
- `frontend/src/App.tsx` - Added LeftPanel to layout
- `frontend/src/App.css` - Added app-body flex container
- New: `frontend/src/components/LeftPanel/*` - All sidebar components
- New: `frontend/src/components/LeftPanel/__tests__/*` - Component tests
- New: `frontend/src/stores/__tests__/editor-store-favorites.test.ts` - Store tests
