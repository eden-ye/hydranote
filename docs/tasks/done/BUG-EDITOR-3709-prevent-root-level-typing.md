# BUG-EDITOR-3709: Prevent Root-Level Typing

**Status**: DONE
**Priority**: Medium
**Estimate**: 2h
**Actual**: 2h

## Problem

Potential for "Type '/' for commands" placeholder to appear at root level in the note, which could allow users to type outside of valid bullet containers, breaking the hierarchical structure.

## Investigation

The issue was largely prevented by existing architecture - the BlockSuite schema limits `affine:note` children to only `hydra:bullet` and `hydra:portal`. The "Type '/' for commands" placeholder is an `affine:paragraph` feature that doesn't appear because we don't use paragraph blocks.

However, defensive measures were added for robustness against potential future changes or edge cases.

## Solution

1. **CSS Protections** - Hide potential placeholder elements and non-hydra blocks at root level
2. **JavaScript Click Handler** - Redirect clicks on empty note area to first bullet
3. **Unit Tests** - 12 new tests documenting expected block structure behavior

## Implementation

### Files Changed
- `frontend/src/components/Editor/Editor.css` - CSS defensive styles
- `frontend/src/components/Editor/Editor.tsx` - Click handler for empty areas
- `frontend/src/__tests__/blocks/hydra-bullet-block.test.ts` - Unit tests

### Key Changes
- Added CSS rules to hide any potential root-level placeholders
- Added click handler to focus first bullet when clicking empty note area
- Added comprehensive tests for block structure validation

## Testing

### Unit Tests
- 12 new tests for block structure behavior
- All tests pass

### Chrome E2E Results
- [x] No "Type '/' for commands" placeholder visible
- [x] Click in empty space doesn't focus note directly
- [x] Enter creates hydra:bullet (not paragraph)
- [x] All editable content in valid containers

## Commits

- PR #139: `fix(editor): Add defensive measures to prevent root-level typing (BUG-EDITOR-3709)`
- Merged: 2026-01-13T23:39:37Z

## Related

- EDITOR-3705: Prevent root-level drag (similar defensive work)
