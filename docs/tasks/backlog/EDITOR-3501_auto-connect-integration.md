# EDITOR-3501: Auto-Connect on AI Generation

## Description
After AI generates content, automatically find related existing notes and create portal connections.

## Acceptance Criteria
- [ ] After AI generation completes, call semantic search API
- [ ] Present related notes as portal candidates (not auto-insert)
- [ ] User can accept/reject each suggested connection
- [ ] Accepted connections create portal as child bullet
- [ ] Feature respects user's setting (can be disabled)

## Technical Details
- Hook into AI generation completion event
- Call API-302 semantic search with generated content
- Show suggestion UI (inline or sidebar)
- On accept: create portal block (EDITOR-3401)
- Store user preference for feature toggle

## Dependencies
- API-302: Semantic Search Endpoint
- EDITOR-3401: Portal Block Schema
- EDITOR-3402: Portal Rendering
- FE-501: Semantic Linking Settings

## Parallel Safe With
- AUTH-*

## Notes
Part of Epic 5: Semantic Linking. Core integration feature.

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
