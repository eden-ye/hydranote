# EDITOR-3701: Fix Drag Drift Near Parent

## Summary
Fix bug where dragging bullets drifts when close to parent bullet.

## Problem
When dragging a bullet and moving it close to its parent bullet, the drag position drifts unexpectedly, making it difficult to reorder bullets accurately.

## Acceptance Criteria
- [ ] Dragging bullets near parent does not drift
- [ ] Drop indicator shows correct position
- [ ] Drag behavior is smooth and predictable
- [ ] Works for all nesting levels
- [ ] No console errors during drag operations

## Technical Notes
Related to EDITOR-3507 (Bullet Drag-and-Drop) which implemented the initial drag functionality.

## Files to Investigate
- `frontend/src/blocks/components/bullet-block.ts` - Drag handlers
- `frontend/src/blocks/styles/` - Drop indicator positioning

## Estimate
3 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP2 - Bug Fixes
