# SYNC-402: Offline Behavior Tests

## Description
Test that offline edits are preserved and sync correctly when connection is restored.

## Automation Status
**SEMI-AUTO** - Manual network simulation required

## Acceptance Criteria
- [ ] Test: Edits made offline persist in IndexedDB
- [ ] Test: Reconnection triggers sync
- [ ] Test: Offline edits merge with remote changes
- [ ] Test: No data loss during network interruption
- [ ] Test results documented

## Technical Details

### Test Scenarios

**Scenario 1: Offline Edit Persistence**
```markdown
1. Open app, create document, verify "Synced"
2. Disconnect network (Chrome DevTools → Network → Offline)
3. Create 3 new bullets while offline
4. VERIFY: Sync status shows "Offline"
5. VERIFY: Bullets are saved locally
6. Close and reopen browser
7. VERIFY: Bullets still present (IndexedDB)
```

**Scenario 2: Reconnection Sync**
```markdown
1. Continue from Scenario 1 (offline with local edits)
2. Reconnect network
3. VERIFY: Sync status changes to "Syncing..." then "Synced"
4. Open Window B, navigate to document
5. VERIFY: All offline edits appear in Window B
```

**Scenario 3: Conflict Resolution**
```markdown
1. Window A: Go offline, edit bullet "Apple" → "Apricot"
2. Window B (online): Edit same bullet "Apple" → "Avocado"
3. Window A: Reconnect
4. VERIFY: CRDT merges edits (result depends on timestamps)
5. VERIFY: Both windows show consistent state
```

**Scenario 4: Extended Offline**
```markdown
1. Go offline for 5+ minutes
2. Make multiple edits across document
3. Reconnect
4. VERIFY: All edits sync without errors
5. VERIFY: Document structure intact
```

### Network Simulation
```javascript
// Chrome DevTools Console
// Simulate slow network
await new Promise(r => setTimeout(r, 5000))

// Or use Chrome DevTools Network tab:
// - Offline checkbox
// - Slow 3G preset
```

## Dependencies
- All SYNC-1xx and SYNC-2xx tickets

## Parallel Safe With
- SYNC-401, SYNC-403

## Notes
- Part of MVP3 Epic 4: Testing & Migration
- Critical for offline-first reliability
- Document edge cases discovered

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Multi-Device Sync
- **Estimate**: 3h
