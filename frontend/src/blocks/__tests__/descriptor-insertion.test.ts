import { describe, it, expect } from 'vitest'
import {
  findDuplicateDescriptor,
  removeTriggerText,
  type DescriptorInsertionResult,
} from '../utils/descriptor-insertion'
import type { DescriptorType } from '../utils/descriptor'

// Mock block types matching ParentBlock interface from descriptor-insertion.ts
interface MockBlockWithDescriptor {
  id: string
  isDescriptor?: boolean
  descriptorType?: DescriptorType | null
}

interface MockParentBlock {
  children: MockBlockWithDescriptor[]
}

/**
 * Tests for Descriptor Insertion (EDITOR-3204)
 *
 * Testing:
 * - Duplicate descriptor detection
 * - Trigger text removal
 * - Insertion result structure
 */

describe('Descriptor Insertion (EDITOR-3204)', () => {
  describe('findDuplicateDescriptor', () => {
    it('should return null when no children exist', () => {
      const mockBlock: MockParentBlock = {
        children: [],
      }
      const result = findDuplicateDescriptor(mockBlock, 'what')
      expect(result).toBeNull()
    })

    it('should return null when no matching descriptor exists', () => {
      const mockBlock: MockParentBlock = {
        children: [
          { id: 'child-1', isDescriptor: false, descriptorType: null },
          { id: 'child-2', isDescriptor: true, descriptorType: 'why' },
        ],
      }
      const result = findDuplicateDescriptor(mockBlock, 'what')
      expect(result).toBeNull()
    })

    it('should return the blockId of existing matching descriptor', () => {
      const mockBlock: MockParentBlock = {
        children: [
          { id: 'child-1', isDescriptor: true, descriptorType: 'what' },
          { id: 'child-2', isDescriptor: true, descriptorType: 'why' },
        ],
      }
      const result = findDuplicateDescriptor(mockBlock, 'what')
      expect(result).toBe('child-1')
    })

    it('should not match non-descriptor blocks with same text', () => {
      const mockBlock: MockParentBlock = {
        children: [
          { id: 'child-1', isDescriptor: false, descriptorType: 'what' },
        ],
      }
      const result = findDuplicateDescriptor(mockBlock, 'what')
      expect(result).toBeNull()
    })

    it('should find duplicate regardless of position', () => {
      const mockBlock: MockParentBlock = {
        children: [
          { id: 'child-1', isDescriptor: true, descriptorType: 'how' },
          { id: 'child-2', isDescriptor: true, descriptorType: 'pros' },
          { id: 'child-3', isDescriptor: true, descriptorType: 'what' },
        ],
      }
      const result = findDuplicateDescriptor(mockBlock, 'what')
      expect(result).toBe('child-3')
    })
  })

  describe('removeTriggerText', () => {
    it('should remove ~what from text', () => {
      const result = removeTriggerText('Hello ~what', 'what')
      expect(result).toBe('Hello ')
    })

    it('should remove ~why from text', () => {
      const result = removeTriggerText('Some text ~why', 'why')
      expect(result).toBe('Some text ')
    })

    it('should handle text with only trigger', () => {
      const result = removeTriggerText('~what', 'what')
      expect(result).toBe('')
    })

    it('should handle partial match at end', () => {
      const result = removeTriggerText('Test ~wh', 'what')
      expect(result).toBe('Test ')
    })

    it('should remove trigger with partial query', () => {
      const result = removeTriggerText('Test ~w', 'what')
      expect(result).toBe('Test ')
    })

    it('should handle just tilde', () => {
      const result = removeTriggerText('Test ~', 'what')
      expect(result).toBe('Test ')
    })

    it('should not modify text without trigger', () => {
      const result = removeTriggerText('No trigger here', 'what')
      expect(result).toBe('No trigger here')
    })

    it('should handle case-insensitive matching', () => {
      const result = removeTriggerText('Test ~What', 'what')
      expect(result).toBe('Test ')
    })

    it('should remove trigger from middle of text', () => {
      const result = removeTriggerText('Before ~pros after', 'pros')
      expect(result).toBe('Before  after')
    })

    it('should only remove the last trigger occurrence', () => {
      const result = removeTriggerText('First ~what then ~why', 'why')
      expect(result).toBe('First ~what then ')
    })
  })

  describe('DescriptorInsertionResult type', () => {
    it('should have correct shape for new insertion', () => {
      const result: DescriptorInsertionResult = {
        action: 'created',
        blockId: 'new-block-id',
      }
      expect(result.action).toBe('created')
      expect(result.blockId).toBe('new-block-id')
    })

    it('should have correct shape for existing duplicate', () => {
      const result: DescriptorInsertionResult = {
        action: 'focused_existing',
        blockId: 'existing-block-id',
      }
      expect(result.action).toBe('focused_existing')
      expect(result.blockId).toBe('existing-block-id')
    })
  })
})
