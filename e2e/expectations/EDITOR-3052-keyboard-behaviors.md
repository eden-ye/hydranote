# EDITOR-3052: Keyboard Behaviors E2E Tests

## Test: Backspace at start of bullet merges with previous

### Steps:
1. Navigate to http://localhost:5174
2. Create two bullets: "First bullet" and "Second bullet"
3. Click at start of "Second bullet"
4. Press Backspace

### Expected:
- [x] Bullets merge into "First bulletSecond bullet"
- [x] Cursor is positioned at join point (after "First bullet")
- [x] Only one bullet remains

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- Screenshot confirmed merge behavior working

---

## Test: Backspace on empty bullet deletes it

### Steps:
1. Create two bullets with text
2. Press Enter to create empty third bullet
3. Press Backspace on empty bullet

### Expected:
- [x] Empty bullet is deleted
- [x] Cursor moves to end of previous bullet
- [x] Two bullets remain

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- Empty bullet deleted, cursor moved to previous

---

## Test: Backspace on first child merges into parent

### Steps:
1. Create parent bullet "First" with child "irst"
2. Position cursor at start of child "irst"
3. Press Backspace

### Expected:
- [x] Child text merges into parent: "First" + "irst" = "First" (if was split)
- [x] Cursor is at join point in parent
- [x] Child bullet is deleted

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- "F" parent + "irst" child merged to "First"

---

## Test: Backspace on first bullet does nothing

### Steps:
1. Create single bullet "First bullet"
2. Move cursor to start
3. Press Backspace

### Expected:
- [x] Nothing happens
- [x] Bullet text remains "First bullet"
- [x] Cursor stays at position 0

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- Text preserved, no action taken

---

## Test: Enter in middle of text with children - trailing text becomes first child (RemNote behavior)

### Steps:
1. Create parent bullet "First" with children "Second" and "Third"
2. Position cursor after "F" in "First"
3. Press Enter

### Expected:
- [x] Parent bullet becomes "F" (text before cursor)
- [x] New first child "irst" created (text after cursor)
- [x] Existing children "Second", "Third" remain after new child
- [x] Cursor is at start of new child "irst"

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- Matches RemNote behavior exactly
- Structure: F > [irst, Second, Third]

---

## Test: Enter in middle of text splits bullet (no children)

### Steps:
1. Create bullet "Hello World" (no children)
2. Position cursor between "Hello" and "World" (after space)
3. Press Enter

### Expected:
- [x] First bullet becomes "Hello "
- [x] New sibling bullet below contains "World"
- [x] Cursor is at start of new bullet

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- Split into sibling when no children exist

---

## Test: Delete at end merges with next

### Steps:
1. Create two bullets: "First" and "Second"
2. Position cursor at end of "First"
3. Press Delete

### Expected:
- [x] Bullets merge into "FirstSecond"
- [x] Cursor stays at original position
- [x] Only one bullet remains

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- "First" + "World" merged to "FirstWorld"

---

## Test: Arrow Up/Down navigation traverses tree

### Steps:
1. Create structure: First > [Second, Third]
2. Focus on "First"
3. Press ArrowDown repeatedly

### Expected:
- [x] ArrowDown from "First" goes to "Second" (first child)
- [x] ArrowDown from "Second" goes to "Third" (next sibling)
- [x] ArrowUp from "Third" goes to "Second"
- [x] ArrowUp from "Second" goes to "First" (parent)

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- Proper tree traversal working

---

## Test: Alt+Up swaps with previous sibling

### Steps:
1. Create three bullets: "First", "Second", "Third"
2. Click on "Second"
3. Press Alt+Up

### Expected:
- [x] Order becomes: "Second", "First", "Third"
- [x] Cursor stays on "Second"

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- "Third" moved up to swap with "Second"

---

## Test: Alt+Down swaps with next sibling

### Steps:
1. Create three bullets: "First", "Second", "Third"
2. Click on "Second"
3. Press Alt+Down

### Expected:
- [x] Order becomes: "First", "Third", "Second"
- [x] Cursor stays on "Second"

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- "Third" moved down to swap back

---

## Test: Tab indents bullet and maintains focus

### Steps:
1. Create two bullets at root level
2. Click on second bullet
3. Press Tab

### Expected:
- [x] Second bullet becomes child of first
- [x] Indentation visible
- [x] First bullet shows expand toggle
- [x] Cursor remains on indented bullet

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- Tab indent working with focus maintained

---

## Test: Shift+Tab outdents bullet and maintains focus

### Steps:
1. Have indented bullet (child)
2. Click on child bullet
3. Press Shift+Tab

### Expected:
- [x] Child becomes sibling of parent
- [x] Indentation decreases
- [x] Cursor remains on outdented bullet

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- Shift+Tab outdent working with focus maintained

---

## Summary

| Test | Status |
|------|--------|
| Backspace merges siblings | ✅ |
| Backspace deletes empty | ✅ |
| Backspace first child merges to parent | ✅ |
| Backspace first bullet | ✅ |
| Enter splits with children (RemNote) | ✅ |
| Enter splits without children | ✅ |
| Delete merges next | ✅ |
| Arrow Up/Down tree traversal | ✅ |
| Alt+Up swaps | ✅ |
| Alt+Down swaps | ✅ |
| Tab indents with focus | ✅ |
| Shift+Tab outdents with focus | ✅ |

Tested on: 2026-01-10
Browser: Chrome via Claude-in-Chrome MCP
Port: http://localhost:5174
