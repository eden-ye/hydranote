# EDITOR-3059: Fix Backspace with Selection Deleting Bullet

## Status: COMPLETED (2026-01-10)

---

## Summary

When text is selected and backspace is pressed, the bullet itself gets deleted instead of just the selected text.

## Bug Description

### Steps to Reproduce
1. Create a bullet with text: "Child b"
2. Select all or part of the text
3. Press Backspace

### Expected Behavior
Only the selected text is deleted. The bullet remains with any unselected text.

### Actual Behavior
The entire bullet gets deleted, merging with the previous sibling or parent.

## Root Cause

In `_handleKeydown()` (bullet-block.ts:943-956), the backspace handler only checks cursor position:

```typescript
if (e.key === 'Backspace') {
  const cursorPos = this._getCursorPosition()
  if (cursorPos === 0) {
    e.preventDefault()
    this._handleBackspaceAtStart()
    return
  }
}
```

`_getCursorPosition()` returns `range.index` which is the START of the selection. When text starting from position 0 is selected, `cursorPos` is 0, triggering the merge behavior instead of letting rich-text handle the selection deletion.

## Fix

Check if there's a selection with length > 0. If so, let rich-text handle the backspace normally (don't prevent default).

```typescript
if (e.key === 'Backspace') {
  // Check if there's a selection (selected text to delete)
  const richText = this.querySelector('rich-text') as RichText | null
  const range = richText?.inlineEditor?.getInlineRange()

  // If text is selected (length > 0), let rich-text handle the deletion
  if (range && range.length > 0) {
    return // Don't prevent default - rich-text will delete selected text
  }

  // Only handle backspace at position 0 with no selection
  if (range && range.index === 0) {
    e.preventDefault()
    this._handleBackspaceAtStart()
  }
}
```

## Files Changed

- `frontend/src/blocks/components/bullet-block.ts` - Updated `_handleKeydown()` to check for selection

## Testing

- [x] Unit tests pass (72 tests)
- [x] Build succeeds
- [x] Chrome E2E: Backspace with selection only deletes selected text
- [x] Chrome E2E: Backspace at start (no selection) still merges correctly

## Related

- EDITOR-3052: Fix Editor Keyboard Behaviors (parent ticket)
- EDITOR-3058: Backspace navigates to last visible descendant

## Commits

- `7a009b8` fix(editor): EDITOR-3059 - Backspace with selection only deletes text, not bullet
