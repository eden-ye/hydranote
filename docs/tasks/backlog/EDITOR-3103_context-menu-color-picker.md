# EDITOR-3103: Context Menu Color Picker

## Description
Add a context menu with color palette for applying background colors via right-click.

## Acceptance Criteria
- [ ] Right-click on selected text shows context menu
- [ ] Context menu includes color palette with 6 color swatches
- [ ] Clicking a color applies it to selected text
- [ ] Include "Remove color" option
- [ ] Menu positioned near cursor/selection
- [ ] Menu dismisses on click outside or Escape

## Technical Details
- Custom context menu component (not browser default)
- Color swatches as clickable buttons
- Uses mark API from EDITOR-3101
- Accessible: keyboard navigation in menu

## Dependencies
- EDITOR-3101: Color Palette System

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 1: Background Coloring

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Background Coloring
