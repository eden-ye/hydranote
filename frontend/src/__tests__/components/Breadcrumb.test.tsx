/**
 * Tests for Breadcrumb Component
 * FE-505: Breadcrumb Navigation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Breadcrumb, type BreadcrumbItem } from '@/components/Breadcrumb'

describe('Breadcrumb Component (FE-505)', () => {
  const mockOnNavigate = vi.fn()
  const mockOnExitFocusMode = vi.fn()

  const sampleItems: BreadcrumbItem[] = [
    { id: 'block-1', text: 'Root Item' },
    { id: 'block-2', text: 'Parent Item' },
    { id: 'block-3', text: 'Current Item' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render breadcrumb navigation', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should render all breadcrumb items', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByText('Root Item')).toBeInTheDocument()
      expect(screen.getByText('Parent Item')).toBeInTheDocument()
      expect(screen.getByText('Current Item')).toBeInTheDocument()
    })

    it('should render home button', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByLabelText('Exit focus mode')).toBeInTheDocument()
    })

    it('should render separators between items', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      // There should be 2 separators for 3 items
      const separators = screen.getAllByText('/')
      expect(separators).toHaveLength(2)
    })

    it('should render with empty items array', () => {
      render(
        <Breadcrumb
          items={[]}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.queryByTestId('breadcrumb-item')).not.toBeInTheDocument()
    })

    it('should render single item without separator', () => {
      render(
        <Breadcrumb
          items={[{ id: 'single', text: 'Single Item' }]}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByText('Single Item')).toBeInTheDocument()
      expect(screen.queryByText('/')).not.toBeInTheDocument()
    })
  })

  describe('Text Truncation', () => {
    it('should truncate text longer than 30 characters', () => {
      const longTextItem: BreadcrumbItem[] = [
        { id: 'long', text: 'This is a very long text that should be truncated with ellipsis' },
      ]
      render(
        <Breadcrumb
          items={longTextItem}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByText('This is a very long text that …')).toBeInTheDocument()
    })

    it('should not truncate text of exactly 30 characters', () => {
      const exactTextItem: BreadcrumbItem[] = [
        { id: 'exact', text: '123456789012345678901234567890' }, // 30 chars
      ]
      render(
        <Breadcrumb
          items={exactTextItem}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByText('123456789012345678901234567890')).toBeInTheDocument()
    })

    it('should not truncate short text', () => {
      const shortTextItem: BreadcrumbItem[] = [
        { id: 'short', text: 'Short' },
      ]
      render(
        <Breadcrumb
          items={shortTextItem}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByText('Short')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should call onNavigate when clicking ancestor item', async () => {
      const user = userEvent.setup()
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      await user.click(screen.getByText('Root Item'))
      expect(mockOnNavigate).toHaveBeenCalledWith('block-1')
    })

    it('should call onNavigate when clicking parent item', async () => {
      const user = userEvent.setup()
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      await user.click(screen.getByText('Parent Item'))
      expect(mockOnNavigate).toHaveBeenCalledWith('block-2')
    })

    it('should NOT call onNavigate when clicking current (last) item', async () => {
      const user = userEvent.setup()
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      await user.click(screen.getByText('Current Item'))
      expect(mockOnNavigate).not.toHaveBeenCalled()
    })

    it('should call onExitFocusMode when clicking home button', async () => {
      const user = userEvent.setup()
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      await user.click(screen.getByLabelText('Exit focus mode'))
      expect(mockOnExitFocusMode).toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should navigate when pressing Enter on clickable item', async () => {
      const user = userEvent.setup()
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      const rootItem = screen.getByText('Root Item')
      rootItem.focus()
      await user.keyboard('{Enter}')
      expect(mockOnNavigate).toHaveBeenCalledWith('block-1')
    })

    it('should navigate when pressing Space on clickable item', async () => {
      const user = userEvent.setup()
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      const parentItem = screen.getByText('Parent Item')
      parentItem.focus()
      await user.keyboard(' ')
      expect(mockOnNavigate).toHaveBeenCalledWith('block-2')
    })

    it('should NOT navigate when pressing Enter on current (last) item', async () => {
      const user = userEvent.setup()
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      const currentItem = screen.getByText('Current Item')
      currentItem.focus()
      await user.keyboard('{Enter}')
      expect(mockOnNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label on navigation', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Breadcrumb')
    })

    it('should mark last item with aria-current="page"', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByText('Current Item')).toHaveAttribute('aria-current', 'page')
    })

    it('should not have aria-current on ancestor items', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByText('Root Item')).not.toHaveAttribute('aria-current')
      expect(screen.getByText('Parent Item')).not.toHaveAttribute('aria-current')
    })

    it('should have role="button" on clickable items', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByText('Root Item')).toHaveAttribute('role', 'button')
      expect(screen.getByText('Parent Item')).toHaveAttribute('role', 'button')
    })

    it('should not have role="button" on current (last) item', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByText('Current Item')).not.toHaveAttribute('role', 'button')
    })

    it('should have tabIndex on clickable items', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByText('Root Item')).toHaveAttribute('tabIndex', '0')
      expect(screen.getByText('Parent Item')).toHaveAttribute('tabIndex', '0')
    })

    it('should not have tabIndex on current (last) item', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByText('Current Item')).not.toHaveAttribute('tabIndex')
    })

    it('should hide separators from screen readers', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      const separators = screen.getAllByText('/')
      separators.forEach((separator) => {
        expect(separator).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('Styling', () => {
    it('should apply clickable class to ancestor items', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByText('Root Item')).toHaveClass('breadcrumb-item--clickable')
      expect(screen.getByText('Parent Item')).toHaveClass('breadcrumb-item--clickable')
    })

    it('should not apply clickable class to current (last) item', () => {
      render(
        <Breadcrumb
          items={sampleItems}
          onNavigate={mockOnNavigate}
          onExitFocusMode={mockOnExitFocusMode}
        />
      )
      expect(screen.getByText('Current Item')).not.toHaveClass('breadcrumb-item--clickable')
    })
  })
})
