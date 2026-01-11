# FE-409: Ghost Question Rendering

## Description
Render AI-generated ghost questions in focus mode. Suggest follow-up questions for deeper exploration.

## Acceptance Criteria
- [x] GhostQuestions component with questions list
- [x] Click question to trigger expansion callback
- [x] Dismiss button for unwanted questions
- [x] Loading skeleton while generating
- [x] Keyboard accessible (Enter/Space to select)
- [x] ARIA labels for accessibility
- [x] Styled header "Explore further"

## Implementation
- Component in `frontend/src/components/GhostQuestions.tsx`
- Styles in `frontend/src/components/GhostQuestions.css`
- Props: questions, isLoading, onQuestionClick, onDismiss
- SVG X icon for dismiss button

## Dependencies
- FE-406 (Focus Mode Navigation) ✅
- API-203 (WebSocket Streaming) ✅

## Parallel Safe With
- AUTH-*

## Notes
- Guides deeper thinking
- Questions should be contextual
- Component ready for integration with AI question generation

## Testing
- **Unit Tests**: 15 tests in `src/components/__tests__/GhostQuestions.test.tsx` ✅
- **Commit**: `3ee9a1b` feat(fe): FE-409 - Add GhostQuestions component for focus mode (#26)

## Status
- **Created**: 2025-01-09
- **Code Complete**: 2026-01-10
- **Status**: needs_integration
- **Phase**: 5

## Integration Required

Component is implemented but NOT rendered in Editor.tsx.

**Integration tasks:**
- [ ] Import `GhostQuestions` in Editor.tsx
- [ ] Generate questions via AI when entering focus mode
- [ ] Wire `onQuestionClick` to trigger expansion
- [ ] Wire `onDismiss` to hide questions
- [ ] Position below focused block or in sidebar
