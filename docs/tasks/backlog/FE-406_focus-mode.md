# FE-406: Focus Mode Navigation

## Description
Implement focus mode that zooms into a single bullet and its children. Reduces cognitive load by hiding sibling context.

## Acceptance Criteria
- [ ] Double-click or shortcut enters focus mode
- [ ] Focus mode shows only selected bullet + children
- [ ] Parent context hidden (shown in breadcrumb)
- [ ] Escape or back button exits focus mode
- [ ] Smooth transition animation
- [ ] Editor store tracks focus state

## Dependencies
- EDITOR-303 (Folding/Collapse)

## Parallel Safe With
- AUTH-*, API-*

## Notes
- Core cognitive scaffolding feature
- Combines with breadcrumb for navigation
- Consider nested focus (focus within focus)

## Status
- **Created**: 2025-01-09
- **Status**: pending
- **Phase**: 5
