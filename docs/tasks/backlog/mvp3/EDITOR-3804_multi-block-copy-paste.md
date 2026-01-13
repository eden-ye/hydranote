# EDITOR-3804: Multi-Block Copy Paste

## Summary
Correctly handle copy-paste of multiple bullets/blocks at once.

## Current Behavior
Copy-paste of multiple blocks may:
- Lose hierarchy
- Split incorrectly
- Lose formatting

## Desired Behavior
- Select multiple blocks
- Copy (Cmd+C)
- Paste (Cmd+V) elsewhere
- All blocks paste with correct hierarchy and formatting

## Acceptance Criteria
- [ ] Multi-select works (Shift+click or drag select)
- [ ] Copy captures all selected blocks
- [ ] Paste preserves hierarchy (parent-child relationships)
- [ ] Paste preserves block types (checkbox, numbered, etc.)
- [ ] Paste preserves formatting (bold, italic, etc.)
- [ ] Works across different documents
- [ ] Works with nested blocks

## Technical Notes
- May need custom clipboard format
- Serialize to JSON for internal paste
- Fall back to plain text for external paste

## Estimate
4 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Editor Core
