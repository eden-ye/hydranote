# EDITOR-306: Keyboard Shortcuts E2E Tests

## Test: Enter creates new sibling bullet

### Steps:
1. Navigate to http://localhost:5177
2. Click on bullet content area
3. Type "First bullet"
4. Press Enter

### Expected:
- [x] New bullet appears below
- [x] New bullet has placeholder "Type here..."
- [x] Cursor moves to new bullet

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- New bullet created successfully

---

## Test: Tab indents bullet

### Steps:
1. With two sibling bullets
2. Click on second bullet
3. Press Tab

### Expected:
- [x] Second bullet becomes child of first
- [x] First bullet shows expand/collapse toggle (▼)
- [x] Indentation visually increases

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- Bullet indented under parent

---

## Test: Shift+Tab outdents bullet

### Steps:
1. With indented bullet (child)
2. Click on child bullet
3. Press Shift+Tab

### Expected:
- [x] Child becomes sibling of its parent
- [x] Indentation visually decreases
- [x] Parent loses expand toggle if no more children

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- Bullet outdented to sibling level

---

## Test: Cmd+. toggles fold

### Steps:
1. With parent bullet that has children
2. Click on parent bullet
3. Press Cmd+. (Ctrl+. on Windows)

### Expected:
- [x] Children become hidden (collapsed)
- [x] Toggle icon changes from ▼ to ▶
- [x] Inline preview shows child content

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- Collapse shows ▶ with inline preview "Second bullet"

---

## Test: Cmd+. expands collapsed bullet

### Steps:
1. With collapsed parent bullet
2. Press Cmd+. again

### Expected:
- [x] Children become visible (expanded)
- [x] Toggle icon changes from ▶ to ▼
- [x] Inline preview disappears

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- Expand shows ▼ with children visible

---

## Test: Data persists on reload

### Steps:
1. Type text in bullets
2. Reload page (Cmd+R)
3. Wait for sync

### Expected:
- [x] All text content preserved
- [x] Hierarchy preserved
- [x] Expand/collapse state preserved

### Evidence:
- Tested 2026-01-10 via Chrome E2E
- Text "First bullet" and "Second bullet" persisted after reload

---

## Summary

All EDITOR-306 keyboard shortcuts tested and working:
- Enter: Create sibling ✅
- Tab: Indent ✅
- Shift+Tab: Outdent ✅
- Cmd+.: Toggle fold ✅
- Persistence: Working ✅

Tested on: 2026-01-10
Browser: Chrome via Claude-in-Chrome MCP
Port: http://localhost:5177
