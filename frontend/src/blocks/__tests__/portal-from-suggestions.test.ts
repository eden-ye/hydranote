/**
 * Portal Creation from Suggestions Tests (EDITOR-3503)
 *
 * Tests for creating portal blocks from user-selected suggestions
 * in the reorganization modal (Cmd+Shift+L).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createPortalsFromSuggestions,
  type PortalConnection,
  type DocWithBlocks,
  type BlockWithParent,
} from '../utils/portal-from-suggestions'

describe('createPortalsFromSuggestions (EDITOR-3503)', () => {
  let mockDoc: DocWithBlocks
  let mockNoteBlock: BlockWithParent
  let addBlockSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    addBlockSpy = vi.fn((_flavour: string, _props: Record<string, unknown>, parent: BlockWithParent | string) => {
      const parentId = typeof parent === 'string' ? parent : parent.id
      return `portal-${parentId}-${Date.now()}`
    })

    // Create mock note block
    mockNoteBlock = {
      id: 'note-1',
      flavour: 'affine:note',
      children: [],
      parent: null,
    }

    // Create mock bullets
    const bullet1: BlockWithParent = {
      id: 'bullet-1',
      flavour: 'hydra:bullet',
      children: [],
      parent: mockNoteBlock,
    }
    const bullet2: BlockWithParent = {
      id: 'bullet-2',
      flavour: 'hydra:bullet',
      children: [],
      parent: mockNoteBlock,
    }
    mockNoteBlock.children = [bullet1, bullet2]

    mockDoc = {
      getBlockByFlavour: vi.fn((flavour: string) => {
        if (flavour === 'affine:note') return [mockNoteBlock]
        return []
      }),
      addBlock: addBlockSpy as DocWithBlocks['addBlock'],
    }
  })

  describe('Portal Creation', () => {
    it('should create portal for each selected connection', () => {
      const connections: PortalConnection[] = [
        {
          sourceDocId: 'doc-1',
          sourceBlockId: 'block-1',
          contextPath: 'Tesla > [What] Electric car company',
        },
        {
          sourceDocId: 'doc-2',
          sourceBlockId: 'block-2',
          contextPath: 'Transportation > Types > EVs',
        },
      ]

      createPortalsFromSuggestions(mockDoc, connections)

      expect(addBlockSpy).toHaveBeenCalledTimes(2)
    })

    it('should create portal with correct props', () => {
      const connections: PortalConnection[] = [
        {
          sourceDocId: 'doc-123',
          sourceBlockId: 'block-456',
          contextPath: 'Test > Path',
        },
      ]

      createPortalsFromSuggestions(mockDoc, connections)

      expect(addBlockSpy).toHaveBeenCalledWith(
        'hydra:portal',
        {
          sourceDocId: 'doc-123',
          sourceBlockId: 'block-456',
          isCollapsed: false,
          syncStatus: 'synced',
        },
        'note-1' // Parent ID (note block)
      )
    })

    it('should add portals as children of note block (document root)', () => {
      const connections: PortalConnection[] = [
        {
          sourceDocId: 'doc-1',
          sourceBlockId: 'block-1',
          contextPath: 'Path 1',
        },
      ]

      createPortalsFromSuggestions(mockDoc, connections)

      // Verify portal is added to note block (document root)
      expect(addBlockSpy).toHaveBeenCalledWith(
        'hydra:portal',
        expect.any(Object),
        'note-1'
      )
    })

    it('should handle empty connections array', () => {
      const connections: PortalConnection[] = []

      const result = createPortalsFromSuggestions(mockDoc, connections)

      expect(addBlockSpy).not.toHaveBeenCalled()
      expect(result.count).toBe(0)
    })

    it('should return count of created portals', () => {
      const connections: PortalConnection[] = [
        { sourceDocId: 'doc-1', sourceBlockId: 'block-1', contextPath: 'Path 1' },
        { sourceDocId: 'doc-2', sourceBlockId: 'block-2', contextPath: 'Path 2' },
        { sourceDocId: 'doc-3', sourceBlockId: 'block-3', contextPath: 'Path 3' },
      ]

      const result = createPortalsFromSuggestions(mockDoc, connections)

      expect(result.count).toBe(3)
    })
  })

  describe('Error Handling', () => {
    it('should throw error when note block not found', () => {
      mockDoc.getBlockByFlavour = vi.fn(() => [])

      const connections: PortalConnection[] = [
        { sourceDocId: 'doc-1', sourceBlockId: 'block-1', contextPath: 'Path 1' },
      ]

      expect(() => createPortalsFromSuggestions(mockDoc, connections)).toThrow(
        'No note block found in document'
      )
    })

    it('should continue creating other portals if one fails', () => {
      let callCount = 0
      addBlockSpy = vi.fn(() => {
        callCount++
        if (callCount === 2) {
          throw new Error('Block creation failed')
        }
        return `portal-${callCount}`
      })
      mockDoc.addBlock = addBlockSpy as DocWithBlocks['addBlock']

      const connections: PortalConnection[] = [
        { sourceDocId: 'doc-1', sourceBlockId: 'block-1', contextPath: 'Path 1' },
        { sourceDocId: 'doc-2', sourceBlockId: 'block-2', contextPath: 'Path 2' },
        { sourceDocId: 'doc-3', sourceBlockId: 'block-3', contextPath: 'Path 3' },
      ]

      const result = createPortalsFromSuggestions(mockDoc, connections)

      expect(addBlockSpy).toHaveBeenCalledTimes(3)
      expect(result.count).toBe(2) // Only 2 succeeded
      expect(result.errors).toHaveLength(1) // 1 error
    })
  })

  describe('Constraints', () => {
    it('should never modify source documents (portals only created in current doc)', () => {
      const connections: PortalConnection[] = [
        { sourceDocId: 'other-doc', sourceBlockId: 'other-block', contextPath: 'Path' },
      ]

      createPortalsFromSuggestions(mockDoc, connections)

      // Verify we only add to our doc, never to source docs
      expect(addBlockSpy).toHaveBeenCalledWith(
        'hydra:portal',
        expect.any(Object),
        'note-1' // Always our note block
      )
      // The sourceDocId is in props, not used for modifying that doc
      expect(addBlockSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ sourceDocId: 'other-doc' }),
        expect.any(String)
      )
    })
  })
})
