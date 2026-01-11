# E2E Test Expectations: EDITOR-3405 - Portal Creation UI

## Overview
Testing manual portal creation via slash command `/portal` and keyboard shortcut `Cmd+Shift+P`.

## Test Environment
- **Browser**: Chrome
- **URL**: http://localhost:5173
- **Prerequisites**: User must be logged in with valid session

## Test Scenarios

### Scenario 1: Portal Creation via Slash Command

**Steps:**
1. Navigate to http://localhost:5173
2. Create a new bullet with text "Test bullet 1"
3. Press Enter to create another bullet
4. Type "/portal" in the new bullet
5. Verify portal picker modal appears
6. Verify search input is focused
7. Verify "Test bullet 1" appears in the bullet list
8. Click on "Test bullet 1" in the list
9. Verify portal block is created as child of current bullet
10. Verify portal displays content from "Test bullet 1"
11. Verify /portal text is removed from parent bullet

**Expected Results:**
- ✅ Portal picker opens on typing `/portal`
- ✅ Search input is automatically focused
- ✅ Bullet list shows all available bullets in document
- ✅ Portal is created when clicking a bullet
- ✅ Portal displays correct source content
- ✅ Parent bullet text is cleaned up

### Scenario 2: Portal Creation via Keyboard Shortcut

**Steps:**
1. Navigate to http://localhost:5173
2. Create a bullet with text "Source bullet"
3. Press Enter to create another bullet
4. Type "Parent bullet" in the new bullet
5. Press Cmd+Shift+P (or Ctrl+Shift+P on Windows/Linux)
6. Verify portal picker modal appears
7. Use arrow keys to navigate to "Source bullet"
8. Press Enter to select
9. Verify portal block is created as child of "Parent bullet"
10. Verify portal displays content from "Source bullet"

**Expected Results:**
- ✅ Portal picker opens on Cmd+Shift+P
- ✅ Arrow keys navigate the bullet list
- ✅ Selected item is highlighted
- ✅ Enter key creates the portal
- ✅ Portal shows correct source content

### Scenario 3: Portal Picker Search/Filter

**Steps:**
1. Navigate to http://localhost:5173
2. Create several bullets:
   - "Apple fruit"
   - "Banana fruit"
   - "Cherry fruit"
   - "Apple tree"
3. Create a new bullet and type "/portal"
4. In the search input, type "apple"
5. Verify only "Apple fruit" and "Apple tree" appear in list
6. Clear search (delete text)
7. Verify all bullets reappear
8. Type "banana" in search
9. Verify only "Banana fruit" appears
10. Select "Banana fruit" and press Enter

**Expected Results:**
- ✅ Search filters bullets by text content
- ✅ Search is case-insensitive
- ✅ Clearing search shows all bullets again
- ✅ Can select and create portal from filtered results

### Scenario 4: Portal Picker Keyboard Navigation

**Steps:**
1. Navigate to http://localhost:5173
2. Create bullets: "First", "Second", "Third"
3. Create new bullet and press Cmd+Shift+P
4. Verify first bullet is selected (highlighted)
5. Press ArrowDown
6. Verify second bullet is now selected
7. Press ArrowDown again
8. Verify third bullet is now selected
9. Press ArrowUp
10. Verify second bullet is selected again
11. Press Escape
12. Verify portal picker closes

**Expected Results:**
- ✅ ArrowDown moves selection down
- ✅ ArrowUp moves selection up
- ✅ Selection wraps at boundaries (stays at first/last)
- ✅ Escape closes the picker
- ✅ Visual highlight follows selection

### Scenario 5: Portal Picker Mouse Interaction

**Steps:**
1. Navigate to http://localhost:5173
2. Create bullets: "One", "Two", "Three"
3. Create new bullet and type "/portal"
4. Hover over "Two" with mouse
5. Verify "Two" becomes highlighted
6. Hover over "Three"
7. Verify "Three" becomes highlighted
8. Click on "Three"
9. Verify portal is created for "Three"

**Expected Results:**
- ✅ Mouse hover updates selection
- ✅ Mouse click selects and creates portal
- ✅ Only one item highlighted at a time

### Scenario 6: Portal Picker with Nested Bullets

**Steps:**
1. Navigate to http://localhost:5173
2. Create bullet "Parent"
3. Press Tab to create child bullet "Child 1"
4. Press Enter and type "Child 2" (still indented)
5. Press Shift+Tab to outdent
6. Type "Another Parent"
7. Create new bullet and type "/portal"
8. Verify picker shows visual hierarchy (indentation)
9. Verify "Parent" is level 0 (bold, less indented)
10. Verify "Child 1" and "Child 2" are level 1 (more indented)
11. Select "Child 1" and press Enter
12. Verify portal is created for "Child 1"

**Expected Results:**
- ✅ Nested bullets show correct indentation
- ✅ Level 0 bullets are visually distinct (bold)
- ✅ Can select and create portals for any nesting level

### Scenario 7: Portal Picker Preview

**Steps:**
1. Navigate to http://localhost:5173
2. Create bullet "Long bullet text that will be shown in preview"
3. Create new bullet and type "/portal"
4. Verify preview section at bottom shows "Long bullet text..."
5. Use arrow keys or mouse to select different bullets
6. Verify preview updates to show selected bullet's text

**Expected Results:**
- ✅ Preview section visible at bottom of picker
- ✅ Preview shows selected bullet's text
- ✅ Preview updates when selection changes
- ✅ Long text is truncated appropriately

### Scenario 8: Partial Slash Command Matching

**Steps:**
1. Navigate to http://localhost:5173
2. Create bullet "Target"
3. Create new bullet and type "/p"
4. Verify portal picker opens (partial match)
5. Press Escape to close
6. Type "/po"
7. Verify portal picker opens again
8. Press Escape, type "/port"
9. Verify portal picker opens
10. Select "Target" to create portal

**Expected Results:**
- ✅ `/p`, `/po`, `/port`, `/porta`, `/portal` all trigger picker
- ✅ Other slash commands (e.g., `/desc`) don't trigger picker
- ✅ Partial commands are removed when portal is created

### Scenario 9: Click Outside to Cancel

**Steps:**
1. Navigate to http://localhost:5173
2. Create bullet and type "/portal"
3. Verify picker opens
4. Click on the backdrop (outside the picker)
5. Verify picker closes
6. Verify no portal was created
7. Type "/portal" again
8. Click inside the picker content (not on a bullet)
9. Verify picker stays open

**Expected Results:**
- ✅ Clicking backdrop closes picker
- ✅ No portal created when closing via backdrop
- ✅ Clicking inside picker content doesn't close it

### Scenario 10: Empty State

**Steps:**
1. Navigate to http://localhost:5173
2. Clear all bullets in the document
3. Create one bullet
4. Type "/portal"
5. Verify picker shows "No bullets found" message
6. Type text in search that matches nothing
7. Verify "No bullets found" message appears

**Expected Results:**
- ✅ Empty state shows when no bullets available
- ✅ Empty state shows when search has no matches
- ✅ Cannot create portal when no bullets available

## Success Criteria
All test scenarios pass without errors. Portal creation UI:
- Opens via both slash command and keyboard shortcut
- Provides intuitive search and filter
- Supports keyboard and mouse navigation
- Shows visual hierarchy for nested bullets
- Creates portals correctly and cleans up trigger text
