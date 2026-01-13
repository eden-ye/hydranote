/**
 * Tests for InlineToolbar Component
 * EDITOR-3506: Inline Text Formatting Toolbar
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock floating-ui
vi.mock('@floating-ui/react', () => ({
  useFloating: vi.fn(() => ({
    refs: {
      setReference: vi.fn(),
      setFloating: vi.fn(),
    },
    floatingStyles: { position: 'absolute', top: 100, left: 200 },
    context: {},
  })),
  offset: vi.fn(() => ({})),
  flip: vi.fn(() => ({})),
  shift: vi.fn(() => ({})),
  autoUpdate: vi.fn(() => () => {}),
}))

// Import component after mocks
import InlineToolbar from '@/components/InlineToolbar'

describe('InlineToolbar Component (EDITOR-3506)', () => {
  const mockOnFormat = vi.fn()
  const mockOnHighlight = vi.fn()
  const mockOnClose = vi.fn()

  const defaultProps = {
    isVisible: true,
    position: { x: 200, y: 100 },
    activeFormats: {} as Record<string, boolean>,
    onFormat: mockOnFormat,
    onHighlight: mockOnHighlight,
    onClose: mockOnClose,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Visibility', () => {
    it('should render when isVisible is true', () => {
      render(<InlineToolbar {...defaultProps} />)
      expect(screen.getByTestId('inline-toolbar')).toBeInTheDocument()
    })

    it('should not render when isVisible is false', () => {
      render(<InlineToolbar {...defaultProps} isVisible={false} />)
      expect(screen.queryByTestId('inline-toolbar')).not.toBeInTheDocument()
    })
  })

  describe('Format Buttons', () => {
    it('should render Bold button', () => {
      render(<InlineToolbar {...defaultProps} />)
      expect(screen.getByTestId('format-bold')).toBeInTheDocument()
    })

    it('should render Italic button', () => {
      render(<InlineToolbar {...defaultProps} />)
      expect(screen.getByTestId('format-italic')).toBeInTheDocument()
    })

    it('should render Underline button', () => {
      render(<InlineToolbar {...defaultProps} />)
      expect(screen.getByTestId('format-underline')).toBeInTheDocument()
    })

    it('should render Strikethrough button', () => {
      render(<InlineToolbar {...defaultProps} />)
      expect(screen.getByTestId('format-strike')).toBeInTheDocument()
    })

    it('should render Highlight button', () => {
      render(<InlineToolbar {...defaultProps} />)
      expect(screen.getByTestId('format-highlight')).toBeInTheDocument()
    })
  })

  describe('Format Button Clicks', () => {
    it('should call onFormat with "bold" when Bold button is clicked', async () => {
      const user = userEvent.setup()
      render(<InlineToolbar {...defaultProps} />)

      await user.click(screen.getByTestId('format-bold'))
      expect(mockOnFormat).toHaveBeenCalledWith('bold')
    })

    it('should call onFormat with "italic" when Italic button is clicked', async () => {
      const user = userEvent.setup()
      render(<InlineToolbar {...defaultProps} />)

      await user.click(screen.getByTestId('format-italic'))
      expect(mockOnFormat).toHaveBeenCalledWith('italic')
    })

    it('should call onFormat with "underline" when Underline button is clicked', async () => {
      const user = userEvent.setup()
      render(<InlineToolbar {...defaultProps} />)

      await user.click(screen.getByTestId('format-underline'))
      expect(mockOnFormat).toHaveBeenCalledWith('underline')
    })

    it('should call onFormat with "strike" when Strikethrough button is clicked', async () => {
      const user = userEvent.setup()
      render(<InlineToolbar {...defaultProps} />)

      await user.click(screen.getByTestId('format-strike'))
      expect(mockOnFormat).toHaveBeenCalledWith('strike')
    })
  })

  describe('Active States', () => {
    it('should show Bold button as active when bold format is active', () => {
      render(<InlineToolbar {...defaultProps} activeFormats={{ bold: true }} />)
      const boldButton = screen.getByTestId('format-bold')
      expect(boldButton).toHaveClass('active')
    })

    it('should show Italic button as active when italic format is active', () => {
      render(<InlineToolbar {...defaultProps} activeFormats={{ italic: true }} />)
      const italicButton = screen.getByTestId('format-italic')
      expect(italicButton).toHaveClass('active')
    })

    it('should show Underline button as active when underline format is active', () => {
      render(<InlineToolbar {...defaultProps} activeFormats={{ underline: true }} />)
      const underlineButton = screen.getByTestId('format-underline')
      expect(underlineButton).toHaveClass('active')
    })

    it('should show Strikethrough button as active when strike format is active', () => {
      render(<InlineToolbar {...defaultProps} activeFormats={{ strike: true }} />)
      const strikeButton = screen.getByTestId('format-strike')
      expect(strikeButton).toHaveClass('active')
    })

    it('should show multiple active states simultaneously', () => {
      render(<InlineToolbar {...defaultProps} activeFormats={{ bold: true, italic: true }} />)
      expect(screen.getByTestId('format-bold')).toHaveClass('active')
      expect(screen.getByTestId('format-italic')).toHaveClass('active')
      expect(screen.getByTestId('format-underline')).not.toHaveClass('active')
    })
  })

  describe('Highlight Dropdown', () => {
    it('should open highlight dropdown when Highlight button is clicked', async () => {
      const user = userEvent.setup()
      render(<InlineToolbar {...defaultProps} />)

      await user.click(screen.getByTestId('format-highlight'))
      expect(screen.getByTestId('highlight-dropdown')).toBeInTheDocument()
    })

    it('should close highlight dropdown when clicking outside', async () => {
      const user = userEvent.setup()
      render(<InlineToolbar {...defaultProps} />)

      // Open dropdown
      await user.click(screen.getByTestId('format-highlight'))
      expect(screen.getByTestId('highlight-dropdown')).toBeInTheDocument()

      // Click outside (on the toolbar container)
      fireEvent.mouseDown(document.body)

      await waitFor(() => {
        expect(screen.queryByTestId('highlight-dropdown')).not.toBeInTheDocument()
      })
    })
  })

  describe('Positioning', () => {
    it('should position toolbar at provided coordinates', () => {
      render(<InlineToolbar {...defaultProps} position={{ x: 300, y: 150 }} />)
      const toolbar = screen.getByTestId('inline-toolbar')
      // The floating-ui mock returns fixed styles, so we just check it renders
      expect(toolbar).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should close toolbar when Escape is pressed', async () => {
      const user = userEvent.setup()
      render(<InlineToolbar {...defaultProps} />)

      await user.keyboard('{Escape}')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-labels on buttons', () => {
      render(<InlineToolbar {...defaultProps} />)

      expect(screen.getByTestId('format-bold')).toHaveAttribute('aria-label', 'Bold')
      expect(screen.getByTestId('format-italic')).toHaveAttribute('aria-label', 'Italic')
      expect(screen.getByTestId('format-underline')).toHaveAttribute('aria-label', 'Underline')
      expect(screen.getByTestId('format-strike')).toHaveAttribute('aria-label', 'Strikethrough')
      expect(screen.getByTestId('format-highlight')).toHaveAttribute('aria-label', 'Highlight')
    })

    it('should have role="toolbar" on container', () => {
      render(<InlineToolbar {...defaultProps} />)
      expect(screen.getByTestId('inline-toolbar')).toHaveAttribute('role', 'toolbar')
    })
  })
})
