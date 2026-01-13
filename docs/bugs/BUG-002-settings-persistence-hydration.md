# BUG-002: Settings Not Loading from localStorage on Page Refresh

## Summary
Settings persist to localStorage correctly but UI does not hydrate from localStorage on page refresh - all settings revert to defaults.

## Discovery
- **Date**: 2026-01-12
- **Context**: E2E testing FE-501 and FE-502 with Chrome automation
- **Severity**: Medium - Feature works within session but doesn't persist across refreshes

## Symptoms

### User-Visible
- User changes settings (e.g., enables auto-generation, changes trigger checkboxes)
- Settings appear to save (work correctly within session)
- After page refresh, all settings revert to defaults
- User must reconfigure settings every time they reload the page

### Technical
```
localStorage shows:
{
  "autoGenerationEnabled": true,
  "autoGenerationTriggers": { "what": false, "pros": true, ... }
}

But UI state after refresh shows:
{
  "autoGenEnabled": false,
  "whatChecked": true,
  "prosChecked": false
}
```

- localStorage contains correct persisted values
- Zustand store initializes with defaults instead of reading localStorage
- UI renders default state, ignoring persisted data

## Reproduction Steps

1. Open Hydra Notes at http://localhost:5173
2. Click gear icon to open Settings panel
3. Enable "Auto-generate after descriptor creation" toggle
4. Uncheck "What" trigger checkbox
5. Check "Pros" trigger checkbox
6. Verify localStorage in DevTools shows updated values
7. Refresh the page (F5 or Cmd+R)
8. Open Settings panel again
9. **Expected**: Settings match what you configured (auto-gen ON, What OFF, Pros ON)
10. **Actual**: All settings reverted to defaults (auto-gen OFF, What ON, Pros OFF)

## Root Cause Analysis

### Likely Cause
The Zustand settings store (`frontend/src/stores/settings-store.ts`) saves to localStorage on state changes but does not read from localStorage when initializing.

### Files to Investigate
- `frontend/src/stores/settings-store.ts` - Store initialization and persistence logic
- Check if `persist` middleware is configured correctly
- Check if hydration is being blocked or delayed

### Possible Issues
1. Missing Zustand `persist` middleware
2. `persist` middleware configured but `rehydrate` not called
3. Store initialization happens before localStorage is available
4. localStorage key mismatch between save and load
5. Partial hydration - some fields load, others don't

## Affected Features

- **FE-501**: Semantic Linking Settings - threshold, max suggestions, enable toggle
- **FE-502**: Auto-Generation Settings - enable toggle, generation count, trigger checkboxes

## Workaround

None - users must reconfigure settings after every page refresh.

## Fix Approach

1. Verify Zustand persist middleware is properly configured
2. Ensure store hydrates from localStorage on initialization
3. Add hydration check in store or component mount
4. Test persistence round-trip: save → refresh → load

## Solution

**Root Cause**: The Zustand store had a `loadSettingsFromStorage()` action that was never called on store initialization. The store was initializing with hardcoded defaults instead of reading from localStorage.

**Fix Applied** (`frontend/src/stores/settings-store.ts`):
1. Added `getInitialState()` function that merges localStorage values with defaults on store creation
2. Changed store initialization from hardcoded defaults to `...initialState`

```typescript
function getInitialState(): SettingsState {
  const saved = loadSettings()
  return {
    semanticLinkingEnabled: saved.semanticLinkingEnabled ?? SEMANTIC_LINKING_DEFAULTS.enabled,
    semanticLinkingThreshold: saved.semanticLinkingThreshold ?? SEMANTIC_LINKING_DEFAULTS.threshold,
    // ... etc
  }
}

const initialState = getInitialState()

export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => ({
  ...initialState,  // BUG-002 FIX: Load from localStorage on init
  // ... actions
}))
```

## Verification Plan

After fix:
1. Change multiple settings across both FE-501 and FE-502
2. Verify localStorage contains correct values
3. Refresh page
4. Open Settings panel
5. Verify all settings match pre-refresh state
6. Close and reopen browser tab
7. Verify settings still persist

## Verification Results

**Date**: 2026-01-12
**Status**: FIXED AND VERIFIED

E2E Test Results:
- Set test values in localStorage (autoGenEnabled: true, what: false, pros: true, threshold: 0.6, count: 4, maxSuggestions: 5)
- Reloaded page
- Opened Settings panel
- **All values correctly loaded from localStorage** ✓

| Setting | localStorage | UI After Refresh | Match |
|---------|-------------|------------------|-------|
| semanticLinkingEnabled | false | OFF | ✓ |
| semanticLinkingThreshold | 0.6 | 0.6 | ✓ |
| semanticLinkingMaxSuggestions | 5 | 5 | ✓ |
| autoGenerationEnabled | true | ON | ✓ |
| autoGenerationCount | 4 | 4 | ✓ |
| trigger: what | false | unchecked | ✓ |
| trigger: why | true | checked | ✓ |
| trigger: how | true | checked | ✓ |
| trigger: pros | true | checked | ✓ |
| trigger: cons | false | unchecked | ✓ |

All 1035 unit tests passing. Build successful.

## Related Issues

- FE-501: Semantic Linking Settings
- FE-502: Auto-Generation Settings

## References

- Settings Store: `frontend/src/stores/settings-store.ts`
- Settings Panel: `frontend/src/components/SettingsPanel.tsx`
