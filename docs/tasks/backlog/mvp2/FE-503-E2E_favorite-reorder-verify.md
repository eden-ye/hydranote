# FE-503-E2E: Verify Favorite Reorder

## Summary
Chrome E2E test to verify drag-to-reorder favorites functionality from FE-503.

## Background
FE-503 implemented left panel with favorites including drag-to-reorder. This ticket verifies the feature works correctly via Chrome E2E testing.

## E2E Test Scenarios

### Scenario 1: Add Favorites
1. Navigate to http://localhost:5173
2. Create 3 bullets with content
3. Star each bullet to add to favorites
4. Verify all 3 appear in Favorites section

### Scenario 2: Drag to Reorder
1. With 3+ favorites in list
2. Drag first favorite to last position
3. Verify order changes correctly
4. Verify grip handle is visible on hover

### Scenario 3: Persistence
1. Reorder favorites
2. Refresh page
3. Verify reordered favorites persist

### Scenario 4: Remove and Re-add
1. Unstar a favorite (click star again)
2. Verify it's removed from favorites list
3. Star it again
4. Verify it appears at end of list

## Acceptance Criteria
- [ ] All 4 scenarios pass in Chrome E2E
- [ ] No console errors
- [ ] Screenshots captured for evidence

## Estimate
1 hour

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP2 - Left Panel Enhancements
