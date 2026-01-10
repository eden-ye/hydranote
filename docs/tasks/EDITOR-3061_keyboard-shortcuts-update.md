# EDITOR-3061: Keyboard Shortcuts Update

## Status: COMPLETE

## Overview
Update keyboard shortcuts for the bullet block editor to improve usability:
1. **Cmd/Ctrl+Enter** should toggle fold (instead of creating child)
2. **Cmd/Ctrl+.** should do nothing for now (reserved for future use)
3. **Arrow up/down** should maintain column position when navigating between bullets

## Previous Behavior

| Shortcut | Previous Action |
|----------|-----------------|
| Cmd/Ctrl+Enter | Creates new child bullet |
| Cmd/Ctrl+. | Toggles expand/collapse |
| Arrow Up | Navigate to previous sibling (cursor goes to position 0) |
| Arrow Down | Navigate to next sibling/first child (cursor goes to position 0) |

## New Behavior

| Shortcut | New Action |
|----------|------------|
| Cmd/Ctrl+Enter | Toggle expand/collapse |
| Cmd/Ctrl+. | Do nothing (no-op, reserved for future) |
| Arrow Up | Navigate to previous bullet, preserve column position |
| Arrow Down | Navigate to next bullet, preserve column position |

## Implementation Details

### 1. Cmd/Ctrl+Enter -> Toggle Fold
Changed `Mod-Enter` handler in `_bindKeyboardShortcuts()` to call `_toggleExpand()` instead of `_createChild()`.

### 2. Cmd/Ctrl+. -> No-op
Handler returns `true` to prevent default but does nothing. Reserved for future functionality.

### 3. Arrow Up/Down -> Preserve Column Position
This was the most complex change. Key technical discoveries:

**Problem**: `focusTextModel(std, blockId, position)` sets BlockSuite's selection STATE but doesn't reliably set the actual cursor position. The InlineEditor's cursor was being reset to 0 due to async race conditions. Even when using setTimeout(0) to correct the position, users could see the cursor visually jump from position 0 to the correct position.

**Solution**: Hide the caret during the transition using `caretColor: transparent`, then restore it after positioning is complete:

```typescript
private _focusBlockAtPosition(blockId: string, position: number): void {
  const model = this.doc.getBlockById(blockId)
  if (!model) return

  // Get the target block's element to hide its caret during transition
  const blockElement = this.host.view.getBlock(blockId)
  const richText = blockElement?.querySelector('rich-text') as HTMLElement | null

  // Hide cursor during transition to prevent visual jump
  if (richText) {
    richText.style.caretColor = 'transparent'
  }

  // Use BlockSuite's focus mechanism
  focusTextModel(this.std, blockId, position)

  // After focusTextModel's effects settle, set correct position and restore cursor
  setTimeout(() => {
    const inlineEditor = getInlineEditorByModel(this.host, blockId)
    if (inlineEditor) {
      inlineEditor.setInlineRange({ index: position, length: 0 })
    }

    // Restore cursor visibility
    if (richText) {
      richText.style.caretColor = ''
    }
  }, 0)
}
```

**Why this works**:
1. `caretColor: transparent` hides the cursor during the async transition
2. `focusTextModel` triggers BlockSuite's selection system (which puts cursor at wrong position)
3. `setTimeout(0)` allows BlockSuite's processing to complete
4. `setInlineRange` corrects the position
5. Restoring `caretColor` makes the cursor visible at the correct position

Users don't see the cursor jump because it's invisible during the transition.

### New Method: `_focusBlockPreserveColumn`
Added to handle column clamping when target block has shorter text:

```typescript
private _focusBlockPreserveColumn(blockId: string, targetColumn: number): void {
  const targetModel = this.doc.getBlockById(blockId)
  if (!targetModel || !targetModel.text) {
    this._focusBlock(blockId)
    return
  }
  const textLength = targetModel.text.toString().length
  const clampedPosition = Math.min(targetColumn, textLength)
  this._focusBlockAtPosition(blockId, clampedPosition)
}
```

## Files Modified
- `frontend/src/blocks/components/bullet-block.ts`
  - Added import for `getInlineEditorByModel`
  - Modified `Mod-Enter` handler
  - Modified `Mod-.` handler
  - Added `_focusBlockPreserveColumn()` method
  - Updated `_focusBlockAtPosition()` with setTimeout(0) + direct InlineEditor access
  - Updated ArrowUp/ArrowDown handlers to use column preservation

## Testing
- **Unit tests**: All 221 tests pass (`npm run test:run`)
- **Build**: TypeScript compiles without errors (`npm run build`)
- **Manual Chrome testing**:
  - Arrow Up preserves column position
  - Arrow Down preserves column position
  - Column is clamped to end-of-line when target text is shorter
  - Cmd+Enter toggles fold
  - Cmd+. does nothing

## Related Tickets
- EDITOR-306: Initial keyboard shortcuts implementation
- EDITOR-3052: Keyboard behaviors branch
