# EDITOR-3406: Portal Runtime Orphan Detection - E2E Test Expectations

## Feature Description
Portals should automatically detect when their source block is deleted at runtime, transitioning to orphaned state without requiring page refresh.

## Test Scenarios

### Scenario 1: Source Block Deletion Triggers Orphaned State
**Precondition**: A portal exists that references an existing source block

**Steps**:
1. Navigate to the editor
2. Create a bullet block with text "Source content"
3. Create a portal block referencing the source bullet
4. Verify portal shows "synced" state and displays "Source content"
5. Delete the source bullet block
6. **Expected**: Portal immediately transitions to "orphaned" state
7. **Expected**: Portal shows "Source deleted" status badge
8. **Expected**: Portal displays orphaned message: "The source block has been deleted. This portal is now orphaned."

### Scenario 2: Deleting Unrelated Block Does Not Affect Portal
**Precondition**: A portal exists with a valid source block

**Steps**:
1. Navigate to the editor
2. Create a source bullet with text "Source A"
3. Create another bullet with text "Other block"
4. Create a portal referencing "Source A"
5. Delete "Other block"
6. **Expected**: Portal remains in "synced" state
7. **Expected**: Portal still displays "Source A" content

### Scenario 3: Real-time Detection Without Page Refresh
**Precondition**: None

**Steps**:
1. Navigate to the editor
2. Create a source bullet
3. Create a portal referencing it
4. Open browser DevTools Network tab
5. Delete the source bullet
6. **Expected**: Portal transitions to orphaned state immediately
7. **Expected**: No page refresh occurs (verify in Network tab - no document requests)

## Verification Checklist
- [ ] Portal subscribes to blockUpdated slot on creation
- [ ] Portal calls onOrphaned when source block is deleted
- [ ] Portal does NOT call onOrphaned for unrelated block deletions
- [ ] Portal cleans up blockUpdated listener on dispose
- [ ] No console errors during orphan detection
