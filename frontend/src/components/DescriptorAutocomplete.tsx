/**
 * Descriptor Autocomplete Component (EDITOR-3203)
 *
 * Dropdown that appears when user types `~` to insert a descriptor.
 * Features fuzzy matching, keyboard navigation, and visual highlighting.
 */
import { useEffect, useCallback } from 'react'
import { filterDescriptors, type AutocompleteResult } from '@/blocks/utils/descriptor-autocomplete'
import type { Descriptor } from '@/blocks/utils/descriptor-repository'
import './DescriptorAutocomplete.css'

interface DescriptorAutocompleteProps {
  /** Whether the autocomplete dropdown is open */
  isOpen: boolean
  /** Current search query (text typed after ~) */
  query: string
  /** Currently selected index in the list */
  selectedIndex: number
  /** Position of the dropdown (relative to viewport) */
  position: { top: number; left: number }
  /** Called when a descriptor is selected */
  onSelect: (descriptor: Descriptor) => void
  /** Called when the dropdown should close */
  onClose: () => void
  /** Called when query changes (for external state management) */
  onQueryChange: (query: string) => void
  /** Called when selected index changes */
  onSelectedIndexChange: (index: number) => void
}

export function DescriptorAutocomplete({
  isOpen,
  query,
  selectedIndex,
  position,
  onSelect,
  onClose,
  onSelectedIndexChange,
}: DescriptorAutocompleteProps) {
  // Get filtered descriptors
  const results = filterDescriptors(query)

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          onSelectedIndexChange(Math.min(selectedIndex + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          onSelectedIndexChange(Math.max(selectedIndex - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results.length > 0 && results[selectedIndex]) {
            onSelect(results[selectedIndex].descriptor)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [isOpen, results, selectedIndex, onSelect, onClose, onSelectedIndexChange]
  )

  // Attach keyboard listener
  useEffect(() => {
    if (!isOpen) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  // Handle option click
  const handleOptionClick = (result: AutocompleteResult) => {
    onSelect(result.descriptor)
  }

  // Handle backdrop click
  const handleBackdropClick = () => {
    onClose()
  }

  // Prevent clicks inside content from closing
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (!isOpen) return null

  return (
    <div
      data-testid="descriptor-backdrop"
      className="descriptor-autocomplete-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        data-testid="descriptor-autocomplete"
        className="descriptor-autocomplete"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        onClick={handleContentClick}
      >
        <div
          data-testid="descriptor-autocomplete-content"
          className="descriptor-autocomplete-content"
        >
          {results.length === 0 ? (
            <div className="descriptor-autocomplete-empty">
              No matching descriptors
            </div>
          ) : (
            <ul className="descriptor-autocomplete-list">
              {results.map((result, index) => (
                <li
                  key={result.descriptor.key}
                  data-testid={`descriptor-option-${index}`}
                  className={`descriptor-autocomplete-option ${
                    index === selectedIndex ? 'selected' : ''
                  }`}
                  onClick={() => handleOptionClick(result)}
                  onMouseEnter={() => onSelectedIndexChange(index)}
                >
                  <span className="descriptor-label">{result.descriptor.label}</span>
                  <span className="descriptor-shortcut">{result.descriptor.shortLabel}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="descriptor-autocomplete-hint">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Cancel</span>
          </div>
        </div>
      </div>
    </div>
  )
}
