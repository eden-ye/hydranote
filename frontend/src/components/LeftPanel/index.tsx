/**
 * LeftPanel Component
 * FE-503: Left Panel with Favorites
 *
 * Main sidebar component with user info, settings, favorites, and all bullets sections.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { UserInfo } from './UserInfo'
import { FavoritesSection } from './FavoritesSection'
import { AllBulletsSection } from './AllBulletsSection'
import { SettingsPanel } from '../SettingsPanel'

interface LeftPanelProps {
  /** Map of block IDs to their titles */
  blockTitles?: Map<string, string>
  /** Array of top-level block IDs */
  topLevelBlockIds?: string[]
}

export function LeftPanel({
  blockTitles = new Map(),
  topLevelBlockIds = [],
}: LeftPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Load favorites from localStorage on mount
  const loadFavorites = useEditorStore((state) => state.loadFavorites)
  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

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

  const topLevelBlocks = useMemo(
    () =>
      topLevelBlockIds.map((id) => ({
        id,
        title: getBlockTitle(id),
      })),
    [topLevelBlockIds, getBlockTitle]
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
        {/* Header with user info and settings */}
        <div
          style={{
            padding: '12px',
            borderBottom: '1px solid #333',
          }}
        >
          <UserInfo />
          <div style={{ marginTop: '8px' }}>
            <button
              data-testid="sidebar-settings-button"
              onClick={() => setShowSettings(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#888',
                fontSize: '13px',
              }}
            >
              <SettingsIcon />
              <span>Settings</span>
            </button>
          </div>
        </div>

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

      {/* Settings Modal */}
      {showSettings && (
        <div
          data-testid="settings-modal-backdrop"
          onClick={() => setShowSettings(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <SettingsPanel onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}
    </>
  )
}

function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export { FavoritesSection } from './FavoritesSection'
export { AllBulletsSection } from './AllBulletsSection'
export { BlockNode } from './BlockNode'
export { CollapsibleSection } from './CollapsibleSection'
export { UserInfo } from './UserInfo'
