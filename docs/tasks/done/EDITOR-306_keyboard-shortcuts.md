# EDITOR-306: Keyboard Shortcuts

## Description
Implement keyboard shortcuts for common editor operations. Focus on navigation and structure manipulation.

## Acceptance Criteria
- [x] Tab/Shift+Tab for indent/outdent
- [x] Enter to create new sibling bullet
- [x] Cmd+Enter to create child bullet
- [x] Arrow keys for navigation
- [x] Cmd+. to toggle fold
- [x] Shortcuts documented (KEYBOARD_SHORTCUTS export)

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

### Phase 2: BlockSuite Integration (COMPLETED)
Implemented using BlockSuite's bindHotKey system:
- Tab/Shift+Tab handlers with `_indent()` / `_outdent()`
- Enter/Cmd+Enter handlers with `_createSibling()` / `_createChild()`
- Cmd+. handler with `_toggleExpand()`
- Arrow key handlers with `_navigate()` and expand/collapse logic
- All shortcuts properly scoped to hydra:bullet blocks with `{ flavour: true }`

### Files Changed
- `frontend/src/blocks/components/bullet-block.ts`:
  - Added pure logic functions (+89 lines)
  - Added `_bindKeyboardShortcuts()` method with full BlockSuite hotkey registration
  - Added `KEYBOARD_SHORTCUTS` documentation export
- `frontend/src/blocks/__tests__/bullet-block-component.test.ts` (+222 lines)

### Tests
56 tests passing (all green)

### Keyboard Shortcuts Implemented
All shortcuts use BlockSuite's `bindHotKey` system:
- **Mod+. (Cmd/Ctrl+.)**: Toggle fold/expand
- **Tab**: Indent block (make child of previous sibling)
- **Shift+Tab**: Outdent block (make sibling of parent)
- **Enter**: Create new sibling bullet
- **Mod+Enter (Cmd/Ctrl+Enter)**: Create new child bullet
- **ArrowUp**: Navigate to previous sibling or parent
- **ArrowDown**: Navigate to first child (if expanded) or next sibling
- **ArrowLeft**: Collapse if expanded, else navigate to parent
- **ArrowRight**: Expand if collapsed, else navigate to first child

## Commits
- 700c762 feat(editor): EDITOR-306 - Keyboard shortcuts business logic
- 9243c60 docs: update EDITOR-306 with Phase 1 completion status
- 5d743c3 docs(editor): mark EDITOR-306 as done with full implementation details
- 1eb93f8 docs: move EDITOR-306 to done, update current.md

## Status
- **Created**: 2026-01-09
- **Completed**: 2026-01-10
- **Status**: ✅ done
