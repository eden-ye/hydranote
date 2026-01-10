/**
 * Tests for Breadcrumb Component
 * FE-407: Breadcrumb Component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Breadcrumb } from '../Breadcrumb'

describe('Breadcrumb', () => {
  const mockOnNavigate = vi.fn()
  const mockOnExitFocusMode = vi.fn()

  const defaultProps = {
    items: [
      { id: 'root', text: 'Root Note' },
      { id: 'parent', text: 'Parent Bullet' },
      { id: 'current', text: 'Current Focus' },
    ],
    onNavigate: mockOnNavigate,
    onExitFocusMode: mockOnExitFocusMode,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render all breadcrumb items', () => {
      render(<Breadcrumb {...defaultProps} />)

      expect(screen.getByText('Root Note')).toBeInTheDocument()
      expect(screen.getByText('Parent Bullet')).toBeInTheDocument()
      expect(screen.getByText('Current Focus')).toBeInTheDocument()
    })

    it('should render separators between items', () => {
      render(<Breadcrumb {...defaultProps} />)

      // There should be 2 separators for 3 items
      const separators = screen.getAllByText('/')
      expect(separators).toHaveLength(2)
    })

    it('should render home icon for exiting focus mode', () => {
      render(<Breadcrumb {...defaultProps} />)

      expect(screen.getByRole('button', { name: /exit focus mode/i })).toBeInTheDocument()
    })

    it('should truncate long text', () => {
      const longTextProps = {
        ...defaultProps,
        items: [
          { id: 'root', text: 'This is a very long text that should be truncated for display purposes in the breadcrumb' },
        ],
      }
      render(<Breadcrumb {...longTextProps} />)

      // Should show truncated text (first 30 chars + ellipsis)
      expect(screen.getByText('This is a very long text that …')).toBeInTheDocument()
    })

    it('should not render anything when no items', () => {
      const { container } = render(
        <Breadcrumb
          {...defaultProps}
          items={[]}
        />
      )

      // Should only have the home button
      expect(container.querySelectorAll('[data-testid="breadcrumb-item"]')).toHaveLength(0)
    })
  })

  describe('navigation', () => {
    it('should call onNavigate when clicking an ancestor item', () => {
      render(<Breadcrumb {...defaultProps} />)

      fireEvent.click(screen.getByText('Parent Bullet'))

      expect(mockOnNavigate).toHaveBeenCalledWith('parent')
    })

    it('should call onNavigate when clicking root item', () => {
      render(<Breadcrumb {...defaultProps} />)

      fireEvent.click(screen.getByText('Root Note'))

      expect(mockOnNavigate).toHaveBeenCalledWith('root')
    })

    it('should NOT call onNavigate when clicking current (last) item', () => {
      render(<Breadcrumb {...defaultProps} />)

      fireEvent.click(screen.getByText('Current Focus'))

      expect(mockOnNavigate).not.toHaveBeenCalled()
    })

    it('should call onExitFocusMode when clicking home button', () => {
      render(<Breadcrumb {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /exit focus mode/i }))

      expect(mockOnExitFocusMode).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have navigation role', () => {
      render(<Breadcrumb {...defaultProps} />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should have aria-label', () => {
      render(<Breadcrumb {...defaultProps} />)

      expect(screen.getByLabelText(/breadcrumb/i)).toBeInTheDocument()
    })

    it('should mark current item as aria-current', () => {
      render(<Breadcrumb {...defaultProps} />)

      const currentItem = screen.getByText('Current Focus').closest('[data-testid="breadcrumb-item"]')
      expect(currentItem).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('styling', () => {
    it('should have unobtrusive styling by default', () => {
      render(<Breadcrumb {...defaultProps} />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('breadcrumb')
    })

    it('should highlight ancestor items on hover (clickable style)', () => {
      render(<Breadcrumb {...defaultProps} />)

      const ancestorItem = screen.getByText('Parent Bullet').closest('[data-testid="breadcrumb-item"]')
      expect(ancestorItem).toHaveClass('breadcrumb-item--clickable')
    })

    it('should not have clickable style on current item', () => {
      render(<Breadcrumb {...defaultProps} />)

      const currentItem = screen.getByText('Current Focus').closest('[data-testid="breadcrumb-item"]')
      expect(currentItem).not.toHaveClass('breadcrumb-item--clickable')
    })
  })
})
