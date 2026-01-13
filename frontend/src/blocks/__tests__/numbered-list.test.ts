import { describe, it, expect } from 'vitest'
import {
  computeListNumber,
  type ListNumberContext,
} from '../utils/numbered-list'

describe('computeListNumber', () => {
  describe('basic numbering', () => {
    it('should return 1 for first numbered item with no previous siblings', () => {
      const context: ListNumberContext = {
        siblingIndex: 0,
        previousSiblings: [],
      }
      expect(computeListNumber(context)).toBe(1)
    })

    it('should return 2 for second numbered item', () => {
      const context: ListNumberContext = {
        siblingIndex: 1,
        previousSiblings: [{ blockType: 'numbered' }],
      }
      expect(computeListNumber(context)).toBe(2)
    })

    it('should continue counting for multiple numbered items', () => {
      const siblings = [
        { blockType: 'numbered' as const },
        { blockType: 'numbered' as const },
        { blockType: 'numbered' as const },
      ]
      expect(computeListNumber({
        siblingIndex: 3,
        previousSiblings: siblings,
      })).toBe(4)
    })
  })

  describe('mixed block types', () => {
    it('should count only consecutive numbered items before current', () => {
      const context: ListNumberContext = {
        siblingIndex: 2,
        previousSiblings: [
          { blockType: 'bullet' },
          { blockType: 'numbered' },
        ],
      }
      // Only the immediately preceding numbered item counts
      expect(computeListNumber(context)).toBe(2)
    })

    it('should reset count after non-numbered block', () => {
      const context: ListNumberContext = {
        siblingIndex: 3,
        previousSiblings: [
          { blockType: 'numbered' },
          { blockType: 'bullet' },
          { blockType: 'numbered' },
        ],
      }
      // After bullet breaks the sequence, starts from numbered at index 2
      expect(computeListNumber(context)).toBe(2)
    })

    it('should skip checkbox blocks when counting', () => {
      const context: ListNumberContext = {
        siblingIndex: 2,
        previousSiblings: [
          { blockType: 'numbered' },
          { blockType: 'checkbox' },
        ],
      }
      expect(computeListNumber(context)).toBe(1)
    })

    it('should skip heading blocks when counting', () => {
      const context: ListNumberContext = {
        siblingIndex: 2,
        previousSiblings: [
          { blockType: 'numbered' },
          { blockType: 'heading1' },
        ],
      }
      expect(computeListNumber(context)).toBe(1)
    })
  })

  describe('consecutive numbered items', () => {
    it('should count all consecutive numbered items', () => {
      const siblings = [
        { blockType: 'numbered' as const },
        { blockType: 'numbered' as const },
        { blockType: 'numbered' as const },
        { blockType: 'numbered' as const },
      ]
      expect(computeListNumber({
        siblingIndex: 4,
        previousSiblings: siblings,
      })).toBe(5)
    })

    it('should handle long sequences', () => {
      const siblings = Array(10).fill({ blockType: 'numbered' as const })
      expect(computeListNumber({
        siblingIndex: 10,
        previousSiblings: siblings,
      })).toBe(11)
    })
  })

  describe('edge cases', () => {
    it('should handle empty siblings array', () => {
      expect(computeListNumber({
        siblingIndex: 0,
        previousSiblings: [],
      })).toBe(1)
    })

    it('should return 1 when all previous are non-numbered', () => {
      const context: ListNumberContext = {
        siblingIndex: 3,
        previousSiblings: [
          { blockType: 'bullet' },
          { blockType: 'checkbox' },
          { blockType: 'heading1' },
        ],
      }
      expect(computeListNumber(context)).toBe(1)
    })
  })
})
