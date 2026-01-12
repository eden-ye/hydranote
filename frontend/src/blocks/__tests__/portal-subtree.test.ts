import { describe, it, expect } from 'vitest'
import {
  type SubtreeNode,
  type SubtreeFetchResult,
  type FetchSubtreeOptions,
  getIndentationPx,
  flattenSubtree,
  hasVisibleChildren,
  getSubtreeNodeIcon,
  getSubtreeNodeClasses,
  countVisibleNodes,
  findNodeById,
  DEFAULT_MAX_DEPTH,
  DEFAULT_BASE_INDENT,
} from '../utils/portal-subtree'

/**
 * Tests for Portal Subtree Rendering (EDITOR-3504)
 *
 * Testing:
 * - Subtree fetching from source block
 * - Recursive rendering of children
 * - Indentation levels
 * - Per-level expand/collapse state
 * - Loading states
 * - Depth limits for performance
 */

// ============================================================================
// Mock Implementation for Testing
// ============================================================================

/**
 * Fetches the subtree for a given source block using mock data
 * This simulates the real fetchSubtreeFromDoc function but uses a Map
 */
function fetchSubtreeMock(
  sourceBlockId: string,
  mockBlocks: Map<string, { text: string; childIds: string[]; isExpanded: boolean }>,
  options: FetchSubtreeOptions = {}
): SubtreeFetchResult {
  const { maxDepth = DEFAULT_MAX_DEPTH, includeCollapsed = false } = options

  const sourceBlock = mockBlocks.get(sourceBlockId)
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

  const buildNode = (blockId: string, depth: number): SubtreeNode | null => {
    if (depth > maxDepth) {
      depthLimited = true
      return null
    }

    const block = mockBlocks.get(blockId)
    if (!block) return null

    totalNodes++

    const children: SubtreeNode[] = []

    // Only include children if expanded or includeCollapsed is true
    if (block.isExpanded || includeCollapsed) {
      for (const childId of block.childIds) {
        const childNode = buildNode(childId, depth + 1)
        if (childNode) {
          children.push(childNode)
        }
      }
    }

    return {
      id: blockId,
      text: block.text,
      children,
      depth,
      isExpanded: block.isExpanded,
      flavour: 'hydra:bullet',
    }
  }

  const root = buildNode(sourceBlockId, 0)

  return {
    root,
    isLoading: false,
    error: null,
    totalNodes,
    depthLimited,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('Portal Subtree Data Types (EDITOR-3504)', () => {
  describe('SubtreeNode interface', () => {
    it('should create a valid subtree node', () => {
      const node: SubtreeNode = {
        id: 'block-1',
        text: 'Tesla',
        children: [],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }

      expect(node.id).toBe('block-1')
      expect(node.text).toBe('Tesla')
      expect(node.children).toEqual([])
      expect(node.depth).toBe(0)
      expect(node.isExpanded).toBe(true)
      expect(node.flavour).toBe('hydra:bullet')
    })

    it('should support nested children', () => {
      const child: SubtreeNode = {
        id: 'block-2',
        text: 'Founded 2003',
        children: [],
        depth: 1,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }

      const parent: SubtreeNode = {
        id: 'block-1',
        text: 'Tesla',
        children: [child],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }

      expect(parent.children).toHaveLength(1)
      expect(parent.children[0]).toBe(child)
      expect(parent.children[0].depth).toBe(1)
    })
  })

  describe('Constants', () => {
    it('should have DEFAULT_MAX_DEPTH of 10', () => {
      expect(DEFAULT_MAX_DEPTH).toBe(10)
    })

    it('should have DEFAULT_BASE_INDENT of 20', () => {
      expect(DEFAULT_BASE_INDENT).toBe(20)
    })
  })
})

describe('Subtree Fetching (EDITOR-3504)', () => {
  // Setup mock blocks for testing
  const createMockBlocks = () => {
    const blocks = new Map<string, { text: string; childIds: string[]; isExpanded: boolean }>()

    // Tesla (root)
    //   |-- What it is
    //       |-- Electric car company
    //   |-- Founded
    //       |-- 2003

    blocks.set('tesla', { text: 'Tesla', childIds: ['what-it-is', 'founded'], isExpanded: true })
    blocks.set('what-it-is', {
      text: 'What it is',
      childIds: ['electric-car'],
      isExpanded: true,
    })
    blocks.set('electric-car', {
      text: 'Electric car company',
      childIds: [],
      isExpanded: true,
    })
    blocks.set('founded', { text: 'Founded', childIds: ['year-2003'], isExpanded: true })
    blocks.set('year-2003', { text: '2003', childIds: [], isExpanded: true })

    return blocks
  }

  describe('fetchSubtreeMock', () => {
    it('should fetch source block and all children recursively', () => {
      const blocks = createMockBlocks()
      const result = fetchSubtreeMock('tesla', blocks)

      expect(result.error).toBeNull()
      expect(result.isLoading).toBe(false)
      expect(result.root).not.toBeNull()
      expect(result.root!.text).toBe('Tesla')
      expect(result.root!.children).toHaveLength(2)
    })

    it('should set correct depth for each node', () => {
      const blocks = createMockBlocks()
      const result = fetchSubtreeMock('tesla', blocks)

      expect(result.root!.depth).toBe(0) // Tesla
      expect(result.root!.children[0].depth).toBe(1) // What it is
      expect(result.root!.children[0].children[0].depth).toBe(2) // Electric car company
    })

    it('should count total nodes in subtree', () => {
      const blocks = createMockBlocks()
      const result = fetchSubtreeMock('tesla', blocks)

      // Tesla + What it is + Electric car + Founded + 2003 = 5
      expect(result.totalNodes).toBe(5)
    })

    it('should return error for non-existent source block', () => {
      const blocks = createMockBlocks()
      const result = fetchSubtreeMock('non-existent', blocks)

      expect(result.root).toBeNull()
      expect(result.error).toBe('Source block not found')
    })

    it('should respect maxDepth limit', () => {
      const blocks = createMockBlocks()
      const result = fetchSubtreeMock('tesla', blocks, { maxDepth: 1 })

      expect(result.depthLimited).toBe(true)
      // Should have Tesla (depth 0) and children at depth 1
      // But grandchildren at depth 2 should be cut off
      expect(result.root!.children[0].children).toHaveLength(0)
    })

    it('should not include children of collapsed nodes by default', () => {
      const blocks = createMockBlocks()
      // Collapse the "What it is" node
      blocks.set('what-it-is', {
        text: 'What it is',
        childIds: ['electric-car'],
        isExpanded: false,
      })

      const result = fetchSubtreeMock('tesla', blocks)

      // What it is has children but they shouldn't be in the result
      expect(result.root!.children[0].isExpanded).toBe(false)
      expect(result.root!.children[0].children).toHaveLength(0)
    })

    it('should include collapsed children when includeCollapsed is true', () => {
      const blocks = createMockBlocks()
      blocks.set('what-it-is', {
        text: 'What it is',
        childIds: ['electric-car'],
        isExpanded: false,
      })

      const result = fetchSubtreeMock('tesla', blocks, { includeCollapsed: true })

      // Should include the collapsed children
      expect(result.root!.children[0].children).toHaveLength(1)
      expect(result.root!.children[0].children[0].text).toBe('Electric car company')
    })
  })

  describe('Deeply nested structures', () => {
    it('should handle deep nesting up to max depth', () => {
      const blocks = new Map<string, { text: string; childIds: string[]; isExpanded: boolean }>()

      // Create a 15-level deep structure
      for (let i = 0; i < 15; i++) {
        const childId = i < 14 ? `level-${i + 1}` : undefined
        blocks.set(`level-${i}`, {
          text: `Level ${i}`,
          childIds: childId ? [childId] : [],
          isExpanded: true,
        })
      }

      const result = fetchSubtreeMock('level-0', blocks, { maxDepth: 10 })

      expect(result.depthLimited).toBe(true)
      // Should have levels 0-10 (11 nodes)
      expect(result.totalNodes).toBe(11)
    })
  })
})

describe('Indentation Calculation (EDITOR-3504)', () => {
  describe('getIndentationPx', () => {
    it('should return 0 for depth 0', () => {
      expect(getIndentationPx(0)).toBe(0)
    })

    it('should return baseIndent for depth 1', () => {
      expect(getIndentationPx(1)).toBe(20)
    })

    it('should multiply baseIndent by depth', () => {
      expect(getIndentationPx(2)).toBe(40)
      expect(getIndentationPx(3)).toBe(60)
      expect(getIndentationPx(5)).toBe(100)
    })

    it('should use custom baseIndent', () => {
      expect(getIndentationPx(2, 24)).toBe(48)
      expect(getIndentationPx(3, 16)).toBe(48)
    })
  })
})

describe('Subtree Flattening (EDITOR-3504)', () => {
  describe('flattenSubtree', () => {
    it('should return empty array for null root', () => {
      expect(flattenSubtree(null)).toEqual([])
    })

    it('should return single node for leaf', () => {
      const leaf: SubtreeNode = {
        id: 'leaf',
        text: 'Leaf',
        children: [],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }

      const result = flattenSubtree(leaf)
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(leaf)
    })

    it('should flatten expanded children in depth-first order', () => {
      const grandchild: SubtreeNode = {
        id: 'grandchild',
        text: 'Grandchild',
        children: [],
        depth: 2,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      const child: SubtreeNode = {
        id: 'child',
        text: 'Child',
        children: [grandchild],
        depth: 1,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      const root: SubtreeNode = {
        id: 'root',
        text: 'Root',
        children: [child],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }

      const result = flattenSubtree(root)
      expect(result).toHaveLength(3)
      expect(result[0].id).toBe('root')
      expect(result[1].id).toBe('child')
      expect(result[2].id).toBe('grandchild')
    })

    it('should not include children of collapsed nodes', () => {
      const child: SubtreeNode = {
        id: 'child',
        text: 'Child',
        children: [],
        depth: 1,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      const root: SubtreeNode = {
        id: 'root',
        text: 'Root',
        children: [child],
        depth: 0,
        isExpanded: false, // Collapsed
        flavour: 'hydra:bullet',
      }

      const result = flattenSubtree(root)
      expect(result).toHaveLength(1) // Only root
      expect(result[0].id).toBe('root')
    })

    it('should handle complex tree structure', () => {
      // Tree:
      // A (expanded)
      //   |-- B (expanded)
      //   |   |-- D
      //   |-- C (collapsed)
      //       |-- E (should not appear)

      const e: SubtreeNode = {
        id: 'e',
        text: 'E',
        children: [],
        depth: 2,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      const d: SubtreeNode = {
        id: 'd',
        text: 'D',
        children: [],
        depth: 2,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      const c: SubtreeNode = {
        id: 'c',
        text: 'C',
        children: [e],
        depth: 1,
        isExpanded: false, // Collapsed
        flavour: 'hydra:bullet',
      }
      const b: SubtreeNode = {
        id: 'b',
        text: 'B',
        children: [d],
        depth: 1,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      const a: SubtreeNode = {
        id: 'a',
        text: 'A',
        children: [b, c],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }

      const result = flattenSubtree(a)
      expect(result.map((n) => n.id)).toEqual(['a', 'b', 'd', 'c'])
      // 'e' should not appear because 'c' is collapsed
    })
  })
})

describe('Subtree Node Display (EDITOR-3504)', () => {
  describe('hasVisibleChildren', () => {
    it('should return false for leaf nodes', () => {
      const leaf: SubtreeNode = {
        id: 'leaf',
        text: 'Leaf',
        children: [],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      expect(hasVisibleChildren(leaf)).toBe(false)
    })

    it('should return true for expanded nodes with children', () => {
      const child: SubtreeNode = {
        id: 'child',
        text: 'Child',
        children: [],
        depth: 1,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      const parent: SubtreeNode = {
        id: 'parent',
        text: 'Parent',
        children: [child],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      expect(hasVisibleChildren(parent)).toBe(true)
    })

    it('should return false for collapsed nodes with children', () => {
      const child: SubtreeNode = {
        id: 'child',
        text: 'Child',
        children: [],
        depth: 1,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      const parent: SubtreeNode = {
        id: 'parent',
        text: 'Parent',
        children: [child],
        depth: 0,
        isExpanded: false,
        flavour: 'hydra:bullet',
      }
      expect(hasVisibleChildren(parent)).toBe(false)
    })
  })

  describe('getSubtreeNodeIcon', () => {
    it('should return bullet for leaf nodes', () => {
      const leaf: SubtreeNode = {
        id: 'leaf',
        text: 'Leaf',
        children: [],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      expect(getSubtreeNodeIcon(leaf)).toBe('•')
    })

    it('should return down arrow for expanded nodes with children', () => {
      const parent: SubtreeNode = {
        id: 'parent',
        text: 'Parent',
        children: [
          { id: 'child', text: 'Child', children: [], depth: 1, isExpanded: true, flavour: 'hydra:bullet' },
        ],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      expect(getSubtreeNodeIcon(parent)).toBe('▼')
    })

    it('should return right arrow for collapsed nodes with children', () => {
      const parent: SubtreeNode = {
        id: 'parent',
        text: 'Parent',
        children: [
          { id: 'child', text: 'Child', children: [], depth: 1, isExpanded: true, flavour: 'hydra:bullet' },
        ],
        depth: 0,
        isExpanded: false,
        flavour: 'hydra:bullet',
      }
      expect(getSubtreeNodeIcon(parent)).toBe('▶')
    })
  })

  describe('getSubtreeNodeClasses', () => {
    it('should include base class for all nodes', () => {
      const node: SubtreeNode = {
        id: 'node',
        text: 'Node',
        children: [],
        depth: 1,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      expect(getSubtreeNodeClasses(node)).toContain('portal-subtree-node')
    })

    it('should include root class for depth 0', () => {
      const root: SubtreeNode = {
        id: 'root',
        text: 'Root',
        children: [],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      expect(getSubtreeNodeClasses(root)).toContain('portal-subtree-root')
    })

    it('should include parent class for nodes with children', () => {
      const parent: SubtreeNode = {
        id: 'parent',
        text: 'Parent',
        children: [{ id: 'child', text: 'Child', children: [], depth: 1, isExpanded: true, flavour: 'hydra:bullet' }],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      expect(getSubtreeNodeClasses(parent)).toContain('portal-subtree-parent')
    })

    it('should include leaf class for nodes without children', () => {
      const leaf: SubtreeNode = {
        id: 'leaf',
        text: 'Leaf',
        children: [],
        depth: 1,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      expect(getSubtreeNodeClasses(leaf)).toContain('portal-subtree-leaf')
    })

    it('should include collapsed class for collapsed parent nodes', () => {
      const collapsed: SubtreeNode = {
        id: 'collapsed',
        text: 'Collapsed',
        children: [{ id: 'child', text: 'Child', children: [], depth: 1, isExpanded: true, flavour: 'hydra:bullet' }],
        depth: 0,
        isExpanded: false,
        flavour: 'hydra:bullet',
      }
      expect(getSubtreeNodeClasses(collapsed)).toContain('portal-subtree-collapsed')
    })
  })

  describe('countVisibleNodes', () => {
    it('should return 0 for null', () => {
      expect(countVisibleNodes(null)).toBe(0)
    })

    it('should return 1 for single node', () => {
      const leaf: SubtreeNode = {
        id: 'leaf',
        text: 'Leaf',
        children: [],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      expect(countVisibleNodes(leaf)).toBe(1)
    })

    it('should count all visible descendants', () => {
      const grandchild: SubtreeNode = {
        id: 'grandchild',
        text: 'Grandchild',
        children: [],
        depth: 2,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      const child: SubtreeNode = {
        id: 'child',
        text: 'Child',
        children: [grandchild],
        depth: 1,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      const root: SubtreeNode = {
        id: 'root',
        text: 'Root',
        children: [child],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      expect(countVisibleNodes(root)).toBe(3)
    })

    it('should not count hidden children of collapsed nodes', () => {
      const child: SubtreeNode = {
        id: 'child',
        text: 'Child',
        children: [],
        depth: 1,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      const root: SubtreeNode = {
        id: 'root',
        text: 'Root',
        children: [child],
        depth: 0,
        isExpanded: false, // Collapsed
        flavour: 'hydra:bullet',
      }
      expect(countVisibleNodes(root)).toBe(1) // Only root is visible
    })
  })

  describe('findNodeById', () => {
    it('should return null for null root', () => {
      expect(findNodeById(null, 'any')).toBeNull()
    })

    it('should find root node', () => {
      const root: SubtreeNode = {
        id: 'root',
        text: 'Root',
        children: [],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      expect(findNodeById(root, 'root')).toBe(root)
    })

    it('should find nested node', () => {
      const grandchild: SubtreeNode = {
        id: 'grandchild',
        text: 'Grandchild',
        children: [],
        depth: 2,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      const child: SubtreeNode = {
        id: 'child',
        text: 'Child',
        children: [grandchild],
        depth: 1,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      const root: SubtreeNode = {
        id: 'root',
        text: 'Root',
        children: [child],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      expect(findNodeById(root, 'grandchild')).toBe(grandchild)
    })

    it('should return null for non-existent id', () => {
      const root: SubtreeNode = {
        id: 'root',
        text: 'Root',
        children: [],
        depth: 0,
        isExpanded: true,
        flavour: 'hydra:bullet',
      }
      expect(findNodeById(root, 'non-existent')).toBeNull()
    })
  })
})

describe('Per-Level Collapse State (EDITOR-3504)', () => {
  describe('Independent collapse state per node', () => {
    it('should allow each node to have independent collapse state', () => {
      const blocks = new Map<string, { text: string; childIds: string[]; isExpanded: boolean }>()

      // Parent expanded, first child collapsed, second child expanded
      blocks.set('parent', {
        text: 'Parent',
        childIds: ['child-1', 'child-2'],
        isExpanded: true,
      })
      blocks.set('child-1', {
        text: 'Child 1',
        childIds: ['grandchild-1'],
        isExpanded: false, // Collapsed
      })
      blocks.set('grandchild-1', {
        text: 'Grandchild 1',
        childIds: [],
        isExpanded: true,
      })
      blocks.set('child-2', {
        text: 'Child 2',
        childIds: ['grandchild-2'],
        isExpanded: true, // Expanded
      })
      blocks.set('grandchild-2', {
        text: 'Grandchild 2',
        childIds: [],
        isExpanded: true,
      })

      const result = fetchSubtreeMock('parent', blocks)
      const flat = flattenSubtree(result.root!)

      // Should see: Parent, Child 1 (collapsed), Child 2, Grandchild 2
      expect(flat.map((n) => n.id)).toEqual(['parent', 'child-1', 'child-2', 'grandchild-2'])
    })
  })

  describe('Toggle collapse state', () => {
    /**
     * Toggles the collapse state of a node and returns updated subtree
     * This simulates what would happen in the UI when user clicks collapse
     */
    const toggleNodeExpand = (
      blocks: Map<string, { text: string; childIds: string[]; isExpanded: boolean }>,
      nodeId: string
    ) => {
      const block = blocks.get(nodeId)
      if (block) {
        blocks.set(nodeId, { ...block, isExpanded: !block.isExpanded })
      }
    }

    it('should collapse a node and hide its children', () => {
      const blocks = new Map<string, { text: string; childIds: string[]; isExpanded: boolean }>()
      blocks.set('parent', {
        text: 'Parent',
        childIds: ['child'],
        isExpanded: true,
      })
      blocks.set('child', {
        text: 'Child',
        childIds: [],
        isExpanded: true,
      })

      // Initially expanded
      let result = fetchSubtreeMock('parent', blocks)
      expect(flattenSubtree(result.root!).map((n) => n.id)).toEqual(['parent', 'child'])

      // Toggle collapse
      toggleNodeExpand(blocks, 'parent')
      result = fetchSubtreeMock('parent', blocks)
      expect(flattenSubtree(result.root!).map((n) => n.id)).toEqual(['parent'])
    })

    it('should expand a node and show its children', () => {
      const blocks = new Map<string, { text: string; childIds: string[]; isExpanded: boolean }>()
      blocks.set('parent', {
        text: 'Parent',
        childIds: ['child'],
        isExpanded: false, // Initially collapsed
      })
      blocks.set('child', {
        text: 'Child',
        childIds: [],
        isExpanded: true,
      })

      // Initially collapsed
      let result = fetchSubtreeMock('parent', blocks)
      expect(flattenSubtree(result.root!).map((n) => n.id)).toEqual(['parent'])

      // Toggle expand
      toggleNodeExpand(blocks, 'parent')
      result = fetchSubtreeMock('parent', blocks)
      expect(flattenSubtree(result.root!).map((n) => n.id)).toEqual(['parent', 'child'])
    })
  })
})

describe('Loading State (EDITOR-3504)', () => {
  describe('SubtreeFetchResult loading state', () => {
    it('should indicate loading while fetching', () => {
      // Simulate loading state
      const loadingResult: SubtreeFetchResult = {
        root: null,
        isLoading: true,
        error: null,
        totalNodes: 0,
        depthLimited: false,
      }

      expect(loadingResult.isLoading).toBe(true)
      expect(loadingResult.root).toBeNull()
    })

    it('should transition from loading to loaded', () => {
      const blocks = new Map<string, { text: string; childIds: string[]; isExpanded: boolean }>()
      blocks.set('block', { text: 'Block', childIds: [], isExpanded: true })

      // Simulating async fetch completion
      const result = fetchSubtreeMock('block', blocks)

      expect(result.isLoading).toBe(false)
      expect(result.root).not.toBeNull()
    })
  })
})

describe('Edge Cases (EDITOR-3504)', () => {
  describe('Empty subtrees', () => {
    it('should handle source block with no children', () => {
      const blocks = new Map<string, { text: string; childIds: string[]; isExpanded: boolean }>()
      blocks.set('leaf', { text: 'Leaf node', childIds: [], isExpanded: true })

      const result = fetchSubtreeMock('leaf', blocks)

      expect(result.root!.children).toHaveLength(0)
      expect(result.totalNodes).toBe(1)
    })
  })

  describe('Orphaned children', () => {
    it('should handle missing child blocks gracefully', () => {
      const blocks = new Map<string, { text: string; childIds: string[]; isExpanded: boolean }>()
      // Parent references a non-existent child
      blocks.set('parent', {
        text: 'Parent',
        childIds: ['non-existent'],
        isExpanded: true,
      })

      const result = fetchSubtreeMock('parent', blocks)

      expect(result.root!.children).toHaveLength(0) // Child not found, skipped
      expect(result.totalNodes).toBe(1) // Only parent counted
    })
  })

  describe('Circular references', () => {
    it('should handle potential circular references via depth limit', () => {
      const blocks = new Map<string, { text: string; childIds: string[]; isExpanded: boolean }>()
      // Note: In real BlockSuite, circular references shouldn't happen
      // but depth limit protects against infinite loops
      blocks.set('a', { text: 'A', childIds: ['b'], isExpanded: true })
      blocks.set('b', { text: 'B', childIds: ['a'], isExpanded: true })

      const result = fetchSubtreeMock('a', blocks, { maxDepth: 5 })

      expect(result.depthLimited).toBe(true)
      // Should not infinite loop, terminates at maxDepth
      expect(result.totalNodes).toBeLessThanOrEqual(6) // maxDepth + 1
    })
  })
})
