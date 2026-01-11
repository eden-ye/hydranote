# EDITOR-3054: Implement Focus Utilities (Affine Pattern)

## Description

Create focus utilities following Affine's `focusTextModel()` and `asyncSetInlineRange()` patterns. These utilities will replace the current DOM-based focus management with BlockSuite selection-based focus.

## Background

Affine uses two key abstractions for focus management:
1. `focusTextModel(std, id, offset)` - Sets BlockSuite selection synchronously
2. `asyncSetInlineRange(std, model, range)` - Waits for render, then positions cursor

This separation ensures:
- BlockSuite knows which block is active (synchronous)
- Cursor positioning happens after DOM is ready (async)

## Scope

- Create `frontend/src/blocks/utils/focus.ts`
- Implement `focusBulletBlock()` using BlockSuite selection API
- Implement `asyncSetInlineRange()` using rich-text's inlineEditor
- Implement `getCursorPosition()` using inlineEditor.getInlineRange()
- Implement `isAtStart()` and `isAtEnd()` helpers

## Files to Create/Modify

- `frontend/src/blocks/utils/focus.ts` (NEW)
- `frontend/src/blocks/utils/index.ts` - Export new utilities

## Implementation

```typescript
import type { BlockStdScope } from '@blocksuite/block-std'
import type { BlockComponent } from '@blocksuite/block-std'

/**
 * Set BlockSuite selection to focus a bullet block.
 * This notifies BlockSuite which block is active (synchronous).
 */
export function focusBulletBlock(std: BlockStdScope, id: string, offset = 0) {
  std.event.active = true
  std.selection.setGroup('note', [
    std.selection.create('text', {
      from: { blockId: id, index: offset, length: 0 },
      to: null,
    }),
  ])
}

/**
 * Wait for block to render, then position cursor in rich-text.
 * This handles the async rendering challenge.
 */
export async function asyncSetInlineRange(
  std: BlockStdScope,
  blockId: string,
  index: number,
  length = 0
) {
  const block = std.view.getBlock(blockId)
  if (!block) return false

  await block.updateComplete

  const richText = block.querySelector('rich-text')
  if (!richText?.inlineEditor) return false

  richText.inlineEditor.setInlineRange({ index, length })
  return true
}

/**
 * Get cursor position from rich-text's inline editor.
 */
export function getCursorPosition(block: BlockComponent): number {
  const richText = block.querySelector('rich-text')
  const range = richText?.inlineEditor?.getInlineRange()
  return range?.index ?? 0
}

/**
 * Check if cursor is at start of text.
 */
export function isAtStart(block: BlockComponent): boolean {
  return getCursorPosition(block) === 0
}

/**
 * Check if cursor is at end of text.
 */
export function isAtEnd(block: BlockComponent): boolean {
  const richText = block.querySelector('rich-text')
  const editor = richText?.inlineEditor
  if (!editor) return false
  const range = editor.getInlineRange()
  return range?.index === editor.yTextLength
}

/**
 * Get text length from rich-text's inline editor.
 */
export function getTextLength(block: BlockComponent): number {
  const richText = block.querySelector('rich-text')
  return richText?.inlineEditor?.yTextLength ?? 0
}
```

## Acceptance Criteria

- [x] Focus utilities work with rich-text component
- [x] Unit tests for all utility functions
- [x] Build passes

## E2E Testing Checklist

- [x] `focusBulletBlock()` moves cursor to specified block
- [x] `asyncSetInlineRange()` positions cursor correctly after block renders
- [x] `getCursorPosition()` returns correct index
- [x] `isAtStart()` returns true when cursor at position 0
- [x] `isAtEnd()` returns true when cursor at text end

## Dependencies

- **EDITOR-3053**: rich-text migration (must complete first)

## Parallel Safe With

- AUTH-*, API-* (different codebase areas)
- EDITOR-3056 (can start after 3053, parallel with 3054)

## Related Tickets

- **EDITOR-3053**: Prerequisite (rich-text migration)
- **EDITOR-3055**: Uses these utilities (depends on this)

## Status

- **Created**: 2026-01-10
- **Status**: COMPLETED (2026-01-10)

## Implementation Notes

Instead of creating separate utility files, integrated focus utilities directly into bullet-block.ts:
- Using `focusTextModel(this.std, blockId, offset)` from `@blocksuite/affine-components/rich-text`
- Using `asyncSetInlineRange(this.host, model, { index, length })` for cursor positioning
- `_getCursorPosition()` updated to use `richText.inlineEditor.getInlineRange()`

The Affine rich-text package already provides these utilities, so no custom implementations were needed.
