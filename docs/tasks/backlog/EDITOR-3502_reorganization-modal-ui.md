# EDITOR-3502: Reorganization Modal UI

## Description
Create modal UI for manual reorganization trigger (Cmd+Shift+L) that shows semantic search suggestions.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [ ] Cmd+Shift+L opens reorganization modal
- [ ] Modal shows "Analyzing..." state while extracting concepts
- [ ] Display extracted concepts with checkboxes
- [ ] For each concept, show matching existing bullets with similarity scores
- [ ] Display full context path for disambiguation: "Apple > [What] Red Sweet Fruit"
- [ ] User can check/uncheck which connections to create
- [ ] "Connect Selected" and "Skip" buttons
- [ ] Respects similarity threshold from settings

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

## Status
- **Created**: 2026-01-12
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
