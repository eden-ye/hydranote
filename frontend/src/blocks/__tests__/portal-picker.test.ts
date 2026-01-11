/**
 * Tests for Portal Picker Utilities (EDITOR-3405)
 *
 * Tests filtering, search, and bullet extraction logic for portal picker.
 */
import { describe, it, expect } from 'vitest'
import {
  filterBullets,
  extractBulletsFromDoc,
  type BulletItem,
} from '../utils/portal-picker'

describe('Portal Picker Utilities', () => {
  describe('filterBullets', () => {
    const bullets: BulletItem[] = [
      { id: 'b1', text: 'First bullet point', level: 0 },
      { id: 'b2', text: 'Second bullet with children', level: 0 },
      { id: 'b3', text: 'Child bullet', level: 1 },
      { id: 'b4', text: 'Another top-level bullet', level: 0 },
      { id: 'b5', text: 'Nested item with special chars!', level: 2 },
    ]

    it('should return all bullets when query is empty', () => {
      const result = filterBullets(bullets, '')
      expect(result).toEqual(bullets)
    })

    it('should filter bullets by exact text match', () => {
      const result = filterBullets(bullets, 'First')
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('First bullet point')
    })

    it('should be case-insensitive', () => {
      const result = filterBullets(bullets, 'first')
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('First bullet point')
    })

    it('should filter by partial match', () => {
      const result = filterBullets(bullets, 'bullet')
      expect(result).toHaveLength(4)
      expect(result.map(b => b.id)).toEqual(['b1', 'b2', 'b3', 'b4'])
    })

    it('should handle queries with special characters', () => {
      const result = filterBullets(bullets, 'special')
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('Nested item with special chars!')
    })

    it('should return empty array when no matches found', () => {
      const result = filterBullets(bullets, 'nonexistent')
      expect(result).toEqual([])
    })

    it('should trim whitespace from query', () => {
      const result = filterBullets(bullets, '  First  ')
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('First bullet point')
    })

    it('should preserve original order of bullets', () => {
      const result = filterBullets(bullets, 'bullet')
      const ids = result.map(b => b.id)
      expect(ids).toEqual(['b1', 'b2', 'b3', 'b4'])
    })
  })

  describe('extractBulletsFromDoc', () => {
    it('should extract bullets from a flat document structure', () => {
      const mockDoc = {
        root: {
          children: [
            {
              id: 'page-1',
              flavour: 'affine:page',
              children: [
                {
                  id: 'b1',
                  flavour: 'hydra:bullet',
                  text: { toString: () => 'First bullet' },
                  children: [],
                },
                {
                  id: 'b2',
                  flavour: 'hydra:bullet',
                  text: { toString: () => 'Second bullet' },
                  children: [],
                },
              ],
            },
          ],
        },
      }

      const result = extractBulletsFromDoc(mockDoc as any)
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ id: 'b1', text: 'First bullet', level: 0 })
      expect(result[1]).toEqual({ id: 'b2', text: 'Second bullet', level: 0 })
    })

    it('should extract bullets with correct nesting levels', () => {
      const mockDoc = {
        root: {
          children: [
            {
              id: 'page-1',
              flavour: 'affine:page',
              children: [
                {
                  id: 'b1',
                  flavour: 'hydra:bullet',
                  text: { toString: () => 'Parent' },
                  children: [
                    {
                      id: 'b2',
                      flavour: 'hydra:bullet',
                      text: { toString: () => 'Child' },
                      children: [
                        {
                          id: 'b3',
                          flavour: 'hydra:bullet',
                          text: { toString: () => 'Grandchild' },
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      }

      const result = extractBulletsFromDoc(mockDoc as any)
      expect(result).toHaveLength(3)
      expect(result[0].level).toBe(0)
      expect(result[1].level).toBe(1)
      expect(result[2].level).toBe(2)
    })

    it('should skip non-bullet blocks', () => {
      const mockDoc = {
        root: {
          children: [
            {
              id: 'page-1',
              flavour: 'affine:page',
              children: [
                {
                  id: 'b1',
                  flavour: 'hydra:bullet',
                  text: { toString: () => 'Bullet' },
                  children: [],
                },
                {
                  id: 'p1',
                  flavour: 'hydra:portal',
                  sourceBlockId: 'b1',
                  children: [],
                },
                {
                  id: 'other',
                  flavour: 'affine:paragraph',
                  text: { toString: () => 'Not a bullet' },
                  children: [],
                },
              ],
            },
          ],
        },
      }

      const result = extractBulletsFromDoc(mockDoc as any)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('b1')
    })

    it('should handle empty document', () => {
      const mockDoc = {
        root: {
          children: [],
        },
      }

      const result = extractBulletsFromDoc(mockDoc as any)
      expect(result).toEqual([])
    })

    it('should handle document with no bullets', () => {
      const mockDoc = {
        root: {
          children: [
            {
              id: 'page-1',
              flavour: 'affine:page',
              children: [
                {
                  id: 'other',
                  flavour: 'affine:paragraph',
                  text: { toString: () => 'Not a bullet' },
                  children: [],
                },
              ],
            },
          ],
        },
      }

      const result = extractBulletsFromDoc(mockDoc as any)
      expect(result).toEqual([])
    })

    it('should handle text that is null or undefined', () => {
      const mockDoc = {
        root: {
          children: [
            {
              id: 'page-1',
              flavour: 'affine:page',
              children: [
                {
                  id: 'b1',
                  flavour: 'hydra:bullet',
                  text: { toString: () => '' },
                  children: [],
                },
                {
                  id: 'b2',
                  flavour: 'hydra:bullet',
                  text: null,
                  children: [],
                },
              ],
            },
          ],
        },
      }

      const result = extractBulletsFromDoc(mockDoc as any)
      expect(result).toHaveLength(2)
      expect(result[0].text).toBe('')
      expect(result[1].text).toBe('')
    })

    it('should preserve document order', () => {
      const mockDoc = {
        root: {
          children: [
            {
              id: 'page-1',
              flavour: 'affine:page',
              children: [
                {
                  id: 'b3',
                  flavour: 'hydra:bullet',
                  text: { toString: () => 'Third' },
                  children: [],
                },
                {
                  id: 'b1',
                  flavour: 'hydra:bullet',
                  text: { toString: () => 'First' },
                  children: [],
                },
                {
                  id: 'b2',
                  flavour: 'hydra:bullet',
                  text: { toString: () => 'Second' },
                  children: [],
                },
              ],
            },
          ],
        },
      }

      const result = extractBulletsFromDoc(mockDoc as any)
      expect(result.map(b => b.id)).toEqual(['b3', 'b1', 'b2'])
    })
  })
})
