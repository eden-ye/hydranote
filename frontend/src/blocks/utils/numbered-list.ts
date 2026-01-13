/**
 * EDITOR-3510: Numbered list utilities
 *
 * Computes list numbers based on sibling positions for numbered list blocks.
 */

import type { BlockType } from './markdown-shortcuts'

/**
 * Sibling block info for list number computation
 */
export interface SiblingBlockInfo {
  blockType: BlockType | string
}

/**
 * Context for computing list number
 */
export interface ListNumberContext {
  /** Index of current block among siblings (0-based) */
  siblingIndex: number
  /** Previous sibling blocks in order */
  previousSiblings: SiblingBlockInfo[]
}

/**
 * Compute the list number for a numbered list item
 *
 * Counts consecutive numbered items before the current position.
 * Resets count when a non-numbered block breaks the sequence.
 *
 * @param context - Context with sibling information
 * @returns The list number (1-based)
 */
export function computeListNumber(context: ListNumberContext): number {
  const { previousSiblings } = context

  if (previousSiblings.length === 0) {
    return 1
  }

  // Count consecutive numbered items from the end (most recent)
  let consecutiveCount = 0
  for (let i = previousSiblings.length - 1; i >= 0; i--) {
    if (previousSiblings[i].blockType === 'numbered') {
      consecutiveCount++
    } else {
      // Non-numbered block breaks the sequence
      break
    }
  }

  return consecutiveCount + 1
}

/**
 * Get all numbered siblings in a list sequence
 *
 * @param siblings - All sibling blocks
 * @param currentIndex - Index of current block
 * @returns Array of block info for consecutive numbered items
 */
export function getNumberedSequence(
  siblings: SiblingBlockInfo[],
  currentIndex: number
): SiblingBlockInfo[] {
  const sequence: SiblingBlockInfo[] = []

  // Look backwards from current index
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (siblings[i].blockType === 'numbered') {
      sequence.unshift(siblings[i])
    } else {
      break
    }
  }

  return sequence
}
