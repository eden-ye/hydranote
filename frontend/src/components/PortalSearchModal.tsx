/**
 * Portal Search Modal Component (EDITOR-3409)
 *
 * VSCode-like search modal for portal creation triggered by Cmd+S
 *
 * Features:
 * - Shows recents (frecency-based) when query is empty
 * - Instant fuzzy search (200ms debounce) when user types
 * - Context paths: "Leetcode / ... / *Combination Without Duplicates"
 * - Highlight matching terms
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Creates portal as new sibling below current bullet
 */
import { useEffect, useCallback, useRef, useMemo } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { frecencyTracker, type RecentItem } from '@/utils/frecency'
import { highlightMatches, type FuzzySearchResult } from '@/utils/fuzzy-search'
import './PortalSearchModal.css'

export interface PortalSearchModalProps {
  /** Callback when a portal target is selected */
  onSelect?: (item: RecentItem | FuzzySearchResult) => void
}

// Type guard to check if item is RecentItem
function isRecentItem(
  item: RecentItem | FuzzySearchResult
): item is RecentItem {
  return 'accessCount' in item
}

// Helper to get display text from either item type
function getItemText(item: RecentItem | FuzzySearchResult): string {
  return isRecentItem(item) ? item.bulletText : item.text
}

// Helper to get context path from either item type
function getItemContextPath(item: RecentItem | FuzzySearchResult): string {
  return item.contextPath
}

// Helper to get unique key from either item type
function getItemKey(item: RecentItem | FuzzySearchResult): string {
  return isRecentItem(item)
    ? `${item.documentId}-${item.blockId}`
    : `${item.documentId}-${item.blockId}`
}

export function PortalSearchModal({ onSelect }: PortalSearchModalProps) {
  const {
    portalSearchModalOpen,
    portalSearchQuery,
    portalSearchResults,
    portalSearchRecents,
    portalSearchSelectedIndex,
    // portalSearchCurrentBulletId is available for future use when integrating
    // with the editor to create portals at the current bullet position
    closePortalSearchModal,
    setPortalSearchQuery,
    setPortalSearchSelectedIndex,
    setPortalSearchRecents,
  } = useEditorStore()

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load recents when modal opens
  useEffect(() => {
    if (portalSearchModalOpen) {
      const recents = frecencyTracker.getTopRecents(10)
      setPortalSearchRecents(recents)
      // Focus input
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 0)
    }
  }, [portalSearchModalOpen, setPortalSearchRecents])

  // Determine what to display: search results or recents
  const displayItems = useMemo(() => {
    if (portalSearchQuery.trim()) {
      return portalSearchResults
    }
    return portalSearchRecents
  }, [portalSearchQuery, portalSearchResults, portalSearchRecents])

  // Handle selection
  const handleSelect = useCallback(
    (item: RecentItem | FuzzySearchResult) => {
      // Record access for frecency tracking
      frecencyTracker.recordAccess({
        documentId: item.documentId,
        blockId: item.blockId,
        bulletText: getItemText(item),
        contextPath: getItemContextPath(item),
      })

      onSelect?.(item)
      closePortalSearchModal()
    },
    [onSelect, closePortalSearchModal]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!portalSearchModalOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setPortalSearchSelectedIndex(
            Math.min(portalSearchSelectedIndex + 1, displayItems.length - 1)
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setPortalSearchSelectedIndex(
            Math.max(portalSearchSelectedIndex - 1, 0)
          )
          break
        case 'Enter':
          e.preventDefault()
          if (displayItems[portalSearchSelectedIndex]) {
            handleSelect(displayItems[portalSearchSelectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          closePortalSearchModal()
          break
      }
    },
    [
      portalSearchModalOpen,
      displayItems,
      portalSearchSelectedIndex,
      setPortalSearchSelectedIndex,
      handleSelect,
      closePortalSearchModal,
    ]
  )

  // Attach keyboard listener
  useEffect(() => {
    if (!portalSearchModalOpen) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [portalSearchModalOpen, handleKeyDown])

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    closePortalSearchModal()
  }, [closePortalSearchModal])

  // Prevent clicks inside modal from closing
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  // Handle search input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPortalSearchQuery(e.target.value)
      // Note: Actual search with debounce will be handled by parent component
      // or a future hook that integrates with the semantic search API
    },
    [setPortalSearchQuery]
  )

  // Handle item click
  const handleItemClick = useCallback(
    (item: RecentItem | FuzzySearchResult) => {
      handleSelect(item)
    },
    [handleSelect]
  )

  // Handle item hover
  const handleItemHover = useCallback(
    (index: number) => {
      setPortalSearchSelectedIndex(index)
    },
    [setPortalSearchSelectedIndex]
  )

  if (!portalSearchModalOpen) return null

  return (
    <div
      data-testid="portal-search-modal-backdrop"
      className="portal-search-modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        data-testid="portal-search-modal"
        className="portal-search-modal"
        onClick={handleModalClick}
      >
        <div className="portal-search-header">
          <span className="portal-search-icon">🔗</span>
          <span className="portal-search-title">Embed a Portal to...</span>
        </div>

        <input
          ref={searchInputRef}
          type="text"
          data-testid="portal-search-input"
          className="portal-search-input"
          placeholder={
            portalSearchQuery ? 'Search bullets...' : 'Search or select recent...'
          }
          value={portalSearchQuery}
          onChange={handleInputChange}
          autoFocus
        />

        {!portalSearchQuery && portalSearchRecents.length > 0 && (
          <div className="portal-search-section-header">Recents</div>
        )}

        <ul className="portal-search-results" data-testid="portal-search-results">
          {displayItems.map((item, i) => (
            <li
              key={getItemKey(item)}
              data-testid={`portal-search-result-${i}`}
              className={`portal-search-result ${
                i === portalSearchSelectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => handleItemHover(i)}
            >
              <div
                className="portal-search-result-text"
                dangerouslySetInnerHTML={{
                  __html: highlightMatches(getItemText(item), portalSearchQuery),
                }}
              />
              <div className="portal-search-result-path">
                {getItemContextPath(item)}
              </div>
            </li>
          ))}
        </ul>

        {displayItems.length === 0 && (
          <div className="portal-search-empty" data-testid="portal-search-empty">
            {portalSearchQuery ? 'No results found' : 'No recent bullets'}
          </div>
        )}

        <div className="portal-search-hint">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  )
}

export default PortalSearchModal
