# EDITOR-3602: Auto-Generate After Descriptor

## Description
Optionally auto-generate content immediately after a descriptor is created.

## Acceptance Criteria
- [x] When descriptor is inserted, optionally trigger AI generation
- [x] Feature is configurable in settings (on/off)
- [x] Debounce to avoid rapid triggers
- [x] Generate 1-5 children based on descriptor type
- [x] User can cancel during generation
- [x] Clear visual indication of auto-generation in progress

## Technical Details
- Hook into descriptor insertion event (EDITOR-3204)
- Check settings for auto-generate preference
- Debounce: wait 500ms after descriptor insert before generating
- Cancel: if user starts typing, abort generation
- Same AI generation logic as EDITOR-3601

## Dependencies
- EDITOR-3201: Descriptor Block Schema
- EDITOR-3204: Descriptor Selection & Insertion
- FE-502: Auto-Generation Settings
- Existing AI generation infrastructure

## Parallel Safe With
- API-*, AUTH-*

## Notes
Part of Epic 6: Auto AI Generation. Optional convenience feature.

## Status
- **Created**: 2026-01-10
- **Completed**: 2026-01-12
- **Status**: ⚠️ INCOMPLETE - Missing Chrome E2E testing
- **Epic**: MVP2 - Auto AI Generation

## Implementation Summary

### Files Modified
1. **`frontend/src/blocks/utils/auto-generate.ts`** (NEW)
   - Pure logic functions for auto-generate feature
   - `shouldAutoGenerate()` - determines if auto-generate should trigger
   - `shouldCancelAutoGenerate()` - determines if user typing should cancel
   - `buildAutoGenerateContext()` - builds context for AI generation
   - `getNextAutoGenerateStatus()` - state machine for status transitions
   - `createDebouncedAutoGenerate()` - creates debounced trigger
   - `validateAutoGenerateSettings()` - validates settings

2. **`frontend/src/stores/editor-store.ts`**
   - Added auto-generate state: `autoGenerateEnabled`, `autoGenerateStatus`, `autoGenerateBlockId`
   - Added actions: `setAutoGenerateEnabled`, `setAutoGenerateStatus`, `startAutoGenerate`, `completeAutoGenerate`, `cancelAutoGenerate`, `resetAutoGenerate`
   - Added selectors: `selectAutoGenerateEnabled`, `selectAutoGenerateStatus`, `selectAutoGenerateBlockId`, `selectIsAutoGenerating`

3. **`frontend/src/components/Editor.tsx`**
   - Added auto-generate state management
   - Modified `handleDescriptorSelect` to trigger auto-generation after descriptor insertion
   - Added useEffect to track expansion completion
   - Added keydown event listener to cancel on user typing
   - Added visual indicator UI showing pending/generating status with cancel button

4. **`frontend/src/index.css`**
   - Added spin animation for loading indicator

5. **`frontend/src/blocks/__tests__/auto-generate.test.ts`** (NEW)
   - 26 unit tests covering all logic functions

### How It Works
1. When a descriptor (e.g., ~what) is inserted via autocomplete
2. If `autoGenerateEnabled` is true and no generation is in progress
3. System shows "Preparing to generate content..." indicator
4. After 500ms debounce, generation starts using existing `expandBlock` hook
5. If user starts typing during pending state, generation is cancelled
6. User can also click "Cancel" button to stop generation
7. Status transitions: idle → pending → generating → completed/cancelled → idle

### Test Results
- All 736 unit tests pass
- Build successful

## E2E Testing Status (2026-01-12)

**Status:** ❌ NOT COMPLETED

**Blocker:** Environment issues prevented E2E testing execution. Console shows 7 TypeError exceptions from stale IndexedDB data.

**Test Environment Issues:**
- Orphaned portal blocks from previous sessions cause console errors
- Clean browser state required for reliable E2E validation
- E2E expectations file exists but scenarios not executed

**Required Actions:**
1. Clear all browser Application data (DevTools)
2. Test in fresh Incognito window
3. Execute scenarios from `e2e/expectations/EDITOR-3602_auto-generate-after-descriptor.md`:
   - Scenario 1: Auto-generation triggers after descriptor insertion
   - Scenario 2: User can cancel pending generation by typing
   - Scenario 3: User can cancel active generation
   - Scenario 4: Auto-generation respects settings
   - Scenario 5: Multiple descriptors don't cause conflicts
4. Verify indicator shows "Preparing to generate content..."
5. Verify 500ms debounce works correctly
6. Capture screenshot evidence
7. Verify no console errors

**Reference:** See `e2e/results/EDITOR-3406_3601_3602_combined-e2e-report.md` for full details.

**TDD Workflow:** Step 7 (Chrome E2E) is INCOMPLETE. Per CLAUDE.md rules, this ticket should NOT be in `done/` folder until E2E testing is completed.
