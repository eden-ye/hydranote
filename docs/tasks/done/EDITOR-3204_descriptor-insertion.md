# EDITOR-3204: Descriptor Selection & Insertion

## Description
Handle the insertion of selected descriptor as a pseudo-child bullet and position cursor for content input.

## Acceptance Criteria
- [ ] Selecting descriptor creates new child bullet with descriptor type
- [ ] Cursor moves to new descriptor's content area
- [ ] Descriptor renders with `|` prefix
- [ ] Prevent duplicate descriptors of same type under same parent
- [ ] Handle insertion at various cursor positions

## Technical Details
- On autocomplete selection:
  1. Remove trigger text (`~what`)
  2. Create child bullet with `isDescriptor: true, descriptorType: 'what'`
  3. Focus new descriptor for content input
- Duplicate check: scan siblings for same descriptorType
- If duplicate exists: focus existing descriptor instead

## Dependencies
- EDITOR-3201: Descriptor Block Schema
- EDITOR-3202: Descriptor Repository
- EDITOR-3203: Descriptor Autocomplete UI

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 2: Descriptor System

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Descriptor System
