/**
 * CollapsibleSection Component
 * FE-503: Left Panel with Favorites
 *
 * A reusable collapsible section with header, icon, and collapse/expand toggle.
 */
import { useState, type ReactNode } from 'react'

interface CollapsibleSectionProps {
  /** Section title */
  title: string
  /** Icon to display in header */
  icon: ReactNode
  /** Section content */
  children: ReactNode
  /** Optional count badge */
  count?: number
  /** Whether to start collapsed */
  defaultCollapsed?: boolean
  /** Callback when collapsed state changes */
  onCollapsedChange?: (collapsed: boolean) => void
}

export function CollapsibleSection({
  title,
  icon,
  children,
  count,
  defaultCollapsed = false,
  onCollapsedChange,
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const handleToggle = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    onCollapsedChange?.(newState)
  }

  return (
    <div style={{ marginBottom: '4px' }}>
      <button
        onClick={handleToggle}
        aria-label={title}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#999',
          fontSize: '12px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <span
          data-testid="collapse-indicator"
          style={{
            display: 'flex',
            alignItems: 'center',
            transition: 'transform 0.15s ease',
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
          }}
        >
          <ChevronIcon />
        </span>
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
        {count !== undefined && count > 0 && (
          <span
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '11px',
              color: '#888',
            }}
          >
            {count}
          </span>
        )}
      </button>
      {!isCollapsed && <div style={{ paddingLeft: '4px' }}>{children}</div>}
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 2L8.5 6L4.5 10" />
    </svg>
  )
}
