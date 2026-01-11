/**
 * Tests for EDITOR-3304: Cheatsheet Separator Styling
 *
 * Tests for styled separators in cheatsheet view:
 * - Arrow separator (=>) between title and content
 * - Pipe separator (|) between descriptor sections
 * - Versus separator (vs.) between Pros and Cons
 */
import { describe, it, expect } from 'vitest'
import {
  computeCheatsheetSegments,
  type DescriptorChild,
  CHEATSHEET_SEPARATOR,
  PROS_CONS_SEPARATOR,
} from '../utils/cheatsheet'

describe('cheatsheet separator styling (EDITOR-3304)', () => {
  describe('computeCheatsheetSegments', () => {
    it('should mark pipe separators with separator type', () => {
      const children: DescriptorChild[] = [
        { text: 'What item', descriptorType: 'what', isDescriptor: true },
        { text: 'Why item', descriptorType: 'why', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)

      // Find the separator segment
      const pipeSegment = segments.find(s => s.text.includes(CHEATSHEET_SEPARATOR))
      expect(pipeSegment).toBeDefined()
      expect(pipeSegment?.separatorType).toBe('pipe')
    })

    it('should mark vs. separator with versus type', () => {
      const children: DescriptorChild[] = [
        { text: 'Fast', descriptorType: 'pros', isDescriptor: true },
        { text: 'Complex', descriptorType: 'cons', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)

      // Find the vs. separator segment
      const vsSegment = segments.find(s => s.text.includes(PROS_CONS_SEPARATOR))
      expect(vsSegment).toBeDefined()
      expect(vsSegment?.separatorType).toBe('versus')
    })

    it('should not mark content segments as separators', () => {
      const children: DescriptorChild[] = [
        { text: 'A framework', descriptorType: 'what', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)

      const contentSegment = segments.find(s => s.text.includes('A framework'))
      expect(contentSegment?.separatorType).toBeUndefined()
    })

    it('should have correct separator types for full cheatsheet', () => {
      const children: DescriptorChild[] = [
        { text: 'Definition', descriptorType: 'what', isDescriptor: true },
        { text: 'Reason', descriptorType: 'why', isDescriptor: true },
        { text: 'Fast', descriptorType: 'pros', isDescriptor: true },
        { text: 'Complex', descriptorType: 'cons', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)

      // Should have: content, pipe, content, pipe, pros, vs, cons
      const pipeSegments = segments.filter(s => s.separatorType === 'pipe')
      const vsSegments = segments.filter(s => s.separatorType === 'versus')

      expect(pipeSegments.length).toBe(2) // Between what-why and why-pros/cons
      expect(vsSegments.length).toBe(1) // Between pros and cons
    })

    it('should not have vs. separator when only pros exist', () => {
      const children: DescriptorChild[] = [
        { text: 'Fast', descriptorType: 'pros', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)

      const vsSegments = segments.filter(s => s.separatorType === 'versus')
      expect(vsSegments.length).toBe(0)
    })

    it('should not have vs. separator when only cons exist', () => {
      const children: DescriptorChild[] = [
        { text: 'Complex', descriptorType: 'cons', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)

      const vsSegments = segments.filter(s => s.separatorType === 'versus')
      expect(vsSegments.length).toBe(0)
    })
  })

  describe('separator text content', () => {
    it('should use pipe character for pipe separator', () => {
      const children: DescriptorChild[] = [
        { text: 'What', descriptorType: 'what', isDescriptor: true },
        { text: 'Why', descriptorType: 'why', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)
      const pipeSegment = segments.find(s => s.separatorType === 'pipe')

      expect(pipeSegment?.text).toContain('|')
    })

    it('should use vs. text for versus separator', () => {
      const children: DescriptorChild[] = [
        { text: 'Pro', descriptorType: 'pros', isDescriptor: true },
        { text: 'Con', descriptorType: 'cons', isDescriptor: true },
      ]

      const segments = computeCheatsheetSegments(children)
      const vsSegment = segments.find(s => s.separatorType === 'versus')

      expect(vsSegment?.text).toContain('vs.')
    })
  })
})
