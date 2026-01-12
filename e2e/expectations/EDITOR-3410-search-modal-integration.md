# EDITOR-3410: Portal Search Modal Integration E2E Tests

## Overview
Integration tests for Cmd+S portal search modal with keyboard shortcuts, portal insertion, and frecency tracking.

## Prerequisites
- Application running on localhost:5173
- Editor loaded with test document containing multiple bullets

## Test Scenario 1: Cmd+S Opens Modal

**Steps:**
1. Navigate to http://localhost:5173
2. Wait for editor to load (persistence status = synced)
3. Click on a bullet to focus it
4. Press Cmd+S (or Ctrl+S on Windows)
5. Verify modal appears with backdrop
6. Verify modal contains:
   - Header: "🔗 Embed a Portal to..."
   - Search input (focused)
   - "Recents" section header (if recents exist)
   - Keyboard hints: "↑↓ Navigate", "↵ Select", "Esc Close"

**Expected Result:**
- Modal opens within 100ms of key press
- Search input is auto-focused
- No browser save dialog appears (prevented)
- No console errors

## Test Scenario 2: Escape Closes Modal Without Action

**Steps:**
1. Open modal with Cmd+S
2. Press Escape key
3. Verify modal closes
4. Verify no portal was created

**Expected Result:**
- Modal closes immediately
- No changes to document
- Focus returns to editor

## Test Scenario 3: Click Outside Closes Modal

**Steps:**
1. Open modal with Cmd+S
2. Click on the backdrop (outside modal content)
3. Verify modal closes

**Expected Result:**
- Modal closes
- No portal created

## Test Scenario 4: Recents Display

**Prerequisites:**
- At least one bullet has been accessed before (via previous portal selection)

**Steps:**
1. First, create a portal by:
   - Type "/portal" in a bullet
   - Select a target bullet
2. Open Cmd+S modal again
3. Verify "Recents" header is displayed
4. Verify previously selected bullet appears in recents list
5. Verify context path is shown for each recent item

**Expected Result:**
- Recents sorted by frecency (most frequent/recent first)
- Context paths show document hierarchy
- Each item shows bullet text

## Test Scenario 5: Fuzzy Search

**Steps:**
1. Open modal with Cmd+S
2. Type "test" in search input
3. Wait 200ms (debounce delay)
4. Verify search results update
5. Verify matching text is highlighted
6. Verify context paths are displayed

**Expected Result:**
- Results update after debounce
- Matching portions highlighted with yellow background
- Empty state shown if no matches

## Test Scenario 6: Keyboard Navigation

**Steps:**
1. Open modal with Cmd+S
2. Ensure recents or search results are displayed
3. Press ArrowDown - verify selection moves to next item
4. Press ArrowDown again - verify selection moves further
5. Press ArrowUp - verify selection moves back up
6. Press Enter - verify portal is created

**Expected Result:**
- Selection highlight moves with arrow keys
- Selection wraps or stops at boundaries
- Enter creates portal from selected item

## Test Scenario 7: Portal Created as Sibling Below Current Bullet

**Steps:**
1. Create document structure:
   - Bullet A
   - Bullet B (will be our cursor position)
   - Bullet C
2. Position cursor in Bullet B
3. Press Cmd+S
4. Select target (e.g., Bullet A) from modal
5. Verify portal is inserted between Bullet B and Bullet C

**Expected Result:**
- New portal block appears as sibling of Bullet B
- Portal is positioned BELOW Bullet B (index = B's index + 1)
- Portal links to selected target
- Document structure: A, B, Portal→A, C

## Test Scenario 8: Frecency Tracking Persists

**Steps:**
1. Open modal with Cmd+S
2. Select a bullet (Bullet X)
3. Refresh page
4. Open modal again
5. Verify Bullet X appears in recents
6. Repeat selection of Bullet X
7. Refresh page again
8. Verify Bullet X has higher frecency (appears first or higher)

**Expected Result:**
- Frecency data persists in localStorage
- Multiple accesses increase frecency score
- Decay factor applies to older items

## Test Scenario 9: Modal Does Not Open Without Selection

**Steps:**
1. Ensure no bullet is focused (click outside editor)
2. Press Cmd+S
3. Verify modal does NOT open

**Expected Result:**
- No modal appears
- May show browser save dialog (normal behavior without cursor)

## Success Criteria

- [ ] Cmd+S opens modal at cursor position
- [ ] Modal displays recents when query is empty
- [ ] Fuzzy search updates on keystroke (200ms debounce)
- [ ] Keyboard navigation works (Arrow keys, Enter, Escape)
- [ ] Portal created as sibling BELOW current bullet
- [ ] Frecency tracker records access on selection
- [ ] Frecency persists across sessions (localStorage)
- [ ] Modal closes on Escape/backdrop click without action
- [ ] No console errors (BUG-001 critical)
- [ ] All UI elements render correctly
