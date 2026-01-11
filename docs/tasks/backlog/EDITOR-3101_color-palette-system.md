# EDITOR-3101: Color Palette System

## Description
Define and implement the color palette system for manual text/background highlighting. This is the foundation for the coloring feature in MVP2.

## Acceptance Criteria
- [ ] Define 6 colors with semantic names and hex values
- [ ] Create color data model in block schema (store color per text range)
- [ ] Integrate with Yjs for persistence
- [ ] Colors apply to selected text ranges (inline marks)
- [ ] Support for background color (primary) and text color (optional)

## Technical Details
- Colors stored as inline marks on rich-text (similar to bold/italic)
- Schema extension for `backgroundColor` mark type
- 6 predefined colors (user can apply any of these)
- Auto-colors (Pros=green, Cons=red) handled separately in EDITOR-3302

## Dependencies
- EDITOR-3056: Inline Formatting (should be completed first for mark infrastructure)

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
This ticket creates the data layer. EDITOR-3102 and EDITOR-3103 add the UI for applying colors.

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Background Coloring
