# EDITOR-3063: Delete Parent Should Unindent Children, Not Delete Them

## Status: COMPLETED (2026-01-10)

---

## Summary

When deleting a parent bullet that has children, the children should be unindented (promoted to the parent's level), not deleted along with the parent.

## Bug Description

### Steps to Reproduce
1. Create a bullet structure:
   ```
   - ABCDEXFGHIJ
   - 11111
     - 22222
     - 33333
   ```
2. Place cursor at the start of "11111" (position 0)
3. Press Backspace to delete/merge the "11111" bullet

### Expected Behavior
"11111" merges with "ABCDEXFGHIJ", and its children (22222, 33333) are unindented to become siblings of the merged bullet:
```
- ABCDEXFGHIJ11111
- 22222
- 33333
```

### Actual Behavior (Before Fix)
The entire "11111" bullet and ALL its children (22222, 33333) were deleted.

## Root Cause

In `_handleBackspaceAtStart()` (bullet-block.ts), when calling `doc.deleteBlock(blockToDelete)`, the children were being deleted along with the parent because they were still nested under it.

## Fix

Before deleting a block in `_handleBackspaceAtStart()`, check if the block has children and reparent them to the appropriate level:

**Case 1: Has previous sibling (merge with last visible descendant)**
- Children stay at the same level (under the same parent)
- Use `doc.moveBlocks(children, parent, nextSibling)` before deletion

**Case 2: First child (merge with parent)**
- Children become siblings of the parent (move to grandparent level)
- Use `doc.moveBlocks(children, grandparent, nextSiblingOfParent)` before deletion

Also added a testable utility function `computeBackspaceMergeStrategy()` for unit testing the logic.

## Files Changed

- `frontend/src/blocks/components/bullet-block.ts`
  - Added `BackspaceMergeInput` interface
  - Added `BackspaceMergeStrategy` interface
  - Added `computeBackspaceMergeStrategy()` exported function
  - Updated `_handleBackspaceAtStart()` to reparent children before deletion

- `frontend/src/blocks/__tests__/bullet-block-component.test.ts`
  - Added tests for `computeBackspaceMergeStrategy()` covering:
    - Block with no children
    - Block with children and previous sibling
    - Block with children and no previous sibling (merge with parent)
    - Block at root level with children

## Testing

- [x] Unit tests pass (219 tests, including 4 new tests for EDITOR-3063)
- [x] Build succeeds
- [x] Chrome E2E: Delete parent unindents children correctly
- [x] Chrome E2E: Delete bullet without children still works (existing behavior preserved)

## Related

- EDITOR-3052: Fix Editor Keyboard Behaviors (parent ticket)
- EDITOR-3058: Backspace navigates to last visible descendant
- EDITOR-3059: Backspace with selection only deletes text

## Commits

- `cf0cfa2` fix(editor): EDITOR-3063 - Delete parent unindents children instead of deleting them
