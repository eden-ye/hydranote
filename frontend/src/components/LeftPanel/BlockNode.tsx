/**
 * BlockNode Component
 * FE-503: Left Panel with Favorites
 *
 * A single block row in the sidebar with icon, title, star toggle, and optional drag handle.
 */
import { useState, type DragEvent } from 'react'

interface BlockNodeProps {
  /** Block ID */
  id: string
  /** Block title/content to display */
  title: string
  /** Click handler */
  onClick: (id: string) => void
  /** Favorite toggle handler */
  onToggleFavorite: (id: string) => void
  /** Whether this block is favorited */
  isFavorite: boolean
  /** Whether this block is currently active/focused */
  isActive: boolean
  /** Whether to show the favorite toggle button */
  showFavoriteToggle?: boolean
  /** Whether this block is draggable */
  draggable?: boolean
  /** Whether this block is currently being dragged */
  isDragging?: boolean
  /** Whether another block is being dragged over this one */
  isDragOver?: boolean
  /** Drag start handler */
  onDragStart?: (id: string) => void
  /** Drag over handler */
  onDragOver?: (e: DragEvent) => void
  /** Drop handler */
  onDrop?: (id: string) => void
}

export function BlockNode({
  id,
  title,
  onClick,
  onToggleFavorite,
  isFavorite,
  isActive,
  showFavoriteToggle = false,
  draggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
}: BlockNodeProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    onClick(id)
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite(id)
  }

  const handleDragStart = (e: DragEvent) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', id)
      e.dataTransfer.effectAllowed = 'move'
    }
    onDragStart?.(id)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
    onDragOver?.(e)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    onDrop?.(id)
  }

  return (
    <div
      data-testid={`block-node-${id}`}
      data-active={isActive ? 'true' : 'false'}
      draggable={draggable}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        cursor: 'pointer',
        borderRadius: '4px',
        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        transition: 'background-color 0.15s ease',
      }}
    >
      {/* Drop indicator */}
      {isDragOver && (
        <div
          data-testid="drop-indicator"
          style={{
            position: 'absolute',
            top: 0,
            left: '12px',
            right: '12px',
            height: '2px',
            backgroundColor: '#4a9eff',
            borderRadius: '1px',
          }}
        />
      )}

      {/* Drag handle */}
      {draggable && (
        <span
          data-testid={`drag-handle-${id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'grab',
            color: '#555',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
        >
          <GripIcon />
        </span>
      )}

      {/* Block icon */}
      <span
        data-testid="block-icon"
        style={{ display: 'flex', alignItems: 'center', color: '#666' }}
      >
        <BulletIcon />
      </span>

      {/* Title */}
      <span
        style={{
          flex: 1,
          fontSize: '14px',
          color: '#ddd',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </span>

      {/* Favorite toggle */}
      {showFavoriteToggle && (
        <button
          data-testid={`favorite-toggle-${id}`}
          aria-pressed={isFavorite}
          onClick={handleToggleFavorite}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: isFavorite ? '#ffd700' : '#666',
            opacity: isHovered || isFavorite ? 1 : 0,
            transition: 'opacity 0.15s ease, color 0.15s ease',
          }}
        >
          <StarIcon filled={isFavorite} />
        </button>
      )}
    </div>
  )
}

function BulletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle cx="7" cy="7" r="3" />
    </svg>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function GripIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="currentColor"
    >
      <circle cx="4" cy="3" r="1" />
      <circle cx="8" cy="3" r="1" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="8" cy="6" r="1" />
      <circle cx="4" cy="9" r="1" />
      <circle cx="8" cy="9" r="1" />
    </svg>
  )
}
