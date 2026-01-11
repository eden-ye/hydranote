# EDITOR-3602: Auto-Generate After Descriptor

## Description
Optionally auto-generate content immediately after a descriptor is created.

## Acceptance Criteria
- [ ] When descriptor is inserted, optionally trigger AI generation
- [ ] Feature is configurable in settings (on/off)
- [ ] Debounce to avoid rapid triggers
- [ ] Generate 1-5 children based on descriptor type
- [ ] User can cancel during generation
- [ ] Clear visual indication of auto-generation in progress

## Technical Details
- Hook into descriptor insertion event (EDITOR-3204)
- Check settings for auto-generate preference
- Debounce: wait 500ms after descriptor insert before generating
- Cancel: if user starts typing, abort generation
- Same AI generation logic as EDITOR-3601

## Dependencies
- EDITOR-3201: Descriptor Block Schema
- EDITOR-3204: Descriptor Selection & Insertion
- FE-502: Auto-Generation Settings
- Existing AI generation infrastructure

## Parallel Safe With
- API-*, AUTH-*

## Notes
Part of Epic 6: Auto AI Generation. Optional convenience feature.

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Auto AI Generation
