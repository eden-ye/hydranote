# EDITOR-3407: Auto-Reorg Foundation

## Description
Build foundation for silent auto-reorganization feature that automatically creates portals in related bullets based on semantic similarity. This phase creates core utilities with mock APIs.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [x] Document observer with 2s debouncing implemented
- [x] Auto-reorg service orchestration logic complete (with mocks)
- [x] AI-driven portal placement logic (descriptor child vs bullet child)
- [x] Zustand store state and actions for auto-reorg
- [x] Unit tests for all utilities pass

## Feature Overview
Silent auto-reorg automatically:
1. Observes document changes via Yjs
2. Debounces 2s after last change
3. Extracts concepts from document text
4. Searches for semantically similar bullets
5. Creates portals inside related bullets (AI decides placement)

## Technical Details

### Document Observer with Debouncing
**File**: `frontend/src/blocks/utils/auto-reorg.ts` (NEW)

```typescript
export interface AutoReorgConfig {
  enabled: boolean
  thresholdScore: number  // 0.7-0.9
  debounceMs: number      // Default 2000ms
  maxResults: number      // Default 5 per concept
}

export function createAutoReorgObserver(
  doc: Doc,
  config: AutoReorgConfig,
  onTrigger: (context: AutoReorgContext) => void
): AutoReorgObserver {
  // Use Yjs doc.spaceDoc.on('update') observer
  // Debounce changes by 2000ms
  // Extract document text on trigger
  // Call onTrigger with context
}

export interface AutoReorgContext {
  documentId: string
  documentText: string      // Full text for concept extraction
  allBulletIds: string[]    // All bullets in doc for portal creation
}
```

### Auto-Reorg Service (with Mocks)
**File**: `frontend/src/services/auto-reorg-service.ts` (NEW)

```typescript
/**
 * Execute auto-reorganization flow
 * Phase 4: Uses mock APIs
 * Phase 5: Integrates real APIs
 */
export async function executeAutoReorg(
  context: AutoReorgContext,
  config: AutoReorgConfig,
  accessToken: string
): Promise<AutoReorgResult> {
  // 1. Call concept extraction (mocked)
  const concepts = await extractConcepts(context.documentText)

  // 2. For each concept, semantic search (mocked)
  const searchResults = []
  for (const concept of concepts) {
    const results = await semanticSearch({
      query: concept.name,
      limit: config.maxResults,
      threshold: config.thresholdScore
    })
    searchResults.push(...results)
  }

  // 3. Deduplicate and sort by score
  const topResults = deduplicateAndSort(searchResults)

  // 4. Create portals (uses real portal creation logic)
  for (const result of topResults) {
    await createPortalInRelatedBullet(result, context)
  }

  return { portalsCreated: topResults.length }
}
```

### AI Portal Placement Logic
**File**: `frontend/src/blocks/utils/portal-placement.ts` (NEW)

```typescript
/**
 * AI-driven portal placement logic
 * Decision tree:
 * 1. If bullet has [What]/[Why]/[How] descriptor → Insert as child of descriptor
 * 2. Otherwise → Insert as direct child of bullet
 * 3. Always insert at index 0 (first child)
 */
export async function createPortalInRelatedBullet(
  result: SearchResult,
  currentDoc: Doc
): Promise<string> {
  const targetBullet = currentDoc.getBlock(result.blockId)

  // Find descriptor children
  const descriptorChild = findDescriptorChild(targetBullet)

  // Decide parent: descriptor if exists, else bullet itself
  const parentBlock = descriptorChild || targetBullet

  // Create portal as first child
  const portalId = currentDoc.addBlock(
    'hydra:portal',
    {
      sourceDocId: result.documentId,
      sourceBlockId: result.blockId,
      isCollapsed: false,
      syncStatus: 'synced'
    },
    parentBlock,
    0  // Insert as first child
  )

  return portalId
}

function findDescriptorChild(bullet: Block): Block | null {
  // Check children for hydra:bullet with descriptor type
  // Return first descriptor child found ([What], [Why], [How], etc.)
}
```

### Zustand Store Updates
**File**: `frontend/src/stores/editor-store.ts` (MODIFY)

```typescript
interface EditorState {
  // ... existing state ...

  // Auto-reorg settings
  autoReorgEnabled: boolean          // Default: true
  autoReorgThreshold: number         // Default: 0.8
  autoReorgStatus: 'idle' | 'processing' | 'completed'
}

interface EditorActions {
  // ... existing actions ...

  setAutoReorgEnabled: (enabled: boolean) => void
  setAutoReorgThreshold: (threshold: number) => void
  setAutoReorgStatus: (status: AutoReorgStatus) => void
}
```

### Mock API Client
**File**: `frontend/src/services/api-client.mock.ts` (NEW)

```typescript
// Mock APIs for frontend development before backend ready
export const mockSemanticSearch = async (query: string): Promise<SemanticSearchResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return [
    {
      documentId: 'doc-1',
      blockId: 'block-1',
      bulletText: 'Neural networks use layers of nodes',
      contextPath: 'Machine Learning > [What] Neural Networks',
      score: 0.92,
      descriptorType: 'What',
      childrenSummary: 'Backpropagation, Activation functions'
    }
  ]
}

export const mockExtractConcepts = async (text: string): Promise<Concept[]> => {
  await new Promise(resolve => setTimeout(resolve, 150))
  return [
    { name: 'machine learning', category: 'topic' },
    { name: 'neural networks', category: 'topic' }
  ]
}

// Usage toggle
const USE_MOCKS = import.meta.env.VITE_USE_MOCK_API === 'true'
```

## Files to Create
- `frontend/src/blocks/utils/auto-reorg.ts` - Document observer with debouncing
- `frontend/src/services/auto-reorg-service.ts` - Orchestration with mocks
- `frontend/src/blocks/utils/portal-placement.ts` - AI placement logic
- `frontend/src/services/api-client.mock.ts` - Mock APIs for testing
- `frontend/src/__tests__/utils/auto-reorg.test.ts` - Unit tests

## Files to Modify
- `frontend/src/stores/editor-store.ts` - Add auto-reorg state and actions

## Testing
**Unit Tests:**
- Auto-reorg debounces changes (wait 2s before triggering)
- Document text extraction handles nested bullets
- Portal placement decision logic correct (descriptor vs bullet)
- Mock APIs return expected data structure

## Implementation Phase
- **Phase**: Phase 4 (Auto-Reorg Frontend Foundation)
- **Time Estimate**: 5 hours
- **Branch**: `editor/EDITOR-3407-auto-reorg-foundation`
- **Dependencies**: None (can use mock APIs initially)

## Deliverables
- [x] `frontend/src/blocks/utils/auto-reorg.ts` with debouncing
- [x] `frontend/src/services/auto-reorg-service.ts` with mocks
- [x] `frontend/src/blocks/utils/portal-placement.ts` AI logic
- [x] `frontend/src/stores/editor-store.ts` auto-reorg state
- [x] Unit tests pass

## Parallel Safe With
- API-301, API-302, API-303 (completely parallel with backend work)
- EDITOR-3409 (search modal foundation - different files)

## Dependencies
- None (uses mocks for backend APIs)

## Notes
Part of MVP2: Semantic Linking. Foundation phase allows frontend development to proceed while backend APIs are being built. Mock APIs enable full testing of orchestration logic without real backend.

**Next Phase**: EDITOR-3408 will integrate real APIs and add Editor.tsx observer integration.

## Status
- **Created**: 2026-01-13
- **Completed**: 2026-01-12
- **Status**: completed
- **Epic**: MVP2 - Semantic Linking

## Implementation Summary
Implemented auto-reorg foundation utilities:

### Files Created
- `frontend/src/blocks/utils/auto-reorg.ts` - Document observer with 2s debouncing
- `frontend/src/blocks/utils/portal-placement.ts` - AI-driven portal placement logic
- `frontend/src/services/api-client.mock.ts` - Mock APIs for semantic search and concept extraction
- `frontend/src/services/auto-reorg-service.ts` - Orchestration logic

### Files Modified
- `frontend/src/stores/editor-store.ts` - Added auto-reorg state (enabled, threshold, status) and actions
- `frontend/src/blocks/utils/index.ts` - Added exports for new utilities

### Test Files Created
- `frontend/src/blocks/__tests__/auto-reorg.test.ts` (20 tests)
- `frontend/src/blocks/__tests__/portal-placement.test.ts` (16 tests)
- `frontend/src/services/__tests__/api-client.mock.test.ts` (15 tests)
- `frontend/src/services/__tests__/auto-reorg-service.test.ts` (15 tests)

### Test Results
- All 815 unit tests pass
- Build succeeds with no TypeScript errors
- Frontend loads without console errors

### Key Features
1. **Document Observer**: 2s debounced observer for document changes
2. **Portal Placement**: AI logic preferring descriptor children over direct bullet children
3. **Mock APIs**: Simulated semantic search and concept extraction for development
4. **Store Integration**: Auto-reorg enabled/disabled, threshold, and status tracking
