/**
 * FocusHeader Component
 * EDITOR-3508: Focus Mode Header
 *
 * Displays a large editable title when in focus mode.
 * - Shows the focused bullet's text as a large title
 * - Home icon to exit focus mode
 */
import './FocusHeader.css'

/**
 * FocusHeader component props
 */
interface FocusHeaderProps {
  /** Title text to display (focused bullet's text) */
  title: string
  /** Callback when exiting focus mode */
  onExitFocusMode: () => void
}

/**
 * FocusHeader component - displays title and exit button in focus mode
 */
export function FocusHeader({ title, onExitFocusMode }: FocusHeaderProps) {
  const displayTitle = title || 'Untitled'

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onExitFocusMode()
    }
  }

  return (
    <header className="focus-header" data-testid="focus-header">
      <button
        className="focus-header-home"
        onClick={onExitFocusMode}
        onKeyDown={handleKeyDown}
        aria-label="Exit focus mode"
        title="Exit focus mode"
        type="button"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>
      <h1 className="focus-header-title" data-testid="focus-header-title">
        {displayTitle}
      </h1>
    </header>
  )
}
