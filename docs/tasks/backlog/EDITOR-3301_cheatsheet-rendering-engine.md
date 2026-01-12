# EDITOR-3301: Cheatsheet Rendering Engine

## Description
Implement the engine that computes and renders cheatsheet content when a bullet is folded.

## Acceptance Criteria
- [ ] When bullet is folded, compute cheatsheet from descriptor children
- [ ] Format: `{What children} | {Pros} vs. {Cons}`
- [ ] Example: `React => A JavaScript Library | Fast, Component-based vs. Steep learning curve`
- [ ] Exclude images from cheatsheet content
- [ ] Truncate/ellipsis for content exceeding max length
- [ ] Only show descriptors marked as visible (see EDITOR-3303)

## Technical Details
- Cheatsheet computed on fold state change
- Traverse descriptor children, extract text content
- Apply formatting rules:
  - `=>` separates bullet title from cheatsheet
  - `|` separates descriptor sections
  - `vs.` separates Pros from Cons
- Cache cheatsheet content to avoid recomputation
- Max character limit per section (configurable)

## Dependencies
- EDITOR-3201: Descriptor Block Schema
- EDITOR-3202: Descriptor Repository

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 3: Cheatsheet. Core rendering logic for folded view.

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Cheatsheet
