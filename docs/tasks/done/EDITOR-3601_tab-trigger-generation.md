# EDITOR-3601: Tab Trigger at Deepest Level

## Description
When user presses Tab at the maximum indentation level (can't indent further), trigger AI generation for the parent descriptor.

## Acceptance Criteria
- [x] Detect Tab press when bullet is at max indent depth
- [x] Trigger AI generation for parent descriptor's topic
- [x] Generate 1-5 child bullets with concise key points (via existing expand feature)
- [x] Insert generated bullets as children (handled by existing expand infrastructure)
- [x] Show loading indicator during generation (existing expand UI)
- [x] Respect AI generation rate limits (existing rate limit checks)

## Technical Details
- "Deepest level" = Tab would normally fail (no further indentation possible)
- Alternative interpretation: user is "already indented" under a descriptor
- Get parent descriptor type (What, Why, How, etc.)
- Call AI generation API with context:
  - Parent bullet text
  - Descriptor type
  - Sibling content for context
- Stream or batch insert generated bullets

## Implementation Summary

### Files Modified
1. **`frontend/src/blocks/components/bullet-block.ts`**
   - Added `TabTriggerInput` interface for Tab trigger detection
   - Added `shouldTriggerDescriptorGeneration()` - determines if Tab should trigger AI
   - Added `DescriptorGenerationContext` interface for AI context
   - Added `DescriptorGenerationInput` interface for context building
   - Added `buildDescriptorGenerationContext()` - builds context for AI prompt
   - Modified Tab handler to check for descriptor generation trigger
   - Added `_dispatchDescriptorGeneration()` - dispatches custom event with context

2. **`frontend/src/components/Editor.tsx`**
   - Imported `DescriptorGenerationContext` type
   - Added `handleDescriptorGenerateEvent` callback handler
   - Added event listener for `hydra-descriptor-generate` event
   - Added cleanup for the event listener

### Event Flow
1. User presses Tab in a bullet block
2. Tab handler checks if indentation is possible
3. If no previous sibling exists (can't indent), checks if parent is a descriptor
4. If parent is descriptor, dispatches `hydra-descriptor-generate` event
5. Editor.tsx catches event and calls `expandBlock()` with descriptor context
6. Existing WebSocket streaming handles AI generation and bullet insertion

## Dependencies
- EDITOR-3201: Descriptor Block Schema
- Existing AI generation infrastructure (MVP1 expand feature)

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 6: Auto AI Generation. Extends MVP1 expand feature.

## Testing

### Unit Tests Added
- `bullet-block-component.test.ts`: 9 new tests for EDITOR-3601
  - `shouldTriggerDescriptorGeneration()` - 5 tests covering all conditions
  - `buildDescriptorGenerationContext()` - 4 tests for context building

### E2E Testing Checklist
- [ ] Start app at localhost:5173
- [ ] Create bullet and add descriptor (type `~what`, `~why`, etc.)
- [ ] Add child bullet under the descriptor
- [ ] Press Tab when there's no previous sibling
- [ ] Verify AI generation triggers (console log: "[DescriptorGenerate] Generating for descriptor:")
- [ ] Verify generated bullets appear as children

## Status
- **Created**: 2026-01-10
- **Completed**: 2026-01-12
- **Status**: ⚠️ INCOMPLETE - Missing Chrome E2E testing
- **Epic**: MVP2 - Auto AI Generation

## Commits
- feat(editor): Add Tab trigger AI generation for descriptors (EDITOR-3601)

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
3. Execute scenarios from `e2e/expectations/EDITOR-3601_tab-trigger-generation.md`:
   - Scenario 1: Tab triggers AI generation under descriptor
   - Scenario 2: Tab indents normally when previous sibling exists
   - Scenario 3: Tab does nothing when not under descriptor
4. Verify console log shows "[DescriptorGenerate] Generating for descriptor:"
5. Capture screenshot evidence
6. Verify no console errors

**Reference:** See `e2e/results/EDITOR-3406_3601_3602_combined-e2e-report.md` for full details.

**TDD Workflow:** Step 7 (Chrome E2E) is INCOMPLETE. Per CLAUDE.md rules, this ticket should NOT be in `done/` folder until E2E testing is completed.
