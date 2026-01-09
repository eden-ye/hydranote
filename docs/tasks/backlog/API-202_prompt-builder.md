# API-202: Prompt Builder

## Description
Create prompt builder service for constructing AI prompts. Build prompts for hierarchical note generation and expansion.

## Acceptance Criteria
- [ ] Prompt builder in `backend/app/services/prompts.py`
- [ ] Template for generating hierarchical structure
- [ ] Template for expanding single bullet
- [ ] Context injection (siblings, parent)
- [ ] Word limit guidance (~20 words)
- [ ] Tests for prompt construction

## Dependencies
- API-201 (Claude AI Service)

## Parallel Safe With
- AUTH-*, EDITOR-*, FE-*

## Notes
- Prompts should encourage concise, structured output
- Consider JSON output format for parsing
- Include examples in prompts

## Status
- **Created**: 2025-01-09
- **Status**: pending
- **Phase**: 4
