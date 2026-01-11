import { describe, it, expect } from 'vitest'
import {
  filterDescriptors,
  fuzzyMatch,
  type AutocompleteResult,
} from '../utils/descriptor-autocomplete'

/**
 * Tests for Descriptor Autocomplete (EDITOR-3203)
 *
 * Testing:
 * - Fuzzy matching logic
 * - Descriptor filtering
 * - Autocomplete result ranking
 */

describe('Descriptor Autocomplete (EDITOR-3203)', () => {
  describe('fuzzyMatch', () => {
    it('should match exact strings', () => {
      expect(fuzzyMatch('what', 'what')).toBe(true)
      expect(fuzzyMatch('why', 'why')).toBe(true)
    })

    it('should match case-insensitively', () => {
      expect(fuzzyMatch('WHAT', 'what')).toBe(true)
      expect(fuzzyMatch('What', 'what')).toBe(true)
      expect(fuzzyMatch('what', 'WHAT')).toBe(true)
    })

    it('should match partial strings from the start', () => {
      expect(fuzzyMatch('w', 'what')).toBe(true)
      expect(fuzzyMatch('wh', 'what')).toBe(true)
      expect(fuzzyMatch('wha', 'what')).toBe(true)
    })

    it('should match substring anywhere in the string', () => {
      expect(fuzzyMatch('is', 'What is it')).toBe(true)
      expect(fuzzyMatch('it', 'What is it')).toBe(true)
      expect(fuzzyMatch('works', 'How it works')).toBe(true)
    })

    it('should not match unrelated strings', () => {
      expect(fuzzyMatch('xyz', 'what')).toBe(false)
      expect(fuzzyMatch('abc', 'pros')).toBe(false)
    })

    it('should handle empty query', () => {
      expect(fuzzyMatch('', 'what')).toBe(true)
      expect(fuzzyMatch('', '')).toBe(true)
    })

    it('should not match when query is longer than text', () => {
      expect(fuzzyMatch('whatwhat', 'what')).toBe(false)
    })
  })

  describe('filterDescriptors', () => {
    it('should return all descriptors for empty query', () => {
      const results = filterDescriptors('')
      expect(results).toHaveLength(5)
    })

    it('should filter by key', () => {
      const results = filterDescriptors('what')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].descriptor.key).toBe('what')
    })

    it('should filter by label', () => {
      const results = filterDescriptors('matters')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].descriptor.key).toBe('why')
    })

    it('should filter by shortLabel', () => {
      const results = filterDescriptors('Pros')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].descriptor.key).toBe('pros')
    })

    it('should be case-insensitive', () => {
      const resultsLower = filterDescriptors('what')
      const resultsUpper = filterDescriptors('WHAT')
      expect(resultsLower.length).toBe(resultsUpper.length)
    })

    it('should return empty array when no match', () => {
      const results = filterDescriptors('xyz')
      expect(results).toHaveLength(0)
    })

    it('should rank exact key matches higher', () => {
      const results = filterDescriptors('how')
      expect(results[0].descriptor.key).toBe('how')
      // "How" exact match should be higher than "How it works" partial match
      expect(results[0].score).toBeGreaterThanOrEqual(results.length > 1 ? results[1].score : 0)
    })

    it('should include match information in results', () => {
      const results = filterDescriptors('what')
      expect(results[0]).toHaveProperty('descriptor')
      expect(results[0]).toHaveProperty('score')
      expect(results[0]).toHaveProperty('matchedField')
    })

    it('should filter multiple partial matches', () => {
      // "o" matches "how", "pros", "cons"
      const results = filterDescriptors('o')
      expect(results.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('AutocompleteResult type', () => {
    it('should have correct shape', () => {
      const result: AutocompleteResult = {
        descriptor: {
          key: 'what',
          label: 'What is it',
          shortLabel: 'What',
        },
        score: 100,
        matchedField: 'key',
      }
      expect(result.descriptor.key).toBe('what')
      expect(result.score).toBe(100)
      expect(result.matchedField).toBe('key')
    })
  })

  describe('Autocomplete behavior', () => {
    it('should filter descriptors starting with query first', () => {
      const results = filterDescriptors('w')
      // 'what' and 'why' start with 'w', should be ranked higher
      const startsWithW = results.filter((r) =>
        r.descriptor.key.toLowerCase().startsWith('w')
      )
      expect(startsWithW.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle special characters gracefully', () => {
      // Should not throw or crash
      const results = filterDescriptors('~')
      expect(Array.isArray(results)).toBe(true)
    })

    it('should handle whitespace in query', () => {
      const results = filterDescriptors('is it')
      // Should match "What is it"
      expect(results.length).toBeGreaterThanOrEqual(1)
    })

    it('should trim query whitespace', () => {
      const results = filterDescriptors('  what  ')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].descriptor.key).toBe('what')
    })
  })
})
