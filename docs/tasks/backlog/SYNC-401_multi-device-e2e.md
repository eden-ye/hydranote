# SYNC-401: Multi-Device E2E Tests

## Description
Create end-to-end tests that verify sync works correctly across multiple browser sessions.

## Automation Status
**SEMI-AUTO** - Manual test execution via Chrome E2E

## Acceptance Criteria
- [ ] Test: Create bullet in Window A, verify appears in Window B
- [ ] Test: Edit bullet in Window B, verify updates in Window A
- [ ] Test: Delete bullet in Window A, verify removed in Window B
- [ ] Test: Concurrent edits in both windows merge correctly
- [ ] Test results documented with screenshots

## Technical Details

### Test Scenarios

**Scenario 1: Basic Sync**
```markdown
1. Open Chrome Window A, login, create document
2. Create 3 bullets: "Apple", "Banana", "Cherry"
3. Wait for sync status to show "Synced"
4. Open Chrome Window B (incognito), login same user
5. Navigate to same document
6. VERIFY: All 3 bullets appear in Window B
```

**Scenario 2: Real-Time Update**
```markdown
1. Continue from Scenario 1
2. In Window B, edit "Apple" → "Avocado"
3. Wait 1-2 seconds
4. VERIFY in Window A: Bullet now shows "Avocado"
```

**Scenario 3: Concurrent Edit**
```markdown
1. In Window A: Start editing "Banana" → "Blueberry"
2. Simultaneously in Window B: Add new bullet "Dragon fruit"
3. Wait for both to sync
4. VERIFY: Both windows show "Blueberry" and "Dragon fruit"
```

**Scenario 4: Delete Sync**
```markdown
1. In Window A: Delete "Cherry"
2. Wait for sync
3. VERIFY in Window B: "Cherry" is removed
```

### E2E Expectation File
```markdown
# e2e/expectations/SYNC-401-multi-device.md

## Prerequisites
- Sync server running locally or in SAT
- Two browser sessions (regular + incognito)
- Same user logged in on both

## Test Steps
[Include detailed steps with expected outcomes]

## Evidence Required
- Screenshot: Window A initial state
- Screenshot: Window B after sync
- Screenshot: Both windows after concurrent edit
```

## Dependencies
- All SYNC-1xx and SYNC-2xx tickets (sync infrastructure)

## Parallel Safe With
- SYNC-402, SYNC-403

## Notes
- Part of MVP3 Epic 4: Testing & Migration
- Use Chrome E2E via Claude-in-Chrome MCP
- Test in both local and SAT environments

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Multi-Device Sync
- **Estimate**: 4h
