# EDITOR-3803: Multiline Block Type

## Summary
New block type that allows multiline content. Pasting multiline text into this block creates a single block instead of multiple bullets.

## Desired Behavior

### Creating Multiline Block
- Hotkey (TBD, e.g., Cmd+Shift+M) creates multiline block
- Block accepts multiple lines of text
- No automatic splitting on Enter

### Paste Behavior
- Pasting multiline content from external source → single block
- Preserves line breaks within the block

### Constraints
- No dragging for multiline blocks (complex reordering)
- Can still be indented/outdented

## Visual Example
```
• Regular bullet
│ This is a multiline block
│ with multiple lines
│ of content preserved
• Another regular bullet
```

## Acceptance Criteria
- [ ] Hotkey creates multiline block
- [ ] Multiline paste creates single block
- [ ] Line breaks preserved within block
- [ ] No drag-and-drop for this block type
- [ ] Can indent/outdent
- [ ] Visual distinction from regular bullets

## Technical Notes
- May need new block type in BlockSuite schema
- Or use existing block with multiline flag

## Estimate
6 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Block Types
