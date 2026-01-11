# EDITOR-3052: Fix Editor Keyboard Behaviors

## Status: COMPLETED (2026-01-10)

---

## Final Resolution: rich-text Migration (2026-01-10)

### Solution Implemented
Migrated from custom `contenteditable` to BlockSuite's `<rich-text>` component.

**Key Changes:**
1. **EDITOR-3053**: Replaced `.bullet-content` contenteditable with `<rich-text>` component
   - Uses `this.model.text.yText` for Yjs binding
   - InlineEditor routes input based on selection, not DOM focus

2. **EDITOR-3054**: Integrated focus utilities from Affine
   - `focusTextModel(std, blockId, offset)` - Sets BlockSuite selection immediately
   - `asyncSetInlineRange(host, model, { index, length })` - Positions cursor after render

3. **EDITOR-3055**: Refactored keyboard handlers
   - `_createSibling()`, `_createChild()`, `_handleEnter()` now use `focusTextModel`
   - `_handleBackspaceAtStart()` uses new focus pattern with deferred deletion
   - Removed deprecated `_setFocusWithStd()` and `_handleInput()` methods
   - Simplified `_focusBlockAtPosition()` to use new utilities

4. **Bug Fix: Duplicate Keyboard Handlers** (2026-01-10)
   - Found and fixed duplicate Enter/Tab handlers causing extra bullets
   - `_handleKeydown()` had handlers for Enter, Tab, Shift+Tab, Cmd+.
   - These duplicated handlers already in `_bindKeyboardShortcuts()` via BlockSuite's `bindHotKey`
   - Fix: Removed duplicate handlers from `_handleKeydown()`, keeping only Backspace

5. **Bug Fix: Fake Cursor After Backspace Merge** (2026-01-10)
   - After Backspace merge, cursor appeared at merge point but Enter created wrong split
   - Root cause: `_getCursorPosition()` only read from InlineEditor, which hadn't synced yet
   - Fix: Added fallback to check BlockSuite TextSelection when InlineEditor range unavailable
   - Now Enter after Backspace merge correctly splits at merge point

6. **Bug Fix: Enter Key Creates Bullet in Wrong Position** (2026-01-10)
   - **Symptom**: Enter at end of "First bullet" (with "Second bullet" below) created new bullet below Second instead of between them
   - **Root cause**: `bindHotKey` with `{ flavour: true }` registers handlers for ALL bullet blocks, but BlockSuite's event dispatcher didn't correctly filter to just the focused block
   - **Investigation**: Console logs showed Enter handler was executing on a nested/hidden child block (index 2 or 3) instead of the clicked block
   - **Fix**: Added `_hasTextSelection()` guard method that checks `std.selection.find('text')` and verifies `text.from.blockId === this.model.id` before processing keyboard events
   - **Pattern**: This matches Affine's "Layer 2" protection where each handler explicitly checks for selection before acting
   - All keyboard handlers (Enter, Tab, Shift+Tab, Mod+Enter, Mod+., Arrow keys) now have this guard

### Why This Fixed the Bug
The root cause was that Hydra used imperative DOM focus (`element.focus()`) which raced against Lit's async rendering. Keystrokes were processed before the new block's DOM was ready.

Affine's solution (now implemented in Hydra):
- InlineEditor routes keystrokes based on **BlockSuite selection**, not DOM focus
- Selection is set synchronously via `focusTextModel()` immediately after block creation
- Cursor positioning happens after render via `asyncSetInlineRange()`
- This eliminates the race condition because input routing doesn't depend on DOM focus

### Files Changed
- `frontend/src/blocks/components/bullet-block.ts`

### Tests
- ✅ 72 unit tests pass
- ✅ Build succeeds
- ✅ Chrome E2E tests pass (all scenarios verified)

---

## Session Summary: 2026-01-10 (50 minutes)

### What's Working (No Regression)
- Enter key creates a new sibling bullet ✓
- The new bullet IS created in the correct position ✓
- Backspace merge with previous sibling works ✓
- Tab/Shift+Tab indent/outdent works ✓
- Arrow key navigation works ✓
- Cmd+Enter creates child bullet ✓
- `shouldUpdate()` guard prevents crash when model is null ✓

### What's NOT Working (Core Issue Remains)
**Bug 2: Cursor/focus doesn't land on new bullet after Enter**
- When you type "First", press Enter, then type "Second":
  - New bullet IS created (visible in DOM)
  - But keystrokes ("Second") either go to the OLD bullet or get lost
  - The auto-focus runs AFTER keystrokes are processed

### Root Cause (Confirmed)
The issue is a **fundamental timing problem** with async DOM rendering:
```
1. Enter keydown fires
2. _createSibling() calls doc.addBlock() - block created in data model
3. _createSibling() sets _pendingFocusBlockId and returns
4. Event handler returns
5. Browser processes NEXT keystrokes (letters of "Second")
   → These go to OLD element (still has DOM focus)
6. [Later] Lit schedules update, renders new block
7. [Later] New block's firstUpdated() runs, auto-focuses
   → TOO LATE - keystrokes already processed
```

### Approaches Tried (All Failed)
| Approach | Why It Failed |
|----------|---------------|
| `requestAnimationFrame` with retries | Keystrokes arrive before RAF callback |
| `queueMicrotask` | Still too slow, keystrokes win race |
| Async focus with `updateComplete` | Awaiting is async, keystrokes processed during await |
| Auto-focus in `firstUpdated()` | DOM renders after keystrokes consumed |
| Blur old element + auto-focus new | Blur works but keystrokes still processed before new block renders |

### Code Changes Made Today
1. Added `static _pendingFocusBlockId` for tracking which block should auto-focus
2. Added auto-focus logic in `firstUpdated()`
3. Added `blur()` call after creating new block to prevent keystrokes going to old block
4. Removed unused `_focusBlockAsync()` method

### What Needs to Be Done
The solution likely requires one of:
1. **Intercept keystrokes**: Queue them until focus is confirmed, then replay
2. **Synchronous DOM creation**: Force Lit to render synchronously before returning
3. **BlockSuite-level fix**: Use BlockSuite's internal selection/focus APIs which may handle this

### No Regression Confirmed
- The bugs are the same as before today's session
- Enter still creates bullets, focus just doesn't land correctly
- This was broken BEFORE today's work began

---

## Chrome Investigation Results (Commit 0aae875)

### Confirmed Bugs

**Bug 1: Backspace on Empty Bullet Does Nothing**
- **Steps to reproduce**: Create parent bullet → Cmd+Enter to add child → Click on empty "Type here..." child → Press Backspace
- **Expected**: Empty bullet should be deleted, cursor moves to parent
- **Actual**: Nothing happens, bullet remains
- **Console**: 4+ `TypeError: Cannot read properties of null (reading 'id')` thrown
- **Root cause**: `_handleBackspaceAtStart()` returns early if no `previousSiblingId`, and when it does try to delete, the render cycle crashes

**Bug 2: Cursor Disappears After Enter/Backspace Operations**
- **Steps to reproduce**: Click on bullet → Press Enter → Type text
- **Expected**: New bullet created AND cursor lands in new bullet, typed text appears
- **Actual**: New bullet IS created (visible in DOM), but cursor does NOT land there. Typed text is lost.
- **Root cause**: `_focusBlock()` uses BlockSuite selection API but doesn't properly position cursor in contenteditable
- **Code location**: `bullet-block.ts:469` and `bullet-block.ts:736-763`

**Bug 3: Backspace Merge Behavior (Partial)**
- **When sibling exists**: Merge WORKS correctly (tested: "Second" merged into empty sibling above)
- **When NO sibling exists (first child)**: Backspace does nothing (returns early at line 710)
- **User's reported issue**: "merges with parent instead of sibling" - Could not reproduce this exact scenario. Current code only merges with `previousSiblingId` which is correctly a sibling, not parent.

### Core Root Cause (All Bugs)

The fundamental issue is in `render()` lifecycle after `deleteBlock()`:

```
1. User presses Backspace/Enter
2. Handler calls this.doc.deleteBlock(this.model)
3. this.model becomes null
4. Lit's reactive system triggers render()
5. Parent class render() accesses this.model.id
6. TypeError: Cannot read properties of null (reading 'id')
7. Error crashes the operation, leaving UI in broken state
```

**Stack trace pattern** (62+ occurrences):
```
TypeError: Cannot read properties of null (reading 'id')
    at _a.render (chunk-QALI4WTV.js:362:42)
    at _a.update (chunk-SSNIW243.js:46:24)
    at _a.performUpdate (chunk-XQCYXLS3.js:737:14)
```

### Fix Strategy Required

1. **Prevent render after model deletion**: Override `shouldUpdate()` or `update()` to check `this.model` before calling super
2. **Fix cursor positioning**: The `_focusBlock()` method needs to actually move DOM focus, not just set BlockSuite selection
3. **Handle empty bullet backspace**: When no previous sibling, should either outdent or merge with parent depending on hierarchy

---

## Bug Report: Commit 7c1a6a3 Broke Enter/Backspace

### Symptoms
- Enter and Backspace operations cause JavaScript exceptions
- App becomes unresponsive after keyboard operations
- Console shows: `TypeError: Cannot read properties of null (reading 'id')`

### Root Cause
In commit `7c1a6a3`, I modified `_handleBackspace` Case 1b to call `this.doc.deleteBlock(this.model)` followed by `_focusBlockAtPosition()`. However:

1. After `deleteBlock()`, the Lit component is still in the render cycle
2. `this.model` becomes null after the block is deleted
3. Subsequent render attempts fail with "Cannot read properties of null (reading 'id')"

### Bad Code Pattern (7c1a6a3)
```typescript
// Case 1b: First child - BROKEN: deletes then tries to focus
if (parent && parent.parent && ctx.parentId) {
  this.doc.deleteBlock(this.model)  // <-- this.model becomes null
  this._focusBlockAtPosition(ctx.parentId, parentTextLength) // <-- still tries to render
  return
}
```

### Fix Required
Need to ensure component doesn't try to render after its model is deleted. Options:
1. Schedule focus in next frame BEFORE delete
2. Use a flag to skip render when model is null
3. Let BlockSuite handle the deletion lifecycle properly

### Action: Revert to ead8618
```bash
git reset --hard ead8618
```

---

## Summary

Implement missing "common sense" keyboard behaviors for the Hydra Notes hierarchical bullet editor to match RemNote standards.

## Problem

The current editor is missing key behaviors that users expect from hierarchical bullet editors like RemNote, Obsidian, and WorkFlowy:

1. **Backspace at start of bullet** - Should merge with previous bullet
2. **Enter in middle of text** - Should split the bullet
3. **Delete at end of bullet** - Should merge with next bullet
4. **Alt+Up/Down** - Should move bullets up/down

## Behavior Rules (Verified via RemNote Chrome Testing)

### Backspace at Start of Bullet
| Condition | Behavior |
|-----------|----------|
| Any bullet with previous sibling | MERGE: Append current text to previous bullet's end, delete current |
| First bullet (no previous) | Do nothing |
| Empty bullet (any level) | Delete bullet, move cursor to previous bullet's end |

### Enter Key Behaviors
| Condition | Behavior |
|-----------|----------|
| Cursor at end of text | Create new sibling below (already implemented) |
| Cursor in middle of text | SPLIT: text after cursor becomes new sibling |
| Empty bullet | Outdent; if top-level, delete it |

### Delete Key Behaviors
| Condition | Behavior |
|-----------|----------|
| Cursor at end of text | Merge next sibling's text into current |
| No next sibling | Do nothing |

### Move Siblings
| Shortcut | Behavior |
|----------|----------|
| Alt+Up | Swap bullet with previous sibling |
| Alt+Down | Swap bullet with next sibling |

## Files Changed

- `frontend/src/blocks/components/bullet-block.ts`
  - Added cursor position helper functions (getCursorPosition, setCursorPosition, isCursorAtStart, isCursorAtEnd)
  - Added `_handleBackspace()` method for merge behavior
  - Added `_handleDelete()` method for merge with next
  - Added `_handleEnter()` method for text splitting
  - Added `_moveSiblingUp()` and `_moveSiblingDown()` methods
  - Fixed DOM sync issue when element is focused (added explicit textContent updates)

## Testing

- [x] Unit tests pass (72 tests)
- [x] Build succeeds
- [x] Chrome E2E tests pass (see e2e/expectations/EDITOR-3052-keyboard-behaviors.md)

## E2E Test Results

| Test | Status |
|------|--------|
| Backspace merges with previous | PASS |
| Backspace deletes empty bullet | PASS |
| Backspace on first bullet does nothing | PASS |
| Enter in middle splits bullet | PASS |
| Delete at end merges with next | PASS |
| Alt+Up swaps with previous | PASS |
| Alt+Down swaps with next | PASS |
| Tab indents (via EDITOR-306) | PASS |
| Shift+Tab outdents (via EDITOR-306) | PASS |

## Commits

- `43306d4` feat(editor): EDITOR-3052 - Add keyboard behaviors for bullet editing

## Related

- EDITOR-306: Keyboard Shortcuts (Tab, Shift+Tab, Cmd+., arrows)
- EDITOR-3051: Persistence fix

---

## Resolution Plan (2026-01-10)

The focus bug root cause has been identified: Hydra uses custom `contenteditable` which receives keystrokes based on DOM focus, but Lit renders asynchronously. Affine solves this with `<rich-text>` component which routes input based on BlockSuite selection.

### Solution Tickets

| Ticket | Summary | Status |
|--------|---------|--------|
| **EDITOR-3053** | Replace contenteditable with rich-text | pending |
| **EDITOR-3054** | Implement focus utilities (Affine pattern) | pending |
| **EDITOR-3055** | Refactor keyboard handlers → **FIXES BUG** | pending |
| **EDITOR-3056** | Add inline formatting (Cmd+B/I/U) | pending |
| **EDITOR-3053u** | Fallback: Keystroke queue | pending (if 3053 fails) |

### Execution Order

```
EDITOR-3053 (rich-text migration)
    │
    ├──→ EDITOR-3054 (focus utilities)
    │        │
    │        └──→ EDITOR-3055 (fix focus bug) ★
    │
    └──→ EDITOR-3056 (inline formatting)

UNHAPPY PATH (if 3053 fails):
    EDITOR-3053u (keystroke queue)
```

See detailed plan: `/Users/taylorye/.claude/plans/reactive-launching-porcupine.md`
