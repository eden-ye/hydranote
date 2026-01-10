/**
 * Breadcrumb Component
 * FE-407: Breadcrumb Component
 *
 * Provides navigation for focus mode, showing the path to the currently focused bullet.
 * - Shows ancestor path with truncated text
 * - Clickable items to navigate up the hierarchy
 * - Home button to exit focus mode entirely
 */
import './Breadcrumb.css'

/**
 * Maximum length for breadcrumb item text before truncation
 */
const MAX_TEXT_LENGTH = 30

/**
 * Breadcrumb item interface
 */
export interface BreadcrumbItem {
  /** Unique identifier for the block */
  id: string
  /** Text content of the block */
  text: string
}

/**
 * Breadcrumb component props
 */
interface BreadcrumbProps {
  /** Array of breadcrumb items from root to current */
  items: BreadcrumbItem[]
  /** Callback when navigating to an ancestor */
  onNavigate: (id: string) => void
  /** Callback when exiting focus mode */
  onExitFocusMode: () => void
}

/**
 * Truncate text if it exceeds max length
 */
function truncateText(text: string): string {
  if (text.length <= MAX_TEXT_LENGTH) {
    return text
  }
  return text.slice(0, MAX_TEXT_LENGTH) + '…'
}

/**
 * Breadcrumb navigation component for focus mode
 */
export function Breadcrumb({
  items,
  onNavigate,
  onExitFocusMode,
}: BreadcrumbProps) {
  const handleItemClick = (id: string, isLast: boolean) => {
    if (!isLast) {
      onNavigate(id)
    }
  }

  return (
    <nav className="breadcrumb" role="navigation" aria-label="Breadcrumb">
      <button
        className="breadcrumb-home"
        onClick={onExitFocusMode}
        aria-label="Exit focus mode"
        title="Exit focus mode"
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
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const isClickable = !isLast

        return (
          <span key={item.id} className="breadcrumb-segment">
            {index > 0 && (
              <span className="breadcrumb-separator" aria-hidden="true">
                /
              </span>
            )}
            <span
              data-testid="breadcrumb-item"
              className={`breadcrumb-item ${isClickable ? 'breadcrumb-item--clickable' : ''}`}
              onClick={() => handleItemClick(item.id, isLast)}
              aria-current={isLast ? 'page' : undefined}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={(e) => {
                if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  handleItemClick(item.id, isLast)
                }
              }}
            >
              {truncateText(item.text)}
            </span>
          </span>
        )
      })}
    </nav>
  )
}
