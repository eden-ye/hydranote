/**
 * HighlightDropdown Component
 * EDITOR-3506: Inline Text Formatting Toolbar
 *
 * Dropdown menu for selecting text and background highlight colors.
 */
import React, { useEffect, useCallback, useRef } from 'react'
import { HIGHLIGHT_COLORS, HIGHLIGHT_COLOR_ORDER } from '@/utils/format-commands'

export interface HighlightDropdownProps {
  isOpen: boolean
  onColorSelect: (color: string | null) => void
  onBackgroundSelect: (background: string | null) => void
  onClose: () => void
  activeColor: string | null
  activeBackground: string | null
}

/**
 * Color swatch button component
 */
interface ColorSwatchProps {
  colorKey: string
  colorValue: string | null
  isActive: boolean
  onClick: () => void
  type: 'color' | 'background'
  label: string
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ colorKey, colorValue, isActive, onClick, type, label }) => {
  const testId = type === 'color' ? `color-${colorKey}` : `background-${colorKey}`
  const dataAttr = type === 'color' ? { 'data-color': colorKey } : { 'data-background': colorKey }

  // Get the actual CSS color for display
  const displayColor = colorKey === 'default' ? (type === 'color' ? '#374151' : '#f3f4f6') : colorValue

  return (
    <button
      data-testid={testId}
      aria-label={label}
      role="menuitem"
      className={`highlight-swatch ${isActive ? 'active' : ''}`}
      onClick={onClick}
      {...dataAttr}
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '4px',
        border: isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        backgroundColor: type === 'background' ? displayColor || '#f3f4f6' : 'transparent',
        color: type === 'color' ? displayColor || '#374151' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        transition: 'all 0.15s ease',
      }}
    >
      {type === 'color' && colorKey !== 'default' && 'A'}
      {type === 'color' && colorKey === 'default' && (
        <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>A</span>
      )}
    </button>
  )
}

const HighlightDropdown: React.FC<HighlightDropdownProps> = ({
  isOpen,
  onColorSelect,
  onBackgroundSelect,
  onClose,
  activeColor,
  activeBackground,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      // Use setTimeout to avoid immediate closure from the opening click
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  const handleColorSelect = useCallback(
    (colorKey: string) => {
      if (colorKey === 'default') {
        onColorSelect(null)
      } else {
        onColorSelect(HIGHLIGHT_COLORS[colorKey].color)
      }
      onClose()
    },
    [onColorSelect, onClose]
  )

  const handleBackgroundSelect = useCallback(
    (colorKey: string) => {
      if (colorKey === 'default') {
        onBackgroundSelect(null)
      } else {
        onBackgroundSelect(HIGHLIGHT_COLORS[colorKey].background)
      }
      onClose()
    },
    [onBackgroundSelect, onClose]
  )

  const isColorActive = (colorKey: string): boolean => {
    if (colorKey === 'default') {
      return activeColor === null
    }
    return activeColor === HIGHLIGHT_COLORS[colorKey]?.color
  }

  const isBackgroundActive = (colorKey: string): boolean => {
    if (colorKey === 'default') {
      return activeBackground === null
    }
    return activeBackground === HIGHLIGHT_COLORS[colorKey]?.background
  }

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      data-testid="highlight-dropdown"
      role="menu"
      className="highlight-dropdown"
      style={{
        position: 'absolute',
        top: '100%',
        left: '0',
        marginTop: '4px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '12px',
        zIndex: 1000,
        minWidth: '200px',
      }}
    >
      {/* Color Section */}
      <div data-testid="color-section" style={{ marginBottom: '12px' }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: '#6b7280',
            marginBottom: '8px',
            textTransform: 'uppercase',
          }}
        >
          Color
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <ColorSwatch
            colorKey="default"
            colorValue={null}
            isActive={isColorActive('default')}
            onClick={() => handleColorSelect('default')}
            type="color"
            label="Default text color"
          />
          {HIGHLIGHT_COLOR_ORDER.map((colorKey) => (
            <ColorSwatch
              key={`color-${colorKey}`}
              colorKey={colorKey}
              colorValue={HIGHLIGHT_COLORS[colorKey].color}
              isActive={isColorActive(colorKey)}
              onClick={() => handleColorSelect(colorKey)}
              type="color"
              label={`${HIGHLIGHT_COLORS[colorKey].name} text color`}
            />
          ))}
        </div>
      </div>

      {/* Background Section */}
      <div data-testid="background-section">
        <div
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: '#6b7280',
            marginBottom: '8px',
            textTransform: 'uppercase',
          }}
        >
          Background
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <ColorSwatch
            colorKey="default"
            colorValue={null}
            isActive={isBackgroundActive('default')}
            onClick={() => handleBackgroundSelect('default')}
            type="background"
            label="Default background"
          />
          {HIGHLIGHT_COLOR_ORDER.map((colorKey) => (
            <ColorSwatch
              key={`bg-${colorKey}`}
              colorKey={colorKey}
              colorValue={HIGHLIGHT_COLORS[colorKey].background}
              isActive={isBackgroundActive(colorKey)}
              onClick={() => handleBackgroundSelect(colorKey)}
              type="background"
              label={`${HIGHLIGHT_COLORS[colorKey].name} background`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default HighlightDropdown
