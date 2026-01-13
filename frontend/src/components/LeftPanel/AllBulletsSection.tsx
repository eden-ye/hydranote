/**
 * AllBulletsSection Component
 * FE-503: Left Panel with Favorites
 *
 * Displays all top-level blocks in the document.
 */
import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { CollapsibleSection } from './CollapsibleSection'
import { BlockNode } from './BlockNode'

interface TopLevelBlock {
  id: string
  title: string
}

interface AllBulletsSectionProps {
  /** Array of top-level blocks to display */
  topLevelBlocks: TopLevelBlock[]
}

export function AllBulletsSection({ topLevelBlocks }: AllBulletsSectionProps) {
  const focusedBlockId = useEditorStore((state) => state.focusedBlockId)
  const enterFocusMode = useEditorStore((state) => state.enterFocusMode)
  const toggleFavorite = useEditorStore((state) => state.toggleFavorite)
  const isFavorite = useEditorStore((state) => state.isFavorite)

  const handleClick = useCallback(
    (id: string) => {
      enterFocusMode(id)
    },
    [enterFocusMode]
  )

  const handleToggleFavorite = useCallback(
    (id: string) => {
      toggleFavorite(id)
    },
    [toggleFavorite]
  )

  const isEmpty = topLevelBlocks.length === 0

  return (
    <div data-testid="all-bullets-section">
      <CollapsibleSection
        title="All Bullets"
        icon={<BulletListIcon />}
        count={topLevelBlocks.length}
      >
        {isEmpty ? (
          <div
            style={{
              padding: '12px 16px',
              color: '#666',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0 }}>No blocks yet</p>
          </div>
        ) : (
          topLevelBlocks.map((block) => (
            <BlockNode
              key={block.id}
              id={block.id}
              data-testid={`bullet-block-${block.id}`}
              title={block.title}
              onClick={handleClick}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={isFavorite(block.id)}
              isActive={focusedBlockId === block.id}
              showFavoriteToggle
              draggable={false}
            />
          ))
        )}
      </CollapsibleSection>
    </div>
  )
}

function BulletListIcon() {
  return (
    <svg
      data-testid="all-bullets-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3" cy="6" r="1.5" fill="currentColor" />
      <circle cx="3" cy="12" r="1.5" fill="currentColor" />
      <circle cx="3" cy="18" r="1.5" fill="currentColor" />
    </svg>
  )
}
