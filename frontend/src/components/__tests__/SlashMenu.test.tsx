import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SlashMenu } from '../SlashMenu'
import { SLASH_MENU_ITEMS } from '@/blocks/utils/slash-menu'

describe('SlashMenu', () => {
  const defaultProps = {
    isOpen: true,
    query: '',
    selectedIndex: 0,
    position: { top: 100, left: 200 },
    onSelect: vi.fn(),
    onClose: vi.fn(),
    onQueryChange: vi.fn(),
    onSelectedIndexChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<SlashMenu {...defaultProps} isOpen={false} />)
      expect(screen.queryByTestId('slash-menu')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(<SlashMenu {...defaultProps} />)
      expect(screen.getByTestId('slash-menu')).toBeInTheDocument()
    })

    it('should render all menu items when query is empty', () => {
      render(<SlashMenu {...defaultProps} />)
      SLASH_MENU_ITEMS.forEach((item) => {
        expect(screen.getByTestId(`slash-menu-item-${item.blockType}`)).toBeInTheDocument()
      })
    })

    it('should position dropdown at specified location', () => {
      render(<SlashMenu {...defaultProps} position={{ top: 150, left: 250 }} />)
      const menu = screen.getByTestId('slash-menu')
      expect(menu).toHaveStyle({ top: '150px', left: '250px' })
    })

    it('should show empty message when no matches', () => {
      render(<SlashMenu {...defaultProps} query="xyz123nonexistent" />)
      expect(screen.getByText('No matching block types')).toBeInTheDocument()
    })
  })

  describe('filtering', () => {
    it('should filter items by query', () => {
      render(<SlashMenu {...defaultProps} query="bullet" />)
      expect(screen.getByTestId('slash-menu-item-bullet')).toBeInTheDocument()
      expect(screen.queryByTestId('slash-menu-item-checkbox')).not.toBeInTheDocument()
    })

    it('should filter heading items', () => {
      render(<SlashMenu {...defaultProps} query="head" />)
      expect(screen.getByTestId('slash-menu-item-heading1')).toBeInTheDocument()
      expect(screen.getByTestId('slash-menu-item-heading2')).toBeInTheDocument()
      expect(screen.getByTestId('slash-menu-item-heading3')).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('should highlight selected item', () => {
      render(<SlashMenu {...defaultProps} selectedIndex={1} />)
      const items = screen.getAllByRole('option')
      expect(items[1]).toHaveClass('selected')
      expect(items[0]).not.toHaveClass('selected')
    })

    it('should call onSelect when item is clicked', () => {
      render(<SlashMenu {...defaultProps} />)
      fireEvent.click(screen.getByTestId('slash-menu-item-bullet'))
      expect(defaultProps.onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ blockType: 'bullet' })
      )
    })
  })

  describe('keyboard navigation', () => {
    it('should navigate down on ArrowDown', () => {
      render(<SlashMenu {...defaultProps} selectedIndex={0} />)
      fireEvent.keyDown(window, { key: 'ArrowDown' })
      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(1)
    })

    it('should navigate up on ArrowUp', () => {
      render(<SlashMenu {...defaultProps} selectedIndex={2} />)
      fireEvent.keyDown(window, { key: 'ArrowUp' })
      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(1)
    })

    it('should not go below 0', () => {
      render(<SlashMenu {...defaultProps} selectedIndex={0} />)
      fireEvent.keyDown(window, { key: 'ArrowUp' })
      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(0)
    })

    it('should not go above max index', () => {
      const maxIndex = SLASH_MENU_ITEMS.length - 1
      render(<SlashMenu {...defaultProps} selectedIndex={maxIndex} />)
      fireEvent.keyDown(window, { key: 'ArrowDown' })
      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(maxIndex)
    })

    it('should select item on Enter', () => {
      render(<SlashMenu {...defaultProps} selectedIndex={0} />)
      fireEvent.keyDown(window, { key: 'Enter' })
      expect(defaultProps.onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ blockType: 'bullet' })
      )
    })

    it('should close menu on Escape', () => {
      render(<SlashMenu {...defaultProps} />)
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have listbox role', () => {
      render(<SlashMenu {...defaultProps} />)
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('should have aria-selected on selected item', () => {
      render(<SlashMenu {...defaultProps} selectedIndex={1} />)
      const items = screen.getAllByRole('option')
      expect(items[1]).toHaveAttribute('aria-selected', 'true')
      expect(items[0]).toHaveAttribute('aria-selected', 'false')
    })

    it('should have descriptive aria-label', () => {
      render(<SlashMenu {...defaultProps} />)
      expect(screen.getByLabelText('Block type menu')).toBeInTheDocument()
    })
  })
})
