# EDITOR-3053: Replace contenteditable with BlockSuite rich-text

## Description

Migrate HydraBulletBlock from custom `contenteditable` div to BlockSuite's `<rich-text>` component. This is the foundation for fixing the focus bug (EDITOR-3052) and enabling inline formatting (EDITOR-3056).

## Background

Hydra currently uses a custom `contenteditable="true"` div (`.bullet-content`) for text editing. This causes focus timing issues because:
- Browser routes keystrokes to whichever DOM element has focus
- Lit renders asynchronously, so new blocks don't exist when keystrokes arrive
- No access to BlockSuite's `InlineEditor` for input routing

Affine solves this by using `<rich-text>` which has an `InlineEditor` that routes input based on BlockSuite selection, not DOM focus.

## Scope

- Replace `.bullet-content` contenteditable div with `<rich-text>` element
- Connect `rich-text` to `this.model.text.yText`
- Remove manual input/text sync handlers (rich-text handles this)
- Update styles for rich-text integration

## Files to Modify

- `frontend/src/blocks/components/bullet-block.ts` - Replace render template
- CSS styles in same file - Replace `.bullet-content` styles

## Implementation

### Step 1: Add rich-text import
```typescript
import '@blocksuite/affine-components/rich-text'
```

### Step 2: Update render template
```typescript
// Before:
<div
  class="bullet-content"
  contenteditable="true"
  data-placeholder="Type here..."
></div>

// After:
<rich-text
  .yText=${this.model.text.yText}
  .enableFormat=${false}
  .enableUndoRedo=${false}
  .readonly=${false}
></rich-text>
```

### Step 3: Remove manual text sync
Delete from `firstUpdated()`:
- `contentDiv.addEventListener('input', ...)`
- `this.model.text.yText.observe(...)`
- Initial `contentDiv.textContent = ...`

### Step 4: Update styles
Replace `.bullet-content` styles with rich-text styling.

## Acceptance Criteria

- [x] Text editing works via rich-text
- [x] Yjs sync still works (collaborative editing)
- [x] No visual regression
- [x] Build passes

## E2E Testing Checklist

- [x] Type text in empty bullet → text appears
- [x] Edit existing text → changes persist
- [x] Refresh page → text restored from IndexedDB
- [x] Placeholder shows when bullet is empty
- [x] Text wraps correctly on long content
- [x] Collapse/expand toggle still works
- [x] Arrow navigation between bullets works

## Dependencies

- None

## Parallel Safe With

- AUTH-*, API-* (different codebase areas)

## Unhappy Path

If rich-text integration fails due to API differences or compatibility issues:
- Switch to **EDITOR-3053u** (Keystroke Queue fallback)

## Related Tickets

- **EDITOR-3052**: Parent ticket (focus bug)
- **EDITOR-3054**: Focus utilities (depends on this)
- **EDITOR-3055**: Keyboard handler refactor (depends on this)
- **EDITOR-3056**: Inline formatting (depends on this)
- **EDITOR-3053u**: Fallback option

## Status

- **Created**: 2026-01-10
- **Status**: COMPLETED (2026-01-10)

## Implementation Notes

Successfully migrated to rich-text component:
- Added imports for `RichText`, `effects as richTextEffects`, `focusTextModel`, `asyncSetInlineRange`
- Replaced contenteditable div with `<rich-text>` in `renderBlock()`
- Removed `_handleInput()` method (rich-text handles Yjs sync automatically)
- Updated CSS to style `rich-text` component
