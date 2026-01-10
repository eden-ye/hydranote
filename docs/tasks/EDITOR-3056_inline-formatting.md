# EDITOR-3056: Add Inline Formatting Support

## Description

Enable bold, italic, underline, and other inline formatting in bullet blocks using BlockSuite's rich-text component.

## Background

With rich-text migration (EDITOR-3053) complete, we can enable inline formatting. BlockSuite's rich-text component supports:
- Bold (Cmd+B)
- Italic (Cmd+I)
- Underline (Cmd+U)
- Strikethrough
- Code
- Links

## Scope

- Enable `enableFormat={true}` on rich-text
- Add `attributeRenderer` for custom formatting styles
- Verify keyboard shortcuts work (Cmd+B, Cmd+I, Cmd+U)
- Update bullet-block styles for formatted text

## Files to Modify

- `frontend/src/blocks/components/bullet-block.ts` - Enable formatting
- `frontend/src/blocks/utils/formatting.ts` (NEW) - Attribute renderer (if needed)

## Implementation

### Step 1: Enable formatting on rich-text
```typescript
<rich-text
  .yText=${this.model.text.yText}
  .enableFormat=${true}  // Changed from false
  .enableUndoRedo=${true}
  .readonly=${false}
></rich-text>
```

### Step 2: Add styles for formatted text
```css
rich-text {
  /* Bold */
  [data-bold="true"] {
    font-weight: bold;
  }

  /* Italic */
  [data-italic="true"] {
    font-style: italic;
  }

  /* Underline */
  [data-underline="true"] {
    text-decoration: underline;
  }

  /* Code */
  [data-code="true"] {
    font-family: monospace;
    background: var(--affine-code-background, #f5f5f5);
    padding: 0 4px;
    border-radius: 2px;
  }
}
```

### Step 3: Verify keyboard shortcuts
BlockSuite's rich-text handles these automatically:
- Cmd+B → bold
- Cmd+I → italic
- Cmd+U → underline

## Acceptance Criteria

- [x] Bold, italic, underline formatting works
- [x] Keyboard shortcuts trigger formatting
- [x] Formatted text persists after refresh
- [x] Build passes

## E2E Testing Checklist

- [x] Select text + Cmd+B → text becomes bold
- [x] Select text + Cmd+I → text becomes italic
- [x] Select text + Cmd+U → text becomes underlined
- [x] Formatted text visible in bullet
- [x] Refresh page → formatting preserved
- [x] Copy/paste preserves formatting
- [x] Undo/redo works with formatting

## Dependencies

- **EDITOR-3053**: rich-text migration (must complete first)

## Parallel Safe With

- AUTH-*, API-* (different codebase areas)
- EDITOR-3054, EDITOR-3055 (can run in parallel after 3053)

## Related Tickets

- **EDITOR-3053**: Prerequisite (rich-text migration)

## Status

- **Created**: 2026-01-10
- **Status**: pending
