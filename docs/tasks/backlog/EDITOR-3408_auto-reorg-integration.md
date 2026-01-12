# EDITOR-3408: Auto-Reorg Integration

## Description
Integrate auto-reorg foundation with real backend APIs and Editor.tsx document observer. This completes the silent auto-reorganization feature.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [ ] Editor.tsx document observer integrated (Yjs `doc.spaceDoc.on('update')`)
- [ ] Real API client replacing mocks (`/api/ai/extract-concepts`, `/api/notes/semantic-search`)
- [ ] Portals created automatically after document blur (2s debounce)
- [ ] Settings toggle works (enable/disable auto-reorg)
- [ ] Unit tests pass
- [ ] Chrome E2E tests pass

## Feature Flow
1. User types in document → Yjs observer fires
2. Debounce 2s → Extract concepts → Semantic search → Create portals
3. Completely silent (no UI feedback, just background operation)

## Technical Details

### Editor.tsx Integration
**File**: `frontend/src/components/Editor.tsx` (MODIFY)

Add around lines 432-462 (existing document observer pattern):

```typescript
// Auto-reorg observer reference
const autoReorgRef = useRef<{ trigger: () => void; cancel: () => void } | null>(null)

useEffect(() => {
  const doc = docRef.current
  if (!doc) return

  // Get auto-reorg settings from store
  const { autoReorgEnabled, autoReorgThreshold } = useEditorStore.getState()

  if (!autoReorgEnabled) return

  // Create debounced auto-reorg observer
  autoReorgRef.current = createAutoReorgObserver(doc, {
    enabled: autoReorgEnabled,
    thresholdScore: autoReorgThreshold,
    debounceMs: 2000,
    maxResults: 5
  }, async (context: AutoReorgContext) => {
    // Set status to processing
    useEditorStore.getState().setAutoReorgStatus('processing')

    try {
      // Execute auto-reorg with real APIs
      const result = await executeAutoReorg(
        context,
        {
          enabled: autoReorgEnabled,
          thresholdScore: autoReorgThreshold,
          debounceMs: 2000,
          maxResults: 5
        },
        accessToken
      )

      // Set status to completed
      useEditorStore.getState().setAutoReorgStatus('completed')

      console.log(`Auto-reorg: Created ${result.portalsCreated} portals`)
    } catch (error) {
      console.error('Auto-reorg failed:', error)
      useEditorStore.getState().setAutoReorgStatus('idle')
    }
  })

  // Observe document updates
  const handleUpdate = () => {
    if (autoReorgEnabled && autoReorgRef.current) {
      autoReorgRef.current.trigger()
    }
  }

  doc.spaceDoc.on('update', handleUpdate)

  return () => {
    doc.spaceDoc.off('update', handleUpdate)
    autoReorgRef.current?.cancel()
  }
}, [autoReorgEnabled, autoReorgThreshold, accessToken])
```

### Real API Client
**File**: `frontend/src/services/api-client.ts` (NEW)

```typescript
/**
 * Real API client for semantic search and concept extraction
 * Replaces mocks from EDITOR-3407
 */

export async function semanticSearch(
  request: SemanticSearchRequest,
  accessToken: string
): Promise<SemanticSearchResult[]> {
  const response = await fetch('/api/notes/semantic-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    throw new Error(`Semantic search failed: ${response.statusText}`)
  }

  return await response.json()
}

export async function extractConcepts(
  text: string,
  maxConcepts: number = 5,
  accessToken: string
): Promise<Concept[]> {
  const response = await fetch('/api/ai/extract-concepts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ text, max_concepts: maxConcepts })
  })

  if (!response.ok) {
    throw new Error(`Concept extraction failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data.concepts
}

export interface SemanticSearchRequest {
  query: string
  limit?: number
  threshold?: number
  descriptor_filter?: string
}

export interface SemanticSearchResult {
  document_id: string
  block_id: string
  bullet_text: string
  context_path: string
  children_summary: string | null
  descriptor_type: string | null
  score: number
}

export interface Concept {
  name: string
  category: string | null
}
```

### Update Auto-Reorg Service
**File**: `frontend/src/services/auto-reorg-service.ts` (MODIFY)

Replace mock imports with real API client:

```typescript
import { semanticSearch, extractConcepts } from './api-client'

export async function executeAutoReorg(
  context: AutoReorgContext,
  config: AutoReorgConfig,
  accessToken: string
): Promise<AutoReorgResult> {
  // 1. Extract concepts using REAL API
  const concepts = await extractConcepts(
    context.documentText,
    config.maxResults,
    accessToken
  )

  // 2. For each concept, semantic search using REAL API
  const searchResults: SemanticSearchResult[] = []
  for (const concept of concepts) {
    const results = await semanticSearch({
      query: concept.name,
      limit: config.maxResults,
      threshold: config.thresholdScore
    }, accessToken)
    searchResults.push(...results)
  }

  // 3. Deduplicate and sort by score
  const topResults = deduplicateAndSort(searchResults)

  // 4. Create portals (unchanged from Phase 4)
  for (const result of topResults) {
    await createPortalInRelatedBullet(result, context)
  }

  return { portalsCreated: topResults.length }
}
```

## Chrome E2E Test Scenario
**File**: `e2e/expectations/auto-reorg.md` (NEW)

```markdown
# Auto-Reorg E2E Test

## Setup
1. Open Hydra Notes editor
2. Create document "Machine Learning" with bullets:
   - "Neural networks"
   - "Decision trees"
   - "Random forests"

## Test Scenario: Silent Auto-Reorg
1. Navigate to different document "AI Projects"
2. Type content mentioning ML concepts (e.g., "Building neural network model")
3. Wait 3 seconds (2s debounce + 1s processing)
4. Navigate back to "Machine Learning" document
5. Verify portals automatically created in related bullets
6. Check portal references correct source blocks
7. Verify no duplicate portals
8. Check browser console for no errors

## Success Criteria
- Portals appear without user interaction
- Placed inside related bullets (not document root)
- Similarity threshold respected (only high-confidence matches)
- No UI feedback (completely silent operation)
- No console errors
```

## Files to Create
- `frontend/src/services/api-client.ts` - Real API client
- `e2e/expectations/auto-reorg.md` - E2E test scenarios

## Files to Modify
- `frontend/src/components/Editor.tsx` - Add document observer integration
- `frontend/src/services/auto-reorg-service.ts` - Replace mocks with real API calls

## Testing
**Unit Tests:**
- API client handles errors gracefully
- Document observer triggers after 2s debounce
- Integration with Zustand store state

**Chrome E2E:**
- Auto-reorg triggers on document changes
- Portals created automatically
- No duplicate portals
- Browser console has no errors (BUG-001 critical)

## Implementation Phase
- **Phase**: Phase 5 (Auto-Reorg Integration)
- **Time Estimate**: 4 hours
- **Branch**: `editor/EDITOR-3408-auto-reorg-integration`
- **Dependencies**: API-301, API-302, API-303, EDITOR-3407 must be complete

## Deliverables
- [x] `frontend/src/components/Editor.tsx` observer integration
- [x] Real API client replacing mocks
- [x] Portals created automatically on document blur
- [x] Unit tests pass
- [x] Chrome E2E tests pass

## Parallel Safe With
- None (requires all backend APIs and frontend foundation complete)

## Dependencies
- **CRITICAL**: API-301, API-302, API-303 must be deployed and working
- **CRITICAL**: EDITOR-3407 must be complete
- Backend endpoints must be accessible from frontend

## Notes
This phase completes the silent auto-reorg feature. After this phase, the feature is fully functional and ready for user testing.

**Settings UI**: User settings toggle will be added in a future FE-* ticket (not blocking for MVP2).

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
