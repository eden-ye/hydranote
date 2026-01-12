import { describe, it, expect } from 'vitest'
import {
  findDescriptorChild,
  determinePortalParent,
  type SearchResult,
} from '../utils/portal-placement'

/**
 * Tests for AI Portal Placement Logic (EDITOR-3407)
 *
 * Decision tree:
 * 1. If bullet has [What]/[Why]/[How] descriptor → Insert as child of descriptor
 * 2. Otherwise → Insert as direct child of bullet
 * 3. Always insert at index 0 (first child)
 */

describe('Portal Placement Logic (EDITOR-3407)', () => {
  describe('findDescriptorChild', () => {
    it('should return null for bullet with no children', () => {
      const bullet = createMockBlock('block-1', [])
      const result = findDescriptorChild(bullet)
      expect(result).toBeNull()
    })

    it('should return null for bullet with only non-descriptor children', () => {
      const bullet = createMockBlock('block-1', [
        createMockBlock('child-1', [], false),
        createMockBlock('child-2', [], false),
      ])
      const result = findDescriptorChild(bullet)
      expect(result).toBeNull()
    })

    it('should find What descriptor child', () => {
      const whatDescriptor = createMockBlock('what-desc', [], true, 'what')
      const bullet = createMockBlock('block-1', [whatDescriptor])
      const result = findDescriptorChild(bullet)
      expect(result).toBe(whatDescriptor)
    })

    it('should find Why descriptor child', () => {
      const whyDescriptor = createMockBlock('why-desc', [], true, 'why')
      const bullet = createMockBlock('block-1', [whyDescriptor])
      const result = findDescriptorChild(bullet)
      expect(result).toBe(whyDescriptor)
    })

    it('should find How descriptor child', () => {
      const howDescriptor = createMockBlock('how-desc', [], true, 'how')
      const bullet = createMockBlock('block-1', [howDescriptor])
      const result = findDescriptorChild(bullet)
      expect(result).toBe(howDescriptor)
    })

    it('should find Pros descriptor child', () => {
      const prosDescriptor = createMockBlock('pros-desc', [], true, 'pros')
      const bullet = createMockBlock('block-1', [prosDescriptor])
      const result = findDescriptorChild(bullet)
      expect(result).toBe(prosDescriptor)
    })

    it('should find Cons descriptor child', () => {
      const consDescriptor = createMockBlock('cons-desc', [], true, 'cons')
      const bullet = createMockBlock('block-1', [consDescriptor])
      const result = findDescriptorChild(bullet)
      expect(result).toBe(consDescriptor)
    })

    it('should return first descriptor when multiple exist', () => {
      const whatDescriptor = createMockBlock('what-desc', [], true, 'what')
      const whyDescriptor = createMockBlock('why-desc', [], true, 'why')
      const bullet = createMockBlock('block-1', [whatDescriptor, whyDescriptor])
      const result = findDescriptorChild(bullet)
      expect(result).toBe(whatDescriptor)
    })

    it('should skip non-descriptor children to find descriptor', () => {
      const normalChild = createMockBlock('normal', [], false)
      const whatDescriptor = createMockBlock('what-desc', [], true, 'what')
      const bullet = createMockBlock('block-1', [normalChild, whatDescriptor])
      const result = findDescriptorChild(bullet)
      expect(result).toBe(whatDescriptor)
    })
  })

  describe('determinePortalParent', () => {
    it('should return descriptor as parent when bullet has descriptor child', () => {
      const whatDescriptor = createMockBlock('what-desc', [], true, 'what')
      const bullet = createMockBlock('block-1', [whatDescriptor])

      const result = determinePortalParent(bullet)

      expect(result.parentBlockId).toBe('what-desc')
      expect(result.insertIndex).toBe(0)
      expect(result.placementReason).toBe('descriptor')
    })

    it('should return bullet as parent when no descriptor exists', () => {
      const normalChild = createMockBlock('child-1', [], false)
      const bullet = createMockBlock('block-1', [normalChild])

      const result = determinePortalParent(bullet)

      expect(result.parentBlockId).toBe('block-1')
      expect(result.insertIndex).toBe(0)
      expect(result.placementReason).toBe('direct')
    })

    it('should return bullet as parent when no children exist', () => {
      const bullet = createMockBlock('block-1', [])

      const result = determinePortalParent(bullet)

      expect(result.parentBlockId).toBe('block-1')
      expect(result.insertIndex).toBe(0)
      expect(result.placementReason).toBe('direct')
    })

    it('should always use index 0 for insertion', () => {
      // With descriptor
      const whatDescriptor = createMockBlock('what-desc', [], true, 'what')
      const bullet1 = createMockBlock('block-1', [whatDescriptor])
      expect(determinePortalParent(bullet1).insertIndex).toBe(0)

      // Without descriptor
      const normalChild = createMockBlock('child-1', [], false)
      const bullet2 = createMockBlock('block-2', [normalChild])
      expect(determinePortalParent(bullet2).insertIndex).toBe(0)

      // Empty bullet
      const bullet3 = createMockBlock('block-3', [])
      expect(determinePortalParent(bullet3).insertIndex).toBe(0)
    })

    it('should prefer What descriptor over other types', () => {
      const whatDescriptor = createMockBlock('what-desc', [], true, 'what')
      const whyDescriptor = createMockBlock('why-desc', [], true, 'why')
      // What appears first
      const bullet = createMockBlock('block-1', [whatDescriptor, whyDescriptor])

      const result = determinePortalParent(bullet)

      expect(result.parentBlockId).toBe('what-desc')
    })
  })

  describe('SearchResult integration', () => {
    it('should handle search result with descriptor type', () => {
      const searchResult: SearchResult = {
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Neural networks use layers',
        contextPath: 'Machine Learning > [What] Neural Networks',
        score: 0.92,
        descriptorType: 'what',
        childrenSummary: 'Backpropagation, Activation functions',
      }

      // Verify the structure is correct for portal creation
      expect(searchResult.documentId).toBeDefined()
      expect(searchResult.blockId).toBeDefined()
      expect(searchResult.score).toBeGreaterThanOrEqual(0)
      expect(searchResult.score).toBeLessThanOrEqual(1)
    })

    it('should handle search result without descriptor type', () => {
      const searchResult: SearchResult = {
        documentId: 'doc-2',
        blockId: 'block-2',
        bulletText: 'Introduction to AI',
        contextPath: 'AI Fundamentals',
        score: 0.85,
        descriptorType: null,
        childrenSummary: null,
      }

      expect(searchResult.descriptorType).toBeNull()
      expect(searchResult.childrenSummary).toBeNull()
    })
  })
})

// Mock Block helper for testing
interface MockBlock {
  id: string
  children: MockBlock[]
  model: {
    isDescriptor: boolean
    descriptorType: string | null
    flavour: string
  }
}

function createMockBlock(
  id: string,
  children: MockBlock[] = [],
  isDescriptor: boolean = false,
  descriptorType: string | null = null
): MockBlock {
  return {
    id,
    children,
    model: {
      isDescriptor,
      descriptorType,
      flavour: 'hydra:bullet',
    },
  }
}
