# API-204: Generate Endpoint Implementation

## Description
Implement the /api/ai/generate endpoint. Transform user input into hierarchical note structure.

## Acceptance Criteria
- [ ] POST /api/ai/generate fully implemented
- [ ] Takes input_text and max_levels
- [ ] Returns hierarchical bullet structure
- [ ] Uses prompt builder for construction
- [ ] Rate limiting applied
- [ ] Returns tokens used
- [ ] Integration tests

## Dependencies
- API-201 (Claude AI Service)
- API-202 (Prompt Builder)

## Parallel Safe With
- AUTH-*, EDITOR-*, FE-*

## Notes
- Currently returns 501 placeholder
- Should return nested BulletNode structure
- Consider async/streaming option

## Status
- **Created**: 2025-01-09
- **Status**: pending
- **Phase**: 4
