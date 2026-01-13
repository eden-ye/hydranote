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
- [ ] Typing `== ` at end of bullet creates dashing button
- [ ] Only one dashing button per bullet
- [ ] Cheat sheet becomes multiline (user input on top, original below)
- [ ] Works with existing slash command for dashing
- [ ] Undo/redo works correctly

## Technical Notes
- Listen for `== ` pattern in text input handler
- Similar to markdown shortcuts (e.g., `#` for headings)

## Files to Modify
- `frontend/src/blocks/components/bullet-block.ts` - Input handler

## Estimate
4 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP2 - Cheat Sheet / Dashing Button
