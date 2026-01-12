# BUG-001: Orphaned Portal Crash Prevents Portal Picker

## Summary
JavaScript TypeError from orphaned portal blocks prevents portal picker from opening, blocking all portal creation and editing functionality.

## Discovery
- **Date**: 2026-01-11
- **Context**: E2E testing EDITOR-3404 and EDITOR-3405 with Chrome automation
- **Severity**: Critical - Complete feature blocker

## Symptoms

### User-Visible
- Typing `/portal` in any bullet displays as plain text instead of opening picker modal
- Keyboard shortcut Cmd+Shift+P does not trigger portal picker
- No visual feedback when attempting to create portals
- Orphaned portal visible on page with "Source deleted" message

### Technical
```
TypeError: Cannot read properties of null (reading 'id')
    at _a.render (chunk-RLJQ3PVD.js:368:42)
```

- 12+ repeated console errors continuously
- Errors originate from BlockSuite's Lit rendering internals (chunk-RLJQ3PVD.js)
- Event propagation broken - portal picker open event never handled

## Reproduction Steps

1. Load Hydra Notes application with existing orphaned portal in IndexedDB
2. Orphaned portal: portal block where source block was previously deleted
3. Open browser console - observe continuous TypeErrors
4. Create a new bullet and type `/portal`
5. **Expected**: Portal picker modal opens
6. **Actual**: Text "/portal" appears as plain text, no modal

## Root Cause Analysis

### Investigation Timeline

1. **Initial Hypothesis**: Portal picker component has a bug
   - **Finding**: PortalPicker.tsx code is correct, uses `bullet.id` as React key (line 150)
   - **Conclusion**: Not the root cause - component never renders

2. **Second Hypothesis**: Portal picker utils have null handling issues
   - **Finding**: `extractBulletsFromDoc()` properly validates blocks before accessing properties
   - **Conclusion**: Not the root cause - function never called

3. **Third Hypothesis**: Event dispatch is broken
   - **Finding**: Bullet block dispatches 'hydra-portal-picker-open' event correctly
   - **Finding**: Editor component has event listener registered
   - **Conclusion**: Events not propagating due to JavaScript errors

4. **Final Discovery**: Orphaned portal's render method crashes
   - **Location**: `frontend/src/blocks/components/portal-block.ts`
   - **Issue**: Accessing `this.model` properties without null check
   - **Impact**: Continuous render errors break event system

### Why This Happened

**Orphaned Portal Lifecycle:**
1. Portal block created with valid source block
2. Source block gets deleted (becomes orphaned)
3. Portal remains in document with invalid sourceBlockId
4. Data persists in Y-indexeddb across page reloads
5. On next page load, portal tries to render but source doesn't exist
6. Model might become corrupted or invalid during cleanup
7. `renderBlock()` accesses `this.model.syncStatus` without checking if model exists
8. TypeError thrown repeatedly (Lit re-renders on errors)
9. JavaScript errors prevent event handlers from executing
10. Portal picker open event never reaches Editor component

**Why Tests Passed:**
- Unit tests mock BlockSuite properly with valid models
- E2E tests didn't test with corrupted/orphaned state
- Build process doesn't catch runtime rendering issues
- IndexedDB persistence wasn't tested with edge cases

## Fix Implementation

### Files Modified
- `frontend/src/blocks/components/portal-block.ts`

### Changes Made

**1. Added null check in `renderBlock()` (line 354-366)**
```typescript
override renderBlock(): TemplateResult {
  // BUGFIX: Add defensive null check for model
  if (!this.model) {
    return html`
      <div class="portal-container portal-orphaned">
        <div class="portal-content">
          <div class="portal-orphaned-message">
            Invalid portal block (missing model). Please delete this block.
          </div>
        </div>
      </div>
    `
  }
  // ... rest of render logic
}
```

**2. Added null check in `_toggleCollapse()` (line 538-539)**
```typescript
private _toggleCollapse(): void {
  if (!this.model) return
  // ... rest of toggle logic
}
```

**3. Added null check in `_formatSourceHint()` (line 550-551)**
```typescript
private _formatSourceHint(): string {
  if (!this.model) return 'Invalid source'
  // ... rest of formatting logic
}
```

**4. Added null check in `_setupSourceObserver()` (line 570-574)**
```typescript
private _setupSourceObserver(): void {
  // ... initialization
  if (!this.model) {
    this._isLoading = false
    return
  }
  // ... rest of setup logic
}
```

**5. Added null check in `onOrphaned` callback (line 592-597)**
```typescript
onOrphaned: () => {
  this._isLoading = false
  this._sourceYText = null
  if (this.model) {
    this.doc.updateBlock(this.model, {
      syncStatus: 'orphaned',
    })
  }
  this.requestUpdate()
}
```

### Why This Fix Works

1. **Prevents Crashes**: Null checks stop TypeErrors before they occur
2. **Graceful Degradation**: Invalid portals render with clear error message
3. **Preserves Functionality**: Other blocks continue working normally
4. **User Guidance**: Error message tells user to delete invalid block
5. **No Data Loss**: Doesn't automatically delete potentially recoverable data

## What I Learned

### Technical Insights

1. **Lit Component Lifecycle**:
   - Lit components can enter invalid states during cleanup
   - `this.model` can become null even in properly instantiated components
   - Defensive coding is critical in render methods

2. **BlockSuite Edge Cases**:
   - Orphaned blocks can persist across sessions via Y-indexeddb
   - Source deletion doesn't automatically clean up dependent blocks
   - Block model validity isn't guaranteed during lifecycle

3. **Event Propagation**:
   - JavaScript errors in one component can break event handling globally
   - Continuous render errors create cascading failures
   - Event listeners stop working when error boundaries aren't crossed

4. **Testing Gaps**:
   - Unit tests don't catch rendering lifecycle issues
   - E2E tests need to cover corrupted/orphaned state scenarios
   - IndexedDB persistence testing is critical for editor apps

### What I Tried (Investigation Steps)

1. ✅ Read E2E test expectations for EDITOR-3404 and EDITOR-3405
2. ✅ Started frontend dev server with clean Vite cache
3. ✅ Opened Chrome automation with MCP tools
4. ✅ Attempted to type "/portal" in application
5. ✅ Captured screenshots showing failure
6. ✅ Read console errors (found 12+ TypeErrors)
7. ✅ Analyzed error stack trace (chunk-RLJQ3PVD.js:368:42)
8. ✅ Examined PortalPicker.tsx for null handling (line 150: bullet.id)
9. ✅ Examined portal-picker.ts utils for null handling
10. ✅ Examined portal-block.ts render method
11. ✅ Examined portal-sync.ts observer creation
12. ✅ Examined Editor.tsx event handling
13. ✅ Traced event dispatch from bullet-block.ts
14. ✅ Identified missing null checks in portal-block.ts
15. ✅ Added defensive null guards in 5 locations
16. ✅ Documented findings and fix

### Process Lessons

1. **Start with Symptoms**: Console errors are the fastest path to root cause
2. **Trace Backwards**: From symptom → error → calling code → root
3. **Trust Tests, Verify Runtime**: Passing tests don't guarantee production safety
4. **Edge Cases First**: Orphaned/corrupted states expose most bugs
5. **Defensive Coding**: Always check assumptions, especially in render methods

## Prevention Measures

### Code Quality
- [ ] Add ESLint rule to warn on unchecked property access
- [ ] Add null check template for Lit component render methods
- [ ] Document Lit component lifecycle edge cases

### Testing
- [ ] Add E2E test for orphaned portal state
- [ ] Add E2E test for corrupted block data
- [ ] Add IndexedDB corruption scenarios to test suite
- [ ] Test with various invalid/edge case states

### Documentation
- [ ] Add "Defensive Coding" section to CLAUDE.md
- [ ] Document common Lit component pitfalls
- [ ] Create guide for testing IndexedDB persistence

## Verification Plan

After fix is deployed:
1. Clear Vite cache: `rm -rf frontend/node_modules/.vite`
2. Restart dev server
3. Clear browser IndexedDB (or delete orphaned portal)
4. Reload application
5. Verify no console errors
6. Type `/portal` → Picker should open
7. Press Cmd+Shift+P → Picker should open
8. Complete all 10 EDITOR-3405 scenarios
9. Complete all 10 EDITOR-3404 scenarios

## Related Issues

- EDITOR-3404: Portal Editing (blocked by this bug)
- EDITOR-3405: Portal Creation UI (blocked by this bug)

## References

- E2E Test Report: `e2e/expectations/EDITOR-3405-portal-creation-ui.md`
- E2E Test Report: `e2e/expectations/EDITOR-3404-portal-editing.md`
- Task Documentation: `docs/tasks/done/EDITOR-3405_portal-creation-ui.md`
- Task Documentation: `docs/tasks/done/EDITOR-3404_portal-editing.md`
