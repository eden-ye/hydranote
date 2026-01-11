# FE-405: AI Generation Store

## Description
Create Zustand store for AI generation state. Track generation requests, loading states, and limits.

## Acceptance Criteria
- [x] Store in `frontend/src/stores/ai-store.ts`
- [x] Track current generation request
- [x] Track loading/streaming state
- [x] Track generations used/remaining
- [x] Actions: setCurrentPrompt, setIsGenerating, setIsStreaming, incrementGenerationsUsed, resetGeneration
- [x] Selectors: selectCanGenerate, selectGenerationsRemaining

## Dependencies
- FE-401 (Supabase Client Frontend) ✅

## Parallel Safe With
- FE-402, FE-403, AUTH-*, API-*, EDITOR-*

## Notes
- Zustand already installed
- Coordinate with WebSocket streaming via useExpandBlock hook
- Update limits after each generation

## Testing
- **Unit Tests**: 21 tests in `src/stores/__tests__/ai-store.test.ts` ✅
- **Commit**: `9838bd2` feat(fe): FE-405 - Add AI generation store with Zustand (#22)

## Status
- **Created**: 2025-01-09
- **Code Complete**: 2026-01-10
- **Status**: needs_integration
- **Phase**: 4

## Integration Required

Store is implemented and tested but NOT integrated into App.tsx.

**TODO in App.tsx line 10:**
```typescript
// TODO: Integrate with AI generation store (FE-405)
```

**Integration tasks:**
- [ ] Import `useAIStore` in App.tsx
- [ ] Wire Spotlight submit to AI store's generate action
- [ ] Display generation limits in UI
