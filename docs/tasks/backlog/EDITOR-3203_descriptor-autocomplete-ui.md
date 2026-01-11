# EDITOR-3203: Descriptor Autocomplete UI

## Description
Implement the autocomplete dropdown that appears when user types `~` to insert a descriptor.

## Acceptance Criteria
- [ ] Typing `~` triggers autocomplete dropdown
- [ ] Dropdown shows available descriptors from repository
- [ ] Fuzzy matching updates on each keystroke
- [ ] Keyboard navigation: Arrow up/down, Enter to select, Escape to dismiss
- [ ] Dropdown positioned below cursor
- [ ] Visual highlight on focused option

## Technical Details
- Intercept `~` key in keyboard handler
- Show dropdown overlay component
- Filter descriptors based on typed text after `~`
- On selection: remove `~` + typed text, insert descriptor
- Dismiss on click outside or Escape

## Dependencies
- EDITOR-3201: Descriptor Block Schema
- EDITOR-3202: Descriptor Repository

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 2: Descriptor System. Similar to @-mention or slash-command UX.

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Descriptor System
