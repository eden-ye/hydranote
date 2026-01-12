import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  mockSemanticSearch,
  mockExtractConcepts,
  isMockApiEnabled,
  type SemanticSearchResult,
  type Concept,
} from '../api-client.mock'

/**
 * Tests for Mock API Client (EDITOR-3407)
 *
 * Mock APIs for frontend development before backend is ready.
 * These mocks allow full testing of orchestration logic without real backend.
 */

describe('Mock API Client (EDITOR-3407)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('mockSemanticSearch', () => {
    it('should return search results after simulated delay', async () => {
      const promise = mockSemanticSearch('neural networks')

      // Should not resolve immediately
      let resolved = false
      promise.then(() => {
        resolved = true
      })

      await vi.advanceTimersByTimeAsync(100)
      expect(resolved).toBe(false)

      await vi.advanceTimersByTimeAsync(100)
      expect(resolved).toBe(true)
    })

    it('should return array of SemanticSearchResult', async () => {
      const promise = mockSemanticSearch('test query')
      await vi.advanceTimersByTimeAsync(200)

      const results = await promise

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
    })

    it('should return results with required fields', async () => {
      const promise = mockSemanticSearch('machine learning')
      await vi.advanceTimersByTimeAsync(200)

      const results = await promise
      const result = results[0]

      expect(result).toHaveProperty('documentId')
      expect(result).toHaveProperty('blockId')
      expect(result).toHaveProperty('bulletText')
      expect(result).toHaveProperty('contextPath')
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('descriptorType')
      expect(result).toHaveProperty('childrenSummary')
    })

    it('should return score between 0 and 1', async () => {
      const promise = mockSemanticSearch('test')
      await vi.advanceTimersByTimeAsync(200)

      const results = await promise

      results.forEach((result) => {
        expect(result.score).toBeGreaterThanOrEqual(0)
        expect(result.score).toBeLessThanOrEqual(1)
      })
    })

    it('should return results relevant to query', async () => {
      const promise = mockSemanticSearch('neural')
      await vi.advanceTimersByTimeAsync(200)

      const results = await promise

      // Mock returns hardcoded data, but at least verify structure
      expect(results[0].bulletText).toBeDefined()
    })

    it('should handle empty query', async () => {
      const promise = mockSemanticSearch('')
      await vi.advanceTimersByTimeAsync(200)

      const results = await promise

      // Should still return results (mock doesn't filter)
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('mockExtractConcepts', () => {
    it('should return concepts after simulated delay', async () => {
      const promise = mockExtractConcepts('Some text about AI and machine learning')

      let resolved = false
      promise.then(() => {
        resolved = true
      })

      await vi.advanceTimersByTimeAsync(100)
      expect(resolved).toBe(false)

      await vi.advanceTimersByTimeAsync(50)
      expect(resolved).toBe(true)
    })

    it('should return array of Concept', async () => {
      const promise = mockExtractConcepts('text')
      await vi.advanceTimersByTimeAsync(150)

      const concepts = await promise

      expect(Array.isArray(concepts)).toBe(true)
      expect(concepts.length).toBeGreaterThan(0)
    })

    it('should return concepts with required fields', async () => {
      const promise = mockExtractConcepts('neural networks and deep learning')
      await vi.advanceTimersByTimeAsync(150)

      const concepts = await promise
      const concept = concepts[0]

      expect(concept).toHaveProperty('name')
      expect(concept).toHaveProperty('category')
    })

    it('should return concepts with valid category', async () => {
      const promise = mockExtractConcepts('test text')
      await vi.advanceTimersByTimeAsync(150)

      const concepts = await promise

      concepts.forEach((concept) => {
        expect(['topic', 'entity', 'action', 'attribute']).toContain(concept.category)
      })
    })

    it('should handle empty text', async () => {
      const promise = mockExtractConcepts('')
      await vi.advanceTimersByTimeAsync(150)

      const concepts = await promise

      // Should still return results (mock doesn't filter)
      expect(Array.isArray(concepts)).toBe(true)
    })
  })

  describe('isMockApiEnabled', () => {
    it('should return boolean', () => {
      const result = isMockApiEnabled()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('Type definitions', () => {
    it('SemanticSearchResult should have correct structure', () => {
      const result: SemanticSearchResult = {
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Sample text',
        contextPath: 'Path > To > Block',
        score: 0.9,
        descriptorType: 'what',
        childrenSummary: 'Child summary',
      }

      expect(result.documentId).toBe('doc-1')
      expect(result.descriptorType).toBe('what')
    })

    it('SemanticSearchResult should allow null descriptorType', () => {
      const result: SemanticSearchResult = {
        documentId: 'doc-1',
        blockId: 'block-1',
        bulletText: 'Sample text',
        contextPath: 'Path',
        score: 0.8,
        descriptorType: null,
        childrenSummary: null,
      }

      expect(result.descriptorType).toBeNull()
    })

    it('Concept should have correct structure', () => {
      const concept: Concept = {
        name: 'machine learning',
        category: 'topic',
      }

      expect(concept.name).toBe('machine learning')
      expect(concept.category).toBe('topic')
    })
  })
})
