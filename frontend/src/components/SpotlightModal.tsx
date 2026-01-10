/**
 * Spotlight Modal Component
 * FE-404: Spotlight Modal (Ctrl+P)
 *
 * Quick AI generation modal similar to macOS Spotlight.
 */
import { useState, useEffect, useRef, type KeyboardEvent } from 'react'

interface SpotlightModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (query: string) => void
  isLoading?: boolean
}

export function SpotlightModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: SpotlightModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSubmit = () => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    onSubmit(trimmedQuery)
    setQuery('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleBackdropClick = () => {
    onClose()
  }

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (!isOpen) return null

  return (
    <div
      data-testid="spotlight-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
      }}
    >
      {/* Backdrop */}
      <div
        data-testid="spotlight-backdrop"
        onClick={handleBackdropClick}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Modal Content */}
      <div
        data-testid="spotlight-content"
        onClick={handleContentClick}
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '600px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Input Area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            gap: '12px',
          }}
        >
          <SearchIcon />
          <input
            ref={inputRef}
            data-testid="spotlight-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask AI to generate notes..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '18px',
              color: '#333',
              backgroundColor: 'transparent',
            }}
          />
          {isLoading && (
            <div data-testid="spotlight-loading">
              <LoadingSpinner />
            </div>
          )}
        </div>

        {/* Hint */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #eee',
            fontSize: '12px',
            color: '#888',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Press Enter to generate</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#999"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      style={{
        animation: 'spin 1s linear infinite',
      }}
    >
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="#ddd"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="#4285f4"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
