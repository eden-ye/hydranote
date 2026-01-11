# FE-502: Auto-Generation Settings

## Description
Add settings UI for configuring auto AI generation behavior.

## Acceptance Criteria
- [ ] Toggle: Auto-generate after descriptor creation (on/off)
- [ ] Input: Generation count (1-5 bullets per descriptor)
- [ ] Checkboxes: Which descriptor types trigger generation
- [ ] Settings persisted in user preferences
- [ ] Settings accessible from main settings panel

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
- **Status**: pending
- **Epic**: MVP2 - Auto AI Generation
