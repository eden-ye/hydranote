# EDITOR-304: Inline Detail View

## Description
Implement computed inline detail view that shows a summary of folded content. When a bullet is collapsed, show a preview of its children inline.

## Acceptance Criteria
- [ ] Collapsed bullets show inline preview of children
- [ ] Preview is computed from child content
- [ ] Preview truncates appropriately
- [ ] Visual distinction between main text and preview
- [ ] Preview updates when children change

## Dependencies
- EDITOR-302 (Bullet Block Schema)

## Parallel Safe With
- EDITOR-303, EDITOR-305, EDITOR-306, EDITOR-307, AUTH-*, API-*, FE-*

## Notes
- Helps users see context without expanding
- Should be lightweight and computed on-demand

## Status
- **Created**: 2025-01-09
- **Status**: pending
