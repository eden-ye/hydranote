/**
 * NavigationButtons Component
 * FE-506: Back/Forward Navigation Buttons
 *
 * Browser-style back and forward navigation buttons for navigating through page history.
 * - Shows above breadcrumb in focus mode
 * - Buttons disabled when no history in that direction
 */
import './NavigationButtons.css'

/**
 * NavigationButtons component props
 */
interface NavigationButtonsProps {
  /** Whether back navigation is available */
  canGoBack: boolean
  /** Whether forward navigation is available */
  canGoForward: boolean
  /** Callback when back button is clicked */
  onBack: () => void
  /** Callback when forward button is clicked */
  onForward: () => void
}

/**
 * Back/Forward navigation buttons component
 */
export function NavigationButtons({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
}: NavigationButtonsProps) {
  const handleBackClick = () => {
    if (canGoBack) {
      onBack()
    }
  }

  const handleForwardClick = () => {
    if (canGoForward) {
      onForward()
    }
  }

  const handleBackKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canGoBack) {
      onBack()
    }
  }

  const handleForwardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canGoForward) {
      onForward()
    }
  }

  return (
    <div className="navigation-buttons">
      <button
        className="navigation-button navigation-button--back"
        onClick={handleBackClick}
        onKeyDown={handleBackKeyDown}
        disabled={!canGoBack}
        aria-label="Go back"
        title="Go back"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        className="navigation-button navigation-button--forward"
        onClick={handleForwardClick}
        onKeyDown={handleForwardKeyDown}
        disabled={!canGoForward}
        aria-label="Go forward"
        title="Go forward"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
