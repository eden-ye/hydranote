# EDITOR-3062: Arrow Keys Should Navigate Text Like Normal Editor

## Description

Currently, ArrowLeft and ArrowRight keys are used for:
- **ArrowLeft**: Collapse expanded bullets OR navigate to parent bullet
- **ArrowRight**: Expand collapsed bullets OR navigate to first child bullet

This is incorrect. Arrow keys should behave like a **normal text editor**:
- **ArrowLeft**: Move cursor one character left within text
- **ArrowRight**: Move cursor one character right within text

The expand/fold functionality should be removed from arrow keys entirely. Users can use the bullet toggle (click on bullet) or dedicated shortcuts for expand/collapse.

## Current Behavior (Wrong)

```
ArrowLeft when bullet is expanded with children → collapses bullet
ArrowLeft when bullet has no children → navigates to parent bullet
ArrowRight when bullet is collapsed with children → expands bullet
ArrowRight when bullet is expanded with children → navigates to first child
```

## Expected Behavior (Correct)

```
ArrowLeft → move cursor one character left in text (browser default)
ArrowRight → move cursor one character right in text (browser default)
ArrowLeft at start of line → jump to end of previous visible bullet
ArrowRight at end of line → jump to start of next visible bullet
```

## Acceptance Criteria

- [x] ArrowLeft moves cursor left within text (default browser behavior)
- [x] ArrowRight moves cursor right within text (default browser behavior)
- [x] ArrowLeft/Right do NOT trigger expand/collapse
- [x] ArrowLeft/Right do NOT navigate between bullets
- [x] Remove `ArrowLeft` and `ArrowRight` handlers from keyboard config
- [x] Remove `_handleArrowLeft()` and `_handleArrowRight()` methods
- [x] Remove ArrowLeft/ArrowRight cases from `getNavigationTarget()`
- [x] Update tests to reflect new behavior
- [x] Expand/collapse remains available via bullet click or Cmd+Enter

## Implementation

### Files to Modify

1. **`frontend/src/blocks/components/bullet-block.ts`**
   - Remove `ArrowLeft` and `ArrowRight` from `keyboardConfig`
   - Remove `_handleArrowLeft()` method
   - Remove `_handleArrowRight()` method
   - Remove `ArrowLeft` and `ArrowRight` cases from `getNavigationTarget()`

2. **`frontend/src/blocks/__tests__/bullet-block-component.test.ts`**
   - Remove or update ArrowLeft/ArrowRight navigation tests
   - Add tests confirming arrow keys are NOT handled (return false)

### Code to Remove

```typescript
// Remove from keyboardConfig:
ArrowLeft: () => {
  if (!this._hasTextSelection()) return false
  this._handleArrowLeft()
  return true
},

ArrowRight: () => {
  if (!this._hasTextSelection()) return false
  this._handleArrowRight()
  return true
},

// Remove methods:
private _handleArrowLeft(): void { ... }
private _handleArrowRight(): void { ... }

// Remove from getNavigationTarget switch:
case 'ArrowLeft':
  ...
case 'ArrowRight':
  ...
```

## Dependencies

- None

## Parallel Safe With

- AUTH-*, API-*, FE-* (different directories)
- NOT safe with other EDITOR-* tickets modifying keyboard handling

## Notes

- This simplifies the keyboard handling significantly
- Arrow key behavior was modeled after Workflowy/Roam but user prefers standard text editor behavior
- Expand/collapse can be triggered via:
  - Clicking on the bullet point
  - Cmd+. (expand) / Cmd+, (collapse) shortcuts (see EDITOR-3061)

## Status

- **Created**: 2025-01-10
- **Completed**: 2025-01-10
- **Status**: completed

## Commits

- Replaced ArrowLeft/ArrowRight handlers with boundary-only logic:
  - ArrowLeft: only intercepts at position 0, jumps to end of previous bullet
  - ArrowRight: only intercepts at end of text, jumps to start of next bullet
  - Otherwise lets browser handle normal cursor movement (returns false)
- Added `_handleArrowLeftAtStart()` method - navigates to last visible descendant
- Added `_handleArrowRightAtEnd()` method - navigates to next visible bullet
- Updated `getNavigationTarget()` to only accept 'ArrowUp' | 'ArrowDown'
- Updated KEYBOARD_SHORTCUTS documentation
- Removed old expand/collapse ArrowLeft/ArrowRight tests
