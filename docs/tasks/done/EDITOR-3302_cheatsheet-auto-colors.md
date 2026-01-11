# EDITOR-3302: Cheatsheet Auto-Colors

## Description
Apply automatic background colors to Pros (green) and Cons (red) sections in the cheatsheet view.

## Acceptance Criteria
- [ ] Pros section in cheatsheet has green background
- [ ] Cons section in cheatsheet has red background
- [ ] Colors only apply in folded cheatsheet view, not when expanded
- [ ] Other descriptors (What, Why, How) have neutral/no color
- [ ] Color contrast meets accessibility standards

## Technical Details
- Detect descriptor type during cheatsheet rendering
- Apply CSS classes for pros/cons sections
- Colors:
  - Pros: light green background (#e6ffe6 or similar)
  - Cons: light red background (#ffe6e6 or similar)
- Use same color definitions from EDITOR-3101 palette where applicable

## Dependencies
- EDITOR-3301: Cheatsheet Rendering Engine
- EDITOR-3101: Color Palette System

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 3: Cheatsheet

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Cheatsheet
