# FE-504: All Bullets Filter

## Summary
Filter "All Bullets" list in left panel to only show bullets that have children or descriptors.

## Current Behavior
The "All Bullets" section shows all top-level blocks regardless of content.

## Desired Behavior
Only show bullets that have:
- Child bullets (nested content)
- Descriptors attached

This makes the list more useful by hiding empty/leaf bullets.

## Acceptance Criteria
- [ ] All Bullets list only shows bullets with children OR descriptors
- [ ] Empty bullets are hidden from the list
- [ ] List updates in real-time as content changes
- [ ] Count badge reflects filtered count
- [ ] No performance impact on large documents

## Files to Modify
- `frontend/src/components/LeftPanel/AllBulletsSection.tsx`

## Estimate
2 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP2 - Left Panel Enhancements
