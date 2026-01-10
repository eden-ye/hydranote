# EDITOR-306: Keyboard Shortcuts

## Description
Implement keyboard shortcuts for common editor operations. Focus on navigation and structure manipulation.

## Acceptance Criteria
- [ ] Tab/Shift+Tab for indent/outdent
- [ ] Enter to create new sibling bullet
- [ ] Cmd+Enter to create child bullet
- [ ] Arrow keys for navigation
- [ ] Cmd+. to toggle fold
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

## Status
- **Created**: 2025-01-09
- **Status**: pending
