/**
 * Tests for EDITOR-3302: Cheatsheet Auto-Colors
 *
 * Tests for automatic background colors on Pros (green) and Cons (red) sections
 * in the cheatsheet view when a bullet is folded.
 */
import { describe, it, expect } from 'vitest'
import {
  computeCheatsheet,
  computeCheatsheetSegments,
  type CheatsheetSegment,
  CHEATSHEET_COLORS,
} from '../utils/cheatsheet'
import type { DescriptorChild } from '../utils/cheatsheet'

describe('cheatsheet auto-colors (EDITOR-3302)', () => {
  describe('CHEATSHEET_COLORS', () => {
    it('should have green color for pros', () => {
      expect(CHEATSHEET_COLORS.pros).toBeDefined()
      expect(CHEATSHEET_COLORS.pros!.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(CHEATSHEET_COLORS.pros!.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })

    it('should have pink/red color for cons', () => {
      expect(CHEATSHEET_COLORS.cons).toBeDefined()
      expect(CHEATSHEET_COLORS.cons!.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(CHEATSHEET_COLORS.cons!.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })

    it('should not have colors for neutral descriptors', () => {
      expect(CHEATSHEET_COLORS.what).toBeUndefined()
      expect(CHEATSHEET_COLORS.why).toBeUndefined()
      expect(CHEATSHEET_COLORS.how).toBeUndefined()
      expect(CHEATSHEET_COLORS.custom).toBeUndefined()
    })
  })

  describe('computeCheatsheetSegments', () => {
    it('should return segments without color for neutral descriptors', () => {
      const children: DescriptorChild[] = [
        { text: 'A JavaScript library', descriptorType: 'what', isDescriptor: true },
        { text: 'Component-based', descriptorType: 'why', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)

      expect(segments.length).toBeGreaterThan(0)
      // All segments should have no color (neutral)
      segments.forEach(segment => {
        if (!segment.text.includes('|')) {
          expect(segment.color).toBeUndefined()
        }
      })
    })

    it('should return pros segment with green color', () => {
      const children: DescriptorChild[] = [
        { text: 'Fast rendering', descriptorType: 'pros', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)

      const prosSegment = segments.find(s => s.text.includes('Fast rendering'))
      expect(prosSegment).toBeDefined()
      expect(prosSegment?.color).toEqual(CHEATSHEET_COLORS.pros)
    })

    it('should return cons segment with pink color', () => {
      const children: DescriptorChild[] = [
        { text: 'Steep learning curve', descriptorType: 'cons', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)

      const consSegment = segments.find(s => s.text.includes('Steep learning curve'))
      expect(consSegment).toBeDefined()
      expect(consSegment?.color).toEqual(CHEATSHEET_COLORS.cons)
    })

    it('should handle Pros vs. Cons with separate colors', () => {
      const children: DescriptorChild[] = [
        { text: 'Fast', descriptorType: 'pros', isDescriptor: true },
        { text: 'Complex', descriptorType: 'cons', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)

      // Should have: pros segment, "vs." separator, cons segment
      const prosSegment = segments.find(s => s.text.includes('Fast'))
      const consSegment = segments.find(s => s.text.includes('Complex'))
      const vsSegment = segments.find(s => s.text.includes('vs.'))

      expect(prosSegment?.color).toEqual(CHEATSHEET_COLORS.pros)
      expect(consSegment?.color).toEqual(CHEATSHEET_COLORS.cons)
      expect(vsSegment?.color).toBeUndefined() // vs. separator has no color
    })

    it('should handle mixed descriptors with appropriate colors', () => {
      const children: DescriptorChild[] = [
        { text: 'A framework', descriptorType: 'what', isDescriptor: true },
        { text: 'Fast', descriptorType: 'pros', isDescriptor: true },
        { text: 'Complex', descriptorType: 'cons', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)

      // What should have no color
      const whatSegment = segments.find(s => s.text.includes('A framework'))
      expect(whatSegment?.color).toBeUndefined()

      // Pros should be green
      const prosSegment = segments.find(s => s.text.includes('Fast'))
      expect(prosSegment?.color).toEqual(CHEATSHEET_COLORS.pros)

      // Cons should be pink
      const consSegment = segments.find(s => s.text.includes('Complex'))
      expect(consSegment?.color).toEqual(CHEATSHEET_COLORS.cons)
    })

    it('should include | separators without color', () => {
      const children: DescriptorChild[] = [
        { text: 'What item', descriptorType: 'what', isDescriptor: true },
        { text: 'Fast', descriptorType: 'pros', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)

      const separatorSegment = segments.find(s => s.text === ' | ')
      expect(separatorSegment).toBeDefined()
      expect(separatorSegment?.color).toBeUndefined()
    })

    it('should return empty array when no descriptors', () => {
      const children: DescriptorChild[] = [
        { text: 'Regular bullet', descriptorType: null, isDescriptor: false },
      ]

      const segments = computeCheatsheetSegments(children)

      expect(segments).toEqual([])
    })

    it('should handle multiple pros items with same color', () => {
      const children: DescriptorChild[] = [
        { text: 'Fast', descriptorType: 'pros', isDescriptor: true },
        { text: 'Easy', descriptorType: 'pros', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)

      // Should be a single segment with "Fast, Easy" in green
      const prosSegment = segments.find(s => s.text.includes('Fast') && s.text.includes('Easy'))
      expect(prosSegment?.color).toEqual(CHEATSHEET_COLORS.pros)
    })

    it('should reconstruct to same text as computeCheatsheet', () => {
      const children: DescriptorChild[] = [
        { text: 'A framework', descriptorType: 'what', isDescriptor: true },
        { text: 'Fast', descriptorType: 'pros', isDescriptor: true },
        { text: 'Complex', descriptorType: 'cons', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)
      const reconstructed = segments.map(s => s.text).join('')

      // Compare with computeCheatsheet output
      const plainText = computeCheatsheet(children)

      expect(reconstructed).toBe(plainText)
    })
  })

  describe('CheatsheetSegment type', () => {
    it('should support text without color', () => {
      const segment: CheatsheetSegment = {
        text: 'Some text',
      }
      expect(segment.text).toBe('Some text')
      expect(segment.color).toBeUndefined()
    })

    it('should support text with color', () => {
      const segment: CheatsheetSegment = {
        text: 'Colored text',
        color: {
          backgroundColor: '#D1FAE5',
          textColor: '#065F46',
        },
      }
      expect(segment.text).toBe('Colored text')
      expect(segment.color?.backgroundColor).toBe('#D1FAE5')
      expect(segment.color?.textColor).toBe('#065F46')
    })
  })
})
