# EDITOR-302: Bullet Block Schema

## Description
Create a custom BlockSuite block schema for hierarchical bullet points. Each bullet should support text content, children (nested bullets), and metadata for folding state.

## Acceptance Criteria
- [ ] Custom bullet block schema defined in `frontend/src/blocks/schemas/`
- [ ] Block supports text content with ~20 word soft limit
- [ ] Block supports nested children (hierarchical structure)
- [ ] Block has folding state metadata (expanded/collapsed)
- [ ] Block registered with BlockSuite editor

## Dependencies
- EDITOR-301 (BlockSuite Integration)

## Parallel Safe With
- AUTH-*, API-*, FE-*

## Notes
- Follow BlockSuite block definition patterns
- Consider AI-guided word limits (~20 words per bullet)
- Schema should support future inline detail view

## Status
- **Created**: 2025-01-09
- **Status**: pending
