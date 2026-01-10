# API-202: Prompt Builder

## Description
Create prompt builder service for constructing AI prompts. Build prompts for hierarchical note generation and expansion.

## Acceptance Criteria
- [x] Prompt builder in `backend/app/services/prompts.py`
- [x] Template for generating hierarchical structure
- [x] Template for expanding single bullet
- [x] Context injection (siblings, parent)
- [x] Word limit guidance (~20 words)
- [x] Tests for prompt construction

## Dependencies
- API-201 (Claude AI Service) - completed

## Parallel Safe With
- AUTH-*, EDITOR-*, FE-*

## Notes
- Prompts should encourage concise, structured output
- Consider JSON output format for parsing
- Include examples in prompts

## Implementation

### Files Created
| File | Description |
|------|-------------|
| `backend/app/services/prompts.py` | PromptBuilder service with templates |
| `backend/tests/test_prompts.py` | 17 unit tests for prompt builder |
| `backend/app/services/__init__.py` | Updated exports |

### Prompt Types
1. **EXPAND_BULLET** - Expands a single bullet with more detail
2. **GENERATE_CHILDREN** - Generates hierarchical child bullets

### Features
- `BlockContext` dataclass for text, parent, and sibling context
- Word limit guidance (~20 words per bullet)
- JSON output format for GENERATE_CHILDREN
- Examples included in prompts
- System prompts for each type
- Edge case handling (empty text, long text, special chars)

### Test Results
```
tests/test_prompts.py - 17 passed
Total backend tests - 40 passed
Frontend build - Passed
Docker build - Passed
```

## Status
- **Created**: 2025-01-09
- **Completed**: 2026-01-09
- **Status**: completed
- **Phase**: 4
