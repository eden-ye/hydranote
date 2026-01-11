# EDITOR-3402: Portal Rendering

## Description
Render portal blocks with source content and distinctive "cool border" styling.

## Acceptance Criteria
- [x] Portal renders source block's content (text + children)
- [x] "Cool border" visual styling distinguishes portal from regular bullets
- [x] Support collapsed/expanded state for portal
- [x] Show portal indicator icon (link/embed symbol)
- [x] Display source location hint (e.g., "from: Document Name")

## Technical Details
- Fetch source block content on render
- Border styling: gradient, dashed, or glowing effect
- Collapsed: show summary line only
- Expanded: show full source content tree
- Handle loading state while fetching source

## Dependencies
- EDITOR-3401: Portal Block Schema

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 4: Portal

## Status
- **Created**: 2026-01-10
- **Completed**: 2026-01-11
- **Status**: completed
- **Epic**: MVP2 - Portal
- **PR**: https://github.com/eden-ye/hydranote/pull/60
