# EDITOR-3058: Fix Backspace to Navigate to Last Visible Descendant

## Status: COMPLETED (2026-01-10)

---

## Summary

When pressing Backspace at the start of a bullet, the cursor should go to the visually preceding bullet (the last visible descendant of the previous sibling), not just the tree-structure previous sibling.

## Bug Description

### Steps to Reproduce
1. Create this structure:
   ```
   • A (expanded)
     • B (expanded)
       • Child bullet
         • | (cursor here, empty bullet)
   • Empty bullet below
   ```
2. Position cursor at start of the empty bullet that's a sibling of "A"
3. Press Backspace

### Expected Behavior
Cursor lands on "Child bullet" (the last visible descendant of the previous sibling structure).

### Actual Behavior
Cursor lands on "A" (the direct previous sibling in tree structure), skipping over all nested children.

## Root Cause

In `_handleBackspaceAtStart()` Case 1 (bullet-block.ts:841-876), when there's a previous sibling, the code directly merges with that sibling:

```typescript
// Case 1: Has previous sibling - merge with it
if (ctx.previousSiblingId) {
  const previousBlock = this.doc.getBlockById(ctx.previousSiblingId)
  // ... merges directly with previousBlock
}
```

This doesn't account for the visual hierarchy - if the previous sibling is expanded and has children, the user expects to merge with its last visible descendant.

## Fix

Add a helper method `_getLastVisibleDescendant()` that traverses down through expanded children to find the deepest last child. Then use this target for merging instead of the direct previous sibling.

```typescript
private _getLastVisibleDescendant(block: BulletBlockModel): BulletBlockModel {
  let target = block
  while (target.isExpanded && target.children.length > 0) {
    target = target.children[target.children.length - 1] as BulletBlockModel
  }
  return target
}
```

## Files Changed

- `frontend/src/blocks/components/bullet-block.ts` - Added `_getLastVisibleDescendant()` helper and updated Case 1 in `_handleBackspaceAtStart()`

## Testing

- [x] Unit tests pass (72 tests)
- [x] Build succeeds
- [ ] Chrome E2E: Backspace goes to last visible descendant
- [ ] Chrome E2E: Backspace still works for simple siblings (no regression)
- [ ] Chrome E2E: Backspace still works for first child merging with parent (no regression)

## Related

- EDITOR-3052: Fix Editor Keyboard Behaviors (parent ticket)
- EDITOR-3057: Fix Enter Key Behavior for Bullets with Children

## Commits

- `8700cb8` fix(editor): EDITOR-3058 - Backspace navigates to last visible descendant
