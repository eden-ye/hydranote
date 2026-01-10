# EDITOR-3057: Fix Enter Key Behavior for Bullets with Children

## Status: COMPLETED (2026-01-10)

---

## Summary

When pressing Enter at the end of a bullet that has children, the new bullet should be created as the **first child** of that bullet, not as a sibling below all children.

## Bug Description

### Steps to Reproduce
1. Create a bullet with text "BULLET TEXT"
2. Create a child bullet under it (Cmd+Enter or Tab)
3. Click back on "BULLET TEXT" and position cursor at the end
4. Press Enter

### Expected Behavior
```
▼ BULLET TEXT
  • [new empty bullet created here - as first child]
  • Child bullet
```
The new bullet should be inserted as the **first child** of "BULLET TEXT", directly below it but above "Child bullet".

### Actual Behavior
```
▼ BULLET TEXT
  • Child bullet
• [new bullet created here - as sibling]
```
The new bullet is created as a **sibling** of "BULLET TEXT", positioned after all its children.

## Root Cause

In `_handleEnter()` (bullet-block.ts:567-615), when cursor is at end of text, it unconditionally calls `_createSibling()`. This doesn't account for the case when the current bullet has children.

```typescript
// Current behavior (line 572-574):
if (cursorPos >= currentText.length) {
  this._createSibling()  // Always creates sibling
  return
}
```

## Fix

When at end of text AND the bullet has children, create a first child instead of a sibling. This matches the expected UX where pressing Enter continues content "inside" the current bullet if it already has children.

```typescript
// Fixed behavior:
if (cursorPos >= currentText.length) {
  if (this._hasChildren) {
    this._createChild()  // Create first child if has children
  } else {
    this._createSibling()  // Create sibling if no children
  }
  return
}
```

## Files Changed

- `frontend/src/blocks/components/bullet-block.ts` - Modified `_handleEnter()` method

## Testing

- [x] Unit tests pass (72 tests)
- [x] Build succeeds
- [ ] Chrome E2E: Enter at end of bullet with children creates first child
- [ ] Chrome E2E: Enter at end of bullet without children creates sibling (no regression)
- [ ] Chrome E2E: Enter in middle of text still splits correctly (no regression)

## Related

- EDITOR-3052: Fix Editor Keyboard Behaviors (parent ticket)
- EDITOR-306: Keyboard Shortcuts

## Commits

- `c55c005` fix(editor): EDITOR-3057 - Enter creates first child when bullet has children
