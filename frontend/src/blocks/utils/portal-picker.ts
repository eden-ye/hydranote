/**
 * Portal Picker Utilities (EDITOR-3405)
 *
 * Provides filtering and bullet extraction for portal picker UI.
 * Used when user triggers portal creation via /portal or Cmd+Shift+P.
 */

/**
 * Represents a bullet item in the picker
 */
export interface BulletItem {
  /** Block ID */
  id: string
  /** Bullet text content */
  text: string
  /** Nesting level (0 = top-level, 1 = child, etc.) */
  level: number
}

/**
 * Filter bullets by search query
 *
 * @param bullets - The list of bullets to filter
 * @param query - The search query
 * @returns Filtered list of bullets
 */
export function filterBullets(bullets: BulletItem[], query: string): BulletItem[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (normalizedQuery === '') {
    return bullets
  }

  return bullets.filter((bullet) =>
    bullet.text.toLowerCase().includes(normalizedQuery)
  )
}

/**
 * Minimal block interface for extraction
 */
export interface BlockWithChildren {
  id: string
  flavour: string
  text?: { toString?: () => string } | null
  children?: BlockWithChildren[]
}

/**
 * Minimal document interface
 */
export interface DocumentWithRoot {
  root?: {
    children?: BlockWithChildren[]
  } | null
}

/**
 * Extract bullets from a BlockSuite document
 *
 * @param doc - The BlockSuite document
 * @returns List of bullets with their nesting levels
 */
export function extractBulletsFromDoc(doc: DocumentWithRoot): BulletItem[] {
  const bullets: BulletItem[] = []

  function traverseBlocks(blocks: BlockWithChildren[], level: number = 0): void {
    for (const block of blocks) {
      // Only include hydra:bullet blocks
      if (block.flavour === 'hydra:bullet') {
        const text = block.text?.toString?.() || ''
        bullets.push({
          id: block.id,
          text,
          level,
        })

        // Recursively traverse children
        if (block.children && block.children.length > 0) {
          traverseBlocks(block.children, level + 1)
        }
      } else if (block.children && block.children.length > 0) {
        // For non-bullet blocks (like page), continue traversing without incrementing level
        traverseBlocks(block.children, level)
      }
    }
  }

  // Start traversal from root
  if (doc.root && doc.root.children) {
    traverseBlocks(doc.root.children)
  }

  return bullets
}
