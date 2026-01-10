# EDITOR-306: Keyboard Shortcuts

## Description
Implement keyboard shortcuts for common editor operations. Focus on navigation and structure manipulation.

## Acceptance Criteria
- [ ] Tab/Shift+Tab for indent/outdent (logic ready, needs BlockSuite integration)
- [ ] Enter to create new sibling bullet (needs BlockSuite integration)
- [ ] Cmd+Enter to create child bullet (needs BlockSuite integration)
- [x] Arrow keys for navigation (logic layer complete)
- [ ] Cmd+. to toggle fold (needs BlockSuite integration)
- [ ] Shortcuts documented in help

## Dependencies
- EDITOR-301 (BlockSuite Integration)

## Parallel Safe With
- EDITOR-302, EDITOR-303, EDITOR-304, EDITOR-305, EDITOR-307, AUTH-*, API-*, FE-*

## Notes
- Essential for power users
- Follow common outliner conventions
- Consider vim-like bindings for future

## Technical Requirements
- **IMPORTANT**: Must use BlockSuite's keyboard registration system, NOT native DOM event listeners
- Native `this.addEventListener('keydown', ...)` on custom elements doesn't work because BlockSuite captures focus at `AFFINE-PAGE-ROOT` level
- See BUG-EDITOR-303 for details on the failed approach in EDITOR-303

## Bug Fixes Included
- **BUG-EDITOR-303**: Cmd+. fold shortcut not working (deferred from EDITOR-303)

## Implementation Details

### Phase 1: Pure Logic Layer (COMPLETED)
Implemented testable business logic functions:
- `computeIndentLevel(depth)`: Calculate block indentation level
- `canIndent(hasPreviousSibling, depth)`: Validate if block can be indented
- `canOutdent(depth)`: Validate if block can be outdented
- `getNavigationTarget(direction, context)`: Determine target for arrow key navigation
  - ArrowUp: Previous sibling or parent
  - ArrowDown: First child (if expanded) or next sibling
  - ArrowLeft: Collapse (if expanded) or parent
  - ArrowRight: Expand (if collapsed) or first child

### Phase 2: BlockSuite Integration (TODO)
Needs hotkey registration using BlockSuite's keyboard system:
- Tab/Shift+Tab handlers
- Enter/Cmd+Enter handlers
- Cmd+. handler (may reuse BUG-EDITOR-303 fix)

### Files Changed
- `frontend/src/blocks/components/bullet-block.ts` (+89 lines)
- `frontend/src/blocks/__tests__/bullet-block-component.test.ts` (+222 lines)

### Tests
56 tests passing (all green)

## Commits
- 5a2abfe feat(editor): EDITOR-306 - Keyboard shortcuts business logic

## Status
- **Created**: 2025-01-09
- **Completed**: 2026-01-10 (Phase 1: Logic layer)
- **Status**: in_progress (Phase 2: BlockSuite integration pending)
