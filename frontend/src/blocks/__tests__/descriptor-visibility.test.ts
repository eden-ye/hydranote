/**
 * Tests for EDITOR-3303: Descriptor Visibility Toggle
 *
 * Tests for the visibility toggle functionality that controls whether
 * a descriptor appears in the cheatsheet when its parent is folded.
 */
import { describe, it, expect } from 'vitest'
import {
  computeCheatsheet,
  computeCheatsheetSegments,
  groupDescriptorsByType,
  type DescriptorChild,
} from '../utils/cheatsheet'

describe('descriptor visibility toggle (EDITOR-3303)', () => {
  describe('groupDescriptorsByType with visibility', () => {
    it('should include descriptors with cheatsheetVisible: true', () => {
      const children: DescriptorChild[] = [
        { text: 'Visible what', descriptorType: 'what', isDescriptor: true, cheatsheetVisible: true },
        { text: 'Visible pros', descriptorType: 'pros', isDescriptor: true, cheatsheetVisible: true },
      ]

      const grouped = groupDescriptorsByType(children)

      expect(grouped.what).toContain('Visible what')
      expect(grouped.pros).toContain('Visible pros')
    })

    it('should exclude descriptors with cheatsheetVisible: false', () => {
      const children: DescriptorChild[] = [
        { text: 'Visible what', descriptorType: 'what', isDescriptor: true, cheatsheetVisible: true },
        { text: 'Hidden pros', descriptorType: 'pros', isDescriptor: true, cheatsheetVisible: false },
      ]

      const grouped = groupDescriptorsByType(children)

      expect(grouped.what).toContain('Visible what')
      expect(grouped.pros).not.toContain('Hidden pros')
      expect(grouped.pros).toEqual([])
    })

    it('should default to visible when cheatsheetVisible is undefined', () => {
      const children: DescriptorChild[] = [
        { text: 'Default what', descriptorType: 'what', isDescriptor: true },
        { text: 'Explicitly visible', descriptorType: 'pros', isDescriptor: true, cheatsheetVisible: true },
      ]

      const grouped = groupDescriptorsByType(children)

      expect(grouped.what).toContain('Default what')
      expect(grouped.pros).toContain('Explicitly visible')
    })

    it('should filter out all hidden descriptors', () => {
      const children: DescriptorChild[] = [
        { text: 'Hidden 1', descriptorType: 'what', isDescriptor: true, cheatsheetVisible: false },
        { text: 'Hidden 2', descriptorType: 'why', isDescriptor: true, cheatsheetVisible: false },
        { text: 'Hidden 3', descriptorType: 'pros', isDescriptor: true, cheatsheetVisible: false },
      ]

      const grouped = groupDescriptorsByType(children)

      expect(grouped.what).toEqual([])
      expect(grouped.why).toEqual([])
      expect(grouped.pros).toEqual([])
    })
  })

  describe('computeCheatsheet with visibility', () => {
    it('should only include visible descriptors in cheatsheet', () => {
      const children: DescriptorChild[] = [
        { text: 'Visible framework', descriptorType: 'what', isDescriptor: true, cheatsheetVisible: true },
        { text: 'Hidden reason', descriptorType: 'why', isDescriptor: true, cheatsheetVisible: false },
        { text: 'Visible pro', descriptorType: 'pros', isDescriptor: true, cheatsheetVisible: true },
      ]

      const result = computeCheatsheet(children)

      expect(result).toContain('Visible framework')
      expect(result).not.toContain('Hidden reason')
      expect(result).toContain('Visible pro')
    })

    it('should return empty string when all descriptors are hidden', () => {
      const children: DescriptorChild[] = [
        { text: 'Hidden 1', descriptorType: 'what', isDescriptor: true, cheatsheetVisible: false },
        { text: 'Hidden 2', descriptorType: 'pros', isDescriptor: true, cheatsheetVisible: false },
      ]

      const result = computeCheatsheet(children)

      expect(result).toBe('')
    })

    it('should handle mixed visibility with Pros and Cons', () => {
      const children: DescriptorChild[] = [
        { text: 'Visible Pro', descriptorType: 'pros', isDescriptor: true, cheatsheetVisible: true },
        { text: 'Hidden Pro', descriptorType: 'pros', isDescriptor: true, cheatsheetVisible: false },
        { text: 'Visible Con', descriptorType: 'cons', isDescriptor: true, cheatsheetVisible: true },
        { text: 'Hidden Con', descriptorType: 'cons', isDescriptor: true, cheatsheetVisible: false },
      ]

      const result = computeCheatsheet(children)

      expect(result).toContain('Visible Pro')
      expect(result).not.toContain('Hidden Pro')
      expect(result).toContain('Visible Con')
      expect(result).not.toContain('Hidden Con')
      expect(result).toContain('vs.')
    })

    it('should not show vs. separator when only Pros are visible', () => {
      const children: DescriptorChild[] = [
        { text: 'Visible Pro', descriptorType: 'pros', isDescriptor: true, cheatsheetVisible: true },
        { text: 'Hidden Con', descriptorType: 'cons', isDescriptor: true, cheatsheetVisible: false },
      ]

      const result = computeCheatsheet(children)

      expect(result).toBe('Visible Pro')
      expect(result).not.toContain('vs.')
    })

    it('should not show vs. separator when only Cons are visible', () => {
      const children: DescriptorChild[] = [
        { text: 'Hidden Pro', descriptorType: 'pros', isDescriptor: true, cheatsheetVisible: false },
        { text: 'Visible Con', descriptorType: 'cons', isDescriptor: true, cheatsheetVisible: true },
      ]

      const result = computeCheatsheet(children)

      expect(result).toBe('Visible Con')
      expect(result).not.toContain('vs.')
    })
  })

  describe('computeCheatsheetSegments with visibility', () => {
    it('should only include visible descriptors in segments', () => {
      const children: DescriptorChild[] = [
        { text: 'Visible Pro', descriptorType: 'pros', isDescriptor: true, cheatsheetVisible: true },
        { text: 'Hidden Con', descriptorType: 'cons', isDescriptor: true, cheatsheetVisible: false },
      ]

      const segments = computeCheatsheetSegments(children)

      const allText = segments.map(s => s.text).join('')
      expect(allText).toContain('Visible Pro')
      expect(allText).not.toContain('Hidden Con')
    })

    it('should return empty array when all hidden', () => {
      const children: DescriptorChild[] = [
        { text: 'Hidden', descriptorType: 'what', isDescriptor: true, cheatsheetVisible: false },
      ]

      const segments = computeCheatsheetSegments(children)

      expect(segments).toEqual([])
    })

    it('should apply colors only to visible segments', () => {
      const children: DescriptorChild[] = [
        { text: 'Visible Pro', descriptorType: 'pros', isDescriptor: true, cheatsheetVisible: true },
        { text: 'Hidden Pro 2', descriptorType: 'pros', isDescriptor: true, cheatsheetVisible: false },
      ]

      const segments = computeCheatsheetSegments(children)

      // Should only have the visible pro segment
      const prosSegment = segments.find(s => s.text.includes('Visible Pro'))
      expect(prosSegment).toBeDefined()
      expect(prosSegment?.color).toBeDefined()
    })
  })
})
