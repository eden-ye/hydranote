# EDITOR-3405: Portal Creation UI

## Description
Provide UI for manually creating portal blocks and selecting target bullets.

## Acceptance Criteria
- [x] Command or shortcut to create portal (e.g., `/portal` or Cmd+Shift+P)
- [x] Picker UI to select target bullet from current document
- [x] Search/filter in picker for finding bullets
- [x] Preview of selected bullet before confirming
- [x] Insert portal as child of current bullet

## Technical Details
- Portal picker modal/dropdown component
- List bullets in current document (tree view or flat list)
- Search: fuzzy match on bullet text
- On selection: create portal block with source reference
- Future: cross-document picker (MVP3+ scope)

## Dependencies
- EDITOR-3401: Portal Block Schema
- EDITOR-3402: Portal Rendering

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 4: Portal. For semantic linking, portals are created automatically (EDITOR-3501), but manual creation is also useful.

## Status
- **Created**: 2026-01-10
- **Completed**: 2026-01-11
- **Status**: completed
- **Epic**: MVP2 - Portal
- **PR**: https://github.com/eden-ye/hydranote/pull/64

## Implementation Summary

### Files Created
- `frontend/src/components/PortalPicker.tsx` - Portal picker modal component
- `frontend/src/components/PortalPicker.css` - Portal picker styles
- `frontend/src/blocks/utils/portal-picker.ts` - Bullet extraction and filtering utilities
- `frontend/src/blocks/utils/portal-creation-shortcut.ts` - Keyboard shortcut detection (Cmd+Shift+P)
- `frontend/src/blocks/utils/portal-slash-command.ts` - Slash command detection (/portal)
- `frontend/src/components/__tests__/PortalPicker.test.tsx` - Portal picker component tests (25 tests)
- `frontend/src/blocks/__tests__/portal-picker.test.ts` - Portal picker utility tests (15 tests)
- `frontend/src/blocks/__tests__/portal-creation-shortcut.test.ts` - Keyboard shortcut tests (8 tests)
- `frontend/src/blocks/__tests__/portal-slash-command.test.ts` - Slash command tests (17 tests)
- `e2e/expectations/EDITOR-3405-portal-creation-ui.md` - E2E test scenarios

### Files Modified
- `frontend/src/components/Editor.tsx` - Added portal picker integration, event handlers, state management
- `frontend/src/blocks/components/bullet-block.ts` - Added Cmd+Shift+P shortcut, /portal slash command detection
- `frontend/src/blocks/utils/index.ts` - Exported new portal picker utilities
- `frontend/src/stores/editor-store.ts` - Added portal picker state (open, query, blockId, selectedIndex)

### Key Implementation Details

**Portal Picker Component:**
- Modal dropdown with search input
- Displays all bullets from current document with visual hierarchy
- Keyboard navigation (ArrowUp/Down, Enter, Escape)
- Mouse interaction (hover to select, click to confirm)
- Preview section showing selected bullet's text
- Filters bullets by search query (case-insensitive)

**Trigger Methods:**
1. **Slash Command**: Typing `/portal` (or partial `/p`, `/po`, etc.) in a bullet
2. **Keyboard Shortcut**: Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)

**Portal Creation Flow:**
1. User triggers portal picker via slash command or shortcut
2. Portal picker opens with cursor position
3. All document bullets extracted and displayed with nesting levels
4. User searches/filters and selects target bullet
5. Portal block created as child of current bullet
6. Trigger text (e.g., `/portal`) removed from parent bullet
7. Portal displays live-synced content from source bullet

**Visual Features:**
- Indentation based on bullet nesting level (level * 24px + 12px base)
- Bold styling for top-level bullets
- Highlighted selection (keyboard or mouse)
- Preview pane at bottom
- Search-as-you-type filtering
- Empty state when no bullets match

### Testing
- **Unit Tests**: 65 new tests, all passing (694 total tests pass)
  - PortalPicker component: 25 tests
  - Portal picker utilities: 15 tests
  - Keyboard shortcut: 8 tests
  - Slash command: 17 tests
- **Build**: TypeScript and Vite build successful
- **E2E**: 10 test scenarios documented in `e2e/expectations/EDITOR-3405-portal-creation-ui.md`

## E2E Testing Results (2026-01-11)

### Automated Chrome Testing - 2026-01-11 18:22 PST

**Status:** ❌ FAILED (Critical Blocker Found)

**Summary:**
E2E testing discovered a critical JavaScript error that prevents the portal picker from opening. Orphaned portal blocks (with deleted sources) throw repeated TypeErrors, breaking the application's event handling.

**Test Environment:**
- Browser: Chrome (latest)
- Platform: macOS
- URL: http://localhost:5173
- Method: Automated Chrome MCP tools

**Critical Issue Found:**
```
TypeError: Cannot read properties of null (reading 'id')
    at _a.render (chunk-RLJQ3PVD.js:368:42)
```

**Impact:**
- Portal picker does not open when typing `/portal`
- Text displays as plain text instead of triggering modal
- 12+ repeated console errors from orphaned portal rendering
- Blocks all 10 test scenarios for EDITOR-3405

**Test Results:**
- ❌ Scenario 1: Portal Creation via Slash Command - FAILED at step 5
- ⏸️ Scenarios 2-10: NOT TESTED (blocked by Scenario 1 failure)

**Root Cause:**
Orphaned portal block attempts to access `source.id` without null check, causing cascade of JavaScript errors that prevent other UI interactions.

**Recommendations:**
1. Add null checks in `frontend/src/blocks/components/portal-block.ts` before accessing source properties
2. Clear IndexedDB test data containing orphaned portals
3. Add defensive coding for all edge cases (null source, missing blocks, corrupted data)
4. Retry E2E testing after fix with clean state

**Next Actions:**
- [ ] Fix TypeError in portal rendering
- [ ] Clear browser storage and Vite cache
- [ ] Retest all 10 scenarios with clean data
- [ ] Verify portal picker opens correctly

**Full Test Report:** See `e2e/expectations/EDITOR-3405-portal-creation-ui.md`
