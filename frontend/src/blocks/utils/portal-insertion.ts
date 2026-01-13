/**
 * Portal Insertion Utilities (EDITOR-3410)
 *
 * Creates portal blocks as siblings below the current bullet.
 * Used by Cmd+S portal search modal when user selects a target.
 */

/**
 * Block with parent reference for tree traversal
 */
export interface BlockWithParent {
  id: string
  flavour: string
  children?: BlockWithParent[]
  parent: BlockWithParent | null
}

/**
 * Minimal document interface for portal insertion
 */
export interface DocWithBlocks {
  getBlock: (id: string) => BlockWithParent | null
  addBlock: (
    flavour: string,
    props: Record<string, unknown>,
    parent: BlockWithParent,
    insertIndex?: number
  ) => string
}

/**
 * Create portal as new sibling BELOW current bullet
 * Used by Cmd+S modal when user selects a result
 *
 * @param doc - The BlockSuite document
 * @param currentBulletId - ID of the bullet where cursor is positioned
 * @param targetDocId - Document ID of the portal target
 * @param targetBlockId - Block ID of the portal target
 * @returns The new portal block ID
 * @throws Error if current bullet or parent cannot be found
 */
export function createPortalAsSibling(
  doc: DocWithBlocks,
  currentBulletId: string,
  targetDocId: string,
  targetBlockId: string
): string {
  const currentBullet = doc.getBlock(currentBulletId)
  const parent = currentBullet?.parent

  if (!parent) {
    throw new Error('Cannot find parent for sibling insertion')
  }

  // Find index of current bullet in parent's children
  const siblings = parent.children || []
  const currentIndex = siblings.findIndex((c) => c.id === currentBulletId)

  if (currentIndex === -1) {
    throw new Error('Current bullet not found in parent children')
  }

  // Insert after current bullet
  const insertIndex = currentIndex + 1

  const portalId = doc.addBlock(
    'hydra:portal',
    {
      sourceDocId: targetDocId,
      sourceBlockId: targetBlockId,
      isCollapsed: false,
      syncStatus: 'synced',
    },
    parent,
    insertIndex
  )

  return portalId
}
