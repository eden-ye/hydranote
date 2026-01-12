# EDITOR-3102: Keyboard Shortcuts for Coloring

## Description
Implement keyboard shortcuts (Cmd+Alt+3-9) for applying background colors to selected text.

## Acceptance Criteria
- [ ] Cmd+Alt+3 through Cmd+Alt+9 apply colors 1-6 (one key reserved for removal)
- [ ] Shortcut on already-colored text with same color removes the color (toggle)
- [ ] Works with text selection in rich-text editor
- [ ] Visual feedback when color is applied
- [ ] Shortcuts registered via BlockSuite's bindHotKey system

## Technical Details
- Key bindings: Cmd+Alt+3, 4, 5, 6, 7, 8, 9 (6 colors + 1 for clear)
- Uses mark API from EDITOR-3101
- Toggle behavior: same color removes, different color replaces

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
