/**
 * Tests for SpotlightModal Component
 * FE-404: Spotlight Modal (Ctrl+P)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpotlightModal } from '../SpotlightModal'

describe('SpotlightModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Visibility', () => {
    it('should render when open', () => {
      render(<SpotlightModal {...defaultProps} isOpen={true} />)
      expect(screen.getByTestId('spotlight-modal')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<SpotlightModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByTestId('spotlight-modal')).not.toBeInTheDocument()
    })
  })

  describe('Input', () => {
    it('should have a text input', () => {
      render(<SpotlightModal {...defaultProps} />)
      expect(screen.getByTestId('spotlight-input')).toBeInTheDocument()
    })

    it('should focus input on open', async () => {
      render(<SpotlightModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByTestId('spotlight-input')).toHaveFocus()
      })
    })

    it('should allow typing', async () => {
      const user = userEvent.setup()
      render(<SpotlightModal {...defaultProps} />)
      const input = screen.getByTestId('spotlight-input')
      await user.type(input, 'test query')
      expect(input).toHaveValue('test query')
    })
  })

  describe('Submit', () => {
    it('should call onSubmit with query when Enter is pressed', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<SpotlightModal {...defaultProps} onSubmit={onSubmit} />)
      const input = screen.getByTestId('spotlight-input')
      await user.type(input, 'test query{enter}')
      expect(onSubmit).toHaveBeenCalledWith('test query')
    })

    it('should not submit empty query', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<SpotlightModal {...defaultProps} onSubmit={onSubmit} />)
      const input = screen.getByTestId('spotlight-input')
      await user.type(input, '{enter}')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should clear input after submit', async () => {
      const user = userEvent.setup()
      render(<SpotlightModal {...defaultProps} />)
      const input = screen.getByTestId('spotlight-input')
      await user.type(input, 'test query{enter}')
      expect(input).toHaveValue('')
    })
  })

  describe('Close', () => {
    it('should call onClose when Escape is pressed', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<SpotlightModal {...defaultProps} onClose={onClose} />)
      await user.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn()
      render(<SpotlightModal {...defaultProps} onClose={onClose} />)
      const backdrop = screen.getByTestId('spotlight-backdrop')
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalled()
    })

    it('should not close when modal content is clicked', () => {
      const onClose = vi.fn()
      render(<SpotlightModal {...defaultProps} onClose={onClose} />)
      const content = screen.getByTestId('spotlight-content')
      fireEvent.click(content)
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(<SpotlightModal {...defaultProps} isLoading={true} />)
      expect(screen.getByTestId('spotlight-loading')).toBeInTheDocument()
    })

    it('should disable input when loading', () => {
      render(<SpotlightModal {...defaultProps} isLoading={true} />)
      const input = screen.getByTestId('spotlight-input')
      expect(input).toBeDisabled()
    })
  })

  describe('Placeholder', () => {
    it('should have a descriptive placeholder', () => {
      render(<SpotlightModal {...defaultProps} />)
      const input = screen.getByTestId('spotlight-input')
      expect(input).toHaveAttribute('placeholder')
    })
  })
})
