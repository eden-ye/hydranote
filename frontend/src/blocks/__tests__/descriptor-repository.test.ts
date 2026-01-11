import { describe, it, expect } from 'vitest'
import {
  DEFAULT_DESCRIPTORS,
  getDescriptorByKey,
  getAllDescriptors,
  getDescriptorKeys,
  isValidDescriptorKey,
  type Descriptor,
} from '../utils/descriptor-repository'

/**
 * Tests for Descriptor Repository (EDITOR-3202)
 *
 * Testing:
 * - Default descriptors (What, Why, How, Pros, Cons)
 * - Descriptor lookup by key
 * - List all descriptors
 * - Extensible design for user-defined descriptors
 */

describe('Descriptor Repository (EDITOR-3202)', () => {
  describe('DEFAULT_DESCRIPTORS', () => {
    it('should have 5 default descriptors', () => {
      expect(DEFAULT_DESCRIPTORS).toHaveLength(5)
    })

    it('should have unique keys', () => {
      const keys = DEFAULT_DESCRIPTORS.map((d) => d.key)
      const uniqueKeys = new Set(keys)
      expect(uniqueKeys.size).toBe(5)
    })

    it('should include What descriptor', () => {
      const what = DEFAULT_DESCRIPTORS.find((d) => d.key === 'what')
      expect(what).toBeDefined()
      expect(what?.shortLabel).toBe('What')
      expect(what?.label).toContain('What')
    })

    it('should include Why descriptor', () => {
      const why = DEFAULT_DESCRIPTORS.find((d) => d.key === 'why')
      expect(why).toBeDefined()
      expect(why?.shortLabel).toBe('Why')
      expect(why?.label).toContain('Why')
    })

    it('should include How descriptor', () => {
      const how = DEFAULT_DESCRIPTORS.find((d) => d.key === 'how')
      expect(how).toBeDefined()
      expect(how?.shortLabel).toBe('How')
      expect(how?.label).toContain('How')
    })

    it('should include Pros descriptor', () => {
      const pros = DEFAULT_DESCRIPTORS.find((d) => d.key === 'pros')
      expect(pros).toBeDefined()
      expect(pros?.shortLabel).toBe('Pros')
      expect(pros?.autoColor).toBe('green')
    })

    it('should include Cons descriptor', () => {
      const cons = DEFAULT_DESCRIPTORS.find((d) => d.key === 'cons')
      expect(cons).toBeDefined()
      expect(cons?.shortLabel).toBe('Cons')
      expect(cons?.autoColor).toBe('pink')
    })

    describe('each descriptor should have required properties', () => {
      DEFAULT_DESCRIPTORS.forEach((descriptor) => {
        describe(`${descriptor.shortLabel} descriptor`, () => {
          it('should have a non-empty key', () => {
            expect(descriptor.key).toBeTruthy()
            expect(typeof descriptor.key).toBe('string')
          })

          it('should have a non-empty label', () => {
            expect(descriptor.label).toBeTruthy()
            expect(typeof descriptor.label).toBe('string')
          })

          it('should have a non-empty shortLabel', () => {
            expect(descriptor.shortLabel).toBeTruthy()
            expect(typeof descriptor.shortLabel).toBe('string')
          })

          it('should have shortLabel shorter than or equal to label', () => {
            expect(descriptor.shortLabel.length).toBeLessThanOrEqual(
              descriptor.label.length
            )
          })
        })
      })
    })
  })

  describe('getDescriptorByKey', () => {
    it('should return descriptor for valid key', () => {
      const what = getDescriptorByKey('what')
      expect(what).toBeDefined()
      expect(what?.key).toBe('what')
    })

    it('should return undefined for invalid key', () => {
      const invalid = getDescriptorByKey('nonexistent')
      expect(invalid).toBeUndefined()
    })

    it('should find all default descriptors by key', () => {
      const keys = ['what', 'why', 'how', 'pros', 'cons']
      keys.forEach((key) => {
        const descriptor = getDescriptorByKey(key)
        expect(descriptor).toBeDefined()
        expect(descriptor?.key).toBe(key)
      })
    })

    it('should return correct properties for pros descriptor', () => {
      const pros = getDescriptorByKey('pros')
      expect(pros).toEqual({
        key: 'pros',
        label: expect.any(String),
        shortLabel: 'Pros',
        autoColor: 'green',
      })
    })

    it('should return correct properties for cons descriptor', () => {
      const cons = getDescriptorByKey('cons')
      expect(cons).toEqual({
        key: 'cons',
        label: expect.any(String),
        shortLabel: 'Cons',
        autoColor: 'pink',
      })
    })
  })

  describe('getAllDescriptors', () => {
    it('should return all default descriptors', () => {
      const all = getAllDescriptors()
      expect(all).toHaveLength(5)
    })

    it('should return a copy (not the original array)', () => {
      const all1 = getAllDescriptors()
      const all2 = getAllDescriptors()
      expect(all1).not.toBe(all2)
      expect(all1).toEqual(all2)
    })

    it('should include all default descriptor keys', () => {
      const all = getAllDescriptors()
      const keys = all.map((d) => d.key)
      expect(keys).toContain('what')
      expect(keys).toContain('why')
      expect(keys).toContain('how')
      expect(keys).toContain('pros')
      expect(keys).toContain('cons')
    })
  })

  describe('getDescriptorKeys', () => {
    it('should return all descriptor keys', () => {
      const keys = getDescriptorKeys()
      expect(keys).toHaveLength(5)
    })

    it('should return keys in order', () => {
      const keys = getDescriptorKeys()
      expect(keys).toEqual(['what', 'why', 'how', 'pros', 'cons'])
    })

    it('should return a copy (not the original array)', () => {
      const keys1 = getDescriptorKeys()
      const keys2 = getDescriptorKeys()
      expect(keys1).not.toBe(keys2)
      expect(keys1).toEqual(keys2)
    })
  })

  describe('isValidDescriptorKey', () => {
    it('should return true for valid descriptor keys', () => {
      expect(isValidDescriptorKey('what')).toBe(true)
      expect(isValidDescriptorKey('why')).toBe(true)
      expect(isValidDescriptorKey('how')).toBe(true)
      expect(isValidDescriptorKey('pros')).toBe(true)
      expect(isValidDescriptorKey('cons')).toBe(true)
    })

    it('should return false for invalid keys', () => {
      expect(isValidDescriptorKey('invalid')).toBe(false)
      expect(isValidDescriptorKey('')).toBe(false)
      expect(isValidDescriptorKey('WHAT')).toBe(false)
      expect(isValidDescriptorKey('custom')).toBe(false)
    })
  })

  describe('Descriptor interface', () => {
    it('should have correct type shape', () => {
      const descriptor: Descriptor = {
        key: 'test',
        label: 'Test Label',
        shortLabel: 'Test',
      }
      expect(descriptor.key).toBe('test')
      expect(descriptor.label).toBe('Test Label')
      expect(descriptor.shortLabel).toBe('Test')
      expect(descriptor.autoColor).toBeUndefined()
    })

    it('should allow optional autoColor', () => {
      const descriptor: Descriptor = {
        key: 'test',
        label: 'Test Label',
        shortLabel: 'Test',
        autoColor: 'blue',
      }
      expect(descriptor.autoColor).toBe('blue')
    })
  })

  describe('Descriptor order', () => {
    it('should maintain consistent order for autocomplete', () => {
      const descriptors = getAllDescriptors()
      const keys = descriptors.map((d) => d.key)
      // What, Why, How are informational - should come first
      // Pros, Cons are evaluative - should come after
      expect(keys.indexOf('what')).toBeLessThan(keys.indexOf('pros'))
      expect(keys.indexOf('why')).toBeLessThan(keys.indexOf('pros'))
      expect(keys.indexOf('how')).toBeLessThan(keys.indexOf('pros'))
    })
  })

  describe('Auto-color assignments', () => {
    it('should assign green to Pros', () => {
      const pros = getDescriptorByKey('pros')
      expect(pros?.autoColor).toBe('green')
    })

    it('should assign pink to Cons', () => {
      const cons = getDescriptorByKey('cons')
      expect(cons?.autoColor).toBe('pink')
    })

    it('should not assign colors to informational descriptors', () => {
      const what = getDescriptorByKey('what')
      const why = getDescriptorByKey('why')
      const how = getDescriptorByKey('how')
      expect(what?.autoColor).toBeUndefined()
      expect(why?.autoColor).toBeUndefined()
      expect(how?.autoColor).toBeUndefined()
    })
  })
})
