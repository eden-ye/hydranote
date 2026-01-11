/**
 * Portal Picker Component (EDITOR-3405)
 *
 * Dropdown that appears when user triggers portal creation via:
 * - /portal slash command
 * - Cmd+Shift+P keyboard shortcut
 *
 * Features:
 * - Search/filter bullets
 * - Keyboard navigation
 * - Visual hierarchy (indentation for nested bullets)
 * - Preview of selected bullet
 */
import { useEffect, useCallback, useRef } from 'react'
import type { BulletItem } from '@/blocks/utils/portal-picker'
import './PortalPicker.css'

interface PortalPickerProps {
  /** Whether the picker is open */
  isOpen: boolean
  /** List of bullets to choose from */
  bullets: BulletItem[]
  /** Currently selected index */
  selectedIndex: number
  /** Position of the picker (relative to viewport) */
  position: { top: number; left: number }
  /** Called when a bullet is selected */
  onSelect: (bullet: BulletItem) => void
  /** Called when the picker should close */
  onClose: () => void
  /** Called when search query changes */
  onQueryChange: (query: string) => void
  /** Called when selected index changes */
  onSelectedIndexChange: (index: number) => void
}

export function PortalPicker({
  isOpen,
  bullets,
  selectedIndex,
  position,
  onSelect,
  onClose,
  onQueryChange,
  onSelectedIndexChange,
}: PortalPickerProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          onSelectedIndexChange(Math.min(selectedIndex + 1, bullets.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          onSelectedIndexChange(Math.max(selectedIndex - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (bullets.length > 0 && bullets[selectedIndex]) {
            onSelect(bullets[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [isOpen, bullets, selectedIndex, onSelect, onClose, onSelectedIndexChange]
  )

  // Attach keyboard listener
  useEffect(() => {
    if (!isOpen) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  // Focus search input on mount
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Handle option click
  const handleOptionClick = (bullet: BulletItem) => {
    onSelect(bullet)
  }

  // Handle backdrop click
  const handleBackdropClick = () => {
    onClose()
  }

  // Prevent clicks inside content from closing
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value)
  }

  if (!isOpen) return null

  const selectedBullet = bullets[selectedIndex]

  return (
    <div
      data-testid="portal-picker-backdrop"
      className="portal-picker-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        data-testid="portal-picker"
        className="portal-picker"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        onClick={handleContentClick}
      >
        <div className="portal-picker-header">
          <input
            ref={searchInputRef}
            type="text"
            className="portal-picker-search"
            placeholder="Search bullets..."
            onChange={handleSearchChange}
          />
        </div>

        <div className="portal-picker-content">
          {bullets.length === 0 ? (
            <div className="portal-picker-empty">No bullets found</div>
          ) : (
            <>
              <ul className="portal-picker-list">
                {bullets.map((bullet, index) => (
                  <li
                    key={bullet.id}
                    role="listitem"
                    data-testid={`portal-option-${index}`}
                    className={`portal-picker-option ${
                      index === selectedIndex ? 'selected' : ''
                    } level-${bullet.level}`}
                    style={{ paddingLeft: `${bullet.level * 24 + 12}px` }}
                    onClick={() => handleOptionClick(bullet)}
                    onMouseEnter={() => onSelectedIndexChange(index)}
                  >
                    <span className="portal-picker-bullet-text">
                      {bullet.text || '(empty)'}
                    </span>
                  </li>
                ))}
              </ul>

              {selectedBullet && (
                <div className="portal-picker-preview" data-testid="portal-picker-preview">
                  <div className="portal-picker-preview-label">Preview:</div>
                  <div className="portal-picker-preview-text">
                    {selectedBullet.text || '(empty)'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="portal-picker-hint">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Cancel</span>
        </div>
      </div>
    </div>
  )
}
