/**
 * Tests for Portal Search Modal Component (EDITOR-3410)
 *
 * Tests the portal search modal UI for Cmd+S shortcut integration.
 * Tests frecency display, fuzzy search, and keyboard navigation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PortalSearchModal } from '../PortalSearchModal'
import { useEditorStore } from '@/stores/editor-store'
import { frecencyTracker } from '@/utils/frecency'
import type { RecentItem } from '@/utils/frecency'
import type { FuzzySearchResult } from '@/utils/fuzzy-search'

// Mock the frecency tracker
vi.mock('@/utils/frecency', () => ({
  frecencyTracker: {
    getTopRecents: vi.fn(),
    recordAccess: vi.fn(),
  },
}))

// Mock CSS import
vi.mock('../PortalSearchModal.css', () => ({}))

describe('PortalSearchModal', () => {
  const mockRecents: RecentItem[] = [
    {
      documentId: 'doc-1',
      blockId: 'block-1',
      bulletText: 'Neural networks basics',
      contextPath: 'Machine Learning / *Neural networks basics',
      accessCount: 5,
      lastAccessTime: Date.now() - 1000,
      frecencyScore: 500,
    },
    {
      documentId: 'doc-1',
      blockId: 'block-2',
      bulletText: 'Decision trees',
      contextPath: 'Machine Learning / *Decision trees',
      accessCount: 3,
      lastAccessTime: Date.now() - 2000,
      frecencyScore: 300,
    },
  ]

  const mockSearchResults: FuzzySearchResult[] = [
    {
      documentId: 'doc-2',
      blockId: 'block-3',
      text: 'Test result one',
      contextPath: 'Test Doc / *Test result one',
      score: 95,
    },
    {
      documentId: 'doc-2',
      blockId: 'block-4',
      text: 'Test result two',
      contextPath: 'Test Doc / *Test result two',
      score: 80,
    },
  ]

  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset editor store state
    useEditorStore.setState({
      portalSearchModalOpen: false,
      portalSearchQuery: '',
      portalSearchResults: [],
      portalSearchRecents: [],
      portalSearchSelectedIndex: 0,
      portalSearchCurrentBulletId: null,
    })
    // Default mock returns for frecency
    vi.mocked(frecencyTracker.getTopRecents).mockReturnValue(mockRecents)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Rendering', () => {
    it('should not render when modal is closed', () => {
      render(<PortalSearchModal onSelect={mockOnSelect} />)
      expect(screen.queryByTestId('portal-search-modal')).not.toBeInTheDocument()
    })

    it('should render when modal is open', () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      expect(screen.getByTestId('portal-search-modal')).toBeInTheDocument()
    })

    it('should render header with portal icon and title', () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      expect(screen.getByText('🔗')).toBeInTheDocument()
      expect(screen.getByText('Embed a Portal to...')).toBeInTheDocument()
    })

    it('should render search input that auto-focuses', async () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      const input = screen.getByTestId('portal-search-input')
      expect(input).toBeInTheDocument()

      await waitFor(() => {
        expect(input).toHaveFocus()
      })
    })

    it('should render keyboard hints', () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      expect(screen.getByText('↑↓ Navigate')).toBeInTheDocument()
      expect(screen.getByText('↵ Select')).toBeInTheDocument()
      expect(screen.getByText('Esc Close')).toBeInTheDocument()
    })
  })

  describe('Recents Display', () => {
    it('should show recents header when query is empty', () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
        portalSearchQuery: '',
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      expect(screen.getByText('Recents')).toBeInTheDocument()
    })

    it('should display recent items sorted by frecency', () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
        portalSearchQuery: '',
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      const items = screen.getAllByTestId(/portal-search-result-/)
      expect(items).toHaveLength(2)
      // First item should be the one with higher frecency
      expect(items[0]).toHaveTextContent('Neural networks basics')
    })

    it('should display context paths for recents', () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
        portalSearchQuery: '',
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      expect(screen.getByText('Machine Learning / *Neural networks basics')).toBeInTheDocument()
    })

    it('should show empty state when no recents exist', () => {
      // Mock frecencyTracker to return empty array
      vi.mocked(frecencyTracker.getTopRecents).mockReturnValue([])

      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: [],
        portalSearchQuery: '',
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      expect(screen.getByTestId('portal-search-empty')).toBeInTheDocument()
      expect(screen.getByText('No recent bullets')).toBeInTheDocument()
    })
  })

  describe('Search Results Display', () => {
    it('should hide recents header when query is not empty', () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchQuery: 'test',
        portalSearchResults: mockSearchResults,
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      expect(screen.queryByText('Recents')).not.toBeInTheDocument()
    })

    it('should display search results when query is present', () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchQuery: 'test',
        portalSearchResults: mockSearchResults,
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      const items = screen.getAllByTestId(/portal-search-result-/)
      expect(items).toHaveLength(2)
    })

    it('should show no results message when search finds nothing', () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchQuery: 'nonexistent',
        portalSearchResults: [],
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should close modal on Escape key', () => {
      const closeModalSpy = vi.spyOn(useEditorStore.getState(), 'closePortalSearchModal')

      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      fireEvent.keyDown(window, { key: 'Escape' })

      expect(closeModalSpy).toHaveBeenCalled()
    })

    it('should navigate down with ArrowDown', () => {
      const setSelectedIndexSpy = vi.spyOn(useEditorStore.getState(), 'setPortalSearchSelectedIndex')

      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
        portalSearchSelectedIndex: 0,
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      fireEvent.keyDown(window, { key: 'ArrowDown' })

      expect(setSelectedIndexSpy).toHaveBeenCalledWith(1)
    })

    it('should navigate up with ArrowUp', () => {
      const setSelectedIndexSpy = vi.spyOn(useEditorStore.getState(), 'setPortalSearchSelectedIndex')

      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
        portalSearchSelectedIndex: 1,
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      fireEvent.keyDown(window, { key: 'ArrowUp' })

      expect(setSelectedIndexSpy).toHaveBeenCalledWith(0)
    })

    it('should select item and call onSelect on Enter', () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
        portalSearchSelectedIndex: 0,
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      fireEvent.keyDown(window, { key: 'Enter' })

      expect(mockOnSelect).toHaveBeenCalledWith(mockRecents[0])
    })

    it('should record frecency access on selection', () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
        portalSearchSelectedIndex: 0,
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      fireEvent.keyDown(window, { key: 'Enter' })

      expect(frecencyTracker.recordAccess).toHaveBeenCalledWith({
        documentId: mockRecents[0].documentId,
        blockId: mockRecents[0].blockId,
        bulletText: mockRecents[0].bulletText,
        contextPath: mockRecents[0].contextPath,
      })
    })
  })

  describe('Mouse Interaction', () => {
    it('should close modal when clicking backdrop', () => {
      const closeModalSpy = vi.spyOn(useEditorStore.getState(), 'closePortalSearchModal')

      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      const backdrop = screen.getByTestId('portal-search-modal-backdrop')
      fireEvent.click(backdrop)

      expect(closeModalSpy).toHaveBeenCalled()
    })

    it('should not close when clicking inside modal content', () => {
      const closeModalSpy = vi.spyOn(useEditorStore.getState(), 'closePortalSearchModal')

      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      const modal = screen.getByTestId('portal-search-modal')
      fireEvent.click(modal)

      expect(closeModalSpy).not.toHaveBeenCalled()
    })

    it('should select item on click', () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      const items = screen.getAllByTestId(/portal-search-result-/)
      fireEvent.click(items[1])

      expect(mockOnSelect).toHaveBeenCalledWith(mockRecents[1])
    })

    it('should update selected index on mouse enter', () => {
      const setSelectedIndexSpy = vi.spyOn(useEditorStore.getState(), 'setPortalSearchSelectedIndex')

      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
        portalSearchSelectedIndex: 0,
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      const items = screen.getAllByTestId(/portal-search-result-/)
      fireEvent.mouseEnter(items[1])

      expect(setSelectedIndexSpy).toHaveBeenCalledWith(1)
    })
  })

  describe('Search Input', () => {
    it('should update query on input change', () => {
      const setQuerySpy = vi.spyOn(useEditorStore.getState(), 'setPortalSearchQuery')

      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      const input = screen.getByTestId('portal-search-input')
      fireEvent.change(input, { target: { value: 'neural' } })

      expect(setQuerySpy).toHaveBeenCalledWith('neural')
    })
  })

  describe('Selection Highlight', () => {
    it('should highlight selected item', () => {
      useEditorStore.setState({
        portalSearchModalOpen: true,
        portalSearchCurrentBulletId: 'bullet-123',
        portalSearchRecents: mockRecents,
        portalSearchSelectedIndex: 1,
      })

      render(<PortalSearchModal onSelect={mockOnSelect} />)
      const items = screen.getAllByTestId(/portal-search-result-/)
      expect(items[1]).toHaveClass('selected')
      expect(items[0]).not.toHaveClass('selected')
    })
  })
})
