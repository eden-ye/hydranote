/**
 * InlineToolbar Component
 * EDITOR-3506: Inline Text Formatting Toolbar
 *
 * A floating toolbar that appears when text is selected, providing
 * quick access to text formatting options.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { TEXT_FORMAT_CONFIGS, HighlightIcon } from '@/utils/format-commands'
import HighlightDropdown from './HighlightDropdown'

export interface InlineToolbarProps {
  isVisible: boolean
  position: { x: number; y: number }
  activeFormats: Record<string, boolean | string | null>
  onFormat: (formatId: string) => void
  onHighlight: (type: 'color' | 'background', value: string | null) => void
  onClose: () => void
}

const InlineToolbar: React.FC<InlineToolbarProps> = ({
  isVisible,
  position,
  activeFormats,
  onFormat,
  onHighlight,
  onClose,
}) => {
  const [highlightDropdownOpen, setHighlightDropdownOpen] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // EDITOR-3512: Derive effective dropdown state to avoid setState in effect
  // Dropdown is only open when toolbar is visible AND user has opened it
  const effectiveDropdownOpen = isVisible && highlightDropdownOpen

  // Handle escape key to close toolbar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible && !effectiveDropdownOpen) {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, effectiveDropdownOpen, onClose])

  const handleFormatClick = useCallback(
    (formatId: string) => {
      onFormat(formatId)
    },
    [onFormat]
  )

  const handleHighlightClick = useCallback(() => {
    setHighlightDropdownOpen((prev) => !prev)
  }, [])

  const handleColorSelect = useCallback(
    (color: string | null) => {
      onHighlight('color', color)
    },
    [onHighlight]
  )

  const handleBackgroundSelect = useCallback(
    (background: string | null) => {
      onHighlight('background', background)
    },
    [onHighlight]
  )

  const handleDropdownClose = useCallback(() => {
    setHighlightDropdownOpen(false)
  }, [])

  const isFormatButtonActive = (formatId: string): boolean => {
    const value = activeFormats[formatId]
    return value === true || (typeof value === 'string' && value !== '')
  }

  if (!isVisible) return null

  // Calculate toolbar position (centered above selection)
  const toolbarStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y - 10}px`, // 10px offset above selection
    transform: 'translate(-50%, -100%)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    padding: '4px 6px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  }

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    padding: '4px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: '#374151',
    transition: 'all 0.15s ease',
  }

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#e5e7eb',
    color: '#1f2937',
  }

  return (
    <div
      ref={toolbarRef}
      data-testid="inline-toolbar"
      role="toolbar"
      aria-label="Text formatting toolbar"
      style={toolbarStyle}
    >
      {/* Format buttons */}
      {TEXT_FORMAT_CONFIGS.map((config) => {
        const isActive = isFormatButtonActive(config.id)
        const Icon = config.icon
        return (
          <button
            key={config.id}
            data-testid={`format-${config.id}`}
            aria-label={config.name}
            aria-pressed={isActive}
            className={isActive ? 'active' : ''}
            style={isActive ? activeButtonStyle : buttonStyle}
            onClick={() => handleFormatClick(config.id)}
            onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
            title={`${config.name} (${config.hotkey.replace('Mod', navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')})`}
          >
            <Icon />
          </button>
        )
      })}

      {/* Separator */}
      <div
        style={{
          width: '1px',
          height: '20px',
          backgroundColor: '#e5e7eb',
          margin: '0 4px',
        }}
      />

      {/* Highlight button with dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          data-testid="format-highlight"
          aria-label="Highlight"
          aria-expanded={effectiveDropdownOpen}
          aria-haspopup="menu"
          className={activeFormats.color || activeFormats.background ? 'active' : ''}
          style={activeFormats.color || activeFormats.background ? activeButtonStyle : buttonStyle}
          onClick={handleHighlightClick}
          onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
          title="Highlight colors"
        >
          <HighlightIcon />
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="currentColor"
            style={{ marginLeft: '2px' }}
          >
            <path d="M1 2.5L4 5.5L7 2.5H1Z" />
          </svg>
        </button>

        <HighlightDropdown
          isOpen={effectiveDropdownOpen}
          onColorSelect={handleColorSelect}
          onBackgroundSelect={handleBackgroundSelect}
          onClose={handleDropdownClose}
          activeColor={(activeFormats.color as string) || null}
          activeBackground={(activeFormats.background as string) || null}
        />
      </div>
    </div>
  )
}

export default InlineToolbar
