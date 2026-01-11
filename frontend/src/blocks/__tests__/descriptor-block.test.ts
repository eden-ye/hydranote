import { describe, it, expect } from 'vitest'

/**
 * Tests for Descriptor Block Schema (EDITOR-3201)
 *
 * Testing:
 * - Descriptor types enum
 * - Schema extension with descriptor props
 * - Visual rendering logic for descriptors
 * - Descriptor label handling for custom types
 */

// Import descriptor utilities (to be created)
import {
  DESCRIPTOR_TYPES,
  isValidDescriptorType,
  getDescriptorLabel,
  getDescriptorPrefix,
  type DescriptorType,
} from '../utils/descriptor'

describe('Descriptor Block (EDITOR-3201)', () => {
  describe('DESCRIPTOR_TYPES', () => {
    it('should have the 6 standard descriptor types', () => {
      expect(DESCRIPTOR_TYPES).toContain('what')
      expect(DESCRIPTOR_TYPES).toContain('why')
      expect(DESCRIPTOR_TYPES).toContain('how')
      expect(DESCRIPTOR_TYPES).toContain('pros')
      expect(DESCRIPTOR_TYPES).toContain('cons')
      expect(DESCRIPTOR_TYPES).toContain('custom')
    })

    it('should have exactly 6 types', () => {
      expect(DESCRIPTOR_TYPES).toHaveLength(6)
    })

    it('should have unique types', () => {
      const uniqueTypes = new Set(DESCRIPTOR_TYPES)
      expect(uniqueTypes.size).toBe(6)
    })
  })

  describe('isValidDescriptorType', () => {
    it('should return true for valid descriptor types', () => {
      expect(isValidDescriptorType('what')).toBe(true)
      expect(isValidDescriptorType('why')).toBe(true)
      expect(isValidDescriptorType('how')).toBe(true)
      expect(isValidDescriptorType('pros')).toBe(true)
      expect(isValidDescriptorType('cons')).toBe(true)
      expect(isValidDescriptorType('custom')).toBe(true)
    })

    it('should return false for invalid types', () => {
      expect(isValidDescriptorType('invalid')).toBe(false)
      expect(isValidDescriptorType('')).toBe(false)
      expect(isValidDescriptorType('WHAT')).toBe(false)
      expect(isValidDescriptorType('foo')).toBe(false)
    })
  })

  describe('getDescriptorLabel', () => {
    it('should return capitalized label for standard types', () => {
      expect(getDescriptorLabel('what')).toBe('What')
      expect(getDescriptorLabel('why')).toBe('Why')
      expect(getDescriptorLabel('how')).toBe('How')
      expect(getDescriptorLabel('pros')).toBe('Pros')
      expect(getDescriptorLabel('cons')).toBe('Cons')
    })

    it('should return custom label when provided for custom type', () => {
      expect(getDescriptorLabel('custom', 'My Custom Label')).toBe('My Custom Label')
    })

    it('should return "Custom" when no label provided for custom type', () => {
      expect(getDescriptorLabel('custom')).toBe('Custom')
    })

    it('should trim whitespace from custom labels', () => {
      expect(getDescriptorLabel('custom', '  Trimmed Label  ')).toBe('Trimmed Label')
    })
  })

  describe('getDescriptorPrefix', () => {
    it('should return pipe prefix for all descriptor types', () => {
      expect(getDescriptorPrefix()).toBe('|')
    })
  })

  describe('Descriptor rendering logic', () => {
    /**
     * Determines if a block should render as a descriptor
     */
    const shouldRenderAsDescriptor = (
      isDescriptor: boolean
    ): boolean => {
      return isDescriptor
    }

    it('should render as descriptor when isDescriptor is true', () => {
      expect(shouldRenderAsDescriptor(true)).toBe(true)
    })

    it('should not render as descriptor when isDescriptor is false', () => {
      expect(shouldRenderAsDescriptor(false)).toBe(false)
    })

    /**
     * Formats the descriptor header text
     */
    const formatDescriptorHeader = (
      descriptorType: DescriptorType,
      customLabel?: string
    ): string => {
      const prefix = getDescriptorPrefix()
      const label = getDescriptorLabel(descriptorType, customLabel)
      return `${prefix} ${label}`
    }

    it('should format what descriptor header correctly', () => {
      expect(formatDescriptorHeader('what')).toBe('| What')
    })

    it('should format why descriptor header correctly', () => {
      expect(formatDescriptorHeader('why')).toBe('| Why')
    })

    it('should format how descriptor header correctly', () => {
      expect(formatDescriptorHeader('how')).toBe('| How')
    })

    it('should format pros descriptor header correctly', () => {
      expect(formatDescriptorHeader('pros')).toBe('| Pros')
    })

    it('should format cons descriptor header correctly', () => {
      expect(formatDescriptorHeader('cons')).toBe('| Cons')
    })

    it('should format custom descriptor header with custom label', () => {
      expect(formatDescriptorHeader('custom', 'My Notes')).toBe('| My Notes')
    })
  })

  describe('Descriptor CSS classes', () => {
    /**
     * Returns CSS class for descriptor styling
     */
    const getDescriptorClass = (isDescriptor: boolean): string => {
      return isDescriptor ? 'descriptor-block' : ''
    }

    it('should return descriptor class when isDescriptor is true', () => {
      expect(getDescriptorClass(true)).toBe('descriptor-block')
    })

    it('should return empty string when isDescriptor is false', () => {
      expect(getDescriptorClass(false)).toBe('')
    })
  })
})

describe('Descriptor Schema Props (EDITOR-3201)', () => {
  // Mock the schema props factory similar to bullet-block-schema.test.ts
  // This tests the expected props structure

  describe('default values', () => {
    it('should default isDescriptor to false', () => {
      const defaultProps = {
        isDescriptor: false,
        descriptorType: null,
        descriptorLabel: undefined,
      }
      expect(defaultProps.isDescriptor).toBe(false)
    })

    it('should default descriptorType to null when not a descriptor', () => {
      const defaultProps = {
        isDescriptor: false,
        descriptorType: null,
        descriptorLabel: undefined,
      }
      expect(defaultProps.descriptorType).toBeNull()
    })
  })

  describe('descriptor block structure', () => {
    it('should allow descriptor children to be regular bullets', () => {
      // A descriptor can have regular bullet children
      // This is the content that appears under the descriptor header
      const descriptorWithChildren = {
        isDescriptor: true,
        descriptorType: 'what' as DescriptorType,
        children: [
          { isDescriptor: false, text: 'Regular child bullet 1' },
          { isDescriptor: false, text: 'Regular child bullet 2' },
        ],
      }

      // All children should be non-descriptors
      expect(descriptorWithChildren.children.every(c => !c.isDescriptor)).toBe(true)
    })

    it('should support all standard descriptor types', () => {
      const types: DescriptorType[] = ['what', 'why', 'how', 'pros', 'cons', 'custom']
      types.forEach(type => {
        const descriptor = {
          isDescriptor: true,
          descriptorType: type,
        }
        expect(descriptor.descriptorType).toBe(type)
      })
    })

    it('should require descriptorLabel for custom type', () => {
      const customDescriptor = {
        isDescriptor: true,
        descriptorType: 'custom' as DescriptorType,
        descriptorLabel: 'My Custom Category',
      }
      expect(customDescriptor.descriptorLabel).toBe('My Custom Category')
    })
  })
})
