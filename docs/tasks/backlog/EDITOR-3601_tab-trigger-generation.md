# EDITOR-3601: Tab Trigger at Deepest Level

## Description
When user presses Tab at the maximum indentation level (can't indent further), trigger AI generation for the parent descriptor.

## Acceptance Criteria
- [ ] Detect Tab press when bullet is at max indent depth
- [ ] Trigger AI generation for parent descriptor's topic
- [ ] Generate 1-5 child bullets with concise key points
- [ ] Insert generated bullets as children
- [ ] Show loading indicator during generation
- [ ] Respect AI generation rate limits

## Technical Details
- "Deepest level" = Tab would normally fail (no further indentation possible)
- Alternative interpretation: user is "already indented" under a descriptor
- Get parent descriptor type (What, Why, How, etc.)
- Call AI generation API with context:
  - Parent bullet text
  - Descriptor type
  - Sibling content for context
- Stream or batch insert generated bullets

## Dependencies
- EDITOR-3201: Descriptor Block Schema
- Existing AI generation infrastructure (MVP1 expand feature)

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 6: Auto AI Generation. Extends MVP1 expand feature.

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Auto AI Generation
