# EDITOR-3505: Portal Subtree Editing E2E Test Expectations

## Test Environment
- Frontend: `npm run dev` (http://localhost:5173)
- Browser: Chrome

## Preconditions
1. Application loaded at http://localhost:5173
2. User is authenticated or using local mode
3. Source block exists with children (nested bullet hierarchy)
4. A portal block exists referencing the source block

## Test Scenarios

### Scenario 1: Subtree Nodes are Editable
**Steps:**
1. Create a source bullet block "Tesla" with children:
   - "What it is" > "Electric car company"
   - "Founded" > "2003"
2. Create a portal block referencing "Tesla"
3. Ensure portal is expanded
4. Click on a subtree node text (e.g., "What it is")

**Expected:**
- [ ] Subtree node content should be focusable
- [ ] Cursor should appear in the text
- [ ] rich-text editor is rendered for the node

### Scenario 2: Edit Warning Shows on First Subtree Edit
**Steps:**
1. With portal expanded and subtree visible
2. Click into any subtree node's content area
3. Before typing, observe the warning banner

**Expected:**
- [ ] Warning banner appears: "Changes will affect the source document. Other portals referencing this content will also update."
- [ ] "Got it" button is visible

### Scenario 3: Dismiss Subtree Warning Permanently
**Steps:**
1. Click "Got it" button on the warning banner

**Expected:**
- [ ] Warning banner disappears
- [ ] Warning does not reappear on subsequent subtree node focuses

### Scenario 4: Subtree Edit Syncs to Source Block
**Steps:**
1. Click on subtree node "What it is"
2. Edit to "What Tesla is"
3. Observe both portal subtree and source document

**Expected:**
- [ ] Portal subtree text becomes "What Tesla is"
- [ ] Source document's child block also becomes "What Tesla is"
- [ ] Sync happens in real-time

### Scenario 5: Visual Indication While Editing Subtree Node
**Steps:**
1. Click into a subtree node to start editing
2. Observe the node's styling

**Expected:**
- [ ] Subtree node shows "Editing source" badge
- [ ] Node has subtle background color change (editing state)
- [ ] Node has hover effect when editable

### Scenario 6: Cursor Navigation Within Subtree Works
**Steps:**
1. Focus on a subtree node
2. Use keyboard arrows to move cursor within text
3. Select text with Shift+Arrow

**Expected:**
- [ ] Arrow keys move cursor within text
- [ ] Shift+Arrow selects text
- [ ] Tab does not navigate between subtree nodes (standard text edit behavior)

### Scenario 7: Rich Text Formatting in Subtree Nodes
**Steps:**
1. Select text within a subtree node
2. Apply bold (Cmd/Ctrl+B)
3. Apply italic (Cmd/Ctrl+I)

**Expected:**
- [ ] Bold formatting applies and syncs to source
- [ ] Italic formatting applies and syncs to source
- [ ] Formatting visible in both portal and source

### Scenario 8: Subtree Not Editable When Portal Collapsed
**Steps:**
1. Collapse the portal (click toggle icon)
2. Subtree is not visible

**Expected:**
- [ ] Subtree is hidden when portal collapsed
- [ ] Only expand/collapse toggle is interactive

### Scenario 9: Subtree Not Editable When Portal Orphaned
**Steps:**
1. Delete the source block
2. Observe the orphaned portal

**Expected:**
- [ ] Portal shows orphaned state (red border)
- [ ] "Source deleted" message appears
- [ ] Subtree is not rendered

### Scenario 10: Different Nodes Can Be Edited Sequentially
**Steps:**
1. Click on subtree node "What it is", edit it
2. Click on subtree node "2003", edit it
3. Observe editing state transitions

**Expected:**
- [ ] First node exits edit mode when second is focused
- [ ] Only one "Editing source" indicator at a time
- [ ] All edits sync correctly to source

## Non-Functional Tests

### Performance
- [ ] Editing subtree nodes has same responsiveness as editing source directly
- [ ] No lag when typing in subtree node
- [ ] Subtree rendering doesn't cause UI jank

### Accessibility
- [ ] Subtree nodes are keyboard accessible
- [ ] Focus indicator visible when editing
- [ ] Warning banner is readable by screen readers

## Test Results

**Tester:** Claude Code
**Date:** 2026-01-12
**Environment:** macOS, localhost:5174

### Test Status: SKIPPED (Chrome MCP Not Available)

**Summary:**
Chrome E2E testing could not proceed because Chrome MCP tools are not connected to the current session.

**Implementation Verification:**
- All unit tests pass (38 tests in portal-subtree-editing.test.ts)
- TypeScript build succeeds
- Code follows existing patterns from EDITOR-3404 portal editing
- CSS classes and styles added for subtree editing states

**Code Changes Made:**
1. Created `portal-subtree-editing.ts` utility with state management and CSS class functions
2. Updated `portal-block.ts` to:
   - Import subtree editing utilities
   - Add subtree editing state tracking
   - Render rich-text for editable subtree nodes
   - Handle focus/blur for subtree editing
   - Show "Editing source" indicator for active node
   - Display edit warning banner on first edit
   - Add CSS for subtree editing states

**Manual Testing Recommended:**
To verify the implementation:
1. Run `npm run dev` in frontend
2. Create a source block with children
3. Create a portal to that block
4. Expand the portal to see subtree
5. Click on subtree nodes to edit
6. Verify edits sync to source document

### Scenarios Not Tested Automatically:
All 10 scenarios require manual browser verification or Chrome MCP connection.
