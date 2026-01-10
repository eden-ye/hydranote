# EDITOR-304: Inline Detail View

## Description
Implement computed inline detail view that shows a summary of folded content. When a bullet is collapsed, show a preview of its children inline.

## Acceptance Criteria
- [x] Collapsed bullets show inline preview of children
- [x] Preview is computed from child content
- [x] Preview truncates appropriately
- [x] Visual distinction between main text and preview
- [x] Preview updates when children change

## Dependencies
- EDITOR-302 (Bullet Block Schema) ✅ READY

## Parallel Safe With
- EDITOR-303, EDITOR-305, EDITOR-306, EDITOR-307, AUTH-*, API-*, FE-*

## Notes
- Helps users see context without expanding
- Should be lightweight and computed on-demand

## Implementation Details

### Functions Added
- `computeInlinePreview(children)`: Concatenates child texts with " · " separator
- `truncatePreview(text)`: Limits preview to 50 chars with ellipsis
- `PREVIEW_MAX_LENGTH`: Constant for max preview length (50)
- `PREVIEW_SEPARATOR`: Separator between child texts (" · ")

### Component Changes
- Added `_getInlinePreview()` method to compute preview from model children
- Added `_renderInlinePreview()` method to render preview element
- Added CSS styling for `.inline-preview` class with subdued color

### Files Changed
- `frontend/src/blocks/components/bullet-block.ts`
- `frontend/src/blocks/__tests__/bullet-block-component.test.ts`

## Commits
- 2087158 feat(editor): EDITOR-304 - Inline detail view for collapsed bullets

## Status
- **Created**: 2025-01-09
- **Completed**: 2026-01-09
- **Status**: done
- **PR**: https://github.com/eden-ye/hydranote/pull/10
