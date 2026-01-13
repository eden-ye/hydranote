/**
 * Tests for HighlightDropdown Component
 * EDITOR-3506: Inline Text Formatting Toolbar - Highlight Dropdown
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import HighlightDropdown from '@/components/HighlightDropdown'
import { HIGHLIGHT_COLORS } from '@/utils/format-commands'

describe('HighlightDropdown Component (EDITOR-3506)', () => {
  const mockOnColorSelect = vi.fn()
  const mockOnBackgroundSelect = vi.fn()
  const mockOnClose = vi.fn()

  const defaultProps = {
    isOpen: true,
    onColorSelect: mockOnColorSelect,
    onBackgroundSelect: mockOnBackgroundSelect,
    onClose: mockOnClose,
    activeColor: null as string | null,
    activeBackground: null as string | null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Visibility', () => {
    it('should render when isOpen is true', () => {
      render(<HighlightDropdown {...defaultProps} />)
      expect(screen.getByTestId('highlight-dropdown')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<HighlightDropdown {...defaultProps} isOpen={false} />)
      expect(screen.queryByTestId('highlight-dropdown')).not.toBeInTheDocument()
    })
  })

  describe('Sections', () => {
    it('should render Color section header', () => {
      render(<HighlightDropdown {...defaultProps} />)
      expect(screen.getByText('Color')).toBeInTheDocument()
    })

    it('should render Background section header', () => {
      render(<HighlightDropdown {...defaultProps} />)
      expect(screen.getByText('Background')).toBeInTheDocument()
    })
  })

  describe('Color Options', () => {
    it('should render Default color option in Color section', () => {
      render(<HighlightDropdown {...defaultProps} />)
      const colorSection = screen.getByTestId('color-section')
      expect(colorSection.querySelector('[data-color="default"]')).toBeInTheDocument()
    })

    it('should render all 9 color options in Color section', () => {
      render(<HighlightDropdown {...defaultProps} />)
      const colorSection = screen.getByTestId('color-section')

      // Check for all expected colors
      const expectedColors = ['default', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'grey']
      expectedColors.forEach((color) => {
        expect(colorSection.querySelector(`[data-color="${color}"]`)).toBeInTheDocument()
      })
    })

    it('should call onColorSelect with color value when color is clicked', async () => {
      const user = userEvent.setup()
      render(<HighlightDropdown {...defaultProps} />)

      const redColor = screen.getByTestId('color-red')
      await user.click(redColor)

      expect(mockOnColorSelect).toHaveBeenCalledWith(HIGHLIGHT_COLORS.red.color)
    })

    it('should call onColorSelect with null for default color', async () => {
      const user = userEvent.setup()
      render(<HighlightDropdown {...defaultProps} />)

      const defaultColor = screen.getByTestId('color-default')
      await user.click(defaultColor)

      expect(mockOnColorSelect).toHaveBeenCalledWith(null)
    })
  })

  describe('Background Options', () => {
    it('should render Default background option in Background section', () => {
      render(<HighlightDropdown {...defaultProps} />)
      const bgSection = screen.getByTestId('background-section')
      expect(bgSection.querySelector('[data-background="default"]')).toBeInTheDocument()
    })

    it('should render all 9 background options in Background section', () => {
      render(<HighlightDropdown {...defaultProps} />)
      const bgSection = screen.getByTestId('background-section')

      const expectedColors = ['default', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'grey']
      expectedColors.forEach((color) => {
        expect(bgSection.querySelector(`[data-background="${color}"]`)).toBeInTheDocument()
      })
    })

    it('should call onBackgroundSelect with background value when background is clicked', async () => {
      const user = userEvent.setup()
      render(<HighlightDropdown {...defaultProps} />)

      const yellowBg = screen.getByTestId('background-yellow')
      await user.click(yellowBg)

      expect(mockOnBackgroundSelect).toHaveBeenCalledWith(HIGHLIGHT_COLORS.yellow.background)
    })

    it('should call onBackgroundSelect with null for default background', async () => {
      const user = userEvent.setup()
      render(<HighlightDropdown {...defaultProps} />)

      const defaultBg = screen.getByTestId('background-default')
      await user.click(defaultBg)

      expect(mockOnBackgroundSelect).toHaveBeenCalledWith(null)
    })
  })

  describe('Active States', () => {
    it('should show active state for selected text color', () => {
      render(<HighlightDropdown {...defaultProps} activeColor={HIGHLIGHT_COLORS.red.color} />)
      expect(screen.getByTestId('color-red')).toHaveClass('active')
    })

    it('should show active state for selected background color', () => {
      render(<HighlightDropdown {...defaultProps} activeBackground={HIGHLIGHT_COLORS.yellow.background} />)
      expect(screen.getByTestId('background-yellow')).toHaveClass('active')
    })

    it('should show default as active when no color is selected', () => {
      render(<HighlightDropdown {...defaultProps} activeColor={null} />)
      expect(screen.getByTestId('color-default')).toHaveClass('active')
    })

    it('should show default as active when no background is selected', () => {
      render(<HighlightDropdown {...defaultProps} activeBackground={null} />)
      expect(screen.getByTestId('background-default')).toHaveClass('active')
    })
  })

  describe('Color Preview', () => {
    it('should show color preview swatches', () => {
      render(<HighlightDropdown {...defaultProps} />)
      const redColorSwatch = screen.getByTestId('color-red')
      // Check that swatch has proper styling (will depend on implementation)
      expect(redColorSwatch).toBeInTheDocument()
    })

    it('should show background preview swatches', () => {
      render(<HighlightDropdown {...defaultProps} />)
      const yellowBgSwatch = screen.getByTestId('background-yellow')
      expect(yellowBgSwatch).toBeInTheDocument()
    })
  })

  describe('Interaction', () => {
    it('should close dropdown after selecting a color', async () => {
      const user = userEvent.setup()
      render(<HighlightDropdown {...defaultProps} />)

      await user.click(screen.getByTestId('color-blue'))

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close dropdown after selecting a background', async () => {
      const user = userEvent.setup()
      render(<HighlightDropdown {...defaultProps} />)

      await user.click(screen.getByTestId('background-green'))

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close dropdown when Escape is pressed', async () => {
      const user = userEvent.setup()
      render(<HighlightDropdown {...defaultProps} />)

      await user.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-labels on color buttons', () => {
      render(<HighlightDropdown {...defaultProps} />)

      expect(screen.getByTestId('color-red')).toHaveAttribute('aria-label', 'Red text color')
      expect(screen.getByTestId('color-default')).toHaveAttribute('aria-label', 'Default text color')
    })

    it('should have proper aria-labels on background buttons', () => {
      render(<HighlightDropdown {...defaultProps} />)

      expect(screen.getByTestId('background-yellow')).toHaveAttribute('aria-label', 'Yellow background')
      expect(screen.getByTestId('background-default')).toHaveAttribute('aria-label', 'Default background')
    })

    it('should have role="menu" on dropdown', () => {
      render(<HighlightDropdown {...defaultProps} />)
      expect(screen.getByTestId('highlight-dropdown')).toHaveAttribute('role', 'menu')
    })
  })
})
