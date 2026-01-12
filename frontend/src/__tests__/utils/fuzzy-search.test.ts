/**
 * Unit Tests for Fuzzy Search (EDITOR-3409)
 *
 * Tests the client-side fuzzy search for portal search modal:
 * - Exact match: 100 points
 * - Starts with: 80-90 points
 * - Contains: 50-60 points
 * - Threshold filtering (default 30)
 * - Result limiting (default 20)
 */
import { describe, it, expect } from 'vitest'
import {
  fuzzySearchBullets,
  calculateFuzzyScore,
  highlightMatches,
  type BulletSearchItem,
} from '@/utils/fuzzy-search'

describe('calculateFuzzyScore', () => {
  it('should return 100 for exact match', () => {
    expect(calculateFuzzyScore('hello', 'hello')).toBe(100)
  })

  it('should return 100 for exact match (case insensitive)', () => {
    expect(calculateFuzzyScore('Hello', 'hello')).toBe(100)
    expect(calculateFuzzyScore('HELLO', 'hello')).toBe(100)
  })

  it('should return 80-90 for starts with match', () => {
    const score = calculateFuzzyScore('hel', 'hello world')
    expect(score).toBeGreaterThanOrEqual(80)
    expect(score).toBeLessThanOrEqual(90)
  })

  it('should return higher score for longer prefix match', () => {
    const shortPrefix = calculateFuzzyScore('he', 'hello')
    const longPrefix = calculateFuzzyScore('hell', 'hello')
    expect(longPrefix).toBeGreaterThan(shortPrefix)
  })

  it('should return 50-60 for contains match', () => {
    const score = calculateFuzzyScore('world', 'hello world')
    expect(score).toBeGreaterThanOrEqual(50)
    expect(score).toBeLessThanOrEqual(60)
  })

  it('should return 0 for empty query', () => {
    expect(calculateFuzzyScore('', 'hello')).toBe(0)
  })

  it('should return 0 for no match', () => {
    expect(calculateFuzzyScore('xyz', 'hello')).toBe(0)
  })

  it('should handle whitespace in query', () => {
    expect(calculateFuzzyScore('  hello  ', 'hello')).toBe(100)
  })
})

describe('fuzzySearchBullets', () => {
  const mockBullets: BulletSearchItem[] = [
    { documentId: 'doc-1', blockId: 'b1', text: 'React hooks guide', contextPath: 'path1' },
    { documentId: 'doc-1', blockId: 'b2', text: 'React components', contextPath: 'path2' },
    { documentId: 'doc-2', blockId: 'b3', text: 'Vue composition API', contextPath: 'path3' },
    { documentId: 'doc-2', blockId: 'b4', text: 'Angular services', contextPath: 'path4' },
    { documentId: 'doc-3', blockId: 'b5', text: 'JavaScript basics', contextPath: 'path5' },
  ]

  it('should return empty array for empty query', () => {
    const results = fuzzySearchBullets('', mockBullets)
    expect(results).toHaveLength(0)
  })

  it('should find exact matches', () => {
    const results = fuzzySearchBullets('React hooks guide', mockBullets)
    expect(results).toHaveLength(1)
    expect(results[0].blockId).toBe('b1')
  })

  it('should find partial matches', () => {
    const results = fuzzySearchBullets('react', mockBullets)
    expect(results.length).toBeGreaterThanOrEqual(2)
    expect(results.some(r => r.blockId === 'b1')).toBe(true)
    expect(results.some(r => r.blockId === 'b2')).toBe(true)
  })

  it('should sort results by score (highest first)', () => {
    const results = fuzzySearchBullets('React hooks guide', mockBullets)
    // Exact match should be first
    if (results.length > 1) {
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score)
    }
  })

  it('should include score in results', () => {
    const results = fuzzySearchBullets('react', mockBullets)
    expect(results[0]).toHaveProperty('score')
    expect(typeof results[0].score).toBe('number')
  })

  it('should filter by threshold', () => {
    const results = fuzzySearchBullets('xyz', mockBullets, { threshold: 30 })
    expect(results).toHaveLength(0)
  })

  it('should limit results', () => {
    // Create many similar items
    const manyBullets: BulletSearchItem[] = Array.from({ length: 30 }, (_, i) => ({
      documentId: 'doc',
      blockId: `b${i}`,
      text: `Test item ${i}`,
      contextPath: `path${i}`,
    }))

    const results = fuzzySearchBullets('test', manyBullets, { limit: 10 })
    expect(results).toHaveLength(10)
  })

  it('should default limit to 20', () => {
    const manyBullets: BulletSearchItem[] = Array.from({ length: 30 }, (_, i) => ({
      documentId: 'doc',
      blockId: `b${i}`,
      text: `Test item ${i}`,
      contextPath: `path${i}`,
    }))

    const results = fuzzySearchBullets('test', manyBullets)
    expect(results).toHaveLength(20)
  })

  it('should preserve original item data in results', () => {
    const results = fuzzySearchBullets('react', mockBullets)
    expect(results[0]).toHaveProperty('documentId')
    expect(results[0]).toHaveProperty('blockId')
    expect(results[0]).toHaveProperty('text')
    expect(results[0]).toHaveProperty('contextPath')
  })
})

describe('highlightMatches', () => {
  it('should wrap matching text with mark tags', () => {
    const result = highlightMatches('Hello World', 'world')
    // The result should contain the highlighted portion
    expect(result).toContain('<mark')
    expect(result).toContain('World')
    expect(result).toContain('</mark>')
  })

  it('should return original text when no query', () => {
    const result = highlightMatches('Hello World', '')
    expect(result).toBe('Hello World')
  })

  it('should handle case insensitive highlighting', () => {
    const result = highlightMatches('Hello World', 'HELLO')
    expect(result).toContain('<mark')
    expect(result).toContain('Hello')
  })

  it('should handle multiple occurrences', () => {
    const result = highlightMatches('test test test', 'test')
    // Should have 3 highlighted portions
    const markCount = (result.match(/<mark/g) || []).length
    expect(markCount).toBe(3)
  })

  it('should preserve non-matching text', () => {
    const result = highlightMatches('Hello World', 'World')
    expect(result).toContain('Hello ')
  })

  it('should handle special regex characters in query', () => {
    // Should not throw with special chars
    expect(() => highlightMatches('test (value)', '(value)')).not.toThrow()
  })
})
