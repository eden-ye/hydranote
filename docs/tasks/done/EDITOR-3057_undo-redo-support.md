# EDITOR-3057: Enable Undo/Redo Support for Inline Formatting

## Description

Enable undo/redo functionality for inline text formatting (bold, italic, underline) in the editor. Currently `enableUndoRedo` is set to `false` on the rich-text component, preventing users from undoing formatting changes with Cmd+Z.

## Background

During EDITOR-3053 (rich-text migration) and EDITOR-3056 (inline formatting), undo/redo was disabled to avoid potential conflicts with Yjs CRDT operations. Now that inline formatting is working, users expect Cmd+Z to undo formatting changes.

## Current State

```typescript
// bullet-block.ts line 1208
<rich-text
  .yText=${this.model.text.yText}
  .enableFormat=${true}
  .enableClipboard=${true}
  .enableUndoRedo=${false}  // Currently disabled
  .readonly=${false}
></rich-text>
```

## Proposed Solutions

### Option A: Simple Enable (Try First)
```typescript
.enableUndoRedo=${true}
```
- Pros: Simplest change, may just work
- Cons: May conflict with document-level operations

### Option B: Yjs UndoManager (If Option A Has Issues)
```typescript
import { UndoManager } from 'yjs'

// In editor initialization
const undoManager = new UndoManager(doc.getText('content'), {
  trackedOrigins: new Set([doc.clientID])
})

// Wire up keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.metaKey && e.key === 'z') {
    if (e.shiftKey) undoManager.redo()
    else undoManager.undo()
  }
})
```

## Acceptance Criteria

- [x] Cmd+Z undoes inline formatting (bold → unbold)
- [x] Cmd+Shift+Z redoes inline formatting
- [x] Undo/redo works for text content changes
- [x] No conflicts with block-level operations
- [x] All existing tests pass

## Files to Modify

- `frontend/src/blocks/components/bullet-block.ts` - Enable undo/redo
- `frontend/src/editor/` - Add UndoManager if needed (Option B)

## Testing

1. Select text, apply bold (Cmd+B)
2. Press Cmd+Z → bold should be removed
3. Press Cmd+Shift+Z → bold should be restored
4. Test with italic and underline
5. Test undo/redo for text typing

## Dependencies

- EDITOR-3056 (Inline Formatting) - completed

## Parallel Safe With

- AUTH-*, API-*, FE-* (different codebase areas)

## Priority

Medium - UX improvement, not blocking core functionality

## Status

- **Created**: 2026-01-11
- **Completed**: 2026-01-11
- **Status**: completed
- **PR**: https://github.com/eden-ye/hydranote/pull/45
- **Commit**: 091bcb7
