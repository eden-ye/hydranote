# BUG-EDITOR-3709: Prevent Root-Level Typing in Editor

## Symptoms

- Users can type at the root level of the editor (outside of any bullet)
- A "Type '/' for commands" placeholder appears at the root level
- Content typed at root level is not properly structured in the hierarchy

## Expected Behavior

- Users should NEVER be able to type at the root level
- All content must exist within bullets (hierarchical structure)
- The root level should not accept text input or show typing placeholders
- Only the first bullet (title bullet) should be directly editable at the top level

## Root Cause Analysis

### Investigation Findings

After thorough investigation, the issue was found to be largely prevented by the existing architecture:

1. **BlockSuite "Type '/' for commands" placeholder**: This placeholder is a feature of `affine:paragraph` blocks from BlockSuite. Our editor uses `hydra:bullet` blocks exclusively, so this placeholder doesn't appear.

2. **Schema configuration**: The schema extends `affine:note` to only accept `hydra:bullet` and `hydra:portal` as children (Editor.tsx lines 1186-1191), which prevents `affine:paragraph` blocks from being created.

3. **Keyboard handling**: All keyboard shortcuts including Enter are bound to `hydra:bullet` blocks via `bindHotKey` with `{ flavour: true }`, ensuring new blocks are always `hydra:bullet`.

### Defensive Measures Added

Although the issue was not actively reproducible, defensive measures were implemented to prevent potential future issues:

1. **CSS protections** (index.css):
   - Hide any potential placeholder pseudo-elements at root level
   - Hide any `affine:paragraph` blocks that might be created
   - Hide any non-hydra child elements in the note container

2. **Click handler** (Editor.tsx):
   - Redirect clicks on empty note area to first bullet
   - Ensures users always end up in a valid editing context

## Solution Implemented

### Files Changed

1. **frontend/src/index.css**
   - Added CSS rules to hide placeholder elements at root level
   - Added rules to hide any `affine:paragraph` blocks
   - Added rules to ensure only `hydra-bullet-block` and `hydra-portal-block` are visible

2. **frontend/src/components/Editor.tsx**
   - Added click handler to redirect clicks on note block's empty area to first bullet
   - Ensures focus always ends up in a valid `hydra:bullet` block

3. **frontend/src/blocks/__tests__/root-level-typing.test.ts**
   - Added unit tests documenting expected behavior
   - Tests validate schema configuration and keyboard behavior

## Impact

- Medium priority - affects data structure integrity
- Users may accidentally create orphaned content outside the bullet hierarchy
- Confusing UX where some content doesn't follow hierarchical rules

## Acceptance Criteria

- [x] No placeholder text appears at the root level
- [x] Clicking at root level focuses the first bullet (or creates one)
- [x] Typing at root level is either blocked or redirected to bullets
- [x] All content remains within the bullet hierarchy

## E2E Test Results

| Test | Result |
|------|--------|
| No "Type '/' for commands" placeholder visible | PASSED |
| Click in empty space doesn't focus note directly | PASSED |
| Enter creates hydra:bullet (not paragraph) | PASSED |
| All editable content in valid containers | PASSED |

## Timeline

- Reported: 2026-01-13
- Fixed: 2026-01-13
- Status: Complete
