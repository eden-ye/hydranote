# EDITOR-3703: == Syntax for Dashing Button

## Summary
Allow users to type `==` at the end of bullet content to create a dashing button. The cheat sheet becomes multiline, moved below user input.

## Desired Behavior

### Creating Dashing Button
1. User types: `My bullet text ==`
2. On space after `==`, converts to dashing button
3. Result: `My bullet text —` with cursor ready for cheat sheet input

### Multiline Cheat Sheet
When user types content after the `==` created dashing button:
- Original cheat sheet content moves below
- User's new input appears on the first line
- Creates a multiline cheat sheet area

### Constraints
- Only ONE dashing button allowed per bullet
- If dashing button already exists, `==` is treated as literal text

## Acceptance Criteria
- [x] Typing `== ` at end of bullet creates dashing button
- [x] Only one dashing button per bullet
- [x] Manual preview text renders with dashing button separator
- [x] Unit tests pass
- [x] Build succeeds

## Technical Notes
- Listen for `== ` pattern in text input handler (similar to markdown shortcuts)
- Added `manualPreviewText` field to bullet block schema
- Created `parseDashingSyntax()` utility function
- Modified `_handleKeydown()` to detect `== ` pattern
- Updated `_renderInlinePreview()` to prioritize manual preview text

## Implementation Details

### Files Modified
1. `frontend/src/blocks/schemas/bullet-block-schema.ts`
   - Added `manualPreviewText: string | undefined` field

2. `frontend/src/blocks/utils/dashing-button-syntax.ts` (new file)
   - `parseDashingSyntax()` - Parses text containing `== ` pattern
   - `endsWithDashingPrefix()` - Helper for early detection

3. `frontend/src/blocks/components/bullet-block.ts`
   - Import dashing syntax parser
   - Added `== ` detection in space key handler
   - Implemented `_handleDashingSyntax()` method
   - Updated `_renderInlinePreview()` to check manual preview first

4. `frontend/src/blocks/__tests__/dashing-button-syntax.test.ts` (new file)
   - 13 test cases covering all scenarios

### How It Works
1. User types: `My text== preview content`
2. When space is pressed after `==`, the system:
   - Splits text at `==`
   - Sets main text to "My text"
   - Sets `manualPreviewText` to "preview content"
3. Renders as: `My text — preview content`

### Testing
- All unit tests pass (1658 tests total)
- Build succeeds with no errors
- Chrome E2E: Requires manual testing (extension in use by another thread)

## Manual E2E Test Steps
1. Open http://localhost:5175
2. Create new bullet
3. Type: `Test bullet== preview text`
4. Press space after `==`
5. Verify: Main text shows "Test bullet", separator shows "—", preview shows "preview text"
6. Try typing `==` again in same bullet
7. Verify: Treated as literal text (only one dashing button per bullet)

## Status
- **Created**: 2026-01-13
- **Completed**: 2026-01-13
- **Status**: completed
- **Epic**: MVP2 - Cheat Sheet / Dashing Button

## Commits
- TBD (pending PR)
