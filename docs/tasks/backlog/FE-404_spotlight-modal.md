# FE-404: Spotlight Modal (Ctrl+P)

## Description
Create Spotlight modal for quick AI generation. User types input, AI generates hierarchical notes.

## Acceptance Criteria
- [ ] Modal opens with Ctrl+P / Cmd+P
- [ ] Text input for user query
- [ ] Submit triggers AI generation
- [ ] Loading state during generation
- [ ] Results inserted into editor
- [ ] Modal closes on Escape
- [ ] Keyboard navigation

## Dependencies
- EDITOR-301 (BlockSuite Integration)
- FE-402 (Auth Store) - for rate limit check

## Parallel Safe With
- AUTH-*, API-*

## Notes
- Core AI interaction point
- Similar to macOS Spotlight UX
- Show remaining generations count

## Status
- **Created**: 2025-01-09
- **Status**: pending
- **Phase**: 4
