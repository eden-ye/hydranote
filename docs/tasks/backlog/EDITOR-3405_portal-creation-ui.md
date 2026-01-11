# EDITOR-3405: Portal Creation UI

## Description
Provide UI for manually creating portal blocks and selecting target bullets.

## Acceptance Criteria
- [ ] Command or shortcut to create portal (e.g., `/portal` or Cmd+Shift+P)
- [ ] Picker UI to select target bullet from current document
- [ ] Search/filter in picker for finding bullets
- [ ] Preview of selected bullet before confirming
- [ ] Insert portal as child of current bullet

## Technical Details
- Portal picker modal/dropdown component
- List bullets in current document (tree view or flat list)
- Search: fuzzy match on bullet text
- On selection: create portal block with source reference
- Future: cross-document picker (MVP3+ scope)

## Dependencies
- EDITOR-3401: Portal Block Schema
- EDITOR-3402: Portal Rendering

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 4: Portal. For semantic linking, portals are created automatically (EDITOR-3501), but manual creation is also useful.

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Portal
