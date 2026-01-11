# FE-501: Semantic Linking Settings

## Description
Add settings UI for configuring semantic linking behavior.

## Acceptance Criteria
- [ ] Toggle: Enable/disable auto-connect feature
- [ ] Slider/input: Similarity threshold (0.5 - 1.0)
- [ ] Input: Max suggestions to show (1-10)
- [ ] Settings persisted in user preferences
- [ ] Settings accessible from main settings panel

## Technical Details
- Add to existing settings store/component
- Persist in IndexedDB (local) and/or Supabase (cloud sync)
- Default values:
  - Auto-connect: enabled
  - Threshold: 0.7
  - Max suggestions: 3
- Settings consumed by EDITOR-3501

## Dependencies
- None (settings infrastructure should exist)

## Parallel Safe With
- EDITOR-*, API-*, AUTH-*

## Notes
Part of Epic 5: Semantic Linking

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
