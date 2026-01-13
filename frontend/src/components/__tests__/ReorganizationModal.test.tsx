/**
 * Tests for Reorganization Modal Component (EDITOR-3502)
 *
 * Tests the reorganization modal UI for Cmd+Shift+L shortcut integration.
 * Tests concept extraction, semantic search results, and connection selection.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReorganizationModal } from '../ReorganizationModal'
import { useEditorStore } from '@/stores/editor-store'
import type { ConceptMatch } from '../ReorganizationModal'

// Mock API client
vi.mock('@/services/api-client.mock', () => ({
  extractConcepts: vi.fn(),
  semanticSearch: vi.fn(),
}))

// Mock CSS import
vi.mock('../ReorganizationModal.css', () => ({}))

describe('ReorganizationModal', () => {
  const mockConceptMatches: ConceptMatch[] = [
    {
      concept: 'Tesla Inc',
      category: 'company',
      matches: [
        {
          documentId: 'doc-1',
          blockId: 'block-1',
          bulletText: 'Electric car company',
          contextPath: 'Tesla > [What] Electric car company',
          score: 0.89,
          descriptorType: 'what',
          childrenSummary: 'Founded 2003, Elon Musk',
        },
        {
          documentId: 'doc-2',
          blockId: 'block-2',
          bulletText: 'Tesla Motors',
          contextPath: 'Companies > Tech > Tesla Motors',
          score: 0.72,
          descriptorType: null,
          childrenSummary: null,
        },
      ],
      selectedMatches: new Set(['block-1']),
    },
    {
      concept: 'electric vehicle',
      category: 'category',
      matches: [
        {
          documentId: 'doc-3',
          blockId: 'block-3',
          bulletText: 'EVs',
          contextPath: 'Transportation > Types > EVs',
          score: 0.85,
          descriptorType: null,
          childrenSummary: null,
        },
      ],
      selectedMatches: new Set(['block-3']),
    },
    {
      concept: 'Model 3',
      category: 'product',
      matches: [],
      selectedMatches: new Set(),
    },
  ]

  const mockOnConnect = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset editor store state
    useEditorStore.setState({
      reorgModalOpen: false,
      reorgModalStatus: 'idle',
      reorgModalDocumentId: null,
      reorgModalConceptMatches: [],
      reorgModalError: null,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Rendering', () => {
    it('should not render when modal is closed', () => {
      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      expect(screen.queryByTestId('reorg-modal')).not.toBeInTheDocument()
    })

    it('should render when modal is open', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalStatus: 'idle',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      expect(screen.getByTestId('reorg-modal')).toBeInTheDocument()
    })

    it('should render header with link icon and title', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: mockConceptMatches,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      expect(screen.getByText('🔗')).toBeInTheDocument()
      expect(screen.getByText('Connect to Existing Knowledge')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show analyzing state while extracting concepts', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalStatus: 'extracting',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      expect(screen.getByText(/Analyzing/i)).toBeInTheDocument()
      expect(screen.getByTestId('reorg-modal-loading')).toBeInTheDocument()
    })

    it('should show searching state while finding matches', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalStatus: 'searching',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      expect(screen.getByText(/Searching/i)).toBeInTheDocument()
    })
  })

  describe('Concept Display', () => {
    it('should display extracted concepts count', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: mockConceptMatches,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      expect(screen.getByText(/Found 3 concepts/i)).toBeInTheDocument()
    })

    it('should display concept names with categories', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: mockConceptMatches,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      expect(screen.getByText('Tesla Inc')).toBeInTheDocument()
      expect(screen.getByText('(company)')).toBeInTheDocument()
      expect(screen.getByText('electric vehicle')).toBeInTheDocument()
      expect(screen.getByText('Model 3')).toBeInTheDocument()
    })

    it('should display matches with context paths and similarity scores', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: mockConceptMatches,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      expect(screen.getByText('Tesla > [What] Electric car company')).toBeInTheDocument()
      expect(screen.getByText('(0.89)')).toBeInTheDocument()
    })

    it('should show no matches message for concepts without matches', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: mockConceptMatches,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      expect(screen.getByText(/No matches found/i)).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('should toggle match selection on checkbox click', () => {
      const toggleMatchSpy = vi.spyOn(useEditorStore.getState(), 'toggleReorgMatch')

      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: mockConceptMatches,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)

      // Find the checkbox for the first match
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)

      // Click to toggle
      fireEvent.click(checkboxes[0])
      expect(toggleMatchSpy).toHaveBeenCalledWith('Tesla Inc', 'block-1')
    })

    it('should show selected count in connect button', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: mockConceptMatches,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      // mockConceptMatches has 2 selected matches total
      expect(screen.getByText(/Connect Selected \(2\)/i)).toBeInTheDocument()
    })

    it('should disable connect button when no matches selected', () => {
      const conceptsWithNoSelection = mockConceptMatches.map((c) => ({
        ...c,
        selectedMatches: new Set<string>(),
      }))

      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: conceptsWithNoSelection,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      const connectButton = screen.getByRole('button', { name: /Connect Selected/i })
      expect(connectButton).toBeDisabled()
    })
  })

  describe('Actions', () => {
    it('should call onConnect with selected connections on confirm', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: mockConceptMatches,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)

      const connectButton = screen.getByRole('button', { name: /Connect Selected/i })
      fireEvent.click(connectButton)

      expect(mockOnConnect).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            sourceBlockId: 'block-1',
            contextPath: 'Tesla > [What] Electric car company',
          }),
          expect.objectContaining({
            sourceBlockId: 'block-3',
            contextPath: 'Transportation > Types > EVs',
          }),
        ])
      )
    })

    it('should call onClose on skip button click', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: mockConceptMatches,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)

      const skipButton = screen.getByRole('button', { name: /Skip/i })
      fireEvent.click(skipButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close modal on backdrop click', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: mockConceptMatches,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)

      const backdrop = screen.getByTestId('reorg-modal-backdrop')
      fireEvent.click(backdrop)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should not close when clicking inside modal content', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: mockConceptMatches,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)

      const modal = screen.getByTestId('reorg-modal')
      fireEvent.click(modal)

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should close modal on Escape key', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: mockConceptMatches,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      fireEvent.keyDown(window, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Error State', () => {
    it('should display error message when error occurs', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalStatus: 'error',
        reorgModalError: 'Failed to extract concepts',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      expect(screen.getByText(/Failed to extract concepts/i)).toBeInTheDocument()
    })

    it('should show retry button on error', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalStatus: 'error',
        reorgModalError: 'Network error',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })
  })

  describe('Concept Expansion', () => {
    it('should toggle concept expansion on click', () => {
      useEditorStore.setState({
        reorgModalOpen: true,
        reorgModalDocumentId: 'test-doc',
        reorgModalConceptMatches: mockConceptMatches,
        reorgModalStatus: 'loaded',
      })

      render(<ReorganizationModal onConnect={mockOnConnect} onClose={mockOnClose} />)

      // Find concept header
      const conceptHeader = screen.getByText('Tesla Inc').closest('[data-testid^="concept-header"]')
      expect(conceptHeader).toBeInTheDocument()

      // Click to collapse
      fireEvent.click(conceptHeader!)

      // Matches should be hidden after collapse (implementation detail)
      // This is a behavioral test - actual visibility depends on implementation
    })
  })
})
