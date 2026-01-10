# EDITOR-3051: Fix Bullet Block Persistence and Text Sync

## Status: Done

## Summary

Fixed two critical bugs in the `hydra:bullet` block implementation that prevented proper text editing and data persistence.

## Issues Fixed

### 1. Text Reversal During Typing

**Symptom**: When typing text, characters appeared in reverse order (e.g., "Testing" became "gnitseT").

**Root Cause**: The Yjs observer in `firstUpdated()` was updating `contentDiv.textContent` on every model change. During typing:
1. User types a character
2. Input handler syncs to Yjs model
3. Observer fires, sets `textContent` (resets cursor to position 0)
4. Next character is typed at cursor position 0 (beginning)

**Fix** (`bullet-block.ts:307-315`):
```typescript
// Only update DOM when NOT focused (avoid cursor issues during typing)
this.model.text.yText.observe(() => {
  const modelText = this.model.text.toString()
  const isNotFocused = document.activeElement !== contentDiv
  if (contentDiv.textContent !== modelText && isNotFocused) {
    contentDiv.textContent = modelText
  }
})
```

### 2. Data Not Persisting on Reload

**Symptom**: Text typed in bullets disappeared after page reload.

**Root Cause**: In `Editor.tsx`, the `doc.load()` callback ran synchronously before y-indexeddb finished restoring data:
```typescript
// BEFORE (broken):
doc.load(() => {
  if (doc.isEmpty) {  // Returns true before sync completes!
    // Creates new empty blocks, overwriting restored data
  }
})
```

**Fix** (`Editor.tsx:120-134`):
```typescript
// AFTER (working):
doc.load()  // Just load, no callback

// Wait for sync completion before checking if empty
persistence.on('synced', () => {
  if (doc.isEmpty) {
    // Only now create initial blocks if truly empty
  }
  setPersistenceState({ status: 'synced', error: null })
})
```

## Lessons Learned (Avoid These Mistakes)

### 1. Yjs/CRDT Observer Timing with DOM Updates

**Mistake**: Updating DOM directly from Yjs observers without considering the editing state.

**Lesson**: When observing CRDT changes that affect editable DOM elements:
- Check if the element is focused before updating
- Save/restore cursor position if update is necessary during editing
- Use a flag to distinguish local vs remote changes

### 2. IndexedDB Sync Timing with Document Initialization

**Mistake**: Assuming `doc.isEmpty` is accurate immediately after `doc.load()`.

**Lesson**: With y-indexeddb persistence:
- `doc.load()` just connects the document, doesn't wait for sync
- The `synced` event fires AFTER IndexedDB data is restored
- Any "create if empty" logic must be inside the `synced` handler
- Never assume document state is final before sync completes

### 3. BlockSuite Component Lifecycle

**Mistake**: Accessing `this.std` in `connectedCallback()` before it's initialized.

**Lesson**: BlockSuite's `std` (standard library) may not be available immediately:
- Use `requestAnimationFrame()` to defer access
- Guard against null: `if (this.std) { ... }`
- `firstUpdated()` is safer for DOM-dependent setup

### 4. Contenteditable Event Handling

**Mistake**: Relying on Lit's template event bindings (`@input`) for contenteditable.

**Lesson**: For contenteditable elements:
- Use manual `addEventListener` in `firstUpdated()` for reliable event capture
- Template bindings may not fire consistently on contenteditable
- Always call `e.preventDefault()` for keyboard shortcuts to prevent default behavior

## Files Changed

- `frontend/src/blocks/components/bullet-block.ts`
  - Added `firstUpdated()` with Yjs observer (focus-aware)
  - Deferred keyboard shortcut binding
  - Added manual event listeners for input/keydown
  - Guarded `renderChildren()` against null std

- `frontend/src/components/Editor.tsx`
  - Moved initial block creation into `synced` handler
  - Changed default block from `affine:paragraph` to `hydra:bullet`

## Testing

- [x] Text typing works correctly
- [x] Data persists on reload
- [x] Enter creates new sibling
- [x] Tab indents
- [x] Shift+Tab outdents
- [x] Cmd+. toggles fold
- [x] 72 unit tests pass
- [x] Build succeeds

## PR

https://github.com/eden-ye/hydranote/pull/16

## Commits

- `a512b47` fix(editor): EDITOR-3051 - Fix bullet block persistence and text sync
