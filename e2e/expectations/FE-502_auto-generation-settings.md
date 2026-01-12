# FE-502: Auto-Generation Settings E2E Test

## Test: Auto-Generation Settings Panel UI

### Prerequisites:
1. Frontend running at http://localhost:5173
2. Backend running at http://localhost:8000

### Steps:
1. Navigate to http://localhost:5173
2. Open Settings panel (click gear icon or settings button)
3. Scroll to "Auto Generation" section
4. Verify all UI elements are present

### Expected (Initial State):
- [ ] "Auto Generation" section header is visible
- [ ] "Auto-generate after descriptor creation" toggle is visible and OFF by default
- [ ] "Bullets per descriptor" input shows value "3"
- [ ] "Bullets per descriptor" input is disabled when toggle is OFF
- [ ] "Trigger on descriptor types" label is visible
- [ ] 5 checkboxes visible: What, Why, How, Pros, Cons
- [ ] What, Why, How checkboxes are checked by default
- [ ] Pros, Cons checkboxes are unchecked by default
- [ ] All trigger checkboxes are disabled when toggle is OFF

### Steps (Enable Auto-Generation):
5. Click "Auto-generate after descriptor creation" toggle to enable
6. Verify controls become enabled

### Expected (Enabled State):
- [ ] Toggle is ON
- [ ] "Bullets per descriptor" input is now enabled
- [ ] All trigger checkboxes are now enabled
- [ ] Disabled styling is removed from controls

### Steps (Modify Settings):
7. Change "Bullets per descriptor" to 5
8. Uncheck "What" checkbox
9. Check "Pros" checkbox
10. Refresh the page

### Expected (Persistence):
- [ ] Settings are persisted in localStorage
- [ ] After refresh, toggle remains ON
- [ ] "Bullets per descriptor" shows 5
- [ ] "What" is unchecked
- [ ] "Pros" is checked
- [ ] Other checkboxes retain their state

### Steps (Boundary Testing):
11. Try setting "Bullets per descriptor" to 0
12. Try setting "Bullets per descriptor" to 10

### Expected (Validation):
- [ ] Value 0 is clamped to minimum (1)
- [ ] Value 10 is clamped to maximum (5)

### Selector hints:
- Settings panel: [data-testid="settings-panel"]
- Auto-generation toggle: [data-testid="auto-generation-toggle"]
- Generation count input: [data-testid="generation-count-input"]
- Generation count row: [data-testid="generation-count-row"]
- Triggers row: [data-testid="triggers-row"]
- Trigger checkboxes: [data-testid="trigger-what-checkbox"], [data-testid="trigger-why-checkbox"], etc.

### Console errors:
- [ ] No console errors during test

## Test Result

**Date**: 2026-01-12
**Status**: MANUAL VERIFICATION PENDING
**Notes**: Chrome MCP tool not connected. Unit tests pass. Visual verification needed.
