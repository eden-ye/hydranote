# EDITOR-3507: Bullet Drag-and-Drop E2E Test

## Overview
Tests the drag-and-drop functionality for bullet blocks, including multi-block selection, visual feedback, and drop placement.

## Pre-requisites
- Frontend running at http://localhost:5178 (or dev port)
- Some bullet content exists in the editor

---

## Test 1: Drag Handle Visibility

### Steps:
1. Navigate to http://localhost:5178
2. Create a bullet with text "Parent bullet"
3. Hover over the bullet block
4. Observe the grip handle (left side, ⋮⋮ icon)

### Expected:
- [ ] Grip handle appears on hover (left side of bullet)
- [ ] Grip handle has smooth show/hide transition (250ms)
- [ ] Grip handle shows 6-dot pattern (⋮⋮)
- [ ] Cursor changes to grab when hovering grip

### Selector hints:
- Grip handle: `.bullet-grip`
- Bullet block: `hydra-bullet-block`

---

## Test 2: Single Block Drag

### Steps:
1. Create two bullets: "First bullet" and "Second bullet"
2. Grab the grip handle of "Second bullet"
3. Drag it above "First bullet"
4. Release

### Expected:
- [ ] Dragged block shows reduced opacity (70%)
- [ ] Drop indicator line appears at drop position
- [ ] Bullets reorder correctly after drop
- [ ] No console errors

### Selector hints:
- Drop indicator: `hydra-drop-indicator`

---

## Test 3: Multi-Block Selection (Shift+Click)

### Steps:
1. Create three bullets: "A", "B", "C"
2. Click grip handle on "A"
3. Shift+Click grip handle on "C"
4. Observe selection state

### Expected:
- [ ] All three bullets are selected (highlighted)
- [ ] Selected blocks show visual highlight (background change)
- [ ] Selection spans from A to C

---

## Test 4: Multi-Block Selection (Cmd/Ctrl+Click)

### Steps:
1. Create three bullets: "A", "B", "C"
2. Click grip handle on "A"
3. Cmd/Ctrl+Click grip handle on "C"
4. Observe selection state

### Expected:
- [ ] Only "A" and "C" are selected (not "B")
- [ ] "B" is not highlighted

---

## Test 5: Drop as Child (Nesting)

### Steps:
1. Create two bullets: "Parent" and "Future Child"
2. Drag "Future Child" to the middle zone of "Parent"
3. Move mouse slightly right (past indent threshold ~24px)
4. Observe drop indicator
5. Release

### Expected:
- [ ] Drop indicator shows "in" placement (indented line)
- [ ] "Future Child" becomes a child of "Parent"
- [ ] Parent shows expand/collapse toggle after drop

---

## Test 6: Invalid Drop Prevention

### Steps:
1. Create parent "A" with child "B"
2. Try to drag "A" onto "B" (its own child)
3. Observe drop behavior

### Expected:
- [ ] Drop indicator does NOT appear over descendants
- [ ] Dropping on self or descendants does nothing
- [ ] No errors or crashes

---

## Test 7: Escape Key Cancels Drag

### Steps:
1. Start dragging a bullet
2. Press Escape key while dragging
3. Observe behavior

### Expected:
- [ ] Drag operation is cancelled
- [ ] Bullet returns to original position
- [ ] No reordering occurs

---

## Test 8: Undo/Redo for Drag Operations

### Steps:
1. Create bullets "A" and "B"
2. Drag "B" above "A"
3. Press Cmd/Ctrl+Z (Undo)
4. Observe order

### Expected:
- [ ] Undo restores original order ("A" then "B")
- [ ] Cmd/Ctrl+Shift+Z redoes the drag operation

---

## Console Check

### Steps:
1. Open browser DevTools (Cmd+Option+I or F12)
2. Go to Console tab
3. Perform all above tests

### Expected:
- [ ] No JavaScript errors
- [ ] Debug logs show: `[DragDrop] Drag started`, `[DragDrop] Drag ended`
- [ ] No warnings about missing models or undefined properties
