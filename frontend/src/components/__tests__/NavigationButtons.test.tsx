/**
 * Tests for NavigationButtons Component
 * FE-506: Back/Forward Navigation Buttons
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NavigationButtons } from '../NavigationButtons'

describe('NavigationButtons', () => {
  const mockOnBack = vi.fn()
  const mockOnForward = vi.fn()

  const defaultProps = {
    canGoBack: true,
    canGoForward: true,
    onBack: mockOnBack,
    onForward: mockOnForward,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render back and forward buttons', () => {
      render(<NavigationButtons {...defaultProps} />)

      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /go forward/i })).toBeInTheDocument()
    })

    it('should render arrow icons', () => {
      render(<NavigationButtons {...defaultProps} />)

      // Check for SVG elements within buttons
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
      buttons.forEach((button) => {
        expect(button.querySelector('svg')).toBeInTheDocument()
      })
    })
  })

  describe('disabled state', () => {
    it('should disable back button when canGoBack is false', () => {
      render(<NavigationButtons {...defaultProps} canGoBack={false} />)

      const backButton = screen.getByRole('button', { name: /go back/i })
      expect(backButton).toBeDisabled()
    })

    it('should disable forward button when canGoForward is false', () => {
      render(<NavigationButtons {...defaultProps} canGoForward={false} />)

      const forwardButton = screen.getByRole('button', { name: /go forward/i })
      expect(forwardButton).toBeDisabled()
    })

    it('should enable back button when canGoBack is true', () => {
      render(<NavigationButtons {...defaultProps} canGoBack={true} />)

      const backButton = screen.getByRole('button', { name: /go back/i })
      expect(backButton).not.toBeDisabled()
    })

    it('should enable forward button when canGoForward is true', () => {
      render(<NavigationButtons {...defaultProps} canGoForward={true} />)

      const forwardButton = screen.getByRole('button', { name: /go forward/i })
      expect(forwardButton).not.toBeDisabled()
    })

    it('should disable both buttons when no history', () => {
      render(<NavigationButtons {...defaultProps} canGoBack={false} canGoForward={false} />)

      expect(screen.getByRole('button', { name: /go back/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /go forward/i })).toBeDisabled()
    })
  })

  describe('navigation', () => {
    it('should call onBack when clicking back button', () => {
      render(<NavigationButtons {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /go back/i }))

      expect(mockOnBack).toHaveBeenCalledTimes(1)
    })

    it('should call onForward when clicking forward button', () => {
      render(<NavigationButtons {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /go forward/i }))

      expect(mockOnForward).toHaveBeenCalledTimes(1)
    })

    it('should NOT call onBack when back button is disabled', () => {
      render(<NavigationButtons {...defaultProps} canGoBack={false} />)

      fireEvent.click(screen.getByRole('button', { name: /go back/i }))

      expect(mockOnBack).not.toHaveBeenCalled()
    })

    it('should NOT call onForward when forward button is disabled', () => {
      render(<NavigationButtons {...defaultProps} canGoForward={false} />)

      fireEvent.click(screen.getByRole('button', { name: /go forward/i }))

      expect(mockOnForward).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have proper aria-labels', () => {
      render(<NavigationButtons {...defaultProps} />)

      expect(screen.getByRole('button', { name: /go back/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /go forward/i })).toHaveAttribute('aria-label')
    })

    it('should have proper button titles for tooltips', () => {
      render(<NavigationButtons {...defaultProps} />)

      expect(screen.getByRole('button', { name: /go back/i })).toHaveAttribute('title')
      expect(screen.getByRole('button', { name: /go forward/i })).toHaveAttribute('title')
    })

    it('should support keyboard navigation with Enter key on back', () => {
      render(<NavigationButtons {...defaultProps} />)

      const backButton = screen.getByRole('button', { name: /go back/i })
      fireEvent.keyDown(backButton, { key: 'Enter' })

      // Button click via Enter should trigger the callback
      expect(mockOnBack).toHaveBeenCalled()
    })

    it('should support keyboard navigation with Enter key on forward', () => {
      render(<NavigationButtons {...defaultProps} />)

      const forwardButton = screen.getByRole('button', { name: /go forward/i })
      fireEvent.keyDown(forwardButton, { key: 'Enter' })

      expect(mockOnForward).toHaveBeenCalled()
    })
  })

  describe('styling', () => {
    it('should have navigation-buttons container class', () => {
      const { container } = render(<NavigationButtons {...defaultProps} />)

      expect(container.querySelector('.navigation-buttons')).toBeInTheDocument()
    })

    it('should have visual distinction between enabled and disabled states', () => {
      render(<NavigationButtons {...defaultProps} canGoBack={false} />)

      const backButton = screen.getByRole('button', { name: /go back/i })
      const forwardButton = screen.getByRole('button', { name: /go forward/i })

      // Disabled button should have disabled class or attribute
      expect(backButton).toBeDisabled()
      expect(forwardButton).not.toBeDisabled()
    })
  })
})
