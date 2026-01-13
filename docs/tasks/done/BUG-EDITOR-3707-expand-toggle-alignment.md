# BUG-EDITOR-3707: Expand Toggle Alignment Fix

## Summary

Fixed grandchild block indentation misalignment caused by conditional rendering of expand toggle.

## Problem

Grandchild blocks appeared at nearly the same indentation level as their parent's siblings because the expand toggle only rendered when a block had children, leaving a 20px gap.

## Solution

Modified `_renderExpandToggle()` in `bullet-block.ts` to always render the toggle element as a placeholder, ensuring consistent 20px spacing regardless of whether a block has children.

## Changes

**File Modified:** `frontend/src/blocks/components/bullet-block.ts`
- `_renderExpandToggle()` now always returns a TemplateResult
- Empty placeholder div rendered when no children
- Interactive toggle with icon rendered when has children

**Tests Added:** `frontend/src/blocks/__tests__/bullet-block-component.test.ts`
- "Expand toggle placeholder (BUG-EDITOR-3707)" test suite

## Commits

- `d454e1a` - fix(editor): Always render expand toggle placeholder for consistent indentation (BUG-EDITOR-3707)
- `3c5796a` - Merged via PR #138

## Verification

- [x] Unit tests pass
- [x] Build succeeds
- [x] PR merged (#138)
- [x] GitHub checks passed
- [x] Chrome E2E testing (verified proper indentation hierarchy)

## Timeline

- **Created**: 2026-01-13
- **Fixed**: 2026-01-13
- **PR Merged**: 2026-01-13
