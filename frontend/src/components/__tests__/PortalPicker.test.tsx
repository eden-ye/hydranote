/**
 * Tests for Portal Picker Component (EDITOR-3405)
 *
 * Tests the UI for creating portal blocks and selecting target bullets.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PortalPicker } from '../PortalPicker'
import type { BulletItem } from '@/blocks/utils/portal-picker'

describe('PortalPicker', () => {
  const mockBullets: BulletItem[] = [
    {
      id: 'block-1',
      text: 'First bullet point',
      level: 0,
    },
    {
      id: 'block-2',
      text: 'Second bullet with children',
      level: 0,
    },
    {
      id: 'block-3',
      text: 'Child bullet',
      level: 1,
    },
    {
      id: 'block-4',
      text: 'Another top-level bullet',
      level: 0,
    },
  ]

  const defaultProps = {
    isOpen: true,
    bullets: mockBullets,
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

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<PortalPicker {...defaultProps} isOpen={false} />)
      expect(screen.queryByTestId('portal-picker')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(<PortalPicker {...defaultProps} />)
      expect(screen.getByTestId('portal-picker')).toBeInTheDocument()
    })

    it('should render all bullets in the list', () => {
      render(<PortalPicker {...defaultProps} />)
      const options = screen.getAllByRole('listitem')
      expect(options).toHaveLength(4)
    })

    it('should position the picker at the specified coordinates', () => {
      render(<PortalPicker {...defaultProps} />)
      const picker = screen.getByTestId('portal-picker')
      expect(picker).toHaveStyle({ top: '100px', left: '200px' })
    })

    it('should show empty state when no bullets match filter', () => {
      render(<PortalPicker {...defaultProps} bullets={[]} />)
      expect(screen.getByText('No bullets found')).toBeInTheDocument()
    })

    it('should highlight the selected index', () => {
      render(<PortalPicker {...defaultProps} selectedIndex={1} />)
      const options = screen.getAllByRole('listitem')
      expect(options[1]).toHaveClass('selected')
    })
  })

  describe('Search/Filter', () => {
    it('should filter bullets by text query', () => {
      const filteredBullets = [
        {
          id: 'block-1',
          text: 'First bullet point',
          level: 0,
        },
      ]
      render(<PortalPicker {...defaultProps} bullets={filteredBullets} />)
      const options = screen.getAllByRole('listitem')
      expect(options).toHaveLength(1)
    })

    it('should show search input field', () => {
      render(<PortalPicker {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText(/search bullets/i)
      expect(searchInput).toBeInTheDocument()
    })

    it('should call onQueryChange when search input changes', () => {
      render(<PortalPicker {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText(/search bullets/i)
      fireEvent.change(searchInput, { target: { value: 'first' } })
      expect(defaultProps.onQueryChange).toHaveBeenCalledWith('first')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should move selection down on ArrowDown', () => {
      render(<PortalPicker {...defaultProps} selectedIndex={0} />)
      fireEvent.keyDown(window, { key: 'ArrowDown' })
      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(1)
    })

    it('should move selection up on ArrowUp', () => {
      render(<PortalPicker {...defaultProps} selectedIndex={2} />)
      fireEvent.keyDown(window, { key: 'ArrowUp' })
      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(1)
    })

    it('should not move selection up past 0', () => {
      render(<PortalPicker {...defaultProps} selectedIndex={0} />)
      fireEvent.keyDown(window, { key: 'ArrowUp' })
      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(0)
    })

    it('should not move selection down past last item', () => {
      render(<PortalPicker {...defaultProps} selectedIndex={3} />)
      fireEvent.keyDown(window, { key: 'ArrowDown' })
      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(3)
    })

    it('should call onSelect on Enter key', () => {
      render(<PortalPicker {...defaultProps} selectedIndex={1} />)
      fireEvent.keyDown(window, { key: 'Enter' })
      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockBullets[1])
    })

    it('should call onClose on Escape key', () => {
      render(<PortalPicker {...defaultProps} />)
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('Mouse Interaction', () => {
    it('should call onSelect when clicking on a bullet', () => {
      render(<PortalPicker {...defaultProps} />)
      const options = screen.getAllByRole('listitem')
      fireEvent.click(options[0])
      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockBullets[0])
    })

    it('should update selected index on mouse enter', () => {
      render(<PortalPicker {...defaultProps} />)
      const options = screen.getAllByRole('listitem')
      fireEvent.mouseEnter(options[1])
      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(1)
    })

    it('should call onClose when clicking backdrop', () => {
      render(<PortalPicker {...defaultProps} />)
      const backdrop = screen.getByTestId('portal-picker-backdrop')
      fireEvent.click(backdrop)
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should not close when clicking inside picker content', () => {
      render(<PortalPicker {...defaultProps} />)
      const picker = screen.getByTestId('portal-picker')
      fireEvent.click(picker)
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
  })

  describe('Preview', () => {
    it('should show preview of selected bullet', () => {
      render(<PortalPicker {...defaultProps} selectedIndex={0} />)
      expect(screen.getByText(/preview/i)).toBeInTheDocument()
      const preview = screen.getByTestId('portal-picker-preview')
      expect(preview).toHaveTextContent('First bullet point')
    })

    it('should update preview when selection changes', () => {
      const { rerender } = render(<PortalPicker {...defaultProps} selectedIndex={0} />)
      const preview = screen.getByTestId('portal-picker-preview')
      expect(preview).toHaveTextContent('First bullet point')

      rerender(<PortalPicker {...defaultProps} selectedIndex={1} />)
      expect(preview).toHaveTextContent('Second bullet with children')
    })
  })

  describe('Visual Hierarchy', () => {
    it('should apply indentation based on bullet level', () => {
      render(<PortalPicker {...defaultProps} />)
      const options = screen.getAllByRole('listitem')
      // Third item (index 2) is a child (level 1), so paddingLeft = level * 24 + 12 = 1 * 24 + 12 = 36px
      expect(options[2]).toHaveStyle({ paddingLeft: '36px' })
    })

    it('should show level indicator for nested bullets', () => {
      render(<PortalPicker {...defaultProps} />)
      const options = screen.getAllByRole('listitem')
      // Third item (index 2) is a child (level 1)
      expect(options[2]).toHaveClass('level-1')
    })
  })

  describe('Accessibility', () => {
    it('should have keyboard navigation hints', () => {
      render(<PortalPicker {...defaultProps} />)
      expect(screen.getByText(/Navigate/i)).toBeInTheDocument()
      expect(screen.getByText(/Select/i)).toBeInTheDocument()
      expect(screen.getByText(/Cancel/i)).toBeInTheDocument()
    })

    it('should focus search input on mount', async () => {
      render(<PortalPicker {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText(/search bullets/i)
      await waitFor(() => {
        expect(searchInput).toHaveFocus()
      })
    })
  })
})
