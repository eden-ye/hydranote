# EDITOR-3303: Descriptor Visibility Toggle

## Description
Add a visibility toggle (grey closed-eye icon) to each descriptor that controls whether it appears in the cheatsheet.

## Acceptance Criteria
- [ ] Grey closed-eye icon appears on right side of each descriptor row
- [ ] Click icon to toggle visibility in cheatsheet
- [ ] Visual state: open eye (visible) vs closed eye (hidden)
- [ ] Visibility preference persisted per descriptor
- [ ] Hidden descriptors excluded from cheatsheet computation
- [ ] Icon only visible on hover or when descriptor is focused

## Technical Details
- Add `cheatsheetVisible: boolean` to descriptor data model
- Default: true (visible)
- Icon component with toggle handler
- CSS: subtle icon, more visible on hover
- Persist in Yjs with descriptor data

## Dependencies
- EDITOR-3201: Descriptor Block Schema
- EDITOR-3301: Cheatsheet Rendering Engine

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 3: Cheatsheet. User control for cheatsheet content.

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Cheatsheet
