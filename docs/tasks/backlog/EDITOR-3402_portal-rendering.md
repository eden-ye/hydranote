# EDITOR-3402: Portal Rendering

## Description
Render portal blocks with source content and distinctive "cool border" styling.

## Acceptance Criteria
- [ ] Portal renders source block's content (text + children)
- [ ] "Cool border" visual styling distinguishes portal from regular bullets
- [ ] Support collapsed/expanded state for portal
- [ ] Show portal indicator icon (link/embed symbol)
- [ ] Display source location hint (e.g., "from: Document Name")

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
- **Status**: pending
- **Epic**: MVP2 - Portal
