/**
 * Tests for LeftPanel Component
 * FE-503: Left Panel with Favorites
 * FE-504: Removed header tests (UserInfo/Settings moved to main Header)
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock editor store
vi.mock('@/stores/editor-store', () => ({
  useEditorStore: vi.fn(),
}))

import { LeftPanel } from '../index'
import { useEditorStore } from '@/stores/editor-store'

// Default mock implementations
const mockEditorStore = {
  favoriteBlockIds: [],
  focusedBlockId: null,
  enterFocusMode: vi.fn(),
  toggleFavorite: vi.fn(),
  isFavorite: vi.fn(() => false),
  reorderFavorites: vi.fn(),
  loadFavorites: vi.fn(),
  // FE-504: Block data from store
  blockTitles: new Map<string, string>(),
  topLevelBlockIds: [] as string[],
}

describe('LeftPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useEditorStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockEditorStore as any)
      }
      return mockEditorStore as any
    })
  })

  describe('Layout', () => {
    it('should render sidebar with correct width', () => {
      render(<LeftPanel />)
      const sidebar = screen.getByTestId('left-panel')
      expect(sidebar).toBeInTheDocument()
      expect(sidebar).toHaveStyle({ width: '240px' })
    })

    it('should have dark theme background', () => {
      render(<LeftPanel />)
      const sidebar = screen.getByTestId('left-panel')
      expect(sidebar).toHaveStyle({ backgroundColor: '#1e1e1e' })
    })
  })

  describe('Toggle Collapse', () => {
    it('should render toggle button', () => {
      render(<LeftPanel />)
      expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument()
    })

    it('should collapse sidebar when toggle is clicked', () => {
      render(<LeftPanel />)
      const toggle = screen.getByTestId('sidebar-toggle')
      fireEvent.click(toggle)
      const sidebar = screen.getByTestId('left-panel')
      expect(sidebar).toHaveStyle({ width: '0px' })
    })

    it('should expand sidebar when toggle is clicked again', () => {
      render(<LeftPanel />)
      const toggle = screen.getByTestId('sidebar-toggle')
      fireEvent.click(toggle) // collapse
      fireEvent.click(toggle) // expand
      const sidebar = screen.getByTestId('left-panel')
      expect(sidebar).toHaveStyle({ width: '240px' })
    })
  })

  describe('Favorites Section', () => {
    it('should render favorites section', () => {
      render(<LeftPanel />)
      expect(screen.getByTestId('favorites-section')).toBeInTheDocument()
    })

    it('should show "No favorites" placeholder when empty', () => {
      render(<LeftPanel />)
      expect(screen.getByText(/no favorites/i)).toBeInTheDocument()
    })

    it('should list favorited blocks', () => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const store = {
          ...mockEditorStore,
          favoriteBlockIds: ['block-1', 'block-2'],
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
      render(<LeftPanel />)
      // BlockNode uses block-node-{id} pattern
      expect(screen.getByTestId('block-node-block-1')).toBeInTheDocument()
      expect(screen.getByTestId('block-node-block-2')).toBeInTheDocument()
    })
  })

  describe('All Bullets Section', () => {
    it('should render all bullets section', () => {
      render(<LeftPanel />)
      expect(screen.getByTestId('all-bullets-section')).toBeInTheDocument()
    })

    it('should show "No blocks yet" when empty', () => {
      render(<LeftPanel />)
      expect(screen.getByText(/no blocks yet/i)).toBeInTheDocument()
    })

    it('should list top-level blocks from store', () => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const titles = new Map<string, string>()
        titles.set('bullet-1', 'First Bullet')
        titles.set('bullet-2', 'Second Bullet')
        const store = {
          ...mockEditorStore,
          blockTitles: titles,
          topLevelBlockIds: ['bullet-1', 'bullet-2'],
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
      render(<LeftPanel />)
      expect(screen.getByText('First Bullet')).toBeInTheDocument()
      expect(screen.getByText('Second Bullet')).toBeInTheDocument()
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should toggle sidebar with Cmd+\\', () => {
      render(<LeftPanel />)
      const sidebar = screen.getByTestId('left-panel')
      expect(sidebar).toHaveStyle({ width: '240px' })

      fireEvent.keyDown(document, { key: '\\', metaKey: true })
      expect(sidebar).toHaveStyle({ width: '0px' })

      fireEvent.keyDown(document, { key: '\\', metaKey: true })
      expect(sidebar).toHaveStyle({ width: '240px' })
    })
  })
})
