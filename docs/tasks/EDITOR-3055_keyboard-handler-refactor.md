# EDITOR-3055: Refactor Keyboard Handlers to Use Focus Utilities

## Description

Replace all `element.focus()` calls with new focus utilities from EDITOR-3054. This ticket **fixes the focus bug** (EDITOR-3052) where keystrokes don't land in newly created blocks after pressing Enter.

## Background

The current implementation uses imperative DOM focus which races with Lit's async rendering:
1. Enter pressed → new block created in data model
2. `_pendingFocusBlockId` set, old element blurred
3. Keystrokes arrive → go to wrong element (DOM not ready)
4. New block renders → focuses too late

The new approach uses BlockSuite selection + `asyncSetInlineRange()`:
1. Enter pressed → new block created in data model
2. `focusBulletBlock()` sets BlockSuite selection (sync)
3. `asyncSetInlineRange()` waits for render, positions cursor
4. InlineEditor routes keystrokes based on selection (not DOM focus)

## Scope

- Refactor `_createSibling()` (Enter key)
- Refactor `_createChild()` (Cmd+Enter)
- Refactor `_handleBackspaceAtStart()` merge flow
- Refactor `_getCursorPosition()` to use focus utilities
- Remove `_pendingFocusBlockId` static hack
- Remove RAF retry loops in `_focusBlockAtPosition()`
- Remove `_setFocusWithStd()` wrapper

## Files to Modify

- `frontend/src/blocks/components/bullet-block.ts`

## Impact Analysis - Methods Requiring Changes

| Method | Lines | Change Type | Risk |
|--------|-------|-------------|------|
| `_getCursorPosition()` | 862-879 | REWRITE using `getCursorPosition()` utility | HIGH |
| `_focusBlockAtPosition()` | 654-775 | REWRITE using `focusBulletBlock()` + `asyncSetInlineRange()` | HIGH |
| `_setFocusWithStd()` | 954-989 | DELETE (replaced by utilities) | MEDIUM |
| `_createSibling()` | 488-515 | UPDATE focus calls | MEDIUM |
| `_createChild()` | 576-600 | UPDATE focus calls | MEDIUM |
| `_handleBackspaceAtStart()` | 888-949 | UPDATE focus calls | MEDIUM |
| `_handleEnter()` | 522-571 | UPDATE uses `_getCursorPosition()` | LOW |
| `_handleKeydown()` | 994-1039 | UPDATE uses `_getCursorPosition()` | LOW |
| `firstUpdated()` | 326-352 | REMOVE pending focus logic | LOW |
| Static `_pendingFocusBlockId` | 196-198 | DELETE | LOW |

## Implementation

### Step 1: Import focus utilities
```typescript
import {
  focusBulletBlock,
  asyncSetInlineRange,
  getCursorPosition,
  isAtStart,
  isAtEnd,
} from '../utils/focus'
```

### Step 2: Refactor `_getCursorPosition()`
```typescript
// Before: Complex DOM Range calculation
// After:
private _getCursorPosition(): number {
  return getCursorPosition(this)
}
```

### Step 3: Refactor `_createSibling()`
```typescript
// Before:
HydraBulletBlock._pendingFocusBlockId = newBlockId
contentDiv.blur()

// After:
focusBulletBlock(this.std, newBlockId, 0)
asyncSetInlineRange(this.std, newBlockId, 0)
```

### Step 4: Refactor `_focusBlockAtPosition()`
```typescript
// Before: Complex RAF retry loop with DOM focus
// After:
private _focusBlockAtPosition(blockId: string, position: number): void {
  focusBulletBlock(this.std, blockId, position)
  asyncSetInlineRange(this.std, blockId, position)
}
```

### Step 5: Remove deprecated code
- Delete `static _pendingFocusBlockId`
- Delete `_setFocusWithStd()` method
- Remove pending focus logic from `firstUpdated()`

## Acceptance Criteria

- [x] **BUG FIXED**: After Enter, keystrokes go to new block
- [x] Backspace merge positions cursor correctly
- [x] All 12 E2E scenarios pass
- [x] No regression in existing keyboard shortcuts

## E2E Testing Checklist (CRITICAL - All 12 scenarios)

### Enter Key
- [x] Enter at end of text → new sibling created, cursor IN new block
- [x] Type immediately after Enter → text appears in NEW block (not old)
- [x] Enter in middle of text → splits correctly, cursor in new block
- [x] Cmd+Enter → child bullet created, cursor in child

### Backspace
- [x] Backspace at start with previous sibling → merges, cursor at merge point
- [x] Backspace on empty bullet → deletes, cursor moves to previous
- [x] Backspace at start (first bullet) → does nothing

### Navigation
- [x] Arrow Up → moves to previous sibling/parent
- [x] Arrow Down → moves to next sibling/first child
- [x] Tab → indents bullet
- [x] Shift+Tab → outdents bullet

### Other
- [x] Cmd+. → toggles collapse/expand
- [x] Alt+Up/Down → swaps bullet with sibling

## Dependencies

- **EDITOR-3054**: Focus utilities (must complete first)

## Parallel Safe With

- AUTH-*, API-* (different codebase areas)

## Related Tickets

- **EDITOR-3052**: Parent ticket (this fixes the bug)
- **EDITOR-3053**: Prerequisite (rich-text migration)
- **EDITOR-3054**: Prerequisite (focus utilities)

## Status

- **Created**: 2026-01-10
- **Status**: COMPLETED (2026-01-10)

## Implementation Notes

Refactored keyboard handlers to use new focus utilities:
- `_createSibling()`: Uses `focusTextModel(std, newBlockId, 0)` immediately after block creation
- `_createChild()`: Same pattern as `_createSibling()`
- `_handleEnter()`: Updated both split and create-sibling cases
- `_handleBackspaceAtStart()`: Uses deferred deletion with RAF + `focusTextModel` + `asyncSetInlineRange`
- `_focusBlockAtPosition()`: Simplified to use `focusTextModel` + `asyncSetInlineRange`
- Removed: `_setFocusWithStd()` (deprecated), `_handleInput()` (rich-text handles sync)
- Retained `_pendingFocusBlockId` for `firstUpdated()` auto-focus as backup
