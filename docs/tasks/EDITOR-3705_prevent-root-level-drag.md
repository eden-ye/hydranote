# EDITOR-3705: Prevent Drag Drift and Root-Level Drops

**Status**: Completed (E2E Tested)
**Branch**: `editor/EDITOR-3705-prevent-root-level-drag`
**Base Commit**: `ade9f65` (origin/main with memory leak fix)
**Created**: 2026-01-13
**Completed**: 2026-01-13
**Priority**: High (User-reported bug)

## Problem Statement

Two related drag-drop issues:

### Issue 1: Root-Level Drift (PARTIALLY ADDRESSED)
Drop indicator appears between Title and first child, allowing invalid drops as siblings of Title.

### Issue 2: Children-Level Drift (FIXED)
When dragging a bullet and cursor passes through OTHER blocks' children (at deeper nesting levels), the drop indicator "drifts" to show placement at those deeper levels instead of staying at the dragged block's level.

**User Feedback**:
- "dragging through same level is correct" ✅
- "dragging bypassing the children level of itself (Other's children)" causes drift ❌ → NOW FIXED ✅

## Solution Implemented (Attempt #5)

**Approach**: Depth-based target snapping in `_handleGlobalDragOver`

When the cursor is over a block that is DEEPER than the dragged block, instead of targeting that deeper block, we "snap" to its ancestor at the same depth as the dragged block.

### Key Code Changes

1. **Added `getBlockDepth()` helper function** (`bullet-block.ts:244-257`)
   - Pure function to compute nesting depth from a block model
   - Counts hydra:bullet ancestors

2. **Modified `_handleGlobalDragOver`** (`bullet-block.ts:2807-2865`)
   - After finding target block under cursor, check depths
   - If target depth > dragged depth, walk up to find ancestor at same depth
   - Use that ancestor as the effective drop target
   - NO early returns (which broke things in Attempt #3)

### Why This Works

- Follows Affine patterns: no early returns, just target adjustment
- Keeps the drag event flow intact
- UI remains responsive
- Drop indicator stays at the correct depth level

## Failed Attempts Summary

| Attempt | Approach | Result |
|---------|----------|--------|
| #1 | Check `!parent.parent` | ❌ Wrong - affine:note HAS parent |
| #2 | Check `parent.flavour === 'affine:note'` | ⚠️ Root-level only, not depth drift |
| #3 | Hysteresis + depth validation in dragover | ❌ CATASTROPHIC - broke entire UI |
| #4 | Validate only in `_performDrop` | ❌ IndexedDB corruption masked results |
| #5 | Depth-based target snapping | ✅ SUCCESS |

## Key Learnings

1. **Unit tests + build ≠ working feature** - MUST browser test
2. **Early returns in event handlers break UI** - state becomes inconsistent
3. **Clear IndexedDB when testing render changes** - orphaned blocks cause null errors
4. **NEVER push untested code** - browser test BEFORE any git push
5. **Rollback immediately on catastrophic failure** - don't debug broken code
6. **Test on fresh IndexedDB state** - existing corruption masks real issues
7. **Target adjustment > target rejection** - don't reject targets, adjust them to valid ones
8. **Walk the ancestor chain** - when target is too deep, find the right ancestor

## Files Modified

- `frontend/src/blocks/components/bullet-block.ts`
  - Added `getBlockDepth()` export function (line ~244)
  - Modified `_handleGlobalDragOver` to add depth snapping logic (line ~2807)

## Testing Checklist

- [x] Clear IndexedDB
- [x] Refresh page
- [x] Create test hierarchy (Parent with children, Sibling)
- [x] Test same-level drag → works correctly
- [x] Test drag through other's children → indicator does NOT drift
- [x] Verify bullets, expand buttons, drag handles all visible
- [x] Unit tests pass (1664 tests)
- [x] Build passes
- [x] User E2E verification passed

## Time Tracking

- Attempt #1: 15 min
- Attempt #2: 20 min
- Attempt #3: 45 min (including rollback)
- Attempt #4: 30 min (including rollback)
- Documentation: 30 min
- Attempt #5: 30 min (successful)
- **Total**: ~3 hours
