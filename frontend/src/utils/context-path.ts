/**
 * Context Path Generation (EDITOR-3409)
 *
 * Generate context path for display in search results
 * Format: "Leetcode / Binary Search / *Combination Without Duplicates"
 *
 * Features:
 * - Shows up to 3 ancestor levels
 * - Truncates middle with "..." if needed
 * - Marks current bullet with *
 */

export interface BlockNode {
  id: string
  flavour: string
  text: string
  parent: BlockNode | null
}

/**
 * Get text content from a block
 */
export function getBlockText(block: BlockNode): string {
  if (block.flavour === 'hydra:bullet') {
    return block.text || ''
  }
  return ''
}

/**
 * Truncate path parts with "..." for long paths
 * - Always truncates if more than 3 parts (regardless of length)
 * - Also truncates if total length exceeds maxLength
 */
export function truncateMiddle(parts: string[], maxLength: number = 60): string {
  if (parts.length === 0) return ''

  // Always truncate middle if more than 3 parts
  if (parts.length > 3) {
    return `${parts[0]} / ... / ${parts[parts.length - 1]}`
  }

  const joined = parts.join(' / ')

  // Truncate by length if needed
  if (joined.length > maxLength) {
    return joined.slice(0, maxLength - 3) + '...'
  }

  return joined
}

/**
 * Generate context path for a block
 *
 * @param block - The block to generate path for
 * @param maxLength - Maximum length before truncation (default 60)
 * @returns Context path string like "Parent / *Current"
 */
export function generateContextPath(
  block: BlockNode,
  maxLength: number = 60
): string {
  // Collect ancestors (only bullet blocks)
  const ancestors: string[] = []
  let current = block.parent

  while (current !== null) {
    // Skip non-bullet ancestors (like page blocks)
    if (current.flavour === 'hydra:bullet') {
      const text = getBlockText(current)
      if (text) {
        ancestors.unshift(text)
      }
    }
    current = current.parent
  }

  // Add current block with * marker
  const currentText = getBlockText(block)
  const parts = [...ancestors, `*${currentText}`]

  // Truncate if too long
  return truncateMiddle(parts, maxLength)
}
