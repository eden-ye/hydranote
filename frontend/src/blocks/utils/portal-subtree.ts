import type { Doc, BlockModel } from '@blocksuite/store'

/**
 * Portal Subtree Utilities (EDITOR-3504)
 *
 * Provides functions for fetching and rendering the subtree of a source block
 * when a portal is expanded. Supports recursive rendering with proper indentation
 * and per-level expand/collapse state.
 */

/**
 * Represents a node in the portal subtree
 */
export interface SubtreeNode {
  /** Block ID */
  id: string
  /** Text content of the block */
  text: string
  /** Child nodes (recursive) */
  children: SubtreeNode[]
  /** Depth level from source root (0 = source block itself) */
  depth: number
  /** Whether this node is expanded (for per-level collapse) */
  isExpanded: boolean
  /** Flavour of the block (for rendering decisions) */
  flavour: string
}

/**
 * Options for fetching subtree
 */
export interface FetchSubtreeOptions {
  /** Maximum depth to fetch (default: 10) */
  maxDepth?: number
  /** Whether to include collapsed children (default: false) */
  includeCollapsed?: boolean
}

/**
 * Result of subtree fetch operation
 */
export interface SubtreeFetchResult {
  /** Root node (the source block) */
  root: SubtreeNode | null
  /** Whether the fetch is still loading */
  isLoading: boolean
  /** Error if fetch failed */
  error: string | null
  /** Total nodes in subtree (for display) */
  totalNodes: number
  /** Whether depth was limited */
  depthLimited: boolean
}

/**
 * Default max depth for subtree fetching
 * Prevents infinite loops and performance issues
 */
export const DEFAULT_MAX_DEPTH = 10

/**
 * Default base indentation in pixels
 */
export const DEFAULT_BASE_INDENT = 20

/**
 * Fetches the subtree for a given source block from a BlockSuite document
 *
 * @param doc - The BlockSuite document
 * @param sourceBlockId - ID of the source block
 * @param options - Fetch options
 * @returns SubtreeFetchResult with the fetched subtree
 */
export function fetchSubtreeFromDoc(
  doc: Doc,
  sourceBlockId: string,
  options: FetchSubtreeOptions = {}
): SubtreeFetchResult {
  const { maxDepth = DEFAULT_MAX_DEPTH, includeCollapsed = false } = options

  const sourceBlock = doc.getBlock(sourceBlockId)

  if (!sourceBlock) {
    return {
      root: null,
      isLoading: false,
      error: 'Source block not found',
      totalNodes: 0,
      depthLimited: false,
    }
  }

  let totalNodes = 0
  let depthLimited = false

  const buildNode = (block: BlockModel, depth: number): SubtreeNode | null => {
    if (depth > maxDepth) {
      depthLimited = true
      return null
    }

    totalNodes++

    // Get text content from block
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = block as any
    const text = model.text?.toString() || ''
    const isExpanded = model.isExpanded !== false // Default to expanded

    const children: SubtreeNode[] = []

    // Only include children if expanded or includeCollapsed is true
    if (isExpanded || includeCollapsed) {
      const blockChildren = block.children || []
      for (const child of blockChildren) {
        const childNode = buildNode(child, depth + 1)
        if (childNode) {
          children.push(childNode)
        }
      }
    }

    return {
      id: block.id,
      text,
      children,
      depth,
      isExpanded,
      flavour: block.flavour,
    }
  }

  const root = buildNode(sourceBlock.model, 0)

  return {
    root,
    isLoading: false,
    error: null,
    totalNodes,
    depthLimited,
  }
}

/**
 * Calculates the indentation in pixels for a given depth level
 *
 * @param depth - The depth level (0 = root)
 * @param baseIndent - Base indentation per level in pixels
 * @returns Indentation in pixels
 */
export function getIndentationPx(
  depth: number,
  baseIndent: number = DEFAULT_BASE_INDENT
): number {
  return depth * baseIndent
}

/**
 * Flattens a subtree into an array for rendering
 * Returns nodes in depth-first order with their depth info
 * Only includes visible nodes (respects expand/collapse state)
 *
 * @param node - The root node to flatten
 * @returns Array of nodes in render order
 */
export function flattenSubtree(node: SubtreeNode | null): SubtreeNode[] {
  if (!node) return []

  const result: SubtreeNode[] = [node]

  // Only include children if this node is expanded
  if (node.isExpanded) {
    for (const child of node.children) {
      result.push(...flattenSubtree(child))
    }
  }

  return result
}

/**
 * Checks if a node has visible children (expanded and has children)
 *
 * @param node - The node to check
 * @returns true if node is expanded and has children
 */
export function hasVisibleChildren(node: SubtreeNode): boolean {
  return node.isExpanded && node.children.length > 0
}

/**
 * Gets the collapse icon for a subtree node
 *
 * @param node - The node to get icon for
 * @returns Icon character for the node
 */
export function getSubtreeNodeIcon(node: SubtreeNode): string {
  if (node.children.length === 0) return '•' // Leaf node
  return node.isExpanded ? '▼' : '▶' // Collapsible node
}

/**
 * Gets CSS class names for a subtree node based on its state
 *
 * @param node - The node to get classes for
 * @returns Array of CSS class names
 */
export function getSubtreeNodeClasses(node: SubtreeNode): string[] {
  const classes = ['portal-subtree-node']

  if (node.depth === 0) {
    classes.push('portal-subtree-root')
  }

  if (node.children.length > 0) {
    classes.push('portal-subtree-parent')
  } else {
    classes.push('portal-subtree-leaf')
  }

  if (!node.isExpanded && node.children.length > 0) {
    classes.push('portal-subtree-collapsed')
  }

  return classes
}

/**
 * Counts the total visible nodes in a subtree
 * Only counts expanded descendants
 *
 * @param node - The root node
 * @returns Number of visible nodes
 */
export function countVisibleNodes(node: SubtreeNode | null): number {
  if (!node) return 0

  let count = 1 // Count this node

  if (node.isExpanded) {
    for (const child of node.children) {
      count += countVisibleNodes(child)
    }
  }

  return count
}

/**
 * Find a node by ID in the subtree
 *
 * @param root - The root node to search from
 * @param nodeId - The ID to find
 * @returns The found node or null
 */
export function findNodeById(
  root: SubtreeNode | null,
  nodeId: string
): SubtreeNode | null {
  if (!root) return null
  if (root.id === nodeId) return root

  for (const child of root.children) {
    const found = findNodeById(child, nodeId)
    if (found) return found
  }

  return null
}
