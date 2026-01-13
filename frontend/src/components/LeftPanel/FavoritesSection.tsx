/**
 * FavoritesSection Component
 * FE-503: Left Panel with Favorites
 *
 * Displays favorited blocks with drag-to-reorder functionality.
 */
import { useState, useCallback, type DragEvent } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { CollapsibleSection } from './CollapsibleSection'
import { BlockNode } from './BlockNode'

interface FavoritesSectionProps {
  /** Function to get block title from ID */
  getBlockTitle: (id: string) => string
}

export function FavoritesSection({ getBlockTitle }: FavoritesSectionProps) {
  const favoriteBlockIds = useEditorStore((state) => state.favoriteBlockIds)
  const focusedBlockId = useEditorStore((state) => state.focusedBlockId)
  const enterFocusMode = useEditorStore((state) => state.enterFocusMode)
  const toggleFavorite = useEditorStore((state) => state.toggleFavorite)
  const reorderFavorites = useEditorStore((state) => state.reorderFavorites)
  // FE-506: Track navigation history
  const pushNavigation = useEditorStore((state) => state.pushNavigation)

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const handleClick = useCallback(
    (id: string) => {
      pushNavigation(id)
      enterFocusMode(id)
    },
    [enterFocusMode, pushNavigation]
  )

  const handleToggleFavorite = useCallback(
    (id: string) => {
      toggleFavorite(id)
    },
    [toggleFavorite]
  )

  const handleDragStart = useCallback((id: string) => {
    setDraggedId(id)
  }, [])

  const handleDragOver = useCallback((e: DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverId(targetId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragOverId(null)
  }, [])

  const handleDrop = useCallback(
    (targetId: string) => {
      if (draggedId && draggedId !== targetId) {
        const targetIndex = favoriteBlockIds.indexOf(targetId)
        if (targetIndex >= 0) {
          reorderFavorites(draggedId, targetIndex)
        }
      }
      setDraggedId(null)
      setDragOverId(null)
    },
    [draggedId, favoriteBlockIds, reorderFavorites]
  )

  const isEmpty = favoriteBlockIds.length === 0

  return (
    <div data-testid="favorites-section" onDragEnd={handleDragEnd}>
      <CollapsibleSection
        title="Favorites"
        icon={<StarIcon />}
        count={favoriteBlockIds.length}
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
            <p style={{ margin: '0 0 4px 0' }}>No favorites yet</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>
              Star blocks to add them here
            </p>
          </div>
        ) : (
          favoriteBlockIds.map((id) => (
            <BlockNode
              key={id}
              id={id}
              data-testid={`favorite-block-${id}`}
              title={getBlockTitle(id)}
              onClick={handleClick}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={true}
              isActive={focusedBlockId === id}
              showFavoriteToggle
              draggable
              isDragging={draggedId === id}
              isDragOver={dragOverId === id}
              onDragStart={handleDragStart}
              onDragOver={(e) => handleDragOver(e, id)}
              onDrop={handleDrop}
            />
          ))
        )}
      </CollapsibleSection>
    </div>
  )
}

function StarIcon() {
  return (
    <svg
      data-testid="favorites-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
