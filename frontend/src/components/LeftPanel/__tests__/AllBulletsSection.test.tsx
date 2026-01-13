/**
 * Tests for AllBulletsSection Component
 * FE-503: Left Panel with Favorites
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock editor store
vi.mock('@/stores/editor-store', () => ({
  useEditorStore: vi.fn(),
}))

import { AllBulletsSection } from '../AllBulletsSection'
import { useEditorStore } from '@/stores/editor-store'

const mockStore = {
  focusedBlockId: null,
  enterFocusMode: vi.fn(),
  toggleFavorite: vi.fn(),
  isFavorite: vi.fn(() => false),
  // FE-506: Navigation history
  pushNavigation: vi.fn(),
}

// Mock top-level blocks (root blocks in the document)
const mockTopLevelBlocks = [
  { id: 'root-1', title: 'First Root Block' },
  { id: 'root-2', title: 'Second Root Block' },
  { id: 'root-3', title: 'Third Root Block' },
]

describe('AllBulletsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useEditorStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStore as any)
      }
      return mockStore as any
    })
  })

  describe('Rendering', () => {
    it('should render all bullets section', () => {
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      expect(screen.getByTestId('all-bullets-section')).toBeInTheDocument()
    })

    it('should show "All Bullets" title', () => {
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      expect(screen.getByText('All Bullets')).toBeInTheDocument()
    })

    it('should show bullet list icon in header', () => {
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      expect(screen.getByTestId('all-bullets-icon')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty message when no blocks', () => {
      render(<AllBulletsSection topLevelBlocks={[]} />)
      expect(screen.getByText(/no blocks yet/i)).toBeInTheDocument()
    })
  })

  describe('Block List', () => {
    it('should render all top-level blocks', () => {
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      expect(screen.getByTestId('block-node-root-1')).toBeInTheDocument()
      expect(screen.getByTestId('block-node-root-2')).toBeInTheDocument()
      expect(screen.getByTestId('block-node-root-3')).toBeInTheDocument()
    })

    it('should show block titles', () => {
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      expect(screen.getByText('First Root Block')).toBeInTheDocument()
      expect(screen.getByText('Second Root Block')).toBeInTheDocument()
    })

    it('should show count badge', () => {
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('Click to Focus', () => {
    it('should call enterFocusMode when block is clicked', () => {
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      const block = screen.getByTestId('block-node-root-1')
      fireEvent.click(block)
      expect(mockStore.enterFocusMode).toHaveBeenCalledWith('root-1')
    })
  })

  describe('Active State', () => {
    it('should highlight the currently focused block', () => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const store = {
          ...mockStore,
          focusedBlockId: 'root-2',
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      const activeBlock = screen.getByTestId('block-node-root-2')
      expect(activeBlock).toHaveAttribute('data-active', 'true')
    })

    it('should not highlight non-focused blocks', () => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const store = {
          ...mockStore,
          focusedBlockId: 'root-2',
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      const inactiveBlock = screen.getByTestId('block-node-root-1')
      expect(inactiveBlock).toHaveAttribute('data-active', 'false')
    })
  })

  describe('Favorite Toggle', () => {
    it('should show star button on hover', () => {
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      const block = screen.getByTestId('block-node-root-1')
      fireEvent.mouseEnter(block)
      expect(screen.getByTestId('favorite-toggle-root-1')).toBeVisible()
    })

    it('should call toggleFavorite when star is clicked', () => {
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      const block = screen.getByTestId('block-node-root-1')
      fireEvent.mouseEnter(block)
      const starButton = screen.getByTestId('favorite-toggle-root-1')
      fireEvent.click(starButton)
      expect(mockStore.toggleFavorite).toHaveBeenCalledWith('root-1')
    })

    it('should show filled star for favorited blocks', () => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const store = {
          ...mockStore,
          isFavorite: (id: string) => id === 'root-1',
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      const block = screen.getByTestId('block-node-root-1')
      fireEvent.mouseEnter(block)
      const starButton = screen.getByTestId('favorite-toggle-root-1')
      expect(starButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Collapsible', () => {
    it('should be collapsible', () => {
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      const header = screen.getByRole('button', { name: /all bullets/i })

      // Initially expanded
      expect(screen.getByTestId('block-node-root-1')).toBeVisible()

      // Collapse
      fireEvent.click(header)
      expect(screen.queryByTestId('block-node-root-1')).not.toBeInTheDocument()

      // Expand
      fireEvent.click(header)
      expect(screen.getByTestId('block-node-root-1')).toBeVisible()
    })
  })

  describe('Not Draggable', () => {
    it('should not have drag handles (only favorites are draggable)', () => {
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      expect(screen.queryByTestId('drag-handle-root-1')).not.toBeInTheDocument()
    })

    it('should not be draggable', () => {
      render(<AllBulletsSection topLevelBlocks={mockTopLevelBlocks} />)
      const block = screen.getByTestId('block-node-root-1')
      expect(block).not.toHaveAttribute('draggable', 'true')
    })
  })

  describe('FE-508: Filtering Empty Bullets', () => {
    it('should only show bullets with children or descriptors (integration test relies on LeftPanel filtering)', () => {
      // This test documents that filtering is handled by LeftPanel, not AllBulletsSection
      // AllBulletsSection is a presentational component that displays whatever it's given

      const filteredBlocks = [
        { id: 'root-1', title: 'Has Children' },
        { id: 'root-2', title: 'Is Descriptor' },
      ]

      render(<AllBulletsSection topLevelBlocks={filteredBlocks} />)

      // Should show only the filtered blocks
      expect(screen.getByTestId('block-node-root-1')).toBeInTheDocument()
      expect(screen.getByTestId('block-node-root-2')).toBeInTheDocument()

      // Count should reflect filtered count
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should update count when filtered list changes', () => {
      const { rerender } = render(<AllBulletsSection topLevelBlocks={[]} />)
      // Count badge is not shown when count is 0
      expect(screen.queryByText('0')).not.toBeInTheDocument()

      const oneBlock = [{ id: 'root-1', title: 'Has Children' }]
      rerender(<AllBulletsSection topLevelBlocks={oneBlock} />)
      expect(screen.getByText('1')).toBeInTheDocument()

      const twoBlocks = [
        { id: 'root-1', title: 'Has Children' },
        { id: 'root-2', title: 'Is Descriptor' },
      ]
      rerender(<AllBulletsSection topLevelBlocks={twoBlocks} />)
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })
})
