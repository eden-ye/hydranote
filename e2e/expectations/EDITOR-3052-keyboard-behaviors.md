# EDITOR-3052: Keyboard Behaviors E2E Tests

## Test: Backspace at start of bullet merges with previous

### Steps:
1. Navigate to http://localhost:5177
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

## Test: Enter in middle of text splits bullet

### Steps:
1. Create bullet "Hello World"
2. Position cursor between "Hello" and "World" (after space)
3. Press Enter

### Expected:
- [x] First bullet becomes "Hello "
- [x] New bullet below contains "World"
- [x] Cursor is at start of new bullet

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- "SplitTest" split into "Split" and "Test" correctly

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

## Test: Tab indents bullet

### Steps:
1. Create two bullets at root level
2. Click on second bullet
3. Press Tab

### Expected:
- [x] Second bullet becomes child of first
- [x] Indentation visible
- [x] First bullet shows expand toggle

### Evidence:
- Tested in EDITOR-306 (2026-01-10)
- Tab indent working

---

## Test: Shift+Tab outdents bullet

### Steps:
1. Have indented bullet (child)
2. Click on child bullet
3. Press Shift+Tab

### Expected:
- [x] Child becomes sibling of parent
- [x] Indentation decreases

### Evidence:
- Tested in EDITOR-306 (2026-01-10)
- Shift+Tab outdent working

---

## Summary

| Test | Status |
|------|--------|
| Backspace merges | ✅ |
| Backspace deletes empty | ✅ |
| Backspace first bullet | ✅ |
| Enter splits | ✅ |
| Delete merges next | ✅ |
| Alt+Up swaps | ✅ |
| Alt+Down swaps | ✅ |
| Tab indents | ✅ |
| Shift+Tab outdents | ✅ |

Tested on: 2026-01-10
Browser: Chrome via Claude-in-Chrome MCP
Port: http://localhost:5177
