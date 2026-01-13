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
  pushNavigation: vi.fn(),
  // FE-504: Block data from store
  blockTitles: new Map<string, string>(),
  topLevelBlockIds: [] as string[],
  // FE-508: Block metadata for filtering
  blockHasChildren: new Map<string, boolean>(),
  blockIsDescriptor: new Map<string, boolean>(),
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

        // FE-508: Add metadata for filtering
        const hasChildren = new Map<string, boolean>()
        hasChildren.set('bullet-1', true) // Has children, should be shown
        hasChildren.set('bullet-2', true) // Has children, should be shown

        const isDescriptor = new Map<string, boolean>()
        isDescriptor.set('bullet-1', false)
        isDescriptor.set('bullet-2', false)

        const store = {
          ...mockEditorStore,
          blockTitles: titles,
          topLevelBlockIds: ['bullet-1', 'bullet-2'],
          blockHasChildren: hasChildren,
          blockIsDescriptor: isDescriptor,
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

  describe('FE-508: Filter Empty Bullets', () => {
    it('should only show bullets that have children', () => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const titles = new Map<string, string>()
        titles.set('bullet-1', 'Has Children')
        titles.set('bullet-2', 'Empty Bullet')
        titles.set('bullet-3', 'Also Has Children')

        const hasChildren = new Map<string, boolean>()
        hasChildren.set('bullet-1', true)
        hasChildren.set('bullet-2', false)
        hasChildren.set('bullet-3', true)

        const isDescriptor = new Map<string, boolean>()
        isDescriptor.set('bullet-1', false)
        isDescriptor.set('bullet-2', false)
        isDescriptor.set('bullet-3', false)

        const store = {
          ...mockEditorStore,
          blockTitles: titles,
          topLevelBlockIds: ['bullet-1', 'bullet-2', 'bullet-3'],
          blockHasChildren: hasChildren,
          blockIsDescriptor: isDescriptor,
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
      render(<LeftPanel />)

      // Should show bullets with children
      expect(screen.getByText('Has Children')).toBeInTheDocument()
      expect(screen.getByText('Also Has Children')).toBeInTheDocument()

      // Should NOT show empty bullet
      expect(screen.queryByText('Empty Bullet')).not.toBeInTheDocument()

      // Count should reflect filtered count
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should only show bullets that are descriptors', () => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const titles = new Map<string, string>()
        titles.set('bullet-1', 'Is Descriptor')
        titles.set('bullet-2', 'Empty Bullet')
        titles.set('bullet-3', 'Also Descriptor')

        const hasChildren = new Map<string, boolean>()
        hasChildren.set('bullet-1', false)
        hasChildren.set('bullet-2', false)
        hasChildren.set('bullet-3', false)

        const isDescriptor = new Map<string, boolean>()
        isDescriptor.set('bullet-1', true)
        isDescriptor.set('bullet-2', false)
        isDescriptor.set('bullet-3', true)

        const store = {
          ...mockEditorStore,
          blockTitles: titles,
          topLevelBlockIds: ['bullet-1', 'bullet-2', 'bullet-3'],
          blockHasChildren: hasChildren,
          blockIsDescriptor: isDescriptor,
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
      render(<LeftPanel />)

      // Should show descriptors
      expect(screen.getByText('Is Descriptor')).toBeInTheDocument()
      expect(screen.getByText('Also Descriptor')).toBeInTheDocument()

      // Should NOT show empty bullet
      expect(screen.queryByText('Empty Bullet')).not.toBeInTheDocument()

      // Count should be 2
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should show bullets that have both children AND are descriptors', () => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const titles = new Map<string, string>()
        titles.set('bullet-1', 'Both')
        titles.set('bullet-2', 'Empty')

        const hasChildren = new Map<string, boolean>()
        hasChildren.set('bullet-1', true)
        hasChildren.set('bullet-2', false)

        const isDescriptor = new Map<string, boolean>()
        isDescriptor.set('bullet-1', true)
        isDescriptor.set('bullet-2', false)

        const store = {
          ...mockEditorStore,
          blockTitles: titles,
          topLevelBlockIds: ['bullet-1', 'bullet-2'],
          blockHasChildren: hasChildren,
          blockIsDescriptor: isDescriptor,
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
      render(<LeftPanel />)

      expect(screen.getByText('Both')).toBeInTheDocument()
      expect(screen.queryByText('Empty')).not.toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should hide all bullets if none have children or descriptors', () => {
      vi.mocked(useEditorStore).mockImplementation((selector) => {
        const titles = new Map<string, string>()
        titles.set('bullet-1', 'Empty 1')
        titles.set('bullet-2', 'Empty 2')

        const hasChildren = new Map<string, boolean>()
        hasChildren.set('bullet-1', false)
        hasChildren.set('bullet-2', false)

        const isDescriptor = new Map<string, boolean>()
        isDescriptor.set('bullet-1', false)
        isDescriptor.set('bullet-2', false)

        const store = {
          ...mockEditorStore,
          blockTitles: titles,
          topLevelBlockIds: ['bullet-1', 'bullet-2'],
          blockHasChildren: hasChildren,
          blockIsDescriptor: isDescriptor,
        }
        if (typeof selector === 'function') {
          return selector(store as any)
        }
        return store as any
      })
      render(<LeftPanel />)

      // Should show empty state
      expect(screen.getByText(/no blocks yet/i)).toBeInTheDocument()
      expect(screen.queryByText('Empty 1')).not.toBeInTheDocument()
      expect(screen.queryByText('Empty 2')).not.toBeInTheDocument()

      // Count badge should not be shown (count is 0)
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })
  })
})
