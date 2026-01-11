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
- **Integration Complete**: 2026-01-11
- **Status**: done
- **Phase**: 5

## Integration Completed

Component integrated into Editor.tsx.

**Completed integration tasks:**
- [x] Import `GhostQuestions` in Editor.tsx
- [x] Generate placeholder questions when entering focus mode
- [x] Wire `onQuestionClick` to trigger expansion (logs to console)
- [x] Wire `onDismiss` to hide questions
- [x] Position below editor in focus mode
- [ ] Generate questions via AI (future iteration - requires backend endpoint)

**Integration Commit**: `cdf1b0c` feat(fe): FE-406-409 - Integrate focus mode, breadcrumb, expand button, ghost questions (#42)
