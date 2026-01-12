# EDITOR-3502: Reorganization Modal UI

## Description
Create modal UI for manual reorganization trigger (Cmd+Shift+L) that shows semantic search suggestions.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [x] Cmd+Shift+L opens reorganization modal
- [x] Modal shows "Analyzing..." state while extracting concepts
- [x] Display extracted concepts with checkboxes
- [x] For each concept, show matching existing bullets with similarity scores
- [x] Display full context path for disambiguation: "Apple > [What] Red Sweet Fruit"
- [x] User can check/uncheck which connections to create
- [x] "Connect Selected" and "Skip" buttons
- [x] Respects similarity threshold from settings

## Technical Details

### Modal Component
```typescript
interface ReorganizationModalProps {
  documentId: string;
  onClose: () => void;
  onConnect: (connections: PortalConnection[]) => void;
}

interface ConceptMatch {
  concept: string;
  category: string;
  matches: SemanticSearchResult[];
  selected: boolean;
}

interface PortalConnection {
  sourceDocId: string;
  sourceBlockId: string;
  contextPath: string;
}
```

### Flow
1. User presses Cmd+Shift+L
2. Modal opens with loading state
3. Call `/api/ai/extract-concepts` with document text
4. For each concept, call `/api/notes/semantic-search`
5. Display results grouped by concept
6. User selects which connections to make
7. On confirm, pass selections to EDITOR-3503

### UI Layout
```
┌─────────────────────────────────────────────────┐
│ 🔗 Connect to Existing Knowledge               │
├─────────────────────────────────────────────────┤
│                                                 │
│ Found 3 concepts in your note:                 │
│                                                 │
│ ▼ Tesla Inc (company)                          │
│   ☑ Tesla > [What] Electric car company (0.89) │
│   ☐ Companies > Tech > Tesla Motors (0.72)     │
│                                                 │
│ ▼ electric vehicle (category)                  │
│   ☑ Transportation > Types > EVs (0.85)        │
│                                                 │
│ ▼ Model 3 (product)                            │
│   ⚠️ No matches found above threshold           │
│                                                 │
├─────────────────────────────────────────────────┤
│               [Skip]  [Connect Selected (2)]   │
└─────────────────────────────────────────────────┘
```

## Dependencies
- API-302: Semantic Search Endpoint
- API-303: Concept Extraction Endpoint
- FE-501: Semantic Linking Settings (for threshold)

## Parallel Safe With
- AUTH-*, API-*

## Notes
Part of Epic 5: Semantic Linking. Core user interaction for reorganization.

**Design Doc**: See `docs/design/semantic-search.md` for full architecture.

## Implementation Summary

### Files Changed/Created
- `frontend/src/components/ReorganizationModal.tsx` - Main modal component
- `frontend/src/components/ReorganizationModal.css` - Modal styling
- `frontend/src/components/__tests__/ReorganizationModal.test.tsx` - 20 component tests
- `frontend/src/stores/editor-store.ts` - Added reorganization modal state (12 new tests)
- `frontend/src/components/Editor.tsx` - Added Cmd+Shift+L shortcut and modal integration
- `e2e/expectations/EDITOR-3502-reorganization-modal.md` - E2E test expectations

### Key Features Implemented
1. **Keyboard Shortcut**: Cmd+Shift+L / Ctrl+Shift+L opens the modal
2. **Loading States**: "Analyzing..." while extracting concepts, "Searching..." while finding matches
3. **Concept Display**: Collapsible concept groups with category labels
4. **Match Display**: Context paths with similarity scores, checkboxes for selection
5. **Selection Management**: Toggle individual matches, count updates in Connect button
6. **Actions**: Connect Selected (creates portals), Skip (closes modal)
7. **Escape & Backdrop**: Close modal with Escape key or clicking outside
8. **Error Handling**: Error state with retry button

### Test Results
- All 972 frontend tests pass (including 20 new ReorganizationModal tests + 12 editor store tests)
- TypeScript build passes with no errors

### E2E Testing
- E2E expectations documented in `e2e/expectations/EDITOR-3502-reorganization-modal.md`
- Manual testing: Frontend dev server verified running at http://localhost:5174

## Status
- **Created**: 2026-01-12
- **Completed**: 2026-01-12
- **Status**: complete
- **Epic**: MVP2 - Semantic Linking
