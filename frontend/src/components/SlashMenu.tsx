/**
 * Slash Menu Component (EDITOR-3510)
 *
 * Dropdown that appears when user types `/` to change block type.
 * Features fuzzy matching, keyboard navigation, and block type icons.
 */
import { useEffect, useCallback } from 'react'
import {
  filterMenuItems,
  type SlashMenuItem,
} from '@/blocks/utils/slash-menu'
import './SlashMenu.css'

interface SlashMenuProps {
  /** Whether the menu is open */
  isOpen: boolean
  /** Current search query (text typed after /) */
  query: string
  /** Currently selected index in the list */
  selectedIndex: number
  /** Position of the dropdown (relative to viewport) */
  position: { top: number; left: number }
  /** Called when a menu item is selected */
  onSelect: (item: SlashMenuItem) => void
  /** Called when the menu should close */
  onClose: () => void
  /** Called when query changes (for external state management) */
  onQueryChange: (query: string) => void
  /** Called when selected index changes */
  onSelectedIndexChange: (index: number) => void
}

export function SlashMenu({
  isOpen,
  query,
  selectedIndex,
  position,
  onSelect,
  onClose,
  onSelectedIndexChange,
}: SlashMenuProps) {
  // Get filtered menu items
  const items = filterMenuItems(query)

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          onSelectedIndexChange(Math.min(selectedIndex + 1, items.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          onSelectedIndexChange(Math.max(selectedIndex - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (items.length > 0 && items[selectedIndex]) {
            onSelect(items[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [isOpen, items, selectedIndex, onSelect, onClose, onSelectedIndexChange]
  )

  // Attach keyboard listener
  useEffect(() => {
    if (!isOpen) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  // Handle option click
  const handleClick = useCallback(
    (item: SlashMenuItem) => {
      onSelect(item)
    },
    [onSelect]
  )

  // Don't render if not open
  if (!isOpen) {
    return null
  }

  // Handle empty results
  if (items.length === 0) {
    return (
      <div
        className="slash-menu"
        style={{ top: position.top, left: position.left }}
        data-testid="slash-menu"
        role="listbox"
        aria-label="Block type menu"
      >
        <div className="slash-menu-empty">No matching block types</div>
      </div>
    )
  }

  return (
    <div
      className="slash-menu"
      style={{ top: position.top, left: position.left }}
      data-testid="slash-menu"
      role="listbox"
      aria-label="Block type menu"
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`slash-menu-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => handleClick(item)}
          role="option"
          aria-selected={index === selectedIndex}
          data-testid={`slash-menu-item-${item.blockType}`}
        >
          <span className="slash-menu-icon">{item.icon}</span>
          <span className="slash-menu-label">{item.label}</span>
          <span className="slash-menu-shortcut">{item.shortcut}</span>
        </div>
      ))}
    </div>
  )
}

export type { SlashMenuProps }
