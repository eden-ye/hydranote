# API-201: Claude AI Service

## Description
Create Claude API service for AI generation. Initialize Anthropic client and implement base generation logic.

## Acceptance Criteria
- [ ] Anthropic client in `backend/app/services/claude.py`
- [ ] Client uses API key from environment
- [ ] Base generation method with streaming
- [ ] Error handling for API failures
- [ ] Rate limit awareness
- [ ] Tests with mocked API

## Dependencies
- None (foundation for AI features)

## Parallel Safe With
- AUTH-*, EDITOR-*, FE-*

## Notes
- anthropic package already installed
- Use claude-3-sonnet for cost efficiency
- Consider token limits and pricing

## Status
- **Created**: 2025-01-09
- **Status**: pending
- **Phase**: 4
