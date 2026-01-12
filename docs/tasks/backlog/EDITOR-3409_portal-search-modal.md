# EDITOR-3409: Portal Search Modal Foundation

## Description
Build VSCode-like search modal for manual portal insertion (triggered by Cmd+S). Shows recents with frecency ranking and instant fuzzy search. This phase creates all UI components and utilities with mock data.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [ ] PortalSearchModal component with VSCode-like UI
- [ ] Frecency tracking working (localStorage, Mozilla Firefox algorithm)
- [ ] Client-side fuzzy search working (200ms debounce)
- [ ] Context path generation ("Leetcode / ... / *Bullet")
- [ ] Zustand store state and actions for modal
- [ ] Unit tests for all utilities pass

## Feature Overview
Cmd+S modal allows user to:
1. Press Cmd+S → Modal opens with recents (top 10, frecency-sorted)
2. Type query → Fuzzy search updates results (200ms debounce)
3. Arrow keys navigate, Enter selects
4. Portal created as new sibling below current bullet
5. Escape closes modal

## Technical Details

### Modal Component
**File**: `frontend/src/components/PortalSearchModal.tsx` (NEW)

```typescript
/**
 * VSCode-like search modal for portal creation
 *
 * Features:
 * - Shows recents (frecency-based) when query is empty
 * - Instant fuzzy search (200ms debounce) when user types
 * - Context paths: "Leetcode / ... / *Combination Without Duplicates"
 * - Highlight matching terms
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Creates portal as new sibling below current bullet
 */
export interface PortalSearchModalProps {
  isOpen: boolean
  currentBulletId: string | null  // Bullet where user pressed Cmd+S
  onClose: () => void
}

export function PortalSearchModal({
  isOpen,
  currentBulletId,
  onClose
}: PortalSearchModalProps) {
  const {
    portalSearchQuery,
    portalSearchResults,
    portalSearchRecents,
    portalSearchSelectedIndex,
    setPortalSearchQuery,
    setPortalSearchSelectedIndex
  } = useEditorStore()

  const debouncedSearch = useDebouncedSearch(200)

  // Show recents when query is empty
  const displayItems = portalSearchQuery
    ? portalSearchResults
    : portalSearchRecents

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setPortalSearchSelectedIndex(Math.min(selectedIndex + 1, displayItems.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setPortalSearchSelectedIndex(Math.max(selectedIndex - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (displayItems[selectedIndex]) {
          handleSelect(displayItems[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [isOpen, displayItems, selectedIndex])

  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  return (
    <div className="portal-search-modal-backdrop" onClick={onClose}>
      <div className="portal-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="portal-search-header">
          <span className="portal-search-icon">🔗</span>
          <span className="portal-search-title">Embed a Portal to...</span>
        </div>

        <input
          type="text"
          className="portal-search-input"
          placeholder={portalSearchQuery ? "Search bullets..." : "Search or select recent..."}
          value={portalSearchQuery}
          onChange={(e) => {
            setPortalSearchQuery(e.target.value)
            debouncedSearch(e.target.value)
          }}
          autoFocus
        />

        {!portalSearchQuery && portalSearchRecents.length > 0 && (
          <div className="portal-search-section-header">Recents</div>
        )}

        <ul className="portal-search-results">
          {displayItems.map((item, i) => (
            <li
              key={item.blockId}
              className={`portal-search-result ${i === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(item)}
            >
              <div className="portal-search-result-text">
                {highlightMatches(item.bulletText, portalSearchQuery)}
              </div>
              <div className="portal-search-result-path">
                {item.contextPath}
              </div>
            </li>
          ))}
        </ul>

        {displayItems.length === 0 && (
          <div className="portal-search-empty">
            {portalSearchQuery ? 'No results found' : 'No recent bullets'}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Modal Styling
**File**: `frontend/src/components/PortalSearchModal.css` (NEW)

```css
/* Based on PortalPicker.css but larger and with context paths */
.portal-search-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.portal-search-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 600px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.portal-search-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  font-weight: 500;
}

.portal-search-icon {
  margin-right: 8px;
}

.portal-search-input {
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid #e5e5e5;
  font-size: 14px;
  outline: none;
}

.portal-search-section-header {
  padding: 8px 16px;
  font-size: 12px;
  color: #888;
  font-weight: 500;
  text-transform: uppercase;
}

.portal-search-results {
  overflow-y: auto;
  max-height: 400px;
}

.portal-search-result {
  padding: 8px 16px;
  cursor: pointer;
  border-left: 3px solid transparent;
}

.portal-search-result.selected {
  background: #f0f0f0;
  border-left-color: #007bff;
}

.portal-search-result-text {
  font-size: 14px;
  margin-bottom: 4px;
}

.portal-search-result-text mark {
  background: #fef3c7;
  padding: 0 2px;
}

.portal-search-result-path {
  font-size: 12px;
  color: #666;
}

.portal-search-empty {
  padding: 32px;
  text-align: center;
  color: #888;
}
```

### Frecency Tracking (Mozilla Firefox Algorithm)
**File**: `frontend/src/utils/frecency.ts` (NEW)

```typescript
/**
 * Track recently/frequently accessed bullets using frecency algorithm
 * Storage: localStorage (persists across sessions)
 * Algorithm: Mozilla Firefox frecency (frequency * decay factor based on age)
 */
export interface RecentItem {
  documentId: string
  blockId: string
  bulletText: string
  contextPath: string
  accessCount: number
  lastAccessTime: number
  frecencyScore: number
}

export class FrecencyTracker {
  private storageKey = 'hydra-portal-recents'

  /**
   * Record access to a bullet
   * Updates access count and last access time
   */
  recordAccess(item: {
    documentId: string
    blockId: string
    bulletText: string
    contextPath: string
  }): void {
    const recents = this.getRecents()
    const existing = recents.find(r =>
      r.documentId === item.documentId &&
      r.blockId === item.blockId
    )

    if (existing) {
      existing.accessCount++
      existing.lastAccessTime = Date.now()
      existing.frecencyScore = this.calculateFrecency(
        existing.accessCount,
        existing.lastAccessTime
      )
    } else {
      recents.push({
        ...item,
        accessCount: 1,
        lastAccessTime: Date.now(),
        frecencyScore: this.calculateFrecency(1, Date.now())
      })
    }

    this.saveRecents(recents)
  }

  /**
   * Get top N recent items sorted by frecency
   */
  getTopRecents(limit: number = 10): RecentItem[] {
    return this.getRecents()
      .sort((a, b) => b.frecencyScore - a.frecencyScore)
      .slice(0, limit)
  }

  /**
   * Calculate frecency score
   * Formula: accessCount * decayFactor(age)
   * Decay factors (Mozilla Firefox algorithm):
   * - < 4 hours: 100
   * - < 24 hours: 70
   * - < 1 week: 50
   * - > 1 week: 30
   */
  private calculateFrecency(
    accessCount: number,
    lastAccessTime: number
  ): number {
    const ageHours = (Date.now() - lastAccessTime) / (1000 * 60 * 60)

    let decayFactor = 1
    if (ageHours < 4) decayFactor = 100
    else if (ageHours < 24) decayFactor = 70
    else if (ageHours < 168) decayFactor = 50  // 1 week
    else decayFactor = 30

    return accessCount * decayFactor
  }

  private getRecents(): RecentItem[] {
    const json = localStorage.getItem(this.storageKey)
    return json ? JSON.parse(json) : []
  }

  private saveRecents(recents: RecentItem[]): void {
    // Keep max 100 items
    const limited = recents.slice(0, 100)
    localStorage.setItem(this.storageKey, JSON.stringify(limited))
  }
}

export const frecencyTracker = new FrecencyTracker()
```

### Client-Side Fuzzy Search
**File**: `frontend/src/utils/fuzzy-search.ts` (NEW)

```typescript
/**
 * Client-side fuzzy search for portal search modal
 * Reuses scoring logic from descriptor-autocomplete.ts
 *
 * Scoring system:
 * - Exact match: 100 points
 * - Starts with query: 80-90 points
 * - Contains query: 50-60 points
 * - Threshold: 30 (filter out low scores)
 * - Limit: Top 20 results
 */

export interface FuzzySearchOptions {
  limit?: number
  threshold?: number  // Minimum score (0-100)
}

export function fuzzySearchBullets(
  query: string,
  allBullets: BulletItem[],
  options: FuzzySearchOptions = {}
): FuzzySearchResult[] {
  const { limit = 20, threshold = 30 } = options

  const results: FuzzySearchResult[] = []

  for (const bullet of allBullets) {
    const score = calculateFuzzyScore(query, bullet.text)

    if (score >= threshold) {
      results.push({
        ...bullet,
        score,
        matchedText: bullet.text
      })
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Calculate fuzzy match score (0-100)
 */
function calculateFuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim()
  const t = target.toLowerCase()

  if (q === '') return 0
  if (t === q) return 100
  if (t.startsWith(q)) return 80 + (q.length / t.length) * 10
  if (t.includes(q)) return 50 + (q.length / t.length) * 10

  return 0
}

/**
 * Highlight matching parts of text
 * Returns JSX with <mark> tags around matches
 */
export function highlightMatches(text: string, query: string): JSX.Element {
  if (!query) return <>{text}</>

  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="search-highlight">{part}</mark>
          : part
      )}
    </>
  )
}
```

### Context Path Generation
**File**: `frontend/src/utils/context-path.ts` (NEW)

```typescript
/**
 * Generate context path for display in search results
 * Format: "Leetcode / Binary Search / *Combination Without Duplicates"
 *
 * Features:
 * - Show up to 3 ancestor levels
 * - Truncate middle with "..." if needed
 * - Mark current bullet with *
 */
export function generateContextPath(
  doc: Doc,
  blockId: string,
  maxLength: number = 60
): string {
  const block = doc.getBlock(blockId)
  if (!block) return ''

  // Collect ancestors
  const ancestors: string[] = []
  let current = block.parent

  while (current && current.flavour !== 'affine:page') {
    const text = getBlockText(current)
    if (text) ancestors.unshift(text)
    current = current.parent
  }

  // Add current block with * marker
  const currentText = getBlockText(block)
  const parts = [...ancestors, `*${currentText}`]

  // Truncate if too long
  return truncateMiddle(parts, maxLength)
}

function getBlockText(block: Block): string {
  if (block.flavour === 'hydra:bullet') {
    return block.text?.toString?.() || ''
  }
  return ''
}

function truncateMiddle(parts: string[], maxLength: number): string {
  const joined = parts.join(' / ')

  if (joined.length <= maxLength) return joined

  // Truncate middle ancestors with "..."
  if (parts.length > 3) {
    return `${parts[0]} / ... / ${parts[parts.length - 1]}`
  }

  return joined.slice(0, maxLength - 3) + '...'
}
```

### Zustand Store Updates
**File**: `frontend/src/stores/editor-store.ts` (MODIFY)

```typescript
interface EditorState {
  // ... existing state ...

  // Search modal state
  portalSearchModalOpen: boolean
  portalSearchQuery: string
  portalSearchResults: SearchResult[]
  portalSearchRecents: RecentItem[]
  portalSearchSelectedIndex: number
  portalSearchCurrentBulletId: string | null
}

interface EditorActions {
  // ... existing actions ...

  openPortalSearchModal: (bulletId: string) => void
  closePortalSearchModal: () => void
  setPortalSearchQuery: (query: string) => void
  setPortalSearchResults: (results: SearchResult[]) => void
  setPortalSearchSelectedIndex: (index: number) => void
}
```

## Files to Create
- `frontend/src/components/PortalSearchModal.tsx` - Main modal UI
- `frontend/src/components/PortalSearchModal.css` - Modal styling
- `frontend/src/utils/frecency.ts` - Recents tracking
- `frontend/src/utils/fuzzy-search.ts` - Client-side search
- `frontend/src/utils/context-path.ts` - Path generation
- `frontend/src/__tests__/utils/frecency.test.ts` - Unit tests
- `frontend/src/__tests__/utils/fuzzy-search.test.ts` - Unit tests
- `frontend/src/__tests__/utils/context-path.test.ts` - Unit tests

## Files to Modify
- `frontend/src/stores/editor-store.ts` - Add modal state and actions

## Testing
**Unit Tests:**
- Frecency score calculated correctly (Mozilla algorithm)
- Fuzzy search scores exact matches highest (100 points)
- Context paths truncated with "..." for long paths
- Highlight matches wraps query in <mark> tags

## Implementation Phase
- **Phase**: Phase 6 (Search Modal Frontend Foundation)
- **Time Estimate**: 6 hours
- **Branch**: `editor/EDITOR-3409-portal-search-modal`
- **Dependencies**: None (can use mock data)

## Deliverables
- [x] `frontend/src/components/PortalSearchModal.tsx` + CSS
- [x] `frontend/src/utils/frecency.ts` recents tracking
- [x] `frontend/src/utils/fuzzy-search.ts` client-side search
- [x] `frontend/src/utils/context-path.ts` path generation
- [x] `frontend/src/stores/editor-store.ts` modal state
- [x] Unit tests pass

## Parallel Safe With
- API-301, API-302, API-303 (completely parallel with backend)
- EDITOR-3407, EDITOR-3408 (auto-reorg features - different files)

## Dependencies
- None (uses mock data for testing)

## Notes
Part of MVP2: Semantic Linking. Foundation phase allows UI development without backend dependency. Modal can be fully tested with mock data.

**Next Phase**: EDITOR-3410 will integrate with Editor.tsx keyboard shortcuts and add real portal insertion logic.

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
