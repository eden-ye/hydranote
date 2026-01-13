# FE-502: Auto-Generation Settings

## Description
Add settings UI for configuring auto AI generation behavior.

## Acceptance Criteria
- [x] Toggle: Auto-generate after descriptor creation (on/off)
- [x] Input: Generation count (1-5 bullets per descriptor)
- [x] Checkboxes: Which descriptor types trigger generation
- [x] Settings persisted in user preferences
- [x] Settings accessible from main settings panel

## Technical Details
- Add to existing settings store/component
- Persist in IndexedDB (local) and/or Supabase (cloud sync)
- Default values:
  - Auto-generate: off
  - Generation count: 3
  - Trigger descriptors: What, Why, How (not Pros/Cons by default)
- Settings consumed by EDITOR-3601 and EDITOR-3602

## Dependencies
- None (settings infrastructure should exist)

## Parallel Safe With
- EDITOR-*, API-*, AUTH-*

## Notes
Part of Epic 6: Auto AI Generation

## Status
- **Created**: 2026-01-10
- **Completed**: 2026-01-12
- **Status**: completed
- **Epic**: MVP2 - Auto AI Generation

## Implementation Summary

### Files Changed
- `frontend/src/stores/settings-store.ts` - Added auto-generation state, actions, and selectors
- `frontend/src/components/SettingsPanel.tsx` - Added Auto Generation UI section
- `frontend/src/stores/__tests__/settings-store.test.ts` - Added FE-502 store tests
- `frontend/src/components/__tests__/SettingsPanel.test.tsx` - Added FE-502 UI tests
- `e2e/expectations/FE-502_auto-generation-settings.md` - E2E test expectations

### Key Exports Added
- `AUTO_GENERATION_DEFAULTS` - Default values for auto-generation settings
- `DescriptorTriggerType` - Type for descriptor triggers (what/why/how/pros/cons)
- `AutoGenerationTriggers` - Interface for trigger settings
- `selectAutoGenerationEnabled` - Selector for enabled state
- `selectAutoGenerationCount` - Selector for count value
- `selectAutoGenerationTriggers` - Selector for trigger settings

### Testing
- Unit tests: 1035 tests passed
- Build: TypeScript + Vite build successful
- Chrome E2E: Test expectations documented (Chrome MCP not connected)

### Commits
- feat(fe): Add auto-generation settings UI (FE-502)
