# FE-504: Left Panel Header Cleanup & Block Wiring

## Description

Follow-up to FE-503 (Left Panel with Favorites). Two issues identified:
1. **Redundant header**: UserInfo and Settings button in left panel duplicate the main Header
2. **No blocks in ALL BULLETS**: `topLevelBlockIds` not wired to LeftPanel, shows "No blocks yet"

## Acceptance Criteria

- [x] Remove UserInfo component from left panel (user info already in main Header)
- [x] Remove Settings button from left panel (settings already in main Header)
- [x] ALL BULLETS section shows all top-level bullets from the document
- [x] Star/favorite button visible on hover over blocks in ALL BULLETS
- [x] Clicking star adds block to FAVORITES section
- [x] No new console errors (pre-existing BUG-001 orphan block errors only)
- [x] All tests pass (1545 tests)

## Implementation Plan

### Step 1: Remove Header from LeftPanel
- Remove `UserInfo` component import and render
- Remove `SettingsPanel` import
- Remove Settings button and `showSettings` state
- Remove Settings modal render
- Remove `SettingsIcon` function
- Remove `UserInfo` export

### Step 2: Add Block State to Store
- Add `blockTitles: Map<string, string>` to EditorState
- Add `topLevelBlockIds: string[]` to EditorState
- Add `syncBlockData` action to update both

### Step 3: Sync Blocks from Editor
- Add helper function to extract top-level blocks from BlockSuite doc
- Call `syncBlockData` on initial load
- Subscribe to `doc.slots.blockUpdated` to sync on changes
- Add cleanup for subscription

### Step 4: Update LeftPanel to Read from Store
- Remove props interface (`blockTitles`, `topLevelBlockIds`)
- Read from `useEditorStore` instead

### Step 5: Update Tests
- Remove UserInfo section tests
- Remove Settings button tests
- Update mock store with new state

## Files to Modify

| File | Changes |
|------|---------|
| frontend/src/components/LeftPanel/index.tsx | Remove header, read from store |
| frontend/src/stores/editor-store.ts | Add blockTitles, topLevelBlockIds, syncBlockData |
| frontend/src/components/Editor.tsx | Add block extraction and observation |
| frontend/src/components/LeftPanel/__tests__/LeftPanel.test.tsx | Remove header tests, update mocks |

## Dependencies

- FE-503 (completed) - base implementation

## Parallel Safe With

- AUTH-*, API-*, EDITOR-* (different areas)

## Estimate

2 hours

## Status

- **Created**: 2026-01-13
- **Completed**: 2026-01-13
- **Status**: Local E2E OK
- **Epic**: MVP2 - Left Panel Navigation
- **Branch**: fe/FE-504-left-panel-cleanup
- **Commit**: 751fab3
- **PR**: https://github.com/eden-ye/hydranote/pull/114

## E2E Testing Results

- ✅ No user info/settings in left panel header
- ✅ ALL BULLETS shows document blocks
- ✅ Star button appears on hover
- ✅ Click star adds block to FAVORITES
- ⚠️ Pre-existing BUG-001 console errors (BlockSuite orphaned blocks)
