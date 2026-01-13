/**
 * Tests for FavoritesSection Component
 * FE-503: Left Panel with Favorites
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock editor store
vi.mock('@/stores/editor-store', () => ({
  useEditorStore: vi.fn(),
}))

import { FavoritesSection } from '../FavoritesSection'
import { useEditorStore } from '@/stores/editor-store'

const mockStore = {
  favoriteBlockIds: [],
  focusedBlockId: null,
  enterFocusMode: vi.fn(),
  toggleFavorite: vi.fn(),
  isFavorite: vi.fn(() => true),
  reorderFavorites: vi.fn(),
}

// Mock block data provider
const mockGetBlockTitle = vi.fn((id: string) => `Block ${id}`)

describe('FavoritesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useEditorStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStore as any)
      }
      return mockStore as any
    })
  })

  describe('Empty State', () => {
    it('should render favorites section', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      expect(screen.getByTestId('favorites-section')).toBeInTheDocument()
    })

    it('should show star icon in header', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      expect(screen.getByTestId('favorites-icon')).toBeInTheDocument()
    })

    it('should show "Favorites" title', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      expect(screen.getByText('Favorites')).toBeInTheDocument()
    })

    it('should show "No favorites" placeholder when empty', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      expect(screen.getByText(/no favorites/i)).toBeInTheDocument()
    })

    it('should show hint to star blocks', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      expect(screen.getByText(/star blocks to add/i)).toBeInTheDocument()
    })
  })

  describe('With Favorites', () => {
    beforeEach(() => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const store = {
          ...mockStore,
          favoriteBlockIds: ['block-1', 'block-2', 'block-3'],
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
    })

    it('should not show empty placeholder', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      expect(screen.queryByText(/no favorites/i)).not.toBeInTheDocument()
    })

    it('should render all favorite blocks', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      expect(screen.getByTestId('block-node-block-1')).toBeInTheDocument()
      expect(screen.getByTestId('block-node-block-2')).toBeInTheDocument()
      expect(screen.getByTestId('block-node-block-3')).toBeInTheDocument()
    })

    it('should show block titles', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      expect(screen.getByText('Block block-1')).toBeInTheDocument()
      expect(screen.getByText('Block block-2')).toBeInTheDocument()
    })

    it('should show count badge', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('Click to Focus', () => {
    beforeEach(() => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const store = {
          ...mockStore,
          favoriteBlockIds: ['block-1'],
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
    })

    it('should call enterFocusMode when favorite is clicked', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      const block = screen.getByTestId('block-node-block-1')
      fireEvent.click(block)
      expect(mockStore.enterFocusMode).toHaveBeenCalledWith('block-1')
    })
  })

  describe('Active State', () => {
    it('should highlight the currently focused block', () => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const store = {
          ...mockStore,
          favoriteBlockIds: ['block-1', 'block-2'],
          focusedBlockId: 'block-1',
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      const activeBlock = screen.getByTestId('block-node-block-1')
      expect(activeBlock).toHaveAttribute('data-active', 'true')
    })
  })

  describe('Unfavorite from List', () => {
    beforeEach(() => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const store = {
          ...mockStore,
          favoriteBlockIds: ['block-1'],
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
    })

    it('should show star toggle on hover', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      const block = screen.getByTestId('block-node-block-1')
      fireEvent.mouseEnter(block)
      expect(screen.getByTestId('favorite-toggle-block-1')).toBeVisible()
    })

    it('should call toggleFavorite when star is clicked', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      const block = screen.getByTestId('block-node-block-1')
      fireEvent.mouseEnter(block)
      const starButton = screen.getByTestId('favorite-toggle-block-1')
      fireEvent.click(starButton)
      expect(mockStore.toggleFavorite).toHaveBeenCalledWith('block-1')
    })
  })

  describe('Drag-to-Reorder', () => {
    beforeEach(() => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const store = {
          ...mockStore,
          favoriteBlockIds: ['block-1', 'block-2', 'block-3'],
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
    })

    it('should have drag handles on favorite blocks', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      expect(screen.getByTestId('drag-handle-block-1')).toBeInTheDocument()
    })

    it('should make blocks draggable', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      const block = screen.getByTestId('block-node-block-1')
      expect(block).toHaveAttribute('draggable', 'true')
    })

    it('should call reorderFavorites on drop', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      const dragBlock = screen.getByTestId('block-node-block-1')
      const dropTarget = screen.getByTestId('block-node-block-3')

      // Start drag
      fireEvent.dragStart(dragBlock, {
        dataTransfer: { setData: vi.fn(), effectAllowed: '' },
      })

      // Drag over target
      fireEvent.dragOver(dropTarget, {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' },
      })

      // Drop
      fireEvent.drop(dropTarget, {
        preventDefault: vi.fn(),
        dataTransfer: { getData: () => 'block-1' },
      })

      expect(mockStore.reorderFavorites).toHaveBeenCalled()
    })

    it('should show drop indicator when dragging over', () => {
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      const dragBlock = screen.getByTestId('block-node-block-1')
      const dropTarget = screen.getByTestId('block-node-block-2')

      fireEvent.dragStart(dragBlock, {
        dataTransfer: { setData: vi.fn(), effectAllowed: '' },
      })
      fireEvent.dragOver(dropTarget, {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' },
      })

      expect(screen.getByTestId('drop-indicator')).toBeInTheDocument()
    })
  })

  describe('Collapsible', () => {
    it('should be collapsible', () => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const store = {
          ...mockStore,
          favoriteBlockIds: ['block-1'],
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
      render(<FavoritesSection getBlockTitle={mockGetBlockTitle} />)
      const header = screen.getByRole('button', { name: /favorites/i })

      // Initially expanded
      expect(screen.getByTestId('block-node-block-1')).toBeVisible()

      // Collapse
      fireEvent.click(header)
      expect(screen.queryByTestId('block-node-block-1')).not.toBeInTheDocument()

      // Expand
      fireEvent.click(header)
      expect(screen.getByTestId('block-node-block-1')).toBeVisible()
    })
  })
})
