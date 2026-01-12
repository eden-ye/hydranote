# EDITOR-3504: Portal Subtree Rendering

## Description
Extend portal blocks to render the full subtree (children) of the source block when expanded, like RemNote.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [x] When portal is expanded, show source bullet AND all its children
- [x] Recursive rendering: children of children are also shown
- [x] Indentation matches source hierarchy
- [x] Expand/collapse state per-level (not just portal root)
- [x] Loading state while fetching children
- [x] Handle deeply nested structures gracefully (limit depth?)

## Technical Details

### Current vs New Behavior
```
CURRENT (text only):              NEW (subtree):
┌────────────────────────────┐   ┌────────────────────────────┐
│ 🔗 Tesla                   │   │ 🔗 Tesla                   │
│    (shows text only)       │   │ └── What it is             │
│                            │   │     └── Electric car co    │
└────────────────────────────┘   │ └── Founded                │
                                 │     └── 2003               │
                                 └────────────────────────────┘
```

### Implementation Summary

Created new utility file `frontend/src/blocks/utils/portal-subtree.ts` with:

1. **SubtreeNode interface** - Represents a node in the portal subtree with:
   - id, text, children, depth, isExpanded, flavour

2. **fetchSubtreeFromDoc()** - Fetches subtree from BlockSuite document with:
   - maxDepth limit (default 10) for performance
   - includeCollapsed option for fetching collapsed children

3. **Helper functions**:
   - `getIndentationPx()` - Calculate indentation based on depth
   - `flattenSubtree()` - Flatten tree for rendering
   - `hasVisibleChildren()` - Check if node has visible children
   - `getSubtreeNodeIcon()` - Get collapse/expand icon
   - `getSubtreeNodeClasses()` - Get CSS classes for styling
   - `countVisibleNodes()` - Count visible descendants
   - `findNodeById()` - Find node in tree

Updated `portal-block.ts` to:
- Track subtree state (`_subtreeResult`, `_subtreeLoading`, `_collapsedSubtreeNodes`)
- Render subtree with proper indentation via `_renderSubtree()`
- Support per-level collapse/expand independent of source
- Show loading indicator while fetching children
- Show depth limit warning if exceeded

### Sync Considerations
- Children are fetched from source document's Yjs doc
- Live sync: if source children change, portal reflects it
- Orphan detection: if any child is deleted, show indicator

### Performance
- Lazy load children on expand (don't fetch until needed)
- Depth limit of 10 levels for performance
- Local collapse state to avoid re-fetching

## Dependencies
- Existing portal infrastructure (EDITOR-3401-3404)

## Parallel Safe With
- AUTH-*, API-*, FE-*

## Notes
Part of Epic 5: Semantic Linking. Essential for knowledge exploration.

**Design Doc**: See `docs/design/semantic-search.md` for full architecture.

## Status
- **Created**: 2026-01-12
- **Completed**: 2026-01-12
- **Status**: completed
- **Epic**: MVP2 - Semantic Linking

## Implementation

### Files Changed
- `frontend/src/blocks/utils/portal-subtree.ts` (NEW) - Subtree utility functions
- `frontend/src/blocks/__tests__/portal-subtree.test.ts` (NEW) - 48 unit tests
- `frontend/src/blocks/components/portal-block.ts` - Added subtree rendering

### Test Results
- 48 new tests for portal subtree utilities
- All 1128 frontend tests pass
- Build succeeds

### E2E Testing
- Unit tests cover all subtree logic
- Chrome MCP not available for manual E2E testing
- Feature requires manual verification in browser
