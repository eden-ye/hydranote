import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FocusHeader } from '../FocusHeader'

/**
 * Tests for FocusHeader component (EDITOR-3508)
 *
 * FocusHeader displays:
 * - Large editable title (the focused bullet's text)
 * - Home icon to exit focus mode
 *
 * The title syncs with the bullet's Yjs text via the doc reference.
 */

describe('FocusHeader Component (EDITOR-3508)', () => {
  const mockOnExitFocusMode = vi.fn()

  beforeEach(() => {
    mockOnExitFocusMode.mockClear()
  })

  describe('Rendering', () => {
    it('should render the title text', () => {
      render(
        <FocusHeader
          title="My Focus Title"
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      expect(screen.getByText('My Focus Title')).toBeInTheDocument()
    })

    it('should render "Untitled" when title is empty', () => {
      render(
        <FocusHeader
          title=""
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      expect(screen.getByText('Untitled')).toBeInTheDocument()
    })

    it('should render home icon button', () => {
      render(
        <FocusHeader
          title="Test Title"
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      const homeButton = screen.getByRole('button', { name: /exit focus mode/i })
      expect(homeButton).toBeInTheDocument()
    })

    it('should have focus-header test ID', () => {
      render(
        <FocusHeader
          title="Test Title"
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      expect(screen.getByTestId('focus-header')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onExitFocusMode when home icon is clicked', () => {
      render(
        <FocusHeader
          title="Test Title"
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      const homeButton = screen.getByRole('button', { name: /exit focus mode/i })
      fireEvent.click(homeButton)

      expect(mockOnExitFocusMode).toHaveBeenCalledTimes(1)
    })

    it('should call onExitFocusMode on Enter key press on home icon', () => {
      render(
        <FocusHeader
          title="Test Title"
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      const homeButton = screen.getByRole('button', { name: /exit focus mode/i })
      fireEvent.keyDown(homeButton, { key: 'Enter' })

      expect(mockOnExitFocusMode).toHaveBeenCalledTimes(1)
    })

    it('should call onExitFocusMode on Space key press on home icon', () => {
      render(
        <FocusHeader
          title="Test Title"
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      const homeButton = screen.getByRole('button', { name: /exit focus mode/i })
      fireEvent.keyDown(homeButton, { key: ' ' })

      expect(mockOnExitFocusMode).toHaveBeenCalledTimes(1)
    })
  })

  describe('Styling', () => {
    it('should render title with large font styling', () => {
      render(
        <FocusHeader
          title="Large Title"
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      const titleElement = screen.getByTestId('focus-header-title')
      expect(titleElement).toHaveClass('focus-header-title')
    })
  })

  describe('Accessibility', () => {
    it('should have accessible name for home button', () => {
      render(
        <FocusHeader
          title="Test Title"
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      const homeButton = screen.getByRole('button', { name: /exit focus mode/i })
      expect(homeButton).toHaveAttribute('aria-label')
    })

    it('should have proper heading structure for title', () => {
      render(
        <FocusHeader
          title="Heading Title"
          onExitFocusMode={mockOnExitFocusMode}
        />
      )

      // Title should be an h1 for proper heading structure in focus mode
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Heading Title')
    })
  })
})
