# EDITOR-3052: Fix Editor Keyboard Behaviors

## Status: Complete

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
