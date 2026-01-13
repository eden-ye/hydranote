/**
 * LeftPanel Component
 * FE-503: Left Panel with Favorites
 * FE-504: Removed redundant header, now reads block data from store
 *
 * Main sidebar component with favorites and all bullets sections.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { FavoritesSection } from './FavoritesSection'
import { AllBulletsSection } from './AllBulletsSection'

export function LeftPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load favorites from localStorage on mount
  const loadFavorites = useEditorStore((state) => state.loadFavorites)
  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  // FE-504: Read block data from store (synced from Editor)
  const blockTitles = useEditorStore((state) => state.blockTitles)
  const topLevelBlockIds = useEditorStore((state) => state.topLevelBlockIds)
  // FE-508: Read block metadata for filtering
  const blockHasChildren = useEditorStore((state) => state.blockHasChildren)
  const blockIsDescriptor = useEditorStore((state) => state.blockIsDescriptor)

  // Keyboard shortcut: Cmd+\ to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '\\' && e.metaKey) {
        e.preventDefault()
        setIsCollapsed((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const getBlockTitle = useCallback(
    (id: string) => blockTitles.get(id) || `Block ${id.slice(0, 8)}`,
    [blockTitles]
  )

  // FE-508: Filter to only show blocks with children or descriptors
  const topLevelBlocks = useMemo(
    () =>
      topLevelBlockIds
        .filter((id) => {
          const hasChildren = blockHasChildren.get(id) || false
          const isDescriptor = blockIsDescriptor.get(id) || false
          return hasChildren || isDescriptor
        })
        .map((id) => ({
          id,
          title: getBlockTitle(id),
        })),
    [topLevelBlockIds, getBlockTitle, blockHasChildren, blockIsDescriptor]
  )

  return (
    <>
      <aside
        data-testid="left-panel"
        style={{
          width: isCollapsed ? '0px' : '240px',
          height: '100%',
          backgroundColor: '#1e1e1e',
          borderRight: isCollapsed ? 'none' : '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
          flexShrink: 0,
        }}
      >
        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {/* Favorites Section */}
          <div style={{ padding: '8px 0' }}>
            <FavoritesSection getBlockTitle={getBlockTitle} />
          </div>

          {/* All Bullets Section */}
          <div style={{ padding: '8px 0', borderTop: '1px solid #333' }}>
            <AllBulletsSection topLevelBlocks={topLevelBlocks} />
          </div>
        </div>
      </aside>

      {/* Toggle button */}
      <button
        data-testid="sidebar-toggle"
        onClick={() => setIsCollapsed((prev) => !prev)}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'fixed',
          left: isCollapsed ? '8px' : '248px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '20px',
          height: '40px',
          backgroundColor: '#333',
          border: 'none',
          borderRadius: '0 4px 4px 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          transition: 'left 0.2s ease',
          zIndex: 100,
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M4.5 2L8.5 6L4.5 10" />
        </svg>
      </button>
    </>
  )
}

export { FavoritesSection } from './FavoritesSection'
export { AllBulletsSection } from './AllBulletsSection'
export { BlockNode } from './BlockNode'
export { CollapsibleSection } from './CollapsibleSection'
