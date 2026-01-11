# EDITOR-3404: Portal Editing E2E Test Expectations

## Test Environment
- Frontend: `npm run dev` (http://localhost:5173)
- Browser: Chrome

## Preconditions
1. Application loaded at http://localhost:5173
2. User is authenticated or using local mode
3. At least one bullet block exists in the document
4. A portal block exists referencing the bullet block

## Test Scenarios

### Scenario 1: Portal Content is Editable When Expanded
**Steps:**
1. Create a source bullet block with text "Hello World"
2. Create a portal block referencing the source
3. Ensure portal is expanded (click 📎 icon if collapsed)
4. Click on the portal content area

**Expected:**
- [ ] Portal content area should be focusable
- [ ] Cursor should appear in the text
- [ ] Content should match source: "Hello World"

### Scenario 2: Edit Warning Shows on First Edit
**Steps:**
1. With portal expanded, click into the content area
2. Before typing, observe the warning banner

**Expected:**
- [ ] Warning banner appears: "Editing will modify the source block. Changes will be reflected in all places this block is referenced."
- [ ] "Got it" button is visible

### Scenario 3: Dismiss Warning Permanently
**Steps:**
1. Click "Got it" button on the warning banner

**Expected:**
- [ ] Warning banner disappears
- [ ] Warning does not reappear on subsequent focuses

### Scenario 4: Text Edit Syncs to Source Block
**Steps:**
1. With portal expanded and focused, type " - edited via portal"
2. Observe both portal content and source block

**Expected:**
- [ ] Portal text becomes "Hello World - edited via portal"
- [ ] Source block text also becomes "Hello World - edited via portal"
- [ ] Sync happens in real-time

### Scenario 5: Visual Indication While Editing
**Steps:**
1. Click into portal content to start editing
2. Observe the portal container styling

**Expected:**
- [ ] Portal container shows "Editing source" badge in header
- [ ] Portal border becomes thicker or has glow effect (editing state)
- [ ] Left border remains indigo color

### Scenario 6: Cursor and Selection Work
**Steps:**
1. In portal content, double-click on a word
2. Try selecting text by dragging
3. Use keyboard arrows to move cursor

**Expected:**
- [ ] Double-click selects word
- [ ] Drag selection works correctly
- [ ] Arrow keys move cursor within text

### Scenario 7: Portal Not Editable When Collapsed
**Steps:**
1. Collapse the portal (click 🔗 icon)
2. Try to click on the collapsed preview

**Expected:**
- [ ] Preview text is not editable
- [ ] Clicking doesn't show cursor
- [ ] Only expand/collapse toggle is interactive

### Scenario 8: Portal Not Editable When Orphaned
**Steps:**
1. Delete the source block
2. Observe the orphaned portal
3. Try to interact with content area

**Expected:**
- [ ] Portal shows orphaned state (red border)
- [ ] "Source deleted" message appears
- [ ] Content area is not interactive/editable

### Scenario 9: Editing Portal Updates Source in Real-Time
**Steps:**
1. Position both source block and portal in view
2. Edit text in portal, watch source
3. Edit text in source, watch portal

**Expected:**
- [ ] Portal-to-source: Changes immediately reflect in source
- [ ] Source-to-portal: Changes immediately reflect in portal
- [ ] No visible delay (< 100ms)

### Scenario 10: Concurrent Edit Handling (Yjs CRDT)
**Steps:**
1. Have portal and source both visible
2. Make rapid edits in portal
3. Make rapid edits in source

**Expected:**
- [ ] Both edits are preserved via Yjs CRDT
- [ ] No data loss or corruption
- [ ] Text converges to consistent state

## Non-Functional Tests

### Performance
- [ ] Editing in portal has same responsiveness as editing source directly
- [ ] No lag when typing in portal
- [ ] Live sync doesn't cause UI jank

### Accessibility
- [ ] Portal content is keyboard navigable
- [ ] Focus indicator visible when editing
- [ ] Warning banner is readable by screen readers

## Test Results
(To be filled after Chrome E2E testing)

- **Tester**:
- **Date**:
- **Results**:
