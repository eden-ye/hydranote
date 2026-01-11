/**
 * Tests for DescriptorAutocomplete Component (EDITOR-3203)
 *
 * Testing:
 * - Dropdown visibility
 * - Descriptor list rendering
 * - Keyboard navigation (up/down, enter, escape)
 * - Fuzzy filtering
 * - Visual highlighting of selected option
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DescriptorAutocomplete } from '../DescriptorAutocomplete'

describe('DescriptorAutocomplete (EDITOR-3203)', () => {
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

  describe('Visibility', () => {
    it('should render when isOpen is true', () => {
      render(<DescriptorAutocomplete {...defaultProps} />)
      expect(screen.getByTestId('descriptor-autocomplete')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<DescriptorAutocomplete {...defaultProps} isOpen={false} />)
      expect(screen.queryByTestId('descriptor-autocomplete')).not.toBeInTheDocument()
    })
  })

  describe('Descriptor List', () => {
    it('should display all default descriptors when query is empty', () => {
      render(<DescriptorAutocomplete {...defaultProps} />)

      expect(screen.getByText('What is it')).toBeInTheDocument()
      expect(screen.getByText('Why it matters')).toBeInTheDocument()
      expect(screen.getByText('How it works')).toBeInTheDocument()
      expect(screen.getByText('Pros / Advantages')).toBeInTheDocument()
      expect(screen.getByText('Cons / Disadvantages')).toBeInTheDocument()
    })

    it('should filter descriptors based on query', () => {
      render(<DescriptorAutocomplete {...defaultProps} query="wh" />)

      expect(screen.getByText('What is it')).toBeInTheDocument()
      expect(screen.getByText('Why it matters')).toBeInTheDocument()
      expect(screen.queryByText('Pros / Advantages')).not.toBeInTheDocument()
    })

    it('should show "No matches" when query has no results', () => {
      render(<DescriptorAutocomplete {...defaultProps} query="xyz" />)

      expect(screen.getByText('No matching descriptors')).toBeInTheDocument()
    })
  })

  describe('Visual Highlighting', () => {
    it('should highlight the selected index', () => {
      render(<DescriptorAutocomplete {...defaultProps} selectedIndex={0} />)

      const firstOption = screen.getByTestId('descriptor-option-0')
      expect(firstOption).toHaveClass('selected')
    })

    it('should highlight different option when selectedIndex changes', () => {
      render(<DescriptorAutocomplete {...defaultProps} selectedIndex={2} />)

      const thirdOption = screen.getByTestId('descriptor-option-2')
      expect(thirdOption).toHaveClass('selected')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should call onSelectedIndexChange with next index on ArrowDown', () => {
      render(<DescriptorAutocomplete {...defaultProps} selectedIndex={0} />)

      fireEvent.keyDown(window, { key: 'ArrowDown' })

      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(1)
    })

    it('should call onSelectedIndexChange with previous index on ArrowUp', () => {
      render(<DescriptorAutocomplete {...defaultProps} selectedIndex={2} />)

      fireEvent.keyDown(window, { key: 'ArrowUp' })

      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(1)
    })

    it('should not go below 0 on ArrowUp at first item', () => {
      render(<DescriptorAutocomplete {...defaultProps} selectedIndex={0} />)

      fireEvent.keyDown(window, { key: 'ArrowUp' })

      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(0)
    })

    it('should not go beyond last item on ArrowDown', () => {
      // 5 default descriptors, max index is 4
      render(<DescriptorAutocomplete {...defaultProps} selectedIndex={4} />)

      fireEvent.keyDown(window, { key: 'ArrowDown' })

      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(4)
    })

    it('should call onSelect with selected descriptor on Enter', () => {
      render(<DescriptorAutocomplete {...defaultProps} selectedIndex={0} />)

      fireEvent.keyDown(window, { key: 'Enter' })

      expect(defaultProps.onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'what' })
      )
    })

    it('should call onClose on Escape', () => {
      render(<DescriptorAutocomplete {...defaultProps} />)

      fireEvent.keyDown(window, { key: 'Escape' })

      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('Click Selection', () => {
    it('should call onSelect when clicking a descriptor option', () => {
      render(<DescriptorAutocomplete {...defaultProps} />)

      fireEvent.click(screen.getByTestId('descriptor-option-0'))

      expect(defaultProps.onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'what' })
      )
    })
  })

  describe('Positioning', () => {
    it('should position dropdown at specified location', () => {
      render(<DescriptorAutocomplete {...defaultProps} position={{ top: 150, left: 250 }} />)

      const dropdown = screen.getByTestId('descriptor-autocomplete')
      expect(dropdown).toHaveStyle({ top: '150px', left: '250px' })
    })
  })

  describe('Backdrop Click', () => {
    it('should close when clicking outside the dropdown', () => {
      render(<DescriptorAutocomplete {...defaultProps} />)

      fireEvent.click(screen.getByTestId('descriptor-backdrop'))

      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should not close when clicking inside the dropdown', () => {
      render(<DescriptorAutocomplete {...defaultProps} />)

      fireEvent.click(screen.getByTestId('descriptor-autocomplete-content'))

      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
  })
})
