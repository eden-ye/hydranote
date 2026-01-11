/**
 * Tests for EDITOR-3301: Cheatsheet Rendering Engine
 *
 * Cheatsheet is the inline preview shown when a bullet is collapsed.
 * It displays descriptor children in a formatted way:
 * Format: "{What children} | {Pros} vs. {Cons}"
 * Example: "React => A JavaScript Library | Fast, Component-based vs. Steep learning curve"
 */
import { describe, it, expect } from 'vitest'
import {
  computeCheatsheet,
  formatCheatsheetSection,
  groupDescriptorsByType,
  truncateCheatsheet,
  CHEATSHEET_MAX_LENGTH,
  CHEATSHEET_SEPARATOR,
  PROS_CONS_SEPARATOR,
  type DescriptorChild,
} from '../utils/cheatsheet'

describe('cheatsheet', () => {
  describe('groupDescriptorsByType', () => {
    it('should group children by descriptor type', () => {
      const children: DescriptorChild[] = [
        { text: 'A JavaScript library', descriptorType: 'what', isDescriptor: true },
        { text: 'Component-based architecture', descriptorType: 'why', isDescriptor: true },
        { text: 'Fast rendering', descriptorType: 'pros', isDescriptor: true },
        { text: 'Steep learning curve', descriptorType: 'cons', isDescriptor: true },
      ]

      const grouped = groupDescriptorsByType(children)

      expect(grouped.what).toEqual(['A JavaScript library'])
      expect(grouped.why).toEqual(['Component-based architecture'])
      expect(grouped.pros).toEqual(['Fast rendering'])
      expect(grouped.cons).toEqual(['Steep learning curve'])
    })

    it('should handle multiple children per type', () => {
      const children: DescriptorChild[] = [
        { text: 'Fast', descriptorType: 'pros', isDescriptor: true },
        { text: 'Easy to learn', descriptorType: 'pros', isDescriptor: true },
        { text: 'Verbose', descriptorType: 'cons', isDescriptor: true },
        { text: 'Large bundle', descriptorType: 'cons', isDescriptor: true },
      ]

      const grouped = groupDescriptorsByType(children)

      expect(grouped.pros).toEqual(['Fast', 'Easy to learn'])
      expect(grouped.cons).toEqual(['Verbose', 'Large bundle'])
    })

    it('should skip non-descriptor children', () => {
      const children: DescriptorChild[] = [
        { text: 'A JavaScript library', descriptorType: 'what', isDescriptor: true },
        { text: 'Regular bullet', descriptorType: null, isDescriptor: false },
        { text: 'Fast', descriptorType: 'pros', isDescriptor: true },
      ]

      const grouped = groupDescriptorsByType(children)

      expect(grouped.what).toEqual(['A JavaScript library'])
      expect(grouped.pros).toEqual(['Fast'])
    })

    it('should skip empty text content', () => {
      const children: DescriptorChild[] = [
        { text: 'A JavaScript library', descriptorType: 'what', isDescriptor: true },
        { text: '', descriptorType: 'why', isDescriptor: true },
        { text: '   ', descriptorType: 'how', isDescriptor: true },
      ]

      const grouped = groupDescriptorsByType(children)

      expect(grouped.what).toEqual(['A JavaScript library'])
      expect(grouped.why).toEqual([])
      expect(grouped.how).toEqual([])
    })

    it('should handle custom descriptor types', () => {
      const children: DescriptorChild[] = [
        { text: 'See also: React docs', descriptorType: 'custom', isDescriptor: true },
      ]

      const grouped = groupDescriptorsByType(children)

      expect(grouped.custom).toEqual(['See also: React docs'])
    })
  })

  describe('formatCheatsheetSection', () => {
    it('should join multiple items with comma and space', () => {
      const items = ['Fast', 'Easy to learn', 'Well documented']
      const result = formatCheatsheetSection(items)
      expect(result).toBe('Fast, Easy to learn, Well documented')
    })

    it('should return single item as-is', () => {
      const items = ['Fast']
      const result = formatCheatsheetSection(items)
      expect(result).toBe('Fast')
    })

    it('should return empty string for empty array', () => {
      const items: string[] = []
      const result = formatCheatsheetSection(items)
      expect(result).toBe('')
    })
  })

  describe('truncateCheatsheet', () => {
    it('should not truncate text under max length', () => {
      const text = 'Short text'
      const result = truncateCheatsheet(text)
      expect(result).toBe('Short text')
    })

    it('should truncate text exceeding max length with ellipsis', () => {
      const text = 'A'.repeat(CHEATSHEET_MAX_LENGTH + 50)
      const result = truncateCheatsheet(text)
      expect(result.length).toBeLessThanOrEqual(CHEATSHEET_MAX_LENGTH + 1) // +1 for ellipsis
      expect(result.endsWith('…')).toBe(true)
    })

    it('should handle custom max length', () => {
      const text = 'This is a longer text'
      const result = truncateCheatsheet(text, 10)
      expect(result).toBe('This is a …')
    })
  })

  describe('computeCheatsheet', () => {
    it('should format basic cheatsheet with What descriptor', () => {
      const children: DescriptorChild[] = [
        { text: 'A JavaScript library', descriptorType: 'what', isDescriptor: true },
      ]

      const result = computeCheatsheet(children)

      expect(result).toBe('A JavaScript library')
    })

    it('should format cheatsheet with What and Why', () => {
      const children: DescriptorChild[] = [
        { text: 'A JavaScript library', descriptorType: 'what', isDescriptor: true },
        { text: 'Component-based architecture', descriptorType: 'why', isDescriptor: true },
      ]

      const result = computeCheatsheet(children)

      expect(result).toBe(`A JavaScript library ${CHEATSHEET_SEPARATOR} Component-based architecture`)
    })

    it('should format cheatsheet with Pros and Cons using vs. separator', () => {
      const children: DescriptorChild[] = [
        { text: 'Fast rendering', descriptorType: 'pros', isDescriptor: true },
        { text: 'Steep learning curve', descriptorType: 'cons', isDescriptor: true },
      ]

      const result = computeCheatsheet(children)

      expect(result).toBe(`Fast rendering ${PROS_CONS_SEPARATOR} Steep learning curve`)
    })

    it('should format full cheatsheet with all descriptor types', () => {
      const children: DescriptorChild[] = [
        { text: 'A JavaScript Library', descriptorType: 'what', isDescriptor: true },
        { text: 'Fast, Component-based', descriptorType: 'pros', isDescriptor: true },
        { text: 'Steep learning curve', descriptorType: 'cons', isDescriptor: true },
      ]

      const result = computeCheatsheet(children)

      // Format: What | Pros vs. Cons
      expect(result).toBe(`A JavaScript Library ${CHEATSHEET_SEPARATOR} Fast, Component-based ${PROS_CONS_SEPARATOR} Steep learning curve`)
    })

    it('should handle multiple items in Pros and Cons', () => {
      const children: DescriptorChild[] = [
        { text: 'Fast', descriptorType: 'pros', isDescriptor: true },
        { text: 'Easy', descriptorType: 'pros', isDescriptor: true },
        { text: 'Complex', descriptorType: 'cons', isDescriptor: true },
        { text: 'Verbose', descriptorType: 'cons', isDescriptor: true },
      ]

      const result = computeCheatsheet(children)

      expect(result).toBe(`Fast, Easy ${PROS_CONS_SEPARATOR} Complex, Verbose`)
    })

    it('should handle only Pros without Cons', () => {
      const children: DescriptorChild[] = [
        { text: 'Fast', descriptorType: 'pros', isDescriptor: true },
        { text: 'Easy', descriptorType: 'pros', isDescriptor: true },
      ]

      const result = computeCheatsheet(children)

      expect(result).toBe('Fast, Easy')
    })

    it('should handle only Cons without Pros', () => {
      const children: DescriptorChild[] = [
        { text: 'Complex', descriptorType: 'cons', isDescriptor: true },
        { text: 'Verbose', descriptorType: 'cons', isDescriptor: true },
      ]

      const result = computeCheatsheet(children)

      expect(result).toBe('Complex, Verbose')
    })

    it('should return empty string when no descriptors', () => {
      const children: DescriptorChild[] = [
        { text: 'Regular bullet', descriptorType: null, isDescriptor: false },
      ]

      const result = computeCheatsheet(children)

      expect(result).toBe('')
    })

    it('should truncate long cheatsheet', () => {
      const longText = 'A'.repeat(100)
      const children: DescriptorChild[] = [
        { text: longText, descriptorType: 'what', isDescriptor: true },
        { text: longText, descriptorType: 'why', isDescriptor: true },
      ]

      const result = computeCheatsheet(children)

      expect(result.length).toBeLessThanOrEqual(CHEATSHEET_MAX_LENGTH + 1) // +1 for ellipsis
      expect(result.endsWith('…')).toBe(true)
    })

    it('should handle How descriptor', () => {
      const children: DescriptorChild[] = [
        { text: 'Install via npm', descriptorType: 'how', isDescriptor: true },
      ]

      const result = computeCheatsheet(children)

      expect(result).toBe('Install via npm')
    })

    it('should order sections: What, Why, How, then Pros vs. Cons', () => {
      const children: DescriptorChild[] = [
        { text: 'Pros item', descriptorType: 'pros', isDescriptor: true },
        { text: 'How item', descriptorType: 'how', isDescriptor: true },
        { text: 'Why item', descriptorType: 'why', isDescriptor: true },
        { text: 'What item', descriptorType: 'what', isDescriptor: true },
        { text: 'Cons item', descriptorType: 'cons', isDescriptor: true },
      ]

      const result = computeCheatsheet(children)

      // Should be: What | Why | How | Pros vs. Cons
      expect(result).toBe(`What item ${CHEATSHEET_SEPARATOR} Why item ${CHEATSHEET_SEPARATOR} How item ${CHEATSHEET_SEPARATOR} Pros item ${PROS_CONS_SEPARATOR} Cons item`)
    })

    it('should handle custom descriptors at the end', () => {
      const children: DescriptorChild[] = [
        { text: 'What item', descriptorType: 'what', isDescriptor: true },
        { text: 'Custom note', descriptorType: 'custom', isDescriptor: true },
      ]

      const result = computeCheatsheet(children)

      expect(result).toBe(`What item ${CHEATSHEET_SEPARATOR} Custom note`)
    })
  })

  describe('CHEATSHEET constants', () => {
    it('should have correct separator', () => {
      expect(CHEATSHEET_SEPARATOR).toBe('|')
    })

    it('should have correct pros/cons separator', () => {
      expect(PROS_CONS_SEPARATOR).toBe('vs.')
    })

    it('should have reasonable max length', () => {
      expect(CHEATSHEET_MAX_LENGTH).toBeGreaterThanOrEqual(50)
      expect(CHEATSHEET_MAX_LENGTH).toBeLessThanOrEqual(200)
    })
  })
})
