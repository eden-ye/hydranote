/**
 * Portal Insertion Tests (EDITOR-3410)
 *
 * Tests for creating portal blocks as siblings below the current bullet.
 * Used by Cmd+S portal search modal when user selects a target.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createPortalAsSibling,
  type DocWithBlocks,
  type BlockWithParent,
} from '../utils/portal-insertion'

describe('createPortalAsSibling', () => {
  let mockDoc: DocWithBlocks

  beforeEach(() => {
    // Reset mock doc before each test
    mockDoc = createMockDoc()
  })

  function createMockDoc(): DocWithBlocks {
    const blocks = new Map<string, BlockWithParent>()
    let addBlockCallIndex = 0

    // Create parent note block
    const parentNote: BlockWithParent = {
      id: 'note-1',
      flavour: 'affine:note',
      children: [],
      parent: null,
    }
    blocks.set('note-1', parentNote)

    // Create bullet blocks as children
    const bulletA: BlockWithParent = {
      id: 'bullet-a',
      flavour: 'hydra:bullet',
      children: [],
      parent: parentNote,
    }
    const bulletB: BlockWithParent = {
      id: 'bullet-b',
      flavour: 'hydra:bullet',
      children: [],
      parent: parentNote,
    }
    const bulletC: BlockWithParent = {
      id: 'bullet-c',
      flavour: 'hydra:bullet',
      children: [],
      parent: parentNote,
    }

    parentNote.children = [bulletA, bulletB, bulletC]
    blocks.set('bullet-a', bulletA)
    blocks.set('bullet-b', bulletB)
    blocks.set('bullet-c', bulletC)

    return {
      getBlock: vi.fn((id: string) => blocks.get(id) || null),
      addBlock: vi.fn((flavour: string, props: Record<string, unknown>, parent: BlockWithParent, insertIndex?: number) => {
        addBlockCallIndex++
        const newId = `portal-${addBlockCallIndex}`
        const newBlock: BlockWithParent = {
          id: newId,
          flavour,
          children: [],
          parent,
          ...props,
        }
        // Insert at the specified index
        if (insertIndex !== undefined && parent.children) {
          parent.children.splice(insertIndex, 0, newBlock)
        } else {
          parent.children?.push(newBlock)
        }
        blocks.set(newId, newBlock)
        return newId
      }),
    }
  }

  it('creates portal as sibling below current bullet', () => {
    // When cursor is at bullet-b, portal should be inserted after bullet-b
    const portalId = createPortalAsSibling(
      mockDoc,
      'bullet-b', // current bullet
      'target-doc-id',
      'target-block-id'
    )

    expect(portalId).toBeDefined()
    expect(mockDoc.addBlock).toHaveBeenCalledWith(
      'hydra:portal',
      {
        sourceDocId: 'target-doc-id',
        sourceBlockId: 'target-block-id',
        isCollapsed: false,
        syncStatus: 'synced',
      },
      expect.anything(), // parent block
      2 // insertIndex = index of bullet-b (1) + 1 = 2
    )
  })

  it('returns the new portal block ID', () => {
    const portalId = createPortalAsSibling(
      mockDoc,
      'bullet-a',
      'doc-123',
      'block-456'
    )

    expect(portalId).toBe('portal-1')
  })

  it('throws error when current bullet is not found', () => {
    expect(() =>
      createPortalAsSibling(
        mockDoc,
        'non-existent-bullet',
        'doc-id',
        'block-id'
      )
    ).toThrow('Cannot find parent for sibling insertion')
  })

  it('throws error when parent is not found', () => {
    // Create a bullet without parent
    const orphanBullet: BlockWithParent = {
      id: 'orphan',
      flavour: 'hydra:bullet',
      children: [],
      parent: null,
    }
    ;(mockDoc.getBlock as ReturnType<typeof vi.fn>).mockImplementation((id: string) => {
      if (id === 'orphan') return orphanBullet
      return null
    })

    expect(() =>
      createPortalAsSibling(mockDoc, 'orphan', 'doc-id', 'block-id')
    ).toThrow('Cannot find parent for sibling insertion')
  })

  it('throws error when current bullet is not in parent children', () => {
    // Create a parent with empty children array
    const emptyParent: BlockWithParent = {
      id: 'empty-parent',
      flavour: 'affine:note',
      children: [],
      parent: null,
    }
    const disconnectedBullet: BlockWithParent = {
      id: 'disconnected',
      flavour: 'hydra:bullet',
      children: [],
      parent: emptyParent, // Has parent but not in children array
    }
    ;(mockDoc.getBlock as ReturnType<typeof vi.fn>).mockImplementation((id: string) => {
      if (id === 'disconnected') return disconnectedBullet
      return null
    })

    expect(() =>
      createPortalAsSibling(mockDoc, 'disconnected', 'doc-id', 'block-id')
    ).toThrow('Current bullet not found in parent children')
  })

  it('inserts at correct position when cursor is at first bullet', () => {
    createPortalAsSibling(mockDoc, 'bullet-a', 'doc-id', 'block-id')

    expect(mockDoc.addBlock).toHaveBeenCalledWith(
      'hydra:portal',
      expect.anything(),
      expect.anything(),
      1 // insertIndex = index of bullet-a (0) + 1 = 1
    )
  })

  it('inserts at correct position when cursor is at last bullet', () => {
    createPortalAsSibling(mockDoc, 'bullet-c', 'doc-id', 'block-id')

    expect(mockDoc.addBlock).toHaveBeenCalledWith(
      'hydra:portal',
      expect.anything(),
      expect.anything(),
      3 // insertIndex = index of bullet-c (2) + 1 = 3
    )
  })
})
