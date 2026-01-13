/**
 * Portal Creation from Suggestions (EDITOR-3503)
 *
 * Creates portal blocks from user-selected suggestions in the reorganization modal.
 * Portals are added as siblings at the end of the current document root.
 */

export interface PortalConnection {
  sourceDocId: string
  sourceBlockId: string
  contextPath: string // For display/logging
}

export interface BlockWithParent {
  id: string
  flavour: string
  children: BlockWithParent[]
  parent: BlockWithParent | null
}

export interface DocWithBlocks {
  getBlockByFlavour: (flavour: string) => BlockWithParent[]
  addBlock: (
    flavour: string,
    props: Record<string, unknown>,
    parentId: string
  ) => string
}

export interface CreatePortalsResult {
  count: number
  errors: Error[]
}

/**
 * Create portal blocks from user-selected suggestions.
 * Portals are added as children of the note block (document root).
 *
 * @param doc - The BlockSuite document
 * @param connections - Array of selected connections from reorganization modal
 * @returns Result with count of created portals and any errors
 * @throws Error if note block is not found
 */
export function createPortalsFromSuggestions(
  doc: DocWithBlocks,
  connections: PortalConnection[]
): CreatePortalsResult {
  const noteBlocks = doc.getBlockByFlavour('affine:note')

  if (noteBlocks.length === 0) {
    throw new Error('No note block found in document')
  }

  const noteBlock = noteBlocks[0]
  const result: CreatePortalsResult = {
    count: 0,
    errors: [],
  }

  for (const connection of connections) {
    try {
      doc.addBlock(
        'hydra:portal',
        {
          sourceDocId: connection.sourceDocId,
          sourceBlockId: connection.sourceBlockId,
          isCollapsed: false,
          syncStatus: 'synced',
        },
        noteBlock.id
      )
      result.count++
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  return result
}
