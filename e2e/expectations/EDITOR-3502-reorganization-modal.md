# EDITOR-3502: Reorganization Modal E2E Expectations

## Overview
This test verifies the reorganization modal UI triggered by Cmd+Shift+L keyboard shortcut.

## Prerequisites
- Frontend dev server running on http://localhost:5173
- Backend running on http://localhost:8000 (for real API calls, though mocks are used in test)

## Test Scenarios

### 1. Open Reorganization Modal with Cmd+Shift+L

**Steps:**
1. Navigate to http://localhost:5173
2. Wait for editor to load (see editor container)
3. Click on a bullet to focus it
4. Press Cmd+Shift+L (or Ctrl+Shift+L on Windows)

**Expected Result:**
- Modal opens with backdrop
- Modal header shows "Connect to Existing Knowledge" with link icon
- Modal shows "Analyzing your note..." loading state while extracting concepts

### 2. View Concept Matches

**Steps:**
1. Wait for loading to complete
2. Observe the concept matches displayed

**Expected Result:**
- Modal shows "Found X concepts in your note" (where X is number of concepts)
- Each concept is displayed with its category in parentheses
- Concepts can be expanded/collapsed by clicking the arrow
- For concepts with matches:
  - Each match shows context path and similarity score in parentheses
  - Checkboxes allow selection/deselection
- For concepts without matches:
  - Shows warning icon with "No matches found above threshold"

### 3. Select/Deselect Matches

**Steps:**
1. Click on checkboxes next to matches
2. Observe the "Connect Selected (N)" button

**Expected Result:**
- Checkbox toggles between checked and unchecked
- "Connect Selected (N)" button updates count based on selections
- When no matches selected, button should be disabled

### 4. Connect Selected

**Steps:**
1. Select one or more matches
2. Click "Connect Selected" button

**Expected Result:**
- Modal closes
- Portal blocks are created for each selected match
- Console log shows portal creation messages

### 5. Skip Without Connecting

**Steps:**
1. Open modal with Cmd+Shift+L
2. Click "Skip" button

**Expected Result:**
- Modal closes without creating any portals
- No console errors

### 6. Close Modal with Escape

**Steps:**
1. Open modal with Cmd+Shift+L
2. Press Escape key

**Expected Result:**
- Modal closes
- No changes made

### 7. Close Modal by Clicking Backdrop

**Steps:**
1. Open modal with Cmd+Shift+L
2. Click outside the modal content (on the dark backdrop)

**Expected Result:**
- Modal closes
- No changes made

### 8. Error State

**Steps:**
1. (Simulate network error - requires mock modification)
2. Observe error state

**Expected Result:**
- Error message displayed with warning icon
- "Retry" button available
- Modal remains open for retry

## Test Evidence
Screenshots should be captured for:
1. Modal open with loading state
2. Modal with concepts loaded
3. Modal with selections made
4. Connect button disabled state (no selections)
5. Error state (if testable)

## Pass Criteria
- All test scenarios pass
- No JavaScript console errors during testing
- Modal styling matches design spec in ticket
